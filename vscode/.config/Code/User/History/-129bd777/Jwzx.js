const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const BUCKET_NAME = process.env.FILES_BUCKET;
  const FILES_TABLE = process.env.FILES_TABLE;

  // New: Check for critical configuration before continuing
  if (!BUCKET_NAME || !FILES_TABLE) {
    console.error("Configuration Error: Missing Environment Variables");
    return error("Internal server configuration error", 500);
  }

  try {
    const userId = getUserIdFromEvent(event);
    const body = JSON.parse(event.body);

    const { fileName, fileSize, fileType, tags = [] } = body;

    // Validate input
    if (!fileName || !fileSize || !fileType) {
      return error("Missing required fields", 400);
    }

    // Check file size limit (5GB)
    if (fileSize > 5 * 1024 * 1024 * 1024) {
      return error("File size exceeds 5GB limit", 400);
    }

    // Check storage quota
    const userRecord = await dynamodb
      .get({
        TableName: process.env.USERS_TABLE,
        Key: { userId },
      })
      .promise();

    if (userRecord.Item) {
      const { storageUsed = 0, storageQuota = 10737418240 } = userRecord.Item;
      if (storageUsed + fileSize > storageQuota) {
        return error("Storage quota exceeded", 403);
      }
    }

    // Generate unique file ID and S3 key
    const fileId = uuidv4();
    const s3Key = `users/${userId}/files/${fileId}/${fileName}`;

    // Generate pre-signed URL for upload
    const uploadUrl = s3.getSignedUrl("putObject", {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: 3600, // 1 hour
      ContentType: fileType,
    });

    // 🚨 CRITICAL DEBUG: Log the result before returning 🚨
    console.log(`DEBUG: Generated File ID: ${fileId}`);
    console.log(`DEBUG: Target S3 Key: ${s3Key}`);
    console.log(`DEBUG: Generated uploadUrl: ${uploadUrl}`); // CHECK THIS IN CLOUDWATCH

    // 🚨 FAIL-SAFE CHECK: Ensure the URL is valid before proceeding
    if (!uploadUrl || uploadUrl.includes("undefined")) {
      console.error("CRITICAL ERROR: S3 signed URL generation failed.");
      // Throwing an error here ensures the client receives a 500, not an 'undefined' 404
      throw new Error("Failed to generate S3 pre-signed URL.");
    }

    // Save metadata to DynamoDB
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

    return success({
      fileId,
      uploadUrl,
      message: "Pre-signed URL generated successfully",
    });
  } catch (err) {
    console.error("Error:", err);
    return error(err.message || "Internal server error", 500);
  }
};
