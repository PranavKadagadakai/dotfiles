// infrastructure/lib/auth-stack.js
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const iam = require("aws-cdk-lib/aws-iam");

class AuthStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // User Pool
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "SecureFileVaultUserPool",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      standardAttributes: { email: { required: true, mutable: false } },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Client (Web)
    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      generateSecret: false,
      authFlows: { userPassword: true, userSrp: true, refreshToken: true },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // Create groups (Admin / PowerUser / Viewer)
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

    // Identity Pool (Cognito Federated Identities)
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

    // Authenticated role (assumed via web identity)
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
      description:
        "Role assumed by authenticated users from Cognito Identity Pool",
    });

    // Example least-privilege policy - give read to S3 bucket and DynamoDB access will be attached later
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
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
      exportName: "UserPoolIdV2",
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      exportName: "UserPoolClientIdV2",
    });
    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: identityPool.ref,
      exportName: "IdentityPoolIdV2",
    });
  }
}

module.exports = { AuthStack };
