// backend/lambda/uploadFile/index.js
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

exports.handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);
    const body = JSON.parse(event.body);
    const { fileName, fileSize, fileType, tags = [] } = body;

    if (!fileName || !fileSize || !fileType)
      return error("Missing required fields", 400);
    if (fileSize > 5 * 1024 * 1024 * 1024)
      return error("File size exceeds 5GB", 400);

    // Check storage quota
    const userRecord = await dynamodb
      .get({ TableName: USERS_TABLE, Key: { userId } })
      .promise();
    if (userRecord.Item) {
      const { storageUsed = 0, storageQuota = 10737418240 } = userRecord.Item;
      if (storageUsed + fileSize > storageQuota)
        return error("Storage quota exceeded", 403);
    }

    const fileId = uuidv4();
    const s3Key = `users/${userId}/files/${fileId}/${fileName}`;

    // presigned URL for putObject
    const uploadUrl = s3.getSignedUrl("putObject", {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: 3600,
      ContentType: fileType,
    });

    const timestamp = Date.now();
    await dynamodb
      .put({
        TableName: FILES_TABLE,
        Item: {
          fileId,
          userId,
          fileName,
          fileSize,
          fileType,
          s3Key,
          tags,
          uploadedAt: timestamp,
          modifiedAt: timestamp,
          status: "uploading",
        },
      })
      .promise();

    return success({ fileId, uploadUrl, message: "Pre-signed URL generated" });
  } catch (err) {
    console.error("uploadFile error", err);
    return error(err.message || "Internal server error", 500);
  }
};
