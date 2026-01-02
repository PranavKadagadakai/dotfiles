const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const iam = require("aws-cdk-lib/aws-iam");
const { Construct } = require("constructs");

class AuthStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Step 3.1: Create Cognito User Pool & Client
    //---------------------------------------------

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "SecureFileVault-Users",

      // Sign-in configuration
      signInAliases: {
        email: true,
        username: false,
      },

      // Self sign-up
      selfSignUpEnabled: true,

      // Email verification
      autoVerify: {
        email: true,
      },

      // Password policy
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(3),
      },

      // Account recovery
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // Standard attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },

      // Custom attributes
      customAttributes: {
        role: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }),
        storageQuota: new cognito.NumberAttribute({
          min: 0,
          max: 1099511627776, // 1TB in bytes
          mutable: true,
        }),
      },

      // MFA configuration
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },

      // Email configuration
      email: cognito.UserPoolEmail.withCognito("noreply@securefile-vault.com"),

      // Removal policy
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create app client
    this.userPoolClient = this.userPool.addClient("WebAppClient", {
      userPoolClientName: "web-app-client",

      // OAuth flows
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
      },

      // Token validity
      accessTokenValidity: cdk.Duration.minutes(60),
      idTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),

      // Prevent user existence errors
      preventUserExistenceErrors: true,

      // OAuth settings
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ["http://localhost:3000/callback"], // Update for production
        logoutUrls: ["http://localhost:3000/logout"],
      },
    });

    // Create user groups
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

    // Step 3.2: Create IAM Roles for User Groups
    //-------------------------------------------

    // Identity Pool for AWS credentials
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

    // Authenticated role
    const authenticatedRole = new iam.Role(this, "AuthenticatedRole", {
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
    });

    // Attach role to identity pool
    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      "IdentityPoolRoleAttachment",
      {
        identityPoolId: identityPool.ref,
        roles: {
          authenticated: authenticatedRole.roleArn,
        },
      }
    );

    // Outputs
    //-------------------------------------------
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
