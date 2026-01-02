// infrastructure/lib/storage-stack.js
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");

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
          allowedOrigins: ["*"], // tighten in prod
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
      removalPolicy: cdk.RemovalPolicy.DESTROY, // dev only; change to RETAIN in prod
      autoDeleteObjects: true, // dev only
    });

    this.thumbnailsBucket = new s3.Bucket(this, "ThumbnailsBucket", {
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
      value: this.thumbnailsBucket.bucketName,
      exportName: "ThumbnailsBucketName",
    });
  }
}

module.exports = { StorageStack };
