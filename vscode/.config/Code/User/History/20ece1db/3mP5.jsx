import React, { useState, useEffect } from "react";

const CertificateViewer = ({ certificateUrl, certificate, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [certificateError, setCertificateError] = useState(null);

  useEffect(() => {
    if (certificate && certificate.file_hash) {
      generateQRCode();
    }
  }, [certificate]);

  const generateQRCode = async () => {
    try {
      const QRCode = await import("qrcode");
      const verificationUrl = `${window.location.origin}/verify-certificate?hash=${certificate.file_hash}`;
      QRCode.toDataURL(
        verificationUrl,
        {
          width: 150,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (err, url) => {
          if (err) {
            console.error("Error generating QR code:", err);
            return;
          }
          setQrCodeDataUrl(url);
        }
      );
    } catch (error) {
      console.error("Error importing QRCode library:", error);
    }
  };

  if (!certificateUrl) return null;
  console.log("Viewing certificate:", certificateUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Certificate Viewer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[80vh]">
          {/* Certificate Preview Section */}
          <div className="text-center mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <svg
                className="w-12 h-12 text-blue-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Certificate Document
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your certificate is available for download. Click the button
                below to open it.
              </p>
              <a
                href={certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Certificate
              </a>
            </div>
          </div>

          {/* AICTE Verification QR Code Section */}
          {certificate && certificate.file_hash && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Certificate Verification QR Code
              </h3>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* QR Code */}
                  <div className="flex-shrink-0">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Certificate Verification QR Code"
                        className="w-36 h-36 border border-gray-300 rounded"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h9m-9-4h4.01m-4.01 4V20"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">
                      AICTE Verification
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Use your phone's camera to scan this QR code to verify the
                      authenticity of this certificate. The QR code contains a
                      secure verification link that can be used to validate the
                      certificate's hash and details.
                    </p>

                    <div className="text-xs text-gray-500">
                      <strong>Certificate Hash:</strong>{" "}
                      <code className="bg-white px-2 py-1 rounded">
                        {certificate.file_hash?.substring(0, 16)}...
                      </code>
                    </div>
                  </div>
                </div>

                {/* Verification URL (for manual access) */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    Manual Verification:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/verify-certificate?hash=${certificate.file_hash}`}
                      className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/verify-certificate?hash=${certificate.file_hash}`
                        );
                      }}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      title="Copy verification URL"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t gap-2">
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Open in New Tab
          </a>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
