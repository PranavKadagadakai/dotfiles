import React, { useState, useEffect } from "react";

const CertificateViewer = ({ certificateUrl, certificate, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);

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
          <iframe
            src={certificateUrl}
            className="w-full h-[600px] border-0"
            title="Certificate"
          />
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
