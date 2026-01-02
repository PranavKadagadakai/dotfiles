// infrastructure/lib/storage-stack.js
import cdk from "aws-cdk-lib";
import s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

class StorageStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.filesBucket = new s3.Bucket(this, "FileStorageBucket", {
      bucketName: `securefile-vault-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"], // restrict in prod
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const thumbnailsBucket = new s3.Bucket(this, "ThumbnailsBucket", {
      bucketName: `securefile-vault-thumbnails-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

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

module.exports = { StorageStack };
