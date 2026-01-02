const AWS = require("aws-sdk");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const dynamodb = new AWS.DynamoDB.DocumentClient();

const FILES_TABLE = process.env.FILES_TABLE;

exports.handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const {
      limit = 50,
      lastKey,
      sortBy = "uploadedAt",
      order = "desc",
    } = queryParams;

    // Query user's files
    const params = {
      TableName: FILES_TABLE,
      IndexName: "UserFilesIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      Limit: parseInt(limit),
      ScanIndexForward: order === "asc",
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(
        Buffer.from(lastKey, "base64").toString()
      );
    }

    const result = await dynamodb.query(params).promise();

    // Prepare response
    const response = {
      files: result.Items,
      count: result.Items.length,
    };

    if (result.LastEvaluatedKey) {
      response.nextKey = Buffer.from(
        JSON.stringify(result.LastEvaluatedKey)
      ).toString("base64");
    }

    return success(response);
  } catch (err) {
    console.error("Error:", err);
    return error(err.message || "Internal server error", 500);
  }
};
