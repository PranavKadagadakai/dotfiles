// infrastructure/lib/lambda-stack.js
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");

class LambdaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Shared layer (CDK will bundle directory)
    const sharedLayer = new lambda.LayerVersion(this, "SharedLayer", {
      code: lambda.Code.fromAsset("../backend/layers"), // directory containing nodejs/
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: "Shared utilities and dependencies",
    });

    // common env
    const commonEnv = {
      FILES_BUCKET: props.filesBucket.bucketName,
      FILES_TABLE: props.filesTable.tableName,
      USERS_TABLE: props.usersTable.tableName,
      ACCESS_LOGS_TABLE: props.accessLogsTable.tableName,
      SHARE_LINKS_TABLE: props.shareLinksTable.tableName,
      USER_POOL_ID: props.userPool.userPoolId,
      API_ENDPOINT: cdk.Fn.join("", ["https://", this.region, ".example.com"]), // overwrite with real endpoint after deploy
    };

    // Define Lambdas (upload, complete, download, list, delete, createShare)
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
        handler: "uploadComplete/index.handler",
        code: lambda.Code.fromAsset("../backend/lambda"),
        layers: [sharedLayer],
        environment: commonEnv,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      }
    );

    const downloadFileFn = new lambda.Function(this, "DownloadFileFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "downloadFile/index.handler",
      code: lambda.Code.fromAsset("../backend/lambda"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const listFilesFn = new lambda.Function(this, "ListFilesFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "listFiles/index.handler",
      code: lambda.Code.fromAsset("../backend/lambda"),
      layers: [sharedLayer],
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const deleteFileFn = new lambda.Function(this, "DeleteFileFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "deleteFile/index.handler",
      code: lambda.Code.fromAsset("../backend/lambda"),
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
        handler: "createShareLink/index.handler",
        code: lambda.Code.fromAsset("../backend/lambda"),
        layers: [sharedLayer],
        environment: commonEnv,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      }
    );

    // Grants (least privilege)
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
    props.filesTable.grantReadWriteData(uploadCompleteFn);

    props.usersTable.grantReadWriteData(uploadFileFn);
    props.usersTable.grantReadWriteData(deleteFileFn);
    props.usersTable.grantReadWriteData(uploadCompleteFn);

    props.accessLogsTable.grantWriteData(uploadFileFn);
    props.accessLogsTable.grantWriteData(downloadFileFn);
    props.accessLogsTable.grantWriteData(deleteFileFn);
    props.accessLogsTable.grantWriteData(uploadCompleteFn);

    props.shareLinksTable.grantReadWriteData(createShareLinkFn);

    // API Gateway + Cognito authorizer
    const api = new apigateway.RestApi(this, "FileStorageAPI", {
      restApiName: "SecureFileVault API",
      description: "API for file storage and sharing",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        allowCredentials: true,
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "APIAuthorizer",
      {
        cognitoUserPools: [props.userPool],
      }
    );

    // Example route wiring
    const files = api.root.addResource("files");
    files.addMethod("POST", new apigateway.LambdaIntegration(uploadFileFn), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const complete = files.addResource("complete");
    complete.addMethod(
      "POST",
      new apigateway.LambdaIntegration(uploadCompleteFn),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    const list = files.addResource("list");
    list.addMethod("GET", new apigateway.LambdaIntegration(listFilesFn), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": "'*'", // Use '*' or a more specific domain for production
          },
          responseTemplates: {
            "application/json": "$input.json('$')",
          },
        },
      ],
    });

    const fileId = files.addResource("{fileId}");
    fileId.addMethod("DELETE", new apigateway.LambdaIntegration(deleteFileFn), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    fileId.addMethod("GET", new apigateway.LambdaIntegration(downloadFileFn), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Output API endpoint
    new cdk.CfnOutput(this, "ApiUrl", { value: api.url, exportName: "ApiUrl" });
    this.api = api;
  }
}

module.exports = { LambdaStack };
