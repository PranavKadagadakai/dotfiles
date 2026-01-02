// backend/layers/nodejs/utils/auth.js
exports.getUserIdFromEvent = (event) => {
  try {
    // When using Cognito authorizer, user info is in requestContext
    if (event.requestContext?.authorizer?.claims) {
      const claims = event.requestContext.authorizer.claims;
      return claims.sub || claims["cognito:username"] || null;
    }

    // Fallback for testing without authorizer
    if (event.queryStringParameters?.userId) {
      return event.queryStringParameters.userId;
    }

    return null;
  } catch (err) {
    console.error("Error extracting userId:", err);
    return null;
  }
};
