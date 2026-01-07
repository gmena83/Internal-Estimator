import multer from "multer";

/**
 * Centrailzed upload configuration.
 * Uses memory storage to avoid blocking Disk I/O.
 * Individual routes handle streaming the buffer to the StorageProvider.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // Increased to 20MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/markdown",
      "text/plain",
      "text/x-markdown",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".pdf",
      ".md",
      ".txt",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
    ];

    const fileExt = file.originalname.toLowerCase().match(/\.[0-9a-z]+$/i)?.[0];

    if (allowedTypes.includes(file.mimetype) && fileExt && allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});
