import { Stack, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import {
  Table,
  AttributeType,
  BillingMode,
  TableEncryption,
  ProjectionType,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DatabaseStack extends Stack {
  /**
   * @param {Construct} scope
   * @param {string} id
   * @param {import('aws-cdk-lib').StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // Users table
    this.usersTable = new Table(this, "UsersTable", {
      tableName: "SecureFileVault-Users",
      partitionKey: { name: "userId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.DESTROY, // Change for production
    });

    // GSI for email lookups
    this.usersTable.addGlobalSecondaryIndex({
      indexName: "EmailIndex",
      partitionKey: { name: "email", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Files metadata table
    this.filesTable = new Table(this, "FilesTable", {
      tableName: "SecureFileVault-Files",
      partitionKey: { name: "fileId", type: AttributeType.STRING },
      sortKey: { name: "userId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // GSI for user file listings
    this.filesTable.addGlobalSecondaryIndex({
      indexName: "UserFilesIndex",
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "uploadedAt", type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });

    // Access logs table
    this.accessLogsTable = new Table(this, "AccessLogsTable", {
      tableName: "SecureFileVault-AccessLogs",
      partitionKey: { name: "logId", type: AttributeType.STRING },
      sortKey: { name: "timestamp", type: AttributeType.NUMBER },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "expiresAt", // Auto-delete old logs
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // GSI for file-based log queries
    this.accessLogsTable.addGlobalSecondaryIndex({
      indexName: "FileLogsIndex",
      partitionKey: { name: "fileId", type: AttributeType.STRING },
      sortKey: { name: "timestamp", type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });

    // Share links table
    this.shareLinksTable = new Table(this, "ShareLinksTable", {
      tableName: "SecureFileVault-ShareLinks",
      partitionKey: { name: "shareId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // GSI for file share links
    this.shareLinksTable.addGlobalSecondaryIndex({
      indexName: "FileSharesIndex",
      partitionKey: { name: "fileId", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Output table names
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
