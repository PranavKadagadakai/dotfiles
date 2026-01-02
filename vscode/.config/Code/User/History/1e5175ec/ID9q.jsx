// src/pages/AuthPage.jsx
import React, { useState } from "react";
import { Login } from "../components/Auth/Login";
import { SignUp } from "../components/Auth/SignUp";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div>
      {isLogin ? (
        <Login onToggleMode={() => setIsLogin(false)} />
      ) : (
        <SignUp onToggleMode={() => setIsLogin(true)} />
      )}
    </div>
  );
};
