// FrontEnd/src/utils/fileValidation.js

// Constants for file validation
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB for images
    DOCUMENT: 10 * 1024 * 1024, // 10MB for documents
    SPREADSHEET: 5 * 1024 * 1024, // 5MB for CSV/Excel files
  },
  ALLOWED_EXTENSIONS: {
    IMAGE: ["jpg", "jpeg", "png", "gif", "webp"],
    CSV: ["csv"],
    EXCEL: ["xlsx", "xls"],
    PDF: ["pdf"],
    DOCUMENT: ["doc", "docx", "txt"],
  },
  ALLOWED_MIME_TYPES: {
    IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    CSV: ["text/csv", "application/csv", "text/plain"],
    EXCEL: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    PDF: ["application/pdf"],
  },
};

/**
 * Validates a file based on type requirements
 * @param {File} file - The file to validate
 * @param {string} type - The expected file type ('image', 'csv', 'excel', 'pdf', 'document')
 * @param {object} options - Additional validation options
 * @returns {object} - {isValid: boolean, error: string, warnings: string[]}
 */
export const validateFile = (file, type, options = {}) => {
  const errors = [];
  const warnings = [];

  // Check if file exists
  if (!file) {
    return { isValid: false, error: "No file provided", warnings: [] };
  }

  // Check file size
  const maxSize =
    options.maxSize ||
    FILE_CONSTANTS.MAX_FILE_SIZE[type.toUpperCase()] ||
    FILE_CONSTANTS.MAX_FILE_SIZE.DOCUMENT;
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(
      `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    );
  }

  // Get file extension
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split(".").pop();

  // Check file extension
  const allowedExtensions =
    FILE_CONSTANTS.ALLOWED_EXTENSIONS[type.toUpperCase()] || [];
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(
      `File type "${fileExtension}" not allowed. Allowed types: ${allowedExtensions.join(
        ", "
      )}`
    );
  }

  // Check MIME type (if available)
  if (file.type) {
    const allowedMimeTypes =
      FILE_CONSTANTS.ALLOWED_MIME_TYPES[type.toUpperCase()] || [];
    if (!allowedMimeTypes.includes(file.type)) {
      warnings.push(
        `MIME type "${file.type}" detected. Please ensure the file format is correct.`
      );
    }
  }

  // Additional security checks
  const fileNameClean = fileName.replace(/[^\w\s.-]/gi, ""); // Remove potentially dangerous characters
  if (fileName !== fileNameClean) {
    warnings.push(
      "Filename contains special characters that have been sanitized"
    );
  }

  // Check for double extensions (security risk)
  const extensionCount = (fileName.match(/\./g) || []).length;
  if (extensionCount > 1) {
    warnings.push(
      "Filename contains multiple extensions - please ensure this is intentional"
    );
  }

  // Check for suspicious extensions
  const suspiciousExtensions = [
    "exe",
    "bat",
    "cmd",
    "scr",
    "pif",
    "com",
    "vbs",
    "js",
    "jar",
    "zip",
    "rar",
  ];
  if (suspiciousExtensions.includes(fileExtension)) {
    errors.push("This file type is not allowed for security reasons");
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join(". ") : null,
    warnings: warnings,
  };
};

/**
 * Validates an image file with additional constraints
 * @param {File} file - The image file to validate
 * @param {object} constraints - Image constraints {minWidth, minHeight, maxWidth, maxHeight}
 * @returns {Promise<object>} - {isValid: boolean, error: string, warnings: string[]}
 */
export const validateImageFile = async (file, constraints = {}) => {
  // First do basic file validation
  const basicValidation = validateFile(file, "image");

  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Additional image-specific validation
  try {
    return new Promise((resolve) => {
      // Create image object to get dimensions
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: width, naturalHeight: height } = img;

        const warnings = [...basicValidation.warnings];

        // Check dimensions if constraints provided
        if (constraints.minWidth && width < constraints.minWidth) {
          warnings.push(
            `Image width (${width}px) is below minimum required (${constraints.minWidth}px)`
          );
        }
        if (constraints.minHeight && height < constraints.minHeight) {
          warnings.push(
            `Image height (${height}px) is below minimum required (${constraints.minHeight}px)`
          );
        }
        if (constraints.maxWidth && width > constraints.maxWidth) {
          warnings.push(
            `Image width (${width}px) exceeds maximum allowed (${constraints.maxWidth}px)`
          );
        }
        if (constraints.maxHeight && height > constraints.maxHeight) {
          warnings.push(
            `Image height (${height}px) exceeds maximum allowed (${constraints.maxHeight}px)`
          );
        }

        resolve({
          ...basicValidation,
          warnings,
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          error:
            "Failed to load image. Please ensure the file is a valid image format.",
          warnings: basicValidation.warnings,
        });
      };

      // Create object URL to load the image
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      // Clean up object URL after loading
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        // ... rest of load logic
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        // ... rest of error logic
      };
    });
  } catch (error) {
    return {
      isValid: false,
      error: "Error validating image file",
      warnings: basicValidation.warnings,
    };
  }
};

/**
 * Validates CSV/Excel file format for bulk operations
 * @param {File} file - The file to validate
 * @param {string} operation - The expected operation type (e.g., 'user_bulk_upload', 'attendance_upload', 'mentee_assignment')
 * @returns {Promise<object>} - {isValid: boolean, error: string, warnings: string[], preview: object}
 */
export const validateBulkUploadFile = async (file, operation) => {
  // First do basic file validation
  const baseType = file.name.toLowerCase().includes(".csv") ? "csv" : "excel";
  const basicValidation = validateFile(file, baseType);

  if (!basicValidation.isValid) {
    return basicValidation;
  }

  try {
    // For CSV files, we can do basic content validation
    if (baseType === "csv") {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            const lines = content.split("\n").filter((line) => line.trim());

            const warnings = [...basicValidation.warnings];

            // Basic CSV validation
            if (lines.length < 2) {
              resolve({
                isValid: false,
                error:
                  "CSV file must contain at least a header row and one data row",
                warnings,
              });
              return;
            }

            // Validate based on operation type
            const headers = lines[0]
              .split(",")
              .map((h) => h.trim().toLowerCase());

            let requiredHeaders = [];
            switch (operation) {
              case "user_bulk_upload":
                requiredHeaders = ["username", "email"];
                break;
              case "attendance_upload":
                requiredHeaders = ["student_id", "attendance"];
                break;
              case "mentee_assignment":
                requiredHeaders = ["mentor_employee_id", "student_usn"];
                break;
              default:
                requiredHeaders = [];
            }

            if (requiredHeaders.length > 0) {
              const missingHeaders = requiredHeaders.filter(
                (required) =>
                  !headers.some(
                    (header) =>
                      header.includes(required) || required.includes(header)
                  )
              );

              if (missingHeaders.length > 0) {
                warnings.push(
                  `Missing expected columns: ${missingHeaders.join(
                    ", "
                  )}. File may not be processed correctly.`
                );
              }
            }

            // Check for data rows
            const dataRows = lines.length - 1;
            if (dataRows === 0) {
              resolve({
                isValid: false,
                error: "No data rows found in CSV file",
                warnings,
              });
              return;
            }

            resolve({
              ...basicValidation,
              preview: {
                totalRows: lines.length,
                dataRows: dataRows,
                headers: lines[0],
                firstDataRow: lines[1] || null,
              },
              warnings,
            });
          } catch (parseError) {
            resolve({
              isValid: false,
              error: "Failed to parse CSV file. Please check the file format.",
              warnings: basicValidation.warnings,
            });
          }
        };

        reader.onerror = () => {
          resolve({
            isValid: false,
            error: "Failed to read file",
            warnings: basicValidation.warnings,
          });
        };

        reader.readAsText(file);
      });
    } else {
      // For Excel files, basic validation is sufficient
      return {
        ...basicValidation,
        preview: {
          totalRows: "Unknown (Excel file)",
          dataRows: "Unknown (Excel file)",
        },
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: "Error validating bulk upload file",
      warnings: basicValidation.warnings,
    };
  }
};

/**
 * Sanitizes filename to prevent security issues
 * @param {string} filename - The original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return "file";

  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // Remove dangerous characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
    .substring(0, 255); // Limit length
};

/**
 * Gets user-friendly file size string
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
