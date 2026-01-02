// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import App from "./App.jsx";
import "./index.css";
import { awsConfig } from "./aws-config.js";

// Configure Amplify
Amplify.configure({
  Auth: awsConfig.Auth,
  API: {
    endpoints: awsConfig.API.endpoints,
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
