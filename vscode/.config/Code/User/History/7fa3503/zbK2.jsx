// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import App from "./App.jsx";
import "./index.css";
import { awsConfig } from "./aws-config.js";

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsConfig.Auth.userPoolId, //
      userPoolClientId: awsConfig.Auth.userPoolClientId, //
      identityPoolId: awsConfig.Auth.identityPoolId, //
    },
  },
  API: {
    REST: {
      fileStorageAPI: {
        endpoint: awsConfig.API.endpoints[0].endpoint, //
        region: awsConfig.API.endpoints[0].region, //
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
