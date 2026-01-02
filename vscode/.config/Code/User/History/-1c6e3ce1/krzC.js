#!/usr/bin/env node
const cdk = require("aws-cdk-lib");
const { StorageStack } = require("../lib/storage-stack");
const { DatabaseStack } = require("../lib/database-stack");
const { AuthStack } = require("../lib/auth-stack");
const { LambdaStack } = require("../lib/lambda-stack");

const app = new cdk.App();

const infra = new cdk.Stack(app, "InfrastructureStack"); // optional top-level stack

const storage = new StorageStack(app, "StorageStack");
const database = new DatabaseStack(app, "DatabaseStack");
const auth = new AuthStack(app, "AuthStackV2");

// pass bucket and tables + userPool to Lambda stack
new LambdaStack(app, "LambdaStack", {
  filesBucket: storage.filesBucket,
  filesTable: database.filesTable,
  usersTable: database.usersTable,
  accessLogsTable: database.accessLogsTable,
  shareLinksTable: database.shareLinksTable,
  userPool: auth.userPool,
});
