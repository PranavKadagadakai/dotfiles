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
