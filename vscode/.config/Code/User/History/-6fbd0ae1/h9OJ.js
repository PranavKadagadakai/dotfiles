const AWS = require("aws-sdk");
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
    const fileId = event.pathParameters?.fileId;

    if (!fileId) {
      return error("File ID is required", 400);
    }

    // Get file metadata
    const fileRecord = await dynamodb
      .get({
        TableName: FILES_TABLE,
        Key: { fileId, userId },
      })
      .promise();

    if (!fileRecord.Item) {
      return error("File not found or access denied", 404);
    }

    const { s3Key, fileSize } = fileRecord.Item;

    // Delete from S3 (adds delete marker, versions preserved)
    await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      })
      .promise();

    // Mark as deleted in DynamoDB
    await dynamodb
      .update({
        TableName: FILES_TABLE,
        Key: { fileId, userId },
        UpdateExpression: "SET #status = :status, deletedAt = :timestamp",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "deleted",
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
          ":fileSize": -fileSize,
        },
      })
      .promise();

    // Log the deletion
    await dynamodb
      .put({
        TableName: LOGS_TABLE,
        Item: {
          logId: `${fileId}-${Date.now()}`,
          fileId,
          userId,
          action: "delete",
          timestamp: Date.now(),
          success: true,
        },
      })
      .promise();

    return success({
      message: "File deleted successfully",
      fileId,
    });
  } catch (err) {
    console.error("Error:", err);
    return error(err.message || "Internal server error", 500);
  }
};
