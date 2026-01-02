import React, { useState } from "react";
import CertificateVerificationForm from "../components/CertificateVerificationForm";

const CertificateVerificationPage = () => {
  const [verifiedCertificate, setVerifiedCertificate] = useState(null);
  const [isVerified, setIsVerified] = useState(null);

  const handleVerificationResult = (result) => {
    setVerifiedCertificate(result);
    setIsVerified(result?.verified || false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Certificate Verification
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Verify the authenticity of a CertifyTrack certificate by entering
            its hash code below.
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <CertificateVerificationForm onResult={handleVerificationResult} />
        </div>

        {/* Results Section */}
        {isVerified !== null && (
          <div className="bg-white shadow-lg rounded-lg p-8">
            {isVerified ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-gray-900">
                    Certificate Verified
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    This certificate is valid and authentic.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Certificate Details
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Certificate ID
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {verifiedCertificate.certificate_id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Student USN
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {verifiedCertificate.student_usn}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Event Name
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {verifiedCertificate.event_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Issue Date
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(
                          verifiedCertificate.issue_date
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                    <svg
                      className="h-8 w-8 text-red-600"
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
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-gray-900">
                    Certificate Not Found
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    No valid certificate was found with the provided hash code.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    Please verify the hash code was entered correctly. Hash
                    codes are typically found on printed certificates or
                    provided by administrators.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Information Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How to Find Your Certificate Hash
          </h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-2">
            <li>
              Physical certificates: Look for the hash code usually printed at
              the bottom of the certificate
            </li>
            <li>
              Digital certificates: Hash codes are typically included in the
              filename or metadata
            </li>
            <li>
              Contact your organizer or administrator if you cannot locate the
              hash code
            </li>
            <li>
              Hash codes are unique identifiers that help prevent certificate
              fraud
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
