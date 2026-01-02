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
