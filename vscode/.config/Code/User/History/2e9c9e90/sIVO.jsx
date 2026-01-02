// src/components/Auth/SignUp.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { getErrorMessage } from "../../utils/errorMessages";
import { toast } from "react-toastify";

export const SignUp = ({ onToggleMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, confirmSignUp } = useAuth();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password);
      if (result.success) {
        setShowVerification(true);
        toast.success("Verification code sent to your email");
      } else {
        toast.error(getErrorMessage({ message: result.error }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await confirmSignUp(email, verificationCode);
      if (result.success) {
        toast.success("Account verified! Please sign in.");
        onToggleMode();
      } else {
        toast.error(getErrorMessage({ message: result.error }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Verify Email
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Enter the verification code sent to <strong>{email}</strong>
          </p>
          <form onSubmit={handleVerify} className="space-y-6">
            <Input
              type="text"
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              placeholder="123456"
            />
            <Button type="submit" loading={loading} className="w-full">
              Verify
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Sign Up
        </h2>
        <form onSubmit={handleSignUp} className="space-y-6">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <Input
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <Button type="submit" loading={loading} className="w-full">
            Sign Up
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <button
            onClick={onToggleMode}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Sign In
          </button>
        </p>
      </Card>
    </div>
  );
};
