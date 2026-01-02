// infrastructure/lib/database-stack.js
const { Stack, RemovalPolicy, CfnOutput } = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");

class DatabaseStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.usersTable = new dynamodb.Table(this, "UsersTable", {
      tableName: "SecureFileVault-Users",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "EmailIndex",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.filesTable = new dynamodb.Table(this, "FilesTable", {
      tableName: "SecureFileVault-Files",
      partitionKey: { name: "fileId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.filesTable.addGlobalSecondaryIndex({
      indexName: "UserFilesIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "uploadedAt", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.accessLogsTable = new dynamodb.Table(this, "AccessLogsTable", {
      tableName: "SecureFileVault-AccessLogs",
      partitionKey: { name: "logId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.accessLogsTable.addGlobalSecondaryIndex({
      indexName: "FileLogsIndex",
      partitionKey: { name: "fileId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.shareLinksTable = new dynamodb.Table(this, "ShareLinksTable", {
      tableName: "SecureFileVault-ShareLinks",
      partitionKey: { name: "shareId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.shareLinksTable.addGlobalSecondaryIndex({
      indexName: "FileSharesIndex",
      partitionKey: { name: "fileId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new CfnOutput(this, "UsersTableName", {
      value: this.usersTable.tableName,
      exportName: "UsersTableName",
    });
    new CfnOutput(this, "FilesTableName", {
      value: this.filesTable.tableName,
      exportName: "FilesTableName",
    });
  }
}

module.exports = { DatabaseStack };
