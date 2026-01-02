// src/components/Auth/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { getErrorMessage } from "../../utils/errorMessages";
import { toast } from "react-toastify";

export const Login = ({ onToggleMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        toast.error(getErrorMessage({ message: result.error }));
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Sign In
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <button
            onClick={onToggleMode}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Sign Up
          </button>
        </p>
      </Card>
    </div>
  );
};
