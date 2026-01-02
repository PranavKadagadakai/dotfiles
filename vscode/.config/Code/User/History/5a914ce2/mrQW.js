const AWS = require("aws-sdk");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;
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

    const { s3Key, fileName, s3VersionId } = fileRecord.Item;

    // Generate pre-signed URL for download
    const downloadUrl = s3.getSignedUrl("getObject", {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      VersionId: s3VersionId,
      Expires: 3600, // 1 hour
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });

    // Log the download
    await dynamodb
      .put({
        TableName: LOGS_TABLE,
        Item: {
          logId: `${fileId}-${Date.now()}`,
          fileId,
          userId,
          action: "download",
          timestamp: Date.now(),
          success: true,
        },
      })
      .promise();

    return success({
      downloadUrl,
      fileName,
      expiresIn: 3600,
    });
  } catch (err) {
    console.error("Error:", err);
    return error(err.message || "Internal server error", 500);
  }
};
