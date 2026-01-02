# AWS File Storage System - Detailed Implementation Guide

**Project:** SecureFileVault  
**Version:** 1.0  
**Last Updated:** October 2025

---

## Table of Contents

1. [Phase 1: Project Setup and Prerequisites](#phase-1-project-setup-and-prerequisites)
2. [Phase 2: Backend Infrastructure](#phase-2)
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

# Phase 2 — StorageStack & DatabaseStack (CDK v2, JavaScript)

This document contains **complete, ready-to-paste JavaScript CDK stack files** for S3 storage (files + thumbnails) and DynamoDB (users, files, access logs, share links). Each file below is a full CommonJS module compatible with a CDK v2 JavaScript app created with `cdk init`.

---

## Files to create

Put these files under `infrastructure/lib/` in your project:

- `storage-stack.js`
- `database-stack.js`

Also ensure your `bin/infrastructure.js` wires these stacks (example provided at the end).

---

## `storage-stack.js`

Create `infrastructure/lib/storage-stack.js` with the following content:

```js
// infrastructure/lib/storage-stack.js
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");

class StorageStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Main files bucket
    this.filesBucket = new s3.Bucket(this, "FileStorageBucket", {
      bucketName: `securefile-vault-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          // In dev you can use '*' — in prod replace with your real origins
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        { noncurrentVersionExpiration: cdk.Duration.days(90) },
        {
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        { abortIncompleteMultipartUploadAfter: cdk.Duration.days(7) },
      ],
      // DEV ONLY: change to RETAIN in production
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Thumbnail bucket for generated images
    this.thumbnailsBucket = new s3.Bucket(this, "ThumbnailsBucket", {
      bucketName: `securefile-vault-thumbnails-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Outputs
    new cdk.CfnOutput(this, "FilesBucketName", {
      value: this.filesBucket.bucketName,
      exportName: "FilesBucketName",
    });
    new cdk.CfnOutput(this, "ThumbnailsBucketName", {
      value: this.thumbnailsBucket.bucketName,
      exportName: "ThumbnailsBucketName",
    });
  }
}

module.exports = { StorageStack };
```

**Important notes**:

- `blockPublicAccess` and `encryption` are set for safety.
- Replace `allowedOrigins` with your actual frontend domain(s) before production.
- `RemovalPolicy.DESTROY` and `autoDeleteObjects: true` are convenient for development but will delete data if the stack is destroyed. Change to `RemovalPolicy.RETAIN` for production.

---

## `database-stack.js`

Create `infrastructure/lib/database-stack.js` with the full content below:

```js
// infrastructure/lib/database-stack.js
const cdk = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");

class DatabaseStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Users table
    this.usersTable = new dynamodb.Table(this, "UsersTable", {
      tableName: "SecureFileVault-Users",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // change to RETAIN in prod
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
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for listing user's files
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
      timeToLiveAttribute: "expiresAt",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

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

    this.shareLinksTable.addGlobalSecondaryIndex({
      indexName: "FileSharesIndex",
      partitionKey: { name: "fileId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, "UsersTableName", {
      value: this.usersTable.tableName,
      exportName: "UsersTableName",
    });
    new cdk.CfnOutput(this, "FilesTableName", {
      value: this.filesTable.tableName,
      exportName: "FilesTableName",
    });
    new cdk.CfnOutput(this, "AccessLogsTableName", {
      value: this.accessLogsTable.tableName,
      exportName: "AccessLogsTableName",
    });
    new cdk.CfnOutput(this, "ShareLinksTableName", {
      value: this.shareLinksTable.tableName,
      exportName: "ShareLinksTableName",
    });
  }
}

module.exports = { DatabaseStack };
```

**Important notes**:

- We used `pointInTimeRecoverySpecification` to avoid deprecation warnings.
- TTL is enabled on access logs and share links via `timeToLiveAttribute`.

---

## `bin/infrastructure.js` (example wiring)

If you don’t already have a `bin/infrastructure.js`, use this full example. It instantiates the two stacks so `cdk deploy` will pick them up.

```js
#!/usr/bin/env node
const cdk = require("aws-cdk-lib");
const { StorageStack } = require("../lib/storage-stack");
const { DatabaseStack } = require("../lib/database-stack");

const app = new cdk.App();

const storage = new StorageStack(app, "StorageStack");
const database = new DatabaseStack(app, "DatabaseStack");

// Later stacks (Auth, Lambda) should receive references to storage.filesBucket, database.filesTable, etc.
```

---

## Deploying these stacks

From `infrastructure/`:

```bash
pnpm install
pnpm exec cdk synth
pnpm exec cdk deploy StorageStack DatabaseStack --require-approval never
```

Watch for outputs displayed in the terminal. You can also run `pnpm exec cdk deploy --all` once you add additional stacks.

---

## Post-deploy verification commands

```bash
aws s3 ls | grep securefile-vault
aws dynamodb list-tables | grep SecureFileVault
aws cloudformation describe-stacks --stack-name StorageStack --query "Stacks[0].Outputs"
aws cloudformation describe-stacks --stack-name DatabaseStack --query "Stacks[0].Outputs"
```

---

## Troubleshooting checklist

- **Cannot find asset**: ensure Lambda code directories referenced later exist (this phase doesn't create Lambdas but the LambdaStack will reference resources). Use full relative paths from `infrastructure/lib/` to your `backend/` directories.
- **Bucket name already exists**: either remove the explicit `bucketName` or change it.
- **RemovalPolicy**: switching to `RETAIN` prevents data loss in production.

---

## Next

Phase 3 will implement the **AuthStack (Cognito + Identity Pool + Roles)** and produce the `auth-stack.js` CommonJS file plus guidance on testing Cognito with AWS CLI.

# Phase 3 — AuthStack (Cognito User Pool, Identity Pool, IAM Roles)

This document contains the **complete** JavaScript CDK stack for authentication using Cognito, plus CLI test commands and troubleshooting steps. It is written for **CDK v2 (aws-cdk-lib)** and CommonJS modules. Copy the file into `infrastructure/lib/auth-stack.js` and wire it in `bin/infrastructure.js` as shown.

---

## Goals

- Create a Cognito **User Pool** (user directory) and **User Pool Client** (web app client)
- Create a Cognito **Identity Pool** (federated identities) and an **authenticated IAM role** for users
- Create three user groups (Admin, PowerUser, Viewer)
- Output important identifiers (UserPoolId, UserPoolClientId, IdentityPoolId)
- Ensure the stack is idempotent and avoid changing user pool schema after initial creation (instructions provided)

---

## `infrastructure/lib/auth-stack.js` (full file)

```js
// infrastructure/lib/auth-stack.js
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const iam = require("aws-cdk-lib/aws-iam");

class AuthStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create User Pool
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "SecureFileVaultUserPool",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // dev only; use RETAIN in prod
    });

    // User Pool Client (web) - no secret so browser apps can use it
    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      generateSecret: false,
      authFlows: { userPassword: true, userSrp: true, refreshToken: true },
    });

    // Create Groups (Admin, PowerUser, Viewer)
    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "Admin",
      description: "Administrators with full access",
      precedence: 1,
    });

    new cognito.CfnUserPoolGroup(this, "PowerUserGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "PowerUser",
      description: "Power users with upload/manage permissions",
      precedence: 2,
    });

    new cognito.CfnUserPoolGroup(this, "ViewerGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "Viewer",
      description: "Read-only users",
      precedence: 3,
    });

    // Identity Pool (Cognito Identity)
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

    // Authenticated role assumed via Cognito identity
    const authenticatedRole = new iam.Role(this, "CognitoAuthenticatedRole", {
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
      description: "Role assumed by authenticated Cognito users",
    });

    // Default policy for authenticated users (least-privilege example: list/get S3 objects and call API)
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject", "s3:ListBucket"],
        resources: [
          "arn:aws:s3:::securefile-vault-*",
          "arn:aws:s3:::securefile-vault-*/*",
        ],
      })
    );

    // Attach role to identity pool
    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      "IdentityPoolRoleAttachment",
      {
        identityPoolId: identityPool.ref,
        roles: { authenticated: authenticatedRole.roleArn },
      }
    );

    // Outputs
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      exportName: "UserPoolId",
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      exportName: "UserPoolClientId",
    });
    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: identityPool.ref,
      exportName: "IdentityPoolId",
    });
  }
}

module.exports = { AuthStack };
```

---

## Important: Avoid modifying User Pool schema after creation

**AWS Cognito disallows changes to existing user pool schema attributes.** If you already deployed a User Pool and later change `standardAttributes`, `schema` or `autoVerifiedAttributes`, the CloudFormation update will fail with an error like:

```
Invalid request provided: Existing schema attributes cannot be modified or deleted.
```

**If this is a development environment** and there are no production users, the simplest fix is to delete the existing user pool and redeploy:

```bash
# list pools
aws cognito-idp list-user-pools --max-results 60

# delete specific pool
aws cognito-idp delete-user-pool --user-pool-id <userPoolId>

# delete CloudFormation stack if partially created
aws cloudformation delete-stack --stack-name AuthStack
```

**If you must keep the existing pool** (production): modify the CDK stack to `import` the existing user pool instead of creating a new one. Example:

```js
// in the stack constructor
const existingPool = cognito.UserPool.fromUserPoolId(
  this,
  "ExistingPool",
  "us-east-1_XXXXXX"
);
// then use existingPool where needed and do not create a new pool
```

---

## Test the User Pool and Identity Flow using AWS CLI

1. **Sign up a test user** (this uses the client id from outputs):

```bash
aws cognito-idp sign-up --client-id <UserPoolClientId> \
  --username testuser@example.com --password 'TestPassword123!' \
  --user-attributes Name=email,Value=testuser@example.com
```

2. **Confirm the user (admin confirm)**:

```bash
aws cognito-idp admin-confirm-sign-up --user-pool-id <UserPoolId> --username testuser@example.com
```

3. **Initiate auth to get tokens**:

```bash
aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id <UserPoolClientId> \
  --auth-parameters USERNAME=testuser@example.com,PASSWORD=TestPassword123!
```

This returns JSON with `IdToken`, `AccessToken`, and `RefreshToken` fields.

4. **Exchange user pool tokens for temporary AWS credentials** (Identity Pool step) — example using `GetId` and `GetCredentialsForIdentity` calls with AWS CLI is more complex; instead you can use Amplify in the frontend to handle it automatically. See the frontend guidance in Phase 5.

---

## Deployment commands

From `infrastructure/`:

```bash
pnpm install
pnpm exec cdk synth
pnpm exec cdk deploy AuthStack --require-approval never
```

If you previously created a pool and ran into the schema update error, follow the deletion steps above before redeploying.

---

## Granting resource permissions to Cognito roles (S3 / DynamoDB)

Later, when you create the `LambdaStack`, you'll pass resource references (e.g., `filesBucket`, `filesTable`) into that stack. You should avoid hardcoding ARNs in the AuthStack. Instead, after creating the IAM role in AuthStack, you can add resource-based policies or grant specific permissions in the LambdaStack using `grant*` helper functions.

If you need to add S3 permissions to the authenticated role now (not recommended), you can do so explicitly in this stack using `authenticatedRole.addToPolicy()` with the correct ARNs (replace placeholders):

```js
authenticatedRole.addToPolicy(
  new iam.PolicyStatement({
    actions: ["s3:GetObject", "s3:ListBucket"],
    resources: [
      "arn:aws:s3:::securefile-vault-930664225363-us-east-1",
      "arn:aws:s3:::securefile-vault-930664225363-us-east-1/*",
    ],
  })
);
```

Prefer granting permissions in the stack that owns the resource (LambdaStack) using CDK's `grant*` methods.

---

## Next

Phase 4 will implement the **LambdaStack** (Lambda functions, shared layer, API Gateway wiring) with full function code templates (upload, uploadComplete, download, list, delete, createShareLink). Let me know when you're ready and I will create a new canvas document for Phase 4.

# Phase 4 — LambdaStack, Shared Layer, Lambda Handlers, API Gateway (CDK v2, JavaScript)

This document contains **complete, ready-to-paste** code for:

- `infrastructure/lib/lambda-stack.js` (CDK stack creating Layer, Lambda functions, API Gateway wiring)
- Full example Lambda handlers (JavaScript) for:

  - `uploadFile` (generate pre-signed URL + create metadata)
  - `uploadComplete` (finalize metadata after client uploads)
  - `downloadFile` (generate pre-signed GET URL)
  - `listFiles` (list user files from DynamoDB)
  - `deleteFile` (delete object + remove metadata)
  - `createShareLink` (create time-limited share record)

- `backend/layers/nodejs` layout and packaging steps (pnpm-friendly)
- Overall deployment explanation and single-command deploy guidance
- Smoke tests and verification commands

> All code is written in **JavaScript** (CommonJS where required for CDK) and uses **pnpm** for package management. Lambda functions target **Node.js 18.x** runtime.

---

## 0. Assumptions & prerequisites

This Phase expects that you have already completed Phase 1–3 and have deployed the StorageStack and DatabaseStack. Specifically, the following objects must exist (or their CDK references must be available when CDK synthesizes LambdaStack):

- `storage.filesBucket` (S3 bucket instance)
- `storage.thumbnailsBucket` (S3 bucket instance)
- `database.filesTable` (DynamoDB table instance)
- `database.usersTable` (DynamoDB table instance)
- `database.accessLogsTable`
- `database.shareLinksTable`
- `auth.userPool` (Cognito User Pool instance)

In the `bin/infrastructure.js` you'll pass these into LambdaStack (example below).

---

## 1. Directory layout (backend)

```
backend/
  layers/
    nodejs/
      package.json
      node_modules/ (created by pnpm --shamefully-hoist)
      utils/
        response.js
        auth.js
  lambda/
    uploadFile/index.js
    uploadComplete/index.js
    downloadFile/index.js
    listFiles/index.js
    deleteFile/index.js
    createShareLink/index.js
```

---

## 2. Shared Layer (utilities)

Create `backend/layers/nodejs/package.json`:

```json
{
  "name": "shared-layer",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "aws-sdk": "^2.1360.0",
    "uuid": "^9.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  }
}
```

Install dependencies while producing a flat `node_modules` structure that packages correctly for Lambda layers:

```bash
cd backend/layers
pnpm install --prod --shamefully-hoist
```

Create `backend/layers/nodejs/utils/response.js` (helper response wrappers):

```js
// backend/layers/nodejs/utils/response.js
exports.success = (body = {}, statusCode = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.error = (message = "Internal Server Error", statusCode = 500) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ error: message }),
});
```

Create `backend/layers/nodejs/utils/auth.js` (extract userId from event - placeholder for Cognito token parsing):

```js
// backend/layers/nodejs/utils/auth.js
exports.getUserIdFromEvent = (event) => {
  // If API Gateway + Cognito authorizer is used, user sub is available in event.requestContext.authorizer
  try {
    if (
      event.requestContext &&
      event.requestContext.authorizer &&
      event.requestContext.authorizer.claims
    ) {
      return (
        event.requestContext.authorizer.claims.sub ||
        event.requestContext.authorizer.claims["cognito:username"] ||
        null
      );
    }

    // If using JWT token in Authorization header, parse it here (not recommended to do heavy logic in lambda)
    return null;
  } catch (err) {
    return null;
  }
};
```

---

## 3. Lambda handlers (full implementations)

> Each lambda is an AWS Lambda function using `aws-sdk` v2 available in the layer. They are minimal but functional and illustrate best practices (error handling, DynamoDB operations, S3 pre-signed URL creation).

### 3.1 `uploadFile` — `backend/lambda/uploadFile/index.js`

```js
// backend/lambda/uploadFile/index.js
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const ddb = new AWS.DynamoDB.DocumentClient();

const BUCKET = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

exports.handler = async (event) => {
  try {
    const userId =
      getUserIdFromEvent(event) ||
      (event.requestContext &&
        event.requestContext.authorizer &&
        event.requestContext.authorizer.principalId) ||
      "anonymous";
    const body = JSON.parse(event.body || "{}");
    const { fileName, fileSize, fileType, tags = [] } = body;

    if (!fileName || !fileSize || !fileType)
      return error("Missing fileName/fileSize/fileType", 400);
    if (fileSize > 5 * 1024 * 1024 * 1024) return error("File too large", 400);

    const fileId = uuidv4();
    const s3Key = `users/${userId}/files/${fileId}/${fileName}`;

    // Generate presigned URL for PUT
    const uploadUrl = s3.getSignedUrl("putObject", {
      Bucket: BUCKET,
      Key: s3Key,
      Expires: 3600, // seconds
      ContentType: fileType,
    });

    const timestamp = Date.now();

    // Save metadata with status 'uploading'
    await ddb
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

    return success({ fileId, uploadUrl });
  } catch (err) {
    console.error("uploadFile error", err);
    return error(err.message || "Internal error", 500);
  }
};
```

---

### 3.2 `uploadComplete` — `backend/lambda/uploadComplete/index.js`

```js
// backend/lambda/uploadComplete/index.js
const AWS = require("aws-sdk");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const ddb = new AWS.DynamoDB.DocumentClient();

const FILES_TABLE = process.env.FILES_TABLE;
const FILES_BUCKET = process.env.FILES_BUCKET;

exports.handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event) || "anonymous";
    const body = JSON.parse(event.body || "{}");
    const { fileId } = body;
    if (!fileId) return error("Missing fileId", 400);

    // Update status to 'available'
    const timestamp = Date.now();
    await ddb
      .update({
        TableName: FILES_TABLE,
        Key: { fileId },
        UpdateExpression: "SET #s = :s, modifiedAt = :m",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "available", ":m": timestamp },
      })
      .promise();

    return success({ message: "Upload finalized" });
  } catch (err) {
    console.error("uploadComplete error", err);
    return error(err.message || "Internal error", 500);
  }
};
```

---

### 3.3 `downloadFile` — `backend/lambda/downloadFile/index.js`

```js
// backend/lambda/downloadFile/index.js
const AWS = require("aws-sdk");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const ddb = new AWS.DynamoDB.DocumentClient();

const BUCKET = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;

exports.handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event) || "anonymous";
    const fileId = event.pathParameters && event.pathParameters.fileId;
    if (!fileId) return error("Missing fileId", 400);

    const resp = await ddb
      .get({ TableName: FILES_TABLE, Key: { fileId } })
      .promise();
    if (!resp.Item) return error("File not found", 404);

    const { s3Key } = resp.Item;

    const url = s3.getSignedUrl("getObject", {
      Bucket: BUCKET,
      Key: s3Key,
      Expires: 3600,
    });

    return success({ downloadUrl: url });
  } catch (err) {
    console.error("downloadFile error", err);
    return error(err.message || "Internal error", 500);
  }
};
```

---

### 3.4 `listFiles` — `backend/lambda/listFiles/index.js`

```js
// backend/lambda/listFiles/index.js
const AWS = require("aws-sdk");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const ddb = new AWS.DynamoDB.DocumentClient();
const FILES_TABLE = process.env.FILES_TABLE;

exports.handler = async (event) => {
  try {
    const userId =
      getUserIdFromEvent(event) ||
      (event.queryStringParameters && event.queryStringParameters.userId);
    if (!userId) return error("Missing userId", 400);

    // Query GSI or scan (GSI is recommended)
    const params = {
      TableName: FILES_TABLE,
      IndexName: "UserFilesIndex",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
      ScanIndexForward: false, // newest first
    };

    const data = await ddb.query(params).promise();
    return success({ items: data.Items || [] });
  } catch (err) {
    console.error("listFiles error", err);
    return error(err.message || "Internal error", 500);
  }
};
```

---

### 3.5 `deleteFile` — `backend/lambda/deleteFile/index.js`

```js
// backend/lambda/deleteFile/index.js
const AWS = require("aws-sdk");
const { success, error } = require("/opt/nodejs/utils/response");
const { getUserIdFromEvent } = require("/opt/nodejs/utils/auth");

const s3 = new AWS.S3();
const ddb = new AWS.DynamoDB.DocumentClient();

const BUCKET = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;

exports.handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event) || "anonymous";
    const fileId = event.pathParameters && event.pathParameters.fileId;
    if (!fileId) return error("Missing fileId", 400);

    const resp = await ddb
      .get({ TableName: FILES_TABLE, Key: { fileId } })
      .promise();
    if (!resp.Item) return error("File not found", 404);

    const { s3Key } = resp.Item;

    // Delete from S3
    await s3.deleteObject({ Bucket: BUCKET, Key: s3Key }).promise();

    // Delete item from DynamoDB
    await ddb.delete({ TableName: FILES_TABLE, Key: { fileId } }).promise();

    return success({ message: "Deleted" });
  } catch (err) {
    console.error("deleteFile error", err);
    return error(err.message || "Internal error", 500);
  }
};
```

---

### 3.6 `createShareLink` — `backend/lambda/createShareLink/index.js`

```js
// backend/lambda/createShareLink/index.js
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { success, error } = require("/opt/nodejs/utils/response");

const ddb = new AWS.DynamoDB.DocumentClient();

const SHARE_TABLE = process.env.SHARE_LINKS_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { fileId, expiresInSeconds = 3600 } = body;
    if (!fileId) return error("Missing fileId", 400);

    const shareId = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    await ddb
      .put({
        TableName: SHARE_TABLE,
        Item: { shareId, fileId, expiresAt },
      })
      .promise();

    return success({ shareId, expiresAt });
  } catch (err) {
    console.error("createShareLink error", err);
    return error(err.message || "Internal error", 500);
  }
};
```

---

## 4. CDK LambdaStack (full file)

Create `infrastructure/lib/lambda-stack.js` with the following content. This uses the resource references passed in from `bin/infrastructure.js`.

```js
// infrastructure/lib/lambda-stack.js
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigw = require("aws-cdk-lib/aws-apigateway");

class LambdaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    if (
      !props ||
      !props.filesBucket ||
      !props.filesTable ||
      !props.usersTable ||
      !props.accessLogsTable ||
      !props.shareLinksTable ||
      !props.userPool
    ) {
      throw new Error(
        "LambdaStack requires filesBucket, filesTable, usersTable, accessLogsTable, shareLinksTable, userPool in props"
      );
    }

    // Shared Layer
    const sharedLayer = new lambda.LayerVersion(this, "SharedLayer", {
      code: lambda.Code.fromAsset("../backend/layers"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: "Shared utilities and dependencies",
    });

    const commonEnv = {
      FILES_BUCKET: props.filesBucket.bucketName,
      FILES_TABLE: props.filesTable.tableName,
      USERS_TABLE: props.usersTable.tableName,
      ACCESS_LOGS_TABLE: props.accessLogsTable.tableName,
      SHARE_LINKS_TABLE: props.shareLinksTable.tableName,
    };

    // Create Lambdas
    const uploadFileFn = new lambda.Function(this, "UploadFileFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/uploadFile"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const uploadCompleteFn = new lambda.Function(
      this,
      "UploadCompleteFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset("../backend/lambda/uploadComplete"),
        layers: [sharedLayer],
        environment: commonEnv,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      }
    );

    const downloadFileFn = new lambda.Function(this, "DownloadFileFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/downloadFile"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const listFilesFn = new lambda.Function(this, "ListFilesFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/listFiles"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const deleteFileFn = new lambda.Function(this, "DeleteFileFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend/lambda/deleteFile"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

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

    // Grants
    props.filesBucket.grantReadWrite(uploadFileFn);
    props.filesBucket.grantRead(uploadCompleteFn);
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

    // API Gateway
    const api = new apigw.RestApi(this, "FileStorageAPI", {
      restApiName: "SecureFileVault API",
      description: "API for file storage and sharing",
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "APIAuthorizer",
      {
        cognitoUserPools: [props.userPool],
      }
    );

    const files = api.root.addResource("files");
    files.addMethod("POST", new apigw.LambdaIntegration(uploadFileFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    const complete = files.addResource("complete");
    complete.addMethod("POST", new apigw.LambdaIntegration(uploadCompleteFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    const list = files.addResource("list");
    list.addMethod("GET", new apigw.LambdaIntegration(listFilesFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    const fileId = files.addResource("{fileId}");
    fileId.addMethod("DELETE", new apigw.LambdaIntegration(deleteFileFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
    fileId.addMethod("GET", new apigw.LambdaIntegration(downloadFileFn), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url, exportName: "ApiUrl" });
  }
}

module.exports = { LambdaStack };
```

**Important**: The `code: lambda.Code.fromAsset()` paths are **relative to `infrastructure/lib/`**; ensure the directories exist exactly as referenced.

---

## 5. Wire LambdaStack in `bin/infrastructure.js`

Update your `bin/infrastructure.js` to pass resource references when instantiating `LambdaStack`:

```js
#!/usr/bin/env node
const cdk = require("aws-cdk-lib");
const { StorageStack } = require("../lib/storage-stack");
const { DatabaseStack } = require("../lib/database-stack");
const { AuthStack } = require("../lib/auth-stack");
const { LambdaStack } = require("../lib/lambda-stack");

const app = new cdk.App();

const storage = new StorageStack(app, "StorageStack");
const database = new DatabaseStack(app, "DatabaseStack");
const auth = new AuthStack(app, "AuthStack");

new LambdaStack(app, "LambdaStack", {
  filesBucket: storage.filesBucket,
  filesTable: database.filesTable,
  usersTable: database.usersTable,
  accessLogsTable: database.accessLogsTable,
  shareLinksTable: database.shareLinksTable,
  userPool: auth.userPool,
});
```

---

## 6. Packaging & Deployment (overall explanation)

### Why packaging matters

- CDK looks for the asset directories you supplied in `lambda.Code.fromAsset(...)` and zips them for upload. If a directory doesn't exist, you will get the "Cannot find asset" error.
- Lambda layers must contain a folder named `nodejs/` at the root with `node_modules` inside (that's why we created `backend/layers/nodejs`).

### Packaging steps (commands)

From project root:

```bash
# 1. Prepare layer (create flattened node_modules layout)
cd backend/layers
pnpm install --prod --shamefully-hoist

# 2. Ensure each lambda folder has index.js and any package.json + node_modules if needed
# If a lambda needs extra packages locally, install them in the lambda folder with --shamefully-hoist
# e.g. for uploadFile
cd ../../backend/lambda/uploadFile
# if needed: pnpm init -y; pnpm add --prod some-dep --shamefully-hoist

# 3. Return to infrastructure and synth/deploy
cd ../../../infrastructure
pnpm install
pnpm exec cdk synth
pnpm exec cdk deploy --all --require-approval never
```

**Tips:**

- If you get an asset path error, verify the path from `infrastructure/lib/lambda-stack.js` to the folder (e.g., `../backend/lambda/uploadFile`).
- Keep shared deps in the layer and avoid per-lambda node_modules unless necessary.

---

## 7. Smoke Tests & Verification (post-deploy)

1. Confirm API URL from CloudFormation outputs or via `pnpm exec cdk ls` + `pnpm exec cdk outputs`.

2. Create a test user in Cognito (Phase 3 output used):

```bash
aws cognito-idp sign-up --client-id <UserPoolClientId> --username tester@example.com --password 'TestPassword123!' --user-attributes Name=email,Value=tester@example.com
aws cognito-idp admin-confirm-sign-up --user-pool-id <UserPoolId> --username tester@example.com
```

3. Get auth tokens (Initiate auth):

```bash
aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id <UserPoolClientId> --auth-parameters USERNAME=tester@example.com,PASSWORD=TestPassword123!
```

4. Use `curl` to call API (replace <idToken> and endpoint):

```bash
# Request presigned URL
curl -X POST "<ApiUrl>/files" -H "Authorization: Bearer <idToken>" -H "Content-Type: application/json" -d '{"fileName":"test.txt","fileSize":12,"fileType":"text/plain"}'

# The API returns uploadUrl and fileId. Use curl to PUT file bytes to uploadUrl:
curl -X PUT "<uploadUrl>" -T ./test.txt -H "Content-Type: text/plain"

# Call finalize
curl -X POST "<ApiUrl>/files/complete" -H "Authorization: Bearer <idToken>" -H "Content-Type: application/json" -d '{"fileId":"<fileId>"}'
```

5. Verify S3 object exists:

```bash
aws s3 ls s3://<FilesBucket> --recursive | grep test.txt
aws dynamodb get-item --table-name <FilesTable> --key '{"fileId":{"S":"<fileId>"}}'
```

---

## 8. Rollback & Cleanup

To remove all deployed stacks:

```bash
cd infrastructure
pnpm exec cdk destroy --all
```

Note: `RemovalPolicy.DESTROY` will delete S3 buckets and their objects. If you want to keep data, change removal policies to `RETAIN` before destroying or manually back up.

---

## 9. Next — Phase 5 (Frontend Vite + React)

After LambdaStack is deployed and tested, proceed to Phase 5 which will:

- Create the Vite React frontend in JavaScript
- Integrate AWS Amplify or aws-amplify-libless approach to sign in with Cognito
- Implement upload UI that requests presigned URLs and uploads directly to S3
- Implement file listing, download, delete, and share link UI
- Build and package the frontend, then upload to S3 or configure CloudFront
