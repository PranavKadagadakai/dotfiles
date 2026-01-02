const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;
const SHARE_LINKS_TABLE = process.env.SHARE_LINKS_TABLE;

exports.handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);
    const {
      fileId,
      expiresIn = 3600,
      maxDownloads = 0,
      password,
    } = JSON.parse(event.body);

    if (!fileId) {
      return error("File ID is required", 400);
    }

    // Verify file ownership
    const fileRecord = await dynamodb
      .get({
        TableName: FILES_TABLE,
        Key: { fileId, userId },
      })
      .promise();

    if (!fileRecord.Item) {
      return error("File not found or access denied", 404);
    }

    const { s3Key, fileName } = fileRecord.Item;

    // Generate share ID
    const shareId = uuidv4();
    const createdAt = Date.now();
    const expiresAt = createdAt + expiresIn * 1000;

    // Create share link record
    await dynamodb
      .put({
        TableName: SHARE_LINKS_TABLE,
        Item: {
          shareId,
          fileId,
          createdBy: userId,
          createdAt,
          expiresAt,
          maxDownloads,
          downloadCount: 0,
          password: password || null,
          revoked: false,
        },
      })
      .promise();

    // Generate share URL
    const shareUrl = `${process.env.API_ENDPOINT}/share/${shareId}`;

    return success({
      shareId,
      shareUrl,
      expiresAt,
      fileName,
    });
  } catch (err) {
    console.error("Error:", err);
    return error(err.message || "Internal server error", 500);
  }
};
