// FrontEnd/src/pages/CertificateVerificationPage.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";

const CertificateVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const hashFromUrl = searchParams.get("hash");

  const [hash, setHash] = useState(hashFromUrl || "");
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (hashFromUrl) {
      verifyCertificate(hashFromUrl);
    }
  }, [hashFromUrl]);

  const verifyCertificate = async (certificateHash = hash) => {
    if (!certificateHash.trim()) {
      setError("Please enter a certificate hash to verify.");
      return;
    }

    setLoading(true);
    setError(null);
    setCertificate(null);
    setVerified(false);

    try {
      const response = await api.get(
        `/certificates/verify/${certificateHash}/`
      );
      setCertificate(response.data);
      setVerified(response.data.verified);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Certificate not found. Please check the hash and try again.");
      } else {
        setError(
          "An error occurred while verifying the certificate. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyCertificate(hash);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Certificate Verification
          </h1>
          <p className="mt-2 text-gray-600">
            Verify the authenticity of a certification
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="hash"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Certificate Hash
              </label>
              <input
                id="hash"
                type="text"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="Enter certificate hash or scan QR code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this hash on your certificate or get it from the QR code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                </div>
              ) : (
                "Verify Certificate"
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Details */}
        {verified && certificate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="ml-2 text-lg font-medium text-green-800">
                Certificate Verified
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Certificate ID:
                </span>
                <span className="text-sm text-gray-900">
                  {certificate.certificate_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Student USN:
                </span>
                <span className="text-sm text-gray-900">
                  {certificate.student_usn}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Event:
                </span>
                <span className="text-sm text-gray-900">
                  {certificate.event_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Issue Date:
                </span>
                <span className="text-sm text-gray-900">
                  {new Date(certificate.issue_date).toLocaleDateString(
                    "en-IN",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded border">
              <p className="text-sm text-gray-600 text-center">
                ✓ This certificate is authentic and was issued by CertifyTrack
              </p>
            </div>
          </div>
        )}

        {/* QR Code Scanner Info */}
        {!hashFromUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  QR Code Scanning
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Use your phone's camera to scan the QR code on the certificate
                  to automatically verify it.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
