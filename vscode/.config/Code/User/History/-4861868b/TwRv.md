# AWS File Storage System - Detailed Implementation Guide

**Project:** SecureFileVault  
**Version:** 1.0  
**Last Updated:** October 2025

---

## Table of Contents

1. [Phase 1: Project Setup and Prerequisites](#phase-1-project-setup-and-prerequisites)
2. [Phase 2: Backend Infrastructure](#phase-2-backend-infrastructure)
3. [Phase 3: Authentication Setup](#phase-3-authentication-setup)
4. [Phase 4: Lambda Functions](#phase-4-lambda-functions)
5. [Phase 5: Frontend Development](#phase-5-frontend-development)
6. [Phase 6: Security Hardening](#phase-6-security-hardening)
7. [Phase 7: Testing](#phase-7-testing)
8. [Phase 8: Deployment](#phase-8-deployment)
9. [Phase 9: Monitoring](#phase-9-monitoring)

---

# Phase 1: Project Setup and Prerequisites

## 1. Overview

This project implements a **Secure File Storage and Sharing Web Application** using AWS cloud infrastructure. It will use the **AWS CDK (JavaScript)** for provisioning, **pnpm** as the package manager, and **Vite + React (JavaScript)** for the frontend web application.

---

## 2. Prerequisites

Before starting, ensure you have the following tools installed:

| Tool    | Minimum Version | Command to Verify         |
| ------- | --------------- | ------------------------- |
| Node.js | 18+             | `node -v`                 |
| pnpm    | 9+              | `pnpm -v`                 |
| AWS CLI | 2.x             | `aws --version`           |
| AWS CDK | 2.x             | `pnpm exec cdk --version` |

You should also have:

- An **AWS account** with programmatic access (Access Key ID & Secret Access Key)
- An **IAM user** with admin privileges or sufficient permissions for S3, DynamoDB, Cognito, and Lambda

### Configure AWS CLI

```bash
aws configure
```

Provide your access key, secret key, region (e.g., `us-east-1`), and output format (`json`).

---

## 3. Project Structure

We'll create a mono-repo style setup with two folders:

```
File_Storing_And_Sharing_App/
├── backend/
│   └── lambda/
├── infrastructure/
│   ├── bin/
│   └── lib/
└── frontend/
```

Each folder will contain:

- `infrastructure/`: AWS CDK app for cloud resources
- `backend/`: Lambda functions (Node.js JavaScript)
- `frontend/`: Vite React web application

---

## 4. Initialize the CDK Infrastructure Project

Navigate to your workspace and initialize:

```bash
mkdir -p File_Storing_And_Sharing_App/infrastructure
cd File_Storing_And_Sharing_App/infrastructure
pnpm dlx cdk init app --language=javascript
```

This creates a basic CDK project with JavaScript. Now install the necessary CDK libraries:

```bash
pnpm add aws-cdk-lib constructs
```

We'll be using AWS CDK v2, so **do not install any deprecated `@aws-cdk/*` packages**.

### Directory Structure after Initialization

```
infrastructure/
├── bin/
│   └── infrastructure.js
├── lib/
│   ├── infrastructure-stack.js
│   ├── storage-stack.js
│   ├── database-stack.js
│   ├── auth-stack.js
│   └── lambda-stack.js
├── package.json
└── cdk.json
```

---

## 5. Initialize the Backend Project

From the project root:

```bash
mkdir -p backend/lambda
cd backend
pnpm init -y
pnpm add aws-sdk
```

Create folders for each Lambda function:

```bash
mkdir -p lambda/{uploadFile,downloadFile,listFiles,deleteFile,createShareLink,uploadComplete}
```

Add a placeholder `index.js` for each function:

```bash
for dir in lambda/*; do
  echo "exports.handler = async () => ({ statusCode: 200, body: 'Hello from $(basename $dir)' });" > "$dir/index.js";
done
```

---

## 6. Initialize the Frontend (Vite + React + JS)

From the root directory:

```bash
mkdir frontend
cd frontend
pnpm create vite@latest . --template react
```

Install dependencies:

```bash
pnpm install
```

Run the app to verify setup:

```bash
pnpm run dev
```

Visit `http://localhost:5173` to verify the Vite React app runs successfully.

---

## 7. Bootstrap AWS CDK Environment

Bootstrap the environment once before any stack deployment:

```bash
cd ../infrastructure
pnpm exec cdk bootstrap
```

This sets up an S3 bucket for CDK assets.

---

## ✅ Summary of Phase 1

At the end of this phase, you should have:

- AWS credentials configured
- CDK initialized with JavaScript and pnpm
- Backend Lambda folders ready
- Vite React app created and running locally
- CDK environment bootstrapped and ready for deployment

**Next:** In Phase 2, we’ll implement the `StorageStack` and `DatabaseStack` using AWS CDK (JavaScript).

## Phase 2: Backend Infrastructure

### Step 2.1: Define S3 Bucket with CDK

Create `infrastructure/lib/storage-stack.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class StorageStack extends cdk.Stack {
  public readonly filesBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for file storage
    this.filesBucket = new s3.Bucket(this, "FileStorageBucket", {
      bucketName: `securefile-vault-${this.account}-${this.region}`,

      // Enable versioning for file history
      versioned: true,

      // Encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,

      // Block all public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // Enable CORS for web uploads
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"], // Restrict in production
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],

      // Lifecycle rules
      lifecycleRules: [
        {
          // Delete old versions after 90 days
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          // Transition old versions to cheaper storage
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        {
          // Delete incomplete multipart uploads
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],

      // Auto-delete on stack deletion (development only)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Remove for production
    });

    // Create bucket for thumbnails
    const thumbnailsBucket = new s3.Bucket(this, "ThumbnailsBucket", {
      bucketName: `securefile-vault-thumbnails-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Output bucket names
    new cdk.CfnOutput(this, "FilesBucketName", {
      value: this.filesBucket.bucketName,
      exportName: "FilesBucketName",
    });

    new cdk.CfnOutput(this, "ThumbnailsBucketName", {
      value: thumbnailsBucket.bucketName,
      exportName: "ThumbnailsBucketName",
    });
  }
}
```

### Step 2.2: Define DynamoDB Tables

Create `infrastructure/lib/database-stack.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DatabaseStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly filesTable: dynamodb.Table;
  public readonly accessLogsTable: dynamodb.Table;
  public readonly shareLinksTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Users table
    this.usersTable = new dynamodb.Table(this, "UsersTable", {
      tableName: "SecureFileVault-Users",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change for production
    });

    // GSI for email lookups
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "EmailIndex",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Files metadata table
    this.filesTable = new dynamodb.Table(this, "FilesTable", {
      tableName: "SecureFileVault-Files",
      partitionKey: { name: "fileId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for user file listings
    this.filesTable.addGlobalSecondaryIndex({
      indexName: "UserFilesIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "uploadedAt", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Access logs table
    this.accessLogsTable = new dynamodb.Table(this, "AccessLogsTable", {
      tableName: "SecureFileVault-AccessLogs",
      partitionKey: { name: "logId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "expiresAt", // Auto-delete old logs
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for file-based log queries
    this.accessLogsTable.addGlobalSecondaryIndex({
      indexName: "FileLogsIndex",
      partitionKey: { name: "fileId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Share links table
    this.shareLinksTable = new dynamodb.Table(this, "ShareLinksTable", {
      tableName: "SecureFileVault-ShareLinks",
      partitionKey: { name: "shareId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for file share links
    this.shareLinksTable.addGlobalSecondaryIndex({
      indexName: "FileSharesIndex",
      partitionKey: { name: "fileId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output table names
    new cdk.CfnOutput(this, "UsersTableName", {
      value: this.usersTable.tableName,
      exportName: "UsersTableName",
    });

    new cdk.CfnOutput(this, "FilesTableName", {
      value: this.filesTable.tableName,
      exportName: "FilesTableName",
    });
  }
}
```

### Step 2.3: Deploy Initial Infrastructure

```bash
# From infrastructure directory
cd infrastructure

# Bootstrap CDK (first time only)
cdk bootstrap

# Synthesize CloudFormation template
cdk synth

# Deploy stacks
cdk deploy --all

# Note the output values (bucket names, table names)
```

### Step 2.4: Verify Infrastructure

```bash
# List S3 buckets
aws s3 ls | grep securefile-vault

# List DynamoDB tables
aws dynamodb list-tables

# Check bucket versioning
aws s3api get-bucket-versioning --bucket securefile-vault-ACCOUNT-REGION
```

---

## Phase 3: Authentication Setup

### Step 3.1: Create Cognito User Pool

Create `infrastructure/lib/auth-stack.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "SecureFileVault-Users",

      // Sign-in configuration
      signInAliases: {
        email: true,
        username: false,
      },

      // Self sign-up
      selfSignUpEnabled: true,

      // Email verification
      autoVerify: {
        email: true,
      },

      // Password policy
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(3),
      },

      // Account recovery
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // Standard attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },

      // Custom attributes
      customAttributes: {
        role: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }),
        storageQuota: new cognito.NumberAttribute({
          min: 0,
          max: 1099511627776, // 1TB in bytes
          mutable: true,
        }),
      },

      // MFA configuration
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },

      // Email configuration
      email: cognito.UserPoolEmail.withCognito("noreply@securefile-vault.com"),

      // Removal policy
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create app client
    this.userPoolClient = this.userPool.addClient("WebAppClient", {
      userPoolClientName: "web-app-client",

      // OAuth flows
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
      },

      // Token validity
      accessTokenValidity: cdk.Duration.minutes(60),
      idTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),

      // Prevent user existence errors
      preventUserExistenceErrors: true,

      // OAuth settings
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ["http://localhost:3000/callback"], // Update for production
        logoutUrls: ["http://localhost:3000/logout"],
      },
    });

    // Create user groups
    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "Admin",
      description: "Administrator users with full access",
      precedence: 1,
    });

    new cognito.CfnUserPoolGroup(this, "PowerUserGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "PowerUser",
      description: "Power users with upload and management capabilities",
      precedence: 2,
    });

    new cognito.CfnUserPoolGroup(this, "ViewerGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "Viewer",
      description: "Read-only users",
      precedence: 3,
    });

    // Outputs
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      exportName: "UserPoolId",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      exportName: "UserPoolClientId",
    });
  }
}
```

### Step 3.2: Create IAM Roles for User Groups

```typescript
// Add to auth-stack.ts

import * as iam from "aws-cdk-lib/aws-iam";

// Inside AuthStack constructor, after user pool creation:

// Identity Pool for AWS credentials
const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
  identityPoolName: "SecureFileVaultIdentityPool",
  allowUnauthenticatedIdentities: false,
  cognitoIdentityProviders: [
    {
      clientId: this.userPoolClient.userPoolClientId,
      providerName: this.userPool.userPoolProviderName,
    },
  ],
});

// Authenticated role
const authenticatedRole = new iam.Role(this, "AuthenticatedRole", {
  assumedBy: new iam.FederatedPrincipal(
    "cognito-identity.amazonaws.com",
    {
      StringEquals: {
        "cognito-identity.amazonaws.com:aud": identityPool.ref,
      },
      "ForAnyValue:StringLike": {
        "cognito-identity.amazonaws.com:amr": "authenticated",
      },
    },
    "sts:AssumeRoleWithWebIdentity"
  ),
});

// Attach role to identity pool
new cognito.CfnIdentityPoolRoleAttachment(this, "IdentityPoolRoleAttachment", {
  identityPoolId: identityPool.ref,
  roles: {
    authenticated: authenticatedRole.roleArn,
  },
});
```

### Step 3.3: Deploy Authentication Stack

```bash
cd infrastructure
cdk deploy AuthStack

# Save the output values
# UserPoolId: us-east-1_XXXXXXXXX
# UserPoolClientId: XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 3.4: Test Cognito Setup

```bash
# Create a test user
aws cognito-idp sign-up \
  --client-id YOUR_CLIENT_ID \
  --username testuser@example.com \
  --password TestPassword123! \
  --user-attributes Name=email,Value=testuser@example.com

# Confirm the user (admin action)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser@example.com

# Test login
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=testuser@example.com,PASSWORD=TestPassword123!
```

---

## Phase 4: Lambda Functions

### Step 4.1: Set Up Lambda Layer for Shared Code

```bash
cd backend/layers
mkdir nodejs
cd nodejs
npm init -y

# Install shared dependencies
npm install aws-sdk uuid jsonwebtoken bcryptjs

# Create shared utilities
mkdir utils
```

Create `backend/layers/nodejs/utils/response.js`:

```javascript
module.exports = {
  success: (data, statusCode = 200) => ({
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      success: true,
      data,
    }),
  }),

  error: (message, statusCode = 500) => ({
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      success: false,
      error: message,
    }),
  }),
};
```

Create `backend/layers/nodejs/utils/auth.js`:

```javascript
const jwt = require("jsonwebtoken");

module.exports = {
  verifyToken: (token) => {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error("Invalid token");
    }
  },

  getUserIdFromEvent: (event) => {
    const token = event.headers.Authorization?.replace("Bearer ", "");
    if (!token) {
      throw new Error("No authorization token provided");
    }
    const decoded = jwt.decode(token);
    return decoded.sub || decoded["cognito:username"];
  },

  hasPermission: (userGroups, requiredRole) => {
    const roleHierarchy = { Admin: 3, PowerUser: 2, Viewer: 1 };
    const userRole = userGroups?.[0] || "Viewer";
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  },
};
```

### Step 4.2: Create File Upload Lambda

Create `backend/lambda/uploadFile/index.js`:

```javascript
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;

exports.handler = async (event) => {
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
```

### Step 4.3: Create File Upload Completion Lambda

Create `backend/lambda/uploadComplete/index.js`:

```javascript
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
```

### Step 4.4: Create File Download Lambda

Create `backend/lambda/downloadFile/index.js`:

```javascript
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
```

### Step 4.5: Create List Files Lambda

Create `backend/lambda/listFiles/index.js`:

```javascript
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
```

### Step 4.6: Create Delete File Lambda

Create `backend/lambda/deleteFile/index.js`:

```javascript
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
```

### Step 4.7: Create Share Link Lambda

Create `backend/lambda/createShareLink/index.js`:

```javascript
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
```

### Step 4.8: Create Lambda Layer Deployment Package

```bash
cd backend/layers
zip -r layer.zip nodejs/

# Upload to S3 for CDK deployment
aws s3 cp layer.zip s3://your-deployment-bucket/layers/shared-layer.zip
```

### Step 4.9: Define Lambda Functions in CDK

Create `infrastructure/lib/lambda-stack.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface LambdaStackProps extends cdk.StackProps {
  filesBucket: any;
  filesTable: any;
  usersTable: any;
  accessLogsTable: any;
  shareLinksTable: any;
  userPool: any;
}

export class LambdaStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Create shared Lambda layer
    const sharedLayer = new lambda.LayerVersion(this, "SharedLayer", {
      code: lambda.Code.fromAsset("../backend/layers/layer.zip"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: "Shared utilities and dependencies",
    });

    // Common Lambda environment variables
    const commonEnv = {
      FILES_BUCKET: props.filesBucket.bucketName,
      FILES_TABLE: props.filesTable.tableName,
      USERS_TABLE: props.usersTable.tableName,
      ACCESS_LOGS_TABLE: props.accessLogsTable.tableName,
      SHARE_LINKS_TABLE: props.shareLinksTable.tableName,
    };

    // Upload File Lambda
    const uploadFileFn = new lambda.Function(this, "UploadFileFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/uploadFile"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Download File Lambda
    const downloadFileFn = new lambda.Function(this, "DownloadFileFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/downloadFile"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // List Files Lambda
    const listFilesFn = new lambda.Function(this, "ListFilesFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/listFiles"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Delete File Lambda
    const deleteFileFn = new lambda.Function(this, "DeleteFileFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/deleteFile"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Create Share Link Lambda
    const createShareLinkFn = new lambda.Function(
      this,
      "CreateShareLinkFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset("../backend/lambda/createShareLink"),
        layers: [sharedLayer],
        environment: commonEnv,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      }
    );

    // Grant permissions to Lambda functions
    props.filesBucket.grantReadWrite(uploadFileFn);
    props.filesBucket.grantRead(downloadFileFn);
    props.filesBucket.grantDelete(deleteFileFn);
    props.filesBucket.grantRead(createShareLinkFn);

    props.filesTable.grantReadWriteData(uploadFileFn);
    props.filesTable.grantReadData(downloadFileFn);
    props.filesTable.grantReadData(listFilesFn);
    props.filesTable.grantReadWriteData(deleteFileFn);
    props.filesTable.grantReadData(createShareLinkFn);

    props.usersTable.grantReadWriteData(uploadFileFn);
    props.usersTable.grantReadWriteData(deleteFileFn);

    props.accessLogsTable.grantWriteData(uploadFileFn);
    props.accessLogsTable.grantWriteData(downloadFileFn);
    props.accessLogsTable.grantWriteData(deleteFileFn);

    props.shareLinksTable.grantReadWriteData(createShareLinkFn);

    // Create API Gateway
    this.api = new apigateway.RestApi(this, "FileStorageAPI", {
      restApiName: "SecureFileVault API",
      description: "API for file storage and sharing",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "APIAuthorizer",
      {
        cognitoUserPools: [props.userPool],
      }
    );

    // API Resources
    const files = this.api.root.addResource("files");
    const fileById = files.addResource("{fileId}");
    const share = this.api.root.addResource("share");

    // POST /files/upload
    files
      .addResource("upload")
      .addMethod("POST", new apigateway.LambdaIntegration(uploadFileFn), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

    // GET /files
    files.addMethod("GET", new apigateway.LambdaIntegration(listFilesFn), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /files/{fileId}
    fileById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(downloadFileFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // DELETE /files/{fileId}
    fileById.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteFileFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // POST /share
    share.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createShareLinkFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // Output API URL
    new cdk.CfnOutput(this, "APIEndpoint", {
      value: this.api.url,
      exportName: "APIEndpoint",
    });
  }
}
```

### Step 4.10: Deploy Lambda Functions

```bash
cd infrastructure
cdk deploy LambdaStack

# Note the API Gateway endpoint URL
```

---

## Phase 5: Frontend Development

### Step 5.1: Set Up React Application

```bash
cd frontend
npx create-react-app file-vault-ui --template typescript
cd file-vault-ui

# Install dependencies
npm install aws-amplify @aws-amplify/ui-react
npm install axios react-router-dom
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install react-dropzone
npm install date-fns
```

### Step 5.2: Configure AWS Amplify

Create `frontend/file-vault-ui/src/aws-config.ts`:

```typescript
export const awsConfig = {
  Auth: {
    region: "us-east-1",
    userPoolId: "us-east-1_XXXXXXXXX", // Replace with your User Pool ID
    userPoolWebClientId: "XXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with Client ID
    mandatorySignIn: true,
    authenticationFlowType: "USER_PASSWORD_AUTH",
  },
  API: {
    endpoints: [
      {
        name: "FileStorageAPI",
        endpoint: "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod", // Replace with your API URL
        region: "us-east-1",
      },
    ],
  },
};
```

### Step 5.3: Create Authentication Context

Create `frontend/file-vault-ui/src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from "react";
import { Auth } from "aws-amplify";

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const user = await Auth.signIn(email, password);
    setUser(user);
  };

  const signUp = async (email: string, password: string) => {
    await Auth.signUp({
      username: email,
      password,
      attributes: { email },
    });
  };

  const signOut = async () => {
    await Auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

### Step 5.4: Create File Upload Component

Create `frontend/file-vault-ui/src/components/FileUpload.tsx`:

```typescript
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { API, Auth } from "aws-amplify";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Button,
  TextField,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface FileUploadProps {
  onUploadComplete: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setProgress(0);

    try {
      // Get JWT token
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      // Step 1: Request upload URL
      const response = await API.post("FileStorageAPI", "/files/upload", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          tags,
        },
      });

      const { uploadUrl, fileId } = response.data;

      // Step 2: Upload file to S3
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });

      // Step 3: Confirm upload completion
      await API.post("FileStorageAPI", "/files/upload-complete", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { fileId },
      });

      alert("File uploaded successfully!");
      onUploadComplete();
      setTags([]);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    multiple: false,
  });

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.400",
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragActive ? "action.hover" : "background.paper",
          transition: "all 0.3s",
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? "Drop file here"
            : "Drag & drop file or click to select"}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Maximum file size: 5GB
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Add tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTag()}
          InputProps={{
            endAdornment: (
              <Button onClick={addTag} size="small">
                Add
              </Button>
            ),
          }}
        />
        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => removeTag(tag)}
              size="small"
            />
          ))}
        </Box>
      </Box>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Uploading: {progress}%
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
```

### Step 5.5: Create File List Component

Create `frontend/file-vault-ui/src/components/FileList.tsx`:

```typescript
import React, { useState, useEffect } from "react";
import { API, Auth } from "aws-amplify";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  CircularProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import ShareIcon from "@mui/icons-material/Share";
import { formatBytes, formatDate } from "../utils/formatters";

interface File {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: number;
  tags: string[];
}

interface FileListProps {
  refresh: number;
}

export const FileList: React.FC<FileListProps> = ({ refresh }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [refresh]);

  const fetchFiles = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await API.get("FileStorageAPI", "/files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await API.get("FileStorageAPI", `/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      window.open(response.data.downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Download failed");
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      await API.del("FileStorageAPI", `/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("File deleted successfully");
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Delete failed");
    }
  };

  const handleShare = async (fileId: string) => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await API.post("FileStorageAPI", "/share", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          fileId,
          expiresIn: 86400, // 24 hours
        },
      });

      const { shareUrl } = response.data;
      navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Error creating share link:", error);
      alert("Failed to create share link");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (files.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="textSecondary">
          No files uploaded yet
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>File Name</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Uploaded</TableCell>
            <TableCell>Tags</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.fileId}>
              <TableCell>{file.fileName}</TableCell>
              <TableCell>{formatBytes(file.fileSize)}</TableCell>
              <TableCell>{file.fileType}</TableCell>
              <TableCell>{formatDate(file.uploadedAt)}</TableCell>
              <TableCell>
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {file.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => handleDownload(file.fileId)}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleShare(file.fileId)}
                  size="small"
                >
                  <ShareIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleDelete(file.fileId)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

### Step 5.6: Create Utility Functions

Create `frontend/file-vault-ui/src/utils/formatters.ts`:

```typescript
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};
```

### Step 5.7: Create Main Dashboard

Create `frontend/file-vault-ui/src/pages/Dashboard.tsx`:

```typescript
import React, { useState } from "react";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../contexts/AuthContext";
import { FileUpload } from "../components/FileUpload";
import { FileList } from "../components/FileList";

export const Dashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            SecureFileVault
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.attributes?.email}
          </Typography>
          <Button color="inherit" onClick={signOut} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Files
        </Typography>

        <FileUpload onUploadComplete={handleUploadComplete} />

        <FileList refresh={refreshKey} />
      </Container>
    </Box>
  );
};
```

### Step 5.8: Create Login Component

Create `frontend/file-vault-ui/src/pages/Login.tsx`:

```typescript
import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        await signUp(email, password);
        alert(
          "Sign up successful! Please check your email to verify your account."
        );
        setIsSignUp(false);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            SecureFileVault
          </Typography>
          <Typography variant="h6" align="center" gutterBottom>
            {isSignUp ? "Sign Up" : "Login"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
            >
              {isSignUp ? "Sign Up" : "Login"}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp
                ? "Already have an account? Login"
                : "Don't have an account? Sign Up"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
```

### Step 5.9: Update App.tsx

Replace `frontend/file-vault-ui/src/App.tsx`:

```typescript
import React from "react";
import { Amplify } from "aws-amplify";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { awsConfig } from "./aws-config";

Amplify.configure(awsConfig);

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
  },
});

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

### Step 5.10: Run Frontend Application

```bash
cd frontend/file-vault-ui

# Update aws-config.ts with your actual values

# Start development server
npm start

# Application will open at http://localhost:3000
```

---

## Phase 6: Security Hardening

### Step 6.1: Implement S3 Bucket Policies

```bash
# Create bucket policy JSON
cat > s3-bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy \
  --bucket YOUR-BUCKET-NAME \
  --policy file://s3-bucket-policy.json
```

### Step 6.2: Enable CloudTrail Logging

```bash
# Create CloudTrail trail
aws cloudtrail create-trail \
  --name securefile-vault-trail \
  --s3-bucket-name YOUR-LOGGING-BUCKET

# Start logging
aws cloudtrail start-logging --name securefile-vault-trail

# Enable log file validation
aws cloudtrail update-trail \
  --name securefile-vault-trail \
  --enable-log-file-validation
```

### Step 6.3: Configure AWS WAF (Web Application Firewall)

```typescript
// Add to infrastructure/lib/security-stack.ts

import * as wafv2 from "aws-cdk-lib/aws-wafv2";

export class SecurityStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & { api: any }
  ) {
    super(scope, id, props);

    // Create WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, "WebACL", {
      scope: "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "SecureFileVaultWebACL",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "RateLimitRule",
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "RateLimitRule",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "AWSManagedRulesCommonRuleSet",
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, "WebACLAssociation", {
      resourceArn: props.api.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn,
    });
  }
}
```

### Step 6.4: Enable DynamoDB Point-in-Time Recovery

```bash
# Enable PITR for all tables
aws dynamodb update-continuous-backups \
  --table-name SecureFileVault-Users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name SecureFileVault-Files \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name SecureFileVault-AccessLogs \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name SecureFileVault-ShareLinks \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Step 6.5: Set Up AWS Secrets Manager for Sensitive Data

```bash
# Store encryption keys or API keys
aws secretsmanager create-secret \
  --name securefile-vault/encryption-key \
  --secret-string '{"key":"YOUR-ENCRYPTION-KEY"}'

# Update Lambda to retrieve secrets
# Add to Lambda environment variables:
# SECRET_ARN: arn:aws:secretsmanager:region:account:secret:name
```

### Step 6.6: Implement API Gateway Request Validation

Add to `infrastructure/lib/lambda-stack.ts`:

```typescript
// Request validator
const requestValidator = new apigateway.RequestValidator(
  this,
  "RequestValidator",
  {
    restApi: this.api,
    requestValidatorName: "body-validator",
    validateRequestBody: true,
    validateRequestParameters: true,
  }
);

// Request model for file upload
const uploadModel = this.api.addModel("UploadModel", {
  contentType: "application/json",
  modelName: "UploadModel",
  schema: {
    type: apigateway.JsonSchemaType.OBJECT,
    required: ["fileName", "fileSize", "fileType"],
    properties: {
      fileName: {
        type: apigateway.JsonSchemaType.STRING,
        minLength: 1,
        maxLength: 255,
      },
      fileSize: { type: apigateway.JsonSchemaType.INTEGER, minimum: 1 },
      fileType: { type: apigateway.JsonSchemaType.STRING },
      tags: {
        type: apigateway.JsonSchemaType.ARRAY,
        items: { type: apigateway.JsonSchemaType.STRING },
      },
    },
  },
});

// Apply validator to endpoints
files
  .addResource("upload")
  .addMethod("POST", new apigateway.LambdaIntegration(uploadFileFn), {
    authorizer,
    authorizationType: apigateway.AuthorizationType.COGNITO,
    requestValidator,
    requestModels: { "application/json": uploadModel },
  });
```

### Step 6.7: Configure CORS Properly for Production

```typescript
// Update CORS in API Gateway for production
defaultCorsPreflightOptions: {
  allowOrigins: ['https://yourdomain.com'], // Replace with actual domain
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ],
  maxAge: cdk.Duration.days(1),
}
```

### Step 6.8: Enable AWS GuardDuty

```bash
# Enable GuardDuty for threat detection
aws guardduty create-detector --enable

# Get detector ID
DETECTOR_ID=$(aws guardduty list-detectors --query 'DetectorIds[0]' --output text)

# Configure findings export to S3
aws guardduty create-publishing-destination \
  --detector-id $DETECTOR_ID \
  --destination-type S3 \
  --destination-properties DestinationArn=arn:aws:s3:::your-guardduty-bucket,KmsKeyArn=arn:aws:kms:region:account:key/key-id
```

---

## Phase 7: Testing

### Step 7.1: Unit Testing Lambda Functions

Create `backend/lambda/uploadFile/test.js`:

```javascript
const { handler } = require("./index");

describe("Upload File Lambda", () => {
  const mockEvent = {
    headers: {
      Authorization: "Bearer mock-token",
    },
    body: JSON.stringify({
      fileName: "test.pdf",
      fileSize: 1024000,
      fileType: "application/pdf",
      tags: ["test", "document"],
    }),
  };

  test("should generate pre-signed URL", async () => {
    const result = await handler(mockEvent);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data.uploadUrl).toBeDefined();
    expect(body.data.fileId).toBeDefined();
  });

  test("should reject files over 5GB", async () => {
    const largeFileEvent = {
      ...mockEvent,
      body: JSON.stringify({
        fileName: "large.zip",
        fileSize: 6 * 1024 * 1024 * 1024, // 6GB
        fileType: "application/zip",
      }),
    };

    const result = await handler(largeFileEvent);
    expect(result.statusCode).toBe(400);
  });
});
```

Install testing dependencies:

```bash
cd backend/lambda/uploadFile
npm init -y
npm install --save-dev jest aws-sdk-mock

# Run tests
npm test
```

### Step 7.2: Integration Testing with Postman

Create `tests/postman-collection.json`:

```json
{
  "info": {
    "name": "SecureFileVault API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/x-amz-json-1.1"
              },
              {
                "key": "X-Amz-Target",
                "value": "AWSCognitoIdentityProviderService.InitiateAuth"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"AuthFlow\": \"USER_PASSWORD_AUTH\",\n  \"ClientId\": \"{{clientId}}\",\n  \"AuthParameters\": {\n    \"USERNAME\": \"{{username}}\",\n    \"PASSWORD\": \"{{password}}\"\n  }\n}"
            },
            "url": {
              "raw": "https://cognito-idp.{{region}}.amazonaws.com/",
              "protocol": "https",
              "host": ["cognito-idp", "{{region}}", "amazonaws", "com"],
              "path": [""]
            }
          }
        }
      ]
    },
    {
      "name": "File Operations",
      "item": [
        {
          "name": "Upload File - Get URL",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{idToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"fileName\": \"test-document.pdf\",\n  \"fileSize\": 102400,\n  \"fileType\": \"application/pdf\",\n  \"tags\": [\"test\", \"document\"]\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{apiEndpoint}}/files/upload",
              "host": ["{{apiEndpoint}}"],
              "path": ["files", "upload"]
            }
          }
        },
        {
          "name": "List Files",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{idToken}}"
              }
            ],
            "url": {
              "raw": "{{apiEndpoint}}/files?limit=20",
              "host": ["{{apiEndpoint}}"],
              "path": ["files"],
              "query": [
                {
                  "key": "limit",
                  "value": "20"
                }
              ]
            }
          }
        },
        {
          "name": "Download File",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{idToken}}"
              }
            ],
            "url": {
              "raw": "{{apiEndpoint}}/files/{{fileId}}",
              "host": ["{{apiEndpoint}}"],
              "path": ["files", "{{fileId}}"]
            }
          }
        },
        {
          "name": "Create Share Link",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{idToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"fileId\": \"{{fileId}}\",\n  \"expiresIn\": 86400,\n  \"maxDownloads\": 5\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{apiEndpoint}}/share",
              "host": ["{{apiEndpoint}}"],
              "path": ["share"]
            }
          }
        },
        {
          "name": "Delete File",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{idToken}}"
              }
            ],
            "url": {
              "raw": "{{apiEndpoint}}/files/{{fileId}}",
              "host": ["{{apiEndpoint}}"],
              "path": ["files", "{{fileId}}"]
            }
          }
        }
      ]
    }
  ]
}
```

### Step 7.3: Load Testing with Artillery

Install Artillery:

```bash
npm install -g artillery
```

Create `tests/load-test.yml`:

```yaml
config:
  target: "https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  processor: "./auth-processor.js"

scenarios:
  - name: "File Upload Flow"
    flow:
      - function: "authenticate"
      - post:
          url: "/files/upload"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            fileName: "load-test-{{ $randomString() }}.txt"
            fileSize: 1024
            fileType: "text/plain"
            tags: ["loadtest"]
          capture:
            - json: "$.data.fileId"
              as: "fileId"
      - get:
          url: "/files"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "File Download Flow"
    flow:
      - function: "authenticate"
      - get:
          url: "/files"
          headers:
            Authorization: "Bearer {{ token }}"
          capture:
            - json: "$.data.files[0].fileId"
              as: "fileId"
      - get:
          url: "/files/{{ fileId }}"
          headers:
            Authorization: "Bearer {{ token }}"
```

Run load test:

```bash
artillery run tests/load-test.yml
```

### Step 7.4: Security Testing

Create `tests/security-checks.sh`:

```bash
#!/bin/bash

echo "Running security checks..."

# Check S3 bucket public access
echo "Checking S3 bucket access..."
aws s3api get-public-access-block --bucket securefile-vault-ACCOUNT-REGION

# Check IAM policies
echo "Checking IAM policies for overly permissive actions..."
aws iam get-policy-version \
  --policy-arn arn:aws:iam::ACCOUNT:policy/LambdaExecutionPolicy \
  --version-id v1

# Check Cognito password policy
echo "Checking Cognito password policy..."
aws cognito-idp describe-user-pool --user-pool-id USER_POOL_ID

# Check DynamoDB encryption
echo "Checking DynamoDB encryption..."
aws dynamodb describe-table --table-name SecureFileVault-Files \
  --query 'Table.SSEDescription'

# Check CloudTrail status
echo "Checking CloudTrail logging..."
aws cloudtrail get-trail-status --name securefile-vault-trail

echo "Security checks complete!"
```

### Step 7.5: End-to-End Testing

Create `tests/e2e/file-upload.spec.js`:

```javascript
// Using Playwright or Cypress
describe("File Upload E2E", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000");
    cy.login("testuser@example.com", "TestPassword123!");
  });

  it("should upload a file successfully", () => {
    const fileName = "test-document.pdf";

    // Upload file
    cy.get('input[type="file"]').attachFile(fileName);
    cy.get('[data-testid="upload-button"]').click();

    // Wait for upload
    cy.contains("File uploaded successfully", { timeout: 30000 });

    // Verify file appears in list
    cy.contains(fileName).should("be.visible");
  });

  it("should download a file", () => {
    cy.contains("test-document.pdf")
      .parent()
      .find('[data-testid="download-button"]')
      .click();

    // Verify download started
    cy.verifyDownload("test-document.pdf");
  });

  it("should create and copy share link", () => {
    cy.contains("test-document.pdf")
      .parent()
      .find('[data-testid="share-button"]')
      .click();

    // Check clipboard
    cy.window()
      .its("navigator.clipboard")
      .invoke("readText")
      .should("contain", "share");
  });

  it("should delete a file", () => {
    cy.contains("test-document.pdf")
      .parent()
      .find('[data-testid="delete-button"]')
      .click();
    cy.contains("Are you sure").should("be.visible");
    cy.contains("Confirm").click();

    // Verify file removed
    cy.contains("test-document.pdf").should("not.exist");
  });
});
```

---

## Phase 8: Deployment

### Step 8.1: Production Configuration

Create `infrastructure/config/prod.ts`:

```typescript
export const prodConfig = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
  stackName: "SecureFileVault-Production",

  // S3 Configuration
  s3: {
    removalPolicy: "RETAIN", // Keep data on stack deletion
    autoDeleteObjects: false,
    lifecycleRules: {
      oldVersionsExpirationDays: 90,
      glacierTransitionDays: 30,
    },
  },

  // DynamoDB Configuration
  dynamodb: {
    billingMode: "PROVISIONED",
    readCapacity: 100,
    writeCapacity: 50,
    enableAutoScaling: true,
    removalPolicy: "RETAIN",
  },

  // Lambda Configuration
  lambda: {
    memorySize: 512,
    timeout: 30,
    reservedConcurrentExecutions: 100,
    logRetentionDays: 30,
  },

  // Cognito Configuration
  cognito: {
    mfa: "REQUIRED", // Enforce MFA in production
    passwordPolicy: {
      minLength: 12,
    },
  },

  // API Gateway Configuration
  apiGateway: {
    throttle: {
      rateLimit: 10000,
      burstLimit: 5000,
    },
    cloudWatchLogsEnabled: true,
    tracingEnabled: true,
  },

  // Domain Configuration
  domain: {
    domainName: "api.securefile-vault.com",
    certificateArn: "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID",
  },
};
```

### Step 8.2: Create CI/CD Pipeline with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  NODE_VERSION: 18

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: |
          cd backend
          npm install
          cd ../frontend/file-vault-ui
          npm install

      - name: Run backend tests
        run: |
          cd backend
          npm test

      - name: Run frontend tests
        run: |
          cd frontend/file-vault-ui
          npm test -- --coverage --watchAll=false

      - name: Security scan
        run: |
          npm install -g snyk
          snyk test --all-projects

  deploy-staging:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install CDK
        run: npm install -g aws-cdk

      - name: Deploy to staging
        run: |
          cd infrastructure
          npm install
          cdk deploy --all --require-approval never \
            --context environment=staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://securefile-vault.com
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install CDK
        run: npm install -g aws-cdk

      - name: Build frontend
        run: |
          cd frontend/file-vault-ui
          npm install
          npm run build

      - name: Deploy infrastructure
        run: |
          cd infrastructure
          npm install
          cdk deploy --all --require-approval never \
            --context environment=production

      - name: Deploy frontend to S3
        run: |
          aws s3 sync frontend/file-vault-ui/build/ \
            s3://securefile-vault-frontend/ \
            --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Run smoke tests
        run: |
          npm install -g newman
          newman run tests/postman-collection.json \
            --environment tests/production-env.json

  rollback:
    needs: deploy-production
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Rollback deployment
        run: |
          echo "Deployment failed. Initiating rollback..."
          # Implement rollback logic
```

### Step 8.3: Manual Deployment Steps

```bash
# 1. Update configuration files
cd infrastructure
vim config/prod.ts  # Update with production values

# 2. Build Lambda layers
cd ../backend/layers
npm install --production
zip -r layer.zip nodejs/

# 3. Build frontend
cd ../../frontend/file-vault-ui
npm run build

# 4. Deploy infrastructure
cd ../../infrastructure
npm install

# 5. Synthesize CloudFormation
cdk synth --all --context environment=production

# 6. Review changes
cdk diff --all --context environment=production

# 7. Deploy (requires manual confirmation)
cdk deploy --all --context environment=production

# 8. Get output values
aws cloudformation describe-stacks \
  --stack-name SecureFileVault-Production \
  --query 'Stacks[0].Outputs'

# 9. Deploy frontend to S3 (if using S3 hosting)
aws s3 sync ../frontend/file-vault-ui/build/ \
  s3://securefile-vault-frontend-prod/ \
  --delete \
  --cache-control max-age=31536000,public

# 10. Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"
```

### Step 8.4: Database Migration (if needed)

Create `scripts/migrate-data.js`:

```javascript
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function migrateUserData() {
  console.log("Starting data migration...");

  const params = {
    TableName: "SecureFileVault-Users-Old",
  };

  const users = await dynamodb.scan(params).promise();

  for (const user of users.Items) {
    // Transform data if needed
    const newUser = {
      ...user,
      migratedAt: Date.now(),
    };

    await dynamodb
      .put({
        TableName: "SecureFileVault-Users",
        Item: newUser,
      })
      .promise();

    console.log(`Migrated user: ${user.userId}`);
  }

  console.log("Migration complete!");
}

migrateUserData().catch(console.error);
```

### Step 8.5: Post-Deployment Verification

Create `scripts/verify-deployment.sh`:

```bash
#!/bin/bash

API_ENDPOINT="https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod"

echo "Verifying deployment..."

# Health check
echo "1. API Health Check"
curl -f $API_ENDPOINT/health || exit 1

# Check S3 buckets
echo "2. Checking S3 buckets"
aws s3 ls | grep securefile-vault || exit 1

# Check DynamoDB tables
echo "3. Checking DynamoDB tables"
aws dynamodb list-tables | grep SecureFileVault || exit 1

# Check Lambda functions
echo "4. Checking Lambda functions"
aws lambda list-functions | grep SecureFileVault || exit 1

# Check Cognito User Pool
echo "5. Checking Cognito User Pool"
aws cognito-idp list-user-pools --max-results 10 | grep SecureFileVault || exit 1

# Verify WAF rules
echo "6. Checking WAF configuration"
aws wafv2 list-web-acls --scope=REGIONAL | grep SecureFileVault || exit 1

# Check CloudWatch alarms
echo "7. Checking CloudWatch alarms"
aws cloudwatch describe-alarms | grep SecureFileVault || exit 1

echo "Deployment verification complete!"
```

---

## Phase 9: Monitoring

### Step 9.1: Create CloudWatch Dashboard

Create `infrastructure/lib/monitoring-stack.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as actions from "aws-cdk-lib/aws-cloudwatch-actions";
import { Construct } from "constructs";

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, "AlertTopic", {
      displayName: "SecureFileVault Alerts",
    });

    // Add email subscription
    alertTopic.addSubscription(
      new subscriptions.EmailSubscription("admin@example.com")
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, "MainDashboard", {
      dashboardName: "SecureFileVault-Metrics",
    });

    // API Gateway metrics
    const apiRequests = new cloudwatch.Metric({
      namespace: "AWS/ApiGateway",
      metricName: "Count",
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    const api4xxErrors = new cloudwatch.Metric({
      namespace: "AWS/ApiGateway",
      metricName: "4XXError",
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    const api5xxErrors = new cloudwatch.Metric({
      namespace: "AWS/ApiGateway",
      metricName: "5XXError",
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    // Lambda metrics
    const lambdaErrors = new cloudwatch.Metric({
      namespace: "AWS/Lambda",
      metricName: "Errors",
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    const lambdaDuration = new cloudwatch.Metric({
      namespace: "AWS/Lambda",
      metricName: "Duration",
      statistic: "Average",
      period: cdk.Duration.minutes(5),
    });

    // DynamoDB metrics
    const dynamodbReadThrottle = new cloudwatch.Metric({
      namespace: "AWS/DynamoDB",
      metricName: "UserErrors",
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    // S3 metrics
    const s3Requests = new cloudwatch.Metric({
      namespace: "AWS/S3",
      metricName: "AllRequests",
      statistic: "Sum",
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "API Gateway Requests",
        left: [apiRequests],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "API Gateway Errors",
        left: [api4xxErrors, api5xxErrors],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Performance",
        left: [lambdaDuration],
        right: [lambdaErrors],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "DynamoDB Throttling",
        left: [dynamodbReadThrottle],
        width: 12,
      })
    );

    // Alarms
    const highErrorRateAlarm = new cloudwatch.Alarm(this, "HighErrorRate", {
      metric: api5xxErrors,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highErrorRateAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, "LambdaErrors", {
      metric: lambdaErrors,
      threshold: 5,
      evaluationPeriods: 1,
    });

    lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Output
    new cdk.CfnOutput(this, "DashboardURL", {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
    });
  }
}
```

### Step 9.2: Set Up X-Ray Tracing

Update Lambda functions to enable tracing:

```typescript
// In lambda-stack.ts
const uploadFileFn = new lambda.Function(this, "UploadFileFunction", {
  // ... existing config
  tracing: lambda.Tracing.ACTIVE, // Enable X-Ray
});

// Add X-Ray SDK to Lambda code
// In Lambda function:
const AWSXRay = require("aws-xray-sdk-core");
const AWS = AWSXRay.captureAWS(require("aws-sdk"));
```

### Step 9.3: Create Custom Metrics

Add to Lambda functions:

```javascript
const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

async function publishMetric(metricName, value, unit = "Count") {
  await cloudwatch
    .putMetricData({
      Namespace: "SecureFileVault",
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: [
            {
              Name: "Environment",
              Value: process.env.ENVIRONMENT || "production",
            },
          ],
        },
      ],
    })
    .promise();
}

// Use in Lambda handlers
await publishMetric("FileUploaded", 1);
await publishMetric("UploadSize", fileSize, "Bytes");
```

### Step 9.4: Configure Log Insights Queries

Create `monitoring/log-insights-queries.json`:

```json
{
  "queries": [
    {
      "name": "Top 10 Errors",
      "query": "fields @timestamp, @message\n| filter @message like /ERROR/\n| stats count() by @message\n| sort count desc\n| limit 10"
    },
    {
      "name": "Average Lambda Duration",
      "query": "filter @type = \"REPORT\"\n| stats avg(@duration), max(@duration), min(@duration) by bin(5m)"
    },
    {
      "name": "Failed File Uploads",
      "query": "fields @timestamp, userId, fileName, errorMessage\n| filter action = \"upload\" and success = false\n| sort @timestamp desc\n| limit 100"
    },
    {
      "name": "Large File Uploads",
      "query": "fields @timestamp, userId, fileName, fileSize\n| filter action = \"upload\" and fileSize > 1000000000\n| sort fileSize desc"
    },
    {
      "name": "User Activity Summary",
      "query": "stats count() by userId, action\n| sort count desc"
    }
  ]
}
```

### Step 9.5: Set Up AWS Config Rules

Create `infrastructure/lib/compliance-stack.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import * as config from "aws-cdk-lib/aws-config";
import { Construct } from "constructs";

export class ComplianceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket encryption check
    new config.ManagedRule(this, "S3BucketEncryptionRule", {
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: "Check that S3 buckets have encryption enabled",
    });

    // S3 bucket public access check
    new config.ManagedRule(this, "S3BucketPublicAccessRule", {
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      description: "Check that S3 buckets do not allow public read access",
    });

    // DynamoDB encryption check
    new config.ManagedRule(this, "DynamoDBEncryptionRule", {
      identifier: config.ManagedRuleIdentifiers.DYNAMODB_TABLE_ENCRYPTED_KMS,
      description: "Check that DynamoDB tables are encrypted with KMS",
    });

    // CloudTrail enabled check
    new config.ManagedRule(this, "CloudTrailEnabledRule", {
      identifier: config.ManagedRuleIdentifiers.CLOUD_TRAIL_ENABLED,
      description: "Check that CloudTrail is enabled",
    });

    // IAM password policy check
    new config.ManagedRule(this, "IAMPasswordPolicyRule", {
      identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
      description: "Check IAM password policy compliance",
      inputParameters: {
        RequireUppercaseCharacters: true,
        RequireLowercaseCharacters: true,
        RequireSymbols: true,
        RequireNumbers: true,
        MinimumPasswordLength: 12,
      },
    });
  }
}
```

### Step 9.6: Create Operational Dashboard

Create a simple HTML dashboard for operations team:

```html
<!-- monitoring/ops-dashboard.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>SecureFileVault Operations Dashboard</title>
    <style>
      body {
        font-family: Arial;
        margin: 20px;
        background: #f5f5f5;
      }
      .metric-card {
        background: white;
        padding: 20px;
        margin: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: inline-block;
        min-width: 200px;
      }
      .metric-value {
        font-size: 32px;
        font-weight: bold;
        color: #1976d2;
      }
      .metric-label {
        color: #666;
        margin-top: 8px;
      }
      .status-ok {
        color: green;
      }
      .status-warning {
        color: orange;
      }
      .status-error {
        color: red;
      }
      iframe {
        width: 100%;
        height: 400px;
        border: none;
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <h1>SecureFileVault Operations Dashboard</h1>

    <div id="metrics">
      <div class="metric-card">
        <div class="metric-value" id="totalUsers">-</div>
        <div class="metric-label">Total Users</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="totalFiles">-</div>
        <div class="metric-label">Total Files</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="storageUsed">-</div>
        <div class="metric-label">Storage Used (GB)</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="apiRequests">-</div>
        <div class="metric-label">API Requests (24h)</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="errorRate">-</div>
        <div class="metric-label">Error Rate</div>
      </div>
    </div>

    <h2>System Health</h2>
    <div id="health">
      <p>API Gateway: <span id="apiHealth" class="status-ok">Healthy</span></p>
      <p>
        Lambda Functions:
        <span id="lambdaHealth" class="status-ok">Healthy</span>
      </p>
      <p>DynamoDB: <span id="dynamoHealth" class="status-ok">Healthy</span></p>
      <p>S3 Buckets: <span id="s3Health" class="status-ok">Healthy</span></p>
    </div>

    <h2>CloudWatch Dashboard</h2>
    <iframe
      src="https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=SecureFileVault-Metrics"
    ></iframe>

    <script>
      // Fetch metrics from CloudWatch or your API
      async function updateMetrics() {
        try {
          const response = await fetch("/api/metrics");
          const data = await response.json();

          document.getElementById("totalUsers").textContent = data.totalUsers;
          document.getElementById("totalFiles").textContent = data.totalFiles;
          document.getElementById("storageUsed").textContent = (
            data.storageUsed / 1073741824
          ).toFixed(2);
          document.getElementById("apiRequests").textContent =
            data.apiRequests24h;
          document.getElementById("errorRate").textContent =
            data.errorRate + "%";

          // Update health indicators
          updateHealthStatus("apiHealth", data.health.api);
          updateHealthStatus("lambdaHealth", data.health.lambda);
          updateHealthStatus("dynamoHealth", data.health.dynamodb);
          updateHealthStatus("s3Health", data.health.s3);
        } catch (error) {
          console.error("Error fetching metrics:", error);
        }
      }

      function updateHealthStatus(elementId, status) {
        const element = document.getElementById(elementId);
        element.className = "status-" + status;
        element.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      }

      // Update every 30 seconds
      updateMetrics();
      setInterval(updateMetrics, 30000);
    </script>
  </body>
</html>
```

---

## Additional Implementation Steps

### Step 10.1: Implement File Versioning UI

Add version management to frontend:

```typescript
// frontend/file-vault-ui/src/components/FileVersions.tsx
import React, { useState, useEffect } from "react";
import { API, Auth } from "aws-amplify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import DownloadIcon from "@mui/icons-material/Download";

interface FileVersionsProps {
  fileId: string;
  open: boolean;
  onClose: () => void;
}

export const FileVersions: React.FC<FileVersionsProps> = ({
  fileId,
  open,
  onClose,
}) => {
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, fileId]);

  const fetchVersions = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await API.get(
        "FileStorageAPI",
        `/files/${fileId}/versions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setVersions(response.data.versions);
    } catch (error) {
      console.error("Error fetching versions:", error);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!window.confirm("Restore this version?")) return;

    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      await API.post(
        "FileStorageAPI",
        `/files/${fileId}/restore/${versionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Version restored successfully");
      onClose();
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("Failed to restore version");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>File Version History</DialogTitle>
      <DialogContent>
        <List>
          {versions.map((version, index) => (
            <ListItem key={version.versionId}>
              <ListItemText
                primary={`Version ${versions.length - index}`}
                secondary={`Modified: ${new Date(
                  version.lastModified
                ).toLocaleString()} | Size: ${version.size} bytes`}
              />
              <IconButton onClick={() => handleRestore(version.versionId)}>
                <RestoreIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};
```

### Step 10.2: Add Search Functionality

Create search Lambda and UI:

```javascript
// backend/lambda/searchFiles/index.js
const AWS = require("aws-sdk");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const FILES_TABLE = process.env.FILES_TABLE;

exports.handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);
    const { query, tags, fileType, startDate, endDate } =
      event.queryStringParameters || {};

    let filterExpression = "userId = :userId";
    let expressionAttributeValues = { ":userId": userId };
    let expressionAttributeNames = {};

    if (query) {
      filterExpression += " AND contains(fileName, :query)";
      expressionAttributeValues[":query"] = query;
    }

    if (fileType) {
      filterExpression += " AND fileType = :fileType";
      expressionAttributeValues[":fileType"] = fileType;
    }

    if (startDate) {
      filterExpression += " AND uploadedAt >= :startDate";
      expressionAttributeValues[":startDate"] = parseInt(startDate);
    }

    if (endDate) {
      filterExpression += " AND uploadedAt <= :endDate";
      expressionAttributeValues[":endDate"] = parseInt(endDate);
    }

    const params = {
      TableName: FILES_TABLE,
      IndexName: "UserFilesIndex",
      KeyConditionExpression: "userId = :userId",
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    if (Object.keys(expressionAttributeNames).length > 0) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await dynamodb.query(params).promise();

    // Filter by tags if provided
    let files = result.Items;
    if (tags) {
      const tagArray = tags.split(",");
      files = files.filter((file) =>
        tagArray.some((tag) => file.tags?.includes(tag))
      );
    }

    return success({ files, count: files.length });
  } catch (err) {
    console.error("Error:", err);
    return error(err.message || "Internal server error", 500);
  }
};
```

### Step 10.3: Implement Storage Quota Management

Create Lambda for quota enforcement:

```javascript
// backend/lambda/checkQuota/index.js
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.claims.sub;

  try {
    const user = await dynamodb
      .get({
        TableName: process.env.USERS_TABLE,
        Key: { userId },
      })
      .promise();

    const storageUsed = user.Item?.storageUsed || 0;
    const storageQuota = user.Item?.storageQuota || 10737418240; // 10GB default

    const percentUsed = (storageUsed / storageQuota) * 100;

    // Send warning if > 80%
    if (percentUsed > 80) {
      await sendQuotaWarning(userId, percentUsed);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        storageUsed,
        storageQuota,
        percentUsed: percentUsed.toFixed(2),
        available: storageQuota - storageUsed,
      }),
    };
  } catch (error) {
    console.error("Error checking quota:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to check quota" }),
    };
  }
};

async function sendQuotaWarning(userId, percentUsed) {
  const sns = new AWS.SNS();
  await sns
    .publish({
      TopicArn: process.env.ALERT_TOPIC_ARN,
      Subject: "Storage Quota Warning",
      Message: `User ${userId} has used ${percentUsed.toFixed(
        2
      )}% of storage quota`,
    })
    .promise();
}
```

### Step 10.4: Add Audit Logging

Enhance logging across all operations:

```javascript
// backend/layers/nodejs/utils/audit.js
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function logAuditEvent(event) {
  const {
    userId,
    action,
    resourceType,
    resourceId,
    status,
    ipAddress,
    userAgent,
    metadata = {},
  } = event;

  const auditEntry = {
    logId: `${resourceId}-${Date.now()}`,
    userId,
    action,
    resourceType,
    resourceId,
    status,
    ipAddress,
    userAgent,
    metadata,
    timestamp: Date.now(),
    ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days
  };

  await dynamodb
    .put({
      TableName: process.env.ACCESS_LOGS_TABLE,
      Item: auditEntry,
    })
    .promise();

  console.log("Audit log created:", JSON.stringify(auditEntry));
}

module.exports = { logAuditEvent };
```

### Step 10.5: Create Admin Dashboard

```typescript
// frontend/file-vault-ui/src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { API, Auth } from "aws-amplify";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const [statsRes, activityRes] = await Promise.all([
        API.get("FileStorageAPI", "/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get("FileStorageAPI", "/admin/activity", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data.activities);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Users</Typography>
            <Typography variant="h3">{stats.totalUsers || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Total Files</Typography>
            <Typography variant="h3">{stats.totalFiles || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Storage Used</Typography>
            <Typography variant="h3">
              {stats.storageUsed
                ? (stats.storageUsed / 1073741824).toFixed(2)
                : 0}{" "}
              GB
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Active Shares</Typography>
            <Typography variant="h3">{stats.activeShares || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentActivity.map((activity) => (
              <TableRow key={activity.logId}>
                <TableCell>
                  {new Date(activity.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{activity.userId}</TableCell>
                <TableCell>{activity.action}</TableCell>
                <TableCell>{activity.resourceId}</TableCell>
                <TableCell>{activity.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] Integration tests completed
- [ ] Security scan performed
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] AWS credentials set up
- [ ] Domain and SSL certificates ready

### Deployment

- [ ] Infrastructure deployed (CDK stacks)
- [ ] Lambda functions deployed
- [ ] Frontend built and deployed
- [ ] Database migrations completed
- [ ] CloudWatch alarms configured
- [ ] WAF rules activated
- [ ] DNS records updated
- [ ] SSL certificates verified

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Health checks verified
- [ ] Monitoring dashboards accessible
- [ ] Alert notifications working
- [ ] Backup verification
- [ ] User access tested
- [ ] Documentation published
- [ ] Stakeholders notified

---

## Troubleshooting Guide

### Common Issues

**Issue: Lambda timeout**

```
Solution:
- Increase timeout in CDK configuration
- Optimize Lambda code
- Check DynamoDB capacity
- Review X-Ray traces for bottlenecks
```

**Issue: CORS errors**

```
Solution:
- Verify API Gateway CORS configuration
- Check allowed origins
- Ensure preflight requests handled
- Verify headers in Lambda responses
```

**Issue: Authentication failures**

```
Solution:
- Verify Cognito User Pool configuration
- Check JWT token expiration
- Confirm user pool client settings
- Review IAM roles and policies
```

**Issue: S3 upload failures**

```
Solution:
- Check bucket permissions
- Verify pre-signed URL generation
- Review bucket CORS settings
- Check file size limits
```

**Issue: High DynamoDB costs**

```
Solution:
- Review capacity mode (on-demand vs provisioned)
- Enable auto-scaling
- Optimize queries and indexes
- Implement caching layer
```

---

## Cost Optimization Tips

1. **S3 Lifecycle Policies**: Move old versions to Glacier
2. **DynamoDB On-Demand**: Use for unpredictable workloads
3. **Lambda Reserved Concurrency**: Optimize for consistent traffic
4. **CloudFront CDN**: Reduce data transfer costs
5. **Monitoring**: Set up billing alerts
6. **Right-sizing**: Regular review of resource utilization

---

## Security Best Practices Summary

1. ✅ Encryption at rest (S3, DynamoDB)
2. ✅ Encryption in transit (TLS 1.2+)
3. ✅ IAM least privilege principle
4. ✅ MFA enforcement for production
5. ✅ Regular security audits
6. ✅ CloudTrail logging enabled
7. ✅ WAF rules for API protection
8. ✅ Secrets Manager for sensitive data
9. ✅ Regular dependency updates
10. ✅ Automated security scanning

---

## Next Steps

After successful deployment:

1. **User Onboarding**: Create documentation and tutorials
2. **Performance Optimization**: Monitor and optimize based on usage
3. **Feature Enhancements**: Implement additional features from roadmap
4. **Scaling**: Plan for increased load
5. **Compliance**: Regular audits and compliance checks
6. **Disaster Recovery**: Test backup and recovery procedures
7. **User Feedback**: Collect and implement user suggestions

---

## Support and Maintenance

### Regular Tasks

- Daily: Monitor dashboards and alerts
- Weekly: Review logs and performance metrics
- Monthly: Security patch updates
- Quarterly: Cost optimization review
- Annually: Disaster recovery testing

### Contact Information

- Technical Support: support@securefile-vault.com
- Security Issues: security@securefile-vault.com
- Documentation: https://docs.securefile-vault.com

---

**End of Implementation Guide**

This guide provides a comprehensive roadmap for building and deploying the SecureFileVault application on AWS. Follow each phase sequentially, testing thoroughly at each step before proceeding to the next.
