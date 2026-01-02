const AWS = require("aws-sdk");
const crypto = require("crypto");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;
const LOGS_TABLE = process.env.ACCESS_LOGS_TABLE;

exports.handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);
    const { fileId } = JSON.parse(event.body);

    // Get file metadata
    const fileRecord = await dynamodb
      .get({
        TableName: FILES_TABLE,
        Key: { fileId, userId },
      })
      .promise();

    if (!fileRecord.Item) {
      return error("File not found", 404);
    }

    const { s3Key, fileSize } = fileRecord.Item;

    // Verify file exists in S3
    const s3Object = await s3
      .headObject({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      })
      .promise();

    // Get version ID and ETag
    const versionId = s3Object.VersionId;
    const etag = s3Object.ETag;

    // Update file status
    await dynamodb
      .update({
        TableName: FILES_TABLE,
        Key: { fileId, userId },
        UpdateExpression:
          "SET #status = :status, s3VersionId = :versionId, checksum = :checksum, modifiedAt = :timestamp",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "completed",
          ":versionId": versionId,
          ":checksum": etag,
          ":timestamp": Date.now(),
        },
      })
      .promise();

    // Update user storage usage
    await dynamodb
      .update({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: "ADD storageUsed :fileSize",
        ExpressionAttributeValues: {
          ":fileSize": fileSize,
        },
      })
      .promise();

    // Log the upload
    await dynamodb
      .put({
        TableName: LOGS_TABLE,
        Item: {
          logId: `${fileId}-${Date.now()}`,
          fileId,
          userId,
          action: "upload",
          timestamp: Date.now(),
          success: true,
        },
      })
      .promise();

    return success({
      fileId,
      message: "File upload completed successfully",
    });
  } catch (err) {
    console.error("Error:", err);
    return error(err.message || "Internal server error", 500);
  }
};
