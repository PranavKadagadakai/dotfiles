import React, { useState } from "react";
import api from "../api";

const CertificateVerificationForm = ({ onResult }) => {
  const [hashCode, setHashCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hashCode.trim()) {
      setError("Please enter a hash code");
      return;
    }

    // Basic validation for hash format (SHA256 hashes are 64 characters long)
    if (hashCode.trim().length !== 64) {
      setError("Hash code must be exactly 64 characters long (SHA256 format)");
      return;
    }

    // Check if it's a valid hexadecimal string
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(hashCode.trim())) {
      setError("Hash code must contain only hexadecimal characters (0-9, a-f)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/certificates/verify/${hashCode.trim()}/`
      );
      onResult(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        // Certificate not found
        onResult({ verified: false, message: "Certificate not found" });
      } else {
        // Other errors
        const errorMsg =
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "An error occurred while verifying the certificate";
        setError(errorMsg);
        onResult(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setHashCode("");
    setError("");
    onResult(null);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow hexadecimal characters
    if (value === "" || /^[0-9a-fA-F]*$/.test(value)) {
      setHashCode(value.toLowerCase());
      if (error) setError("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="hashCode"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Certificate Hash Code
          </label>
          <div className="relative">
            <input
              id="hashCode"
              type="text"
              value={hashCode}
              onChange={handleInputChange}
              placeholder="Enter 64-character SHA256 hash code"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm"
              maxLength="64"
              disabled={loading}
            />
            {hashCode && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                disabled={loading}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Enter the 64-character hash code found on your certificate
            (case-insensitive)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Verify Certificate
              </>
            )}
          </button>

          {hashCode && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Examples and Help */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Example Hash Codes
        </h3>
        <div className="space-y-2">
          <div className="font-mono text-sm text-gray-600 bg-white p-2 rounded border break-all">
            e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            (invalid example)
          </div>
          <div className="font-mono text-sm text-gray-600 bg-white p-2 rounded border break-all">
            a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
            (invalid example)
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          These are example hash formats. Use the actual hash code from your
          certificate.
        </p>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Hash codes are case-insensitive (upper or lowercase accepted)
          </li>
          <li>• Only enter the hash code, not the full URL or other text</li>
          <li>• SHA256 hash codes are exactly 64 characters long</li>
          <li>• Hash codes contain only letters (a-f) and numbers (0-9)</li>
        </ul>
      </div>
    </div>
  );
};

export default CertificateVerificationForm;
