// src/aws-config.js
export const awsConfig = {
  Auth: {
    region: import.meta.env.VITE_AWS_REGION, // Replace with your region
    userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID, // Replace with your UserPoolId
    userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID, // Replace with UserPoolClientId
    identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID, // Replace with IdentityPoolId
  },
  API: {
    endpoints: [
      {
        name: "fileStorageAPI",
        endpoint: import.meta.env.VITE_AWS_API_URL,
        region: "us-east-1",
      },
    ],
  },
  Storage: {
    AWSS3: {
      bucket: import.meta.env.VITE_AWS_FILES_BUCKET_NAME, // Replace with your S3 bucket name
      region: "us-east-1",
    },
  },
};
