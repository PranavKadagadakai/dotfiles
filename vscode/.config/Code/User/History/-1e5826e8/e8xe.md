# SecureFileVault: Secure Cloud File Storage and Sharing Application

A scalable, secure, and serverless web application for file management, built entirely on **AWS** infrastructure and deployed using the **AWS CDK**. The application provides users with secure storage, sharing capabilities via temporary links, and granular access controls.

---

## 🌟 Features

The SecureFileVault application implements the following core features:

- **🔐 Secure File Storage:** Files are stored in **Amazon S3** with automatic encryption (S3-Managed Keys) and **File Versioning** enabled for data recovery and auditability.
- **🔗 Temporary File Sharing:** Generates time-limited, **Pre-signed URLs** for secure file download links, removing the need for permanent public access.
- **👤 Role-Based Access Control (RBAC):** Authentication and authorization managed by **Amazon Cognito** (User Pools for identity, Identity Pools for temporary AWS credentials).
- **📝 Metadata Management:** Stores file details (owner, size, type) and access logs in **Amazon DynamoDB**.
- **🔍 Audit Logging:** Tracks file operations (uploads, downloads, shares) for security auditing.

---

## 💻 Tech Stack

The project is a full-stack, serverless application utilizing the following key technologies:

| Category           | Technology                                       | Description                                                                                                     |
| :----------------- | :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | **React** (Vite, JavaScript), **AWS Amplify V6** | User interface for file management, using the modular Amplify libraries for authentication and API interaction. |
| **Infrastructure** | **AWS CDK** (JavaScript)                         | Infrastructure as Code (IaC) used to provision all AWS resources.                                               |
| **Authentication** | **AWS Cognito**                                  | Manages User Pools (signup, sign-in) and Identity Pools (AWS credentials).                                      |
| **API Backend**    | **AWS API Gateway**                              | Provides a RESTful interface to trigger backend Lambda logic. Configured with CORS for frontend access.         |
| **Compute**        | **AWS Lambda** (Node.js)                         | Serverless functions handling business logic (e.g., `listFiles`, `uploadFile`, `createShareLink`).              |
| **Storage**        | **Amazon S3**                                    | Stores files in a versioned, encrypted bucket. Also uses a separate bucket for thumbnails.                      |
| **Database**       | **Amazon DynamoDB**                              | Stores file metadata, user records, and share links.                                                            |

---

## ⚙️ Prerequisites

Before deploying and running the application, ensure you have the following installed and configured:

1.  **Node.js:** Version 18+ (`node -v`)
2.  **pnpm:** Version 9+ (`pnpm -v`)
3.  **AWS CLI:** Version 2.x, configured with credentials that have permissions to deploy resources.
    ```bash
    aws configure
    ```

---

## 🚀 Installation & Deployment

The deployment process is split into two phases: provisioning the **Backend Infrastructure** (CDK) and configuring the **Frontend Application** (React).

### Phase 1: Backend Deployment (AWS CDK)

1.  **Initialize:**

    ```bash
    # Navigate to the infrastructure directory
    cd infrastructure
    pnpm install
    ```

2.  **Bootstrap (First time only):** If you have not used CDK in this region, bootstrap your AWS account.

    ```bash
    pnpm exec cdk bootstrap
    ```

3.  **Deploy All Stacks:** Deploy the Storage, Database, Auth, and Lambda stacks. This command generates the configuration file needed for the frontend.
    ```bash
    pnpm exec cdk deploy --all --outputs-file ../frontend/cdk-outputs.json
    ```
    _Note: The API Gateway has been configured for CORS to allow access from the frontend development server (`http://localhost:5173`)._

### Phase 2: Frontend Setup (React/Vite)

1.  **Setup and Install Dependencies:**

    ```bash
    cd ../frontend
    pnpm install
    ```

2.  **Configure Environment Variables:**
    The environment variables in the **`.env`** file (located in the `frontend` folder) must be populated from the `cdk-outputs.json` file generated in the previous step.

    **Critical Configuration Step:** Ensure the `VITE_AWS_API_URL` **does not have a trailing slash (`/`)** to prevent double slashes in the API calls, which causes 502 Bad Gateway errors.

    **_`.env` Example:_**

    ```ini
    VITE_AWS_REGION=us-east-1
    VITE_AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
    VITE_AWS_USER_POOL_WEB_CLIENT_ID=XXXXXXXXXXXXXXXXX
    VITE_AWS_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    VITE_AWS_API_URL=[https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod](https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod)
    VITE_AWS_FILES_BUCKET_NAME=securefile-vault-930664225363-us-east-1
    ```

3.  **Start the Application:**
    ```bash
    pnpm run dev
    ```
    The application will now run and connect to the deployed AWS backend.

---

## 💡 Troubleshooting

| Issue                                         | Root Cause                                                                            | Resolution                                                                                                                                                                                                                      |
| :-------------------------------------------- | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth UserPool not configured.**             | Vite failing to load environment variables, or incorrect Amplify V6 config structure. | 1. Ensure the **`.env`** file is in the **`frontend/`** directory (not `frontend/src`). 2. Verify `src/main.jsx` uses the **flattened** `Auth` object structure (no `Cognito` nesting) for modular V6 compatibility.            |
| **CORS Policy blocked** / **502 Bad Gateway** | API URL double slash or missing CORS headers on API Gateway.                          | 1. **URL Fix:** Remove the **trailing slash** from `VITE_AWS_API_URL` in the `.env` file. 2. **CORS Fix:** Ensure the CDK code for the API Gateway has `defaultCorsPreflightOptions` configured and redeploy the `LambdaStack`. |

---

## 🧹 Cleanup and Rollback

To remove all provisioned AWS resources and stop incurring costs:

```bash
cd infrastructure
pnpm exec cdk destroy --all

⚠️ Warning: This command will delete all S3 buckets and their contents (including your files) due to the development-focused RemovalPolicy.DESTROY settings in the CDK stacks.
```
