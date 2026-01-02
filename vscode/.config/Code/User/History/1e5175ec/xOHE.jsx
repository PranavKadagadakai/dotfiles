// src/pages/AuthPage.jsx
import React, { useState } from "react";
import { Login } from "../components/Auth/Login";
import { SignUp } from "../components/Auth/SignUp";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full max-w-md">
        {isLogin ? (
          <Login onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignUp onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};
