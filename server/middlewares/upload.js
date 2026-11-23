import multer from "multer";
import path from "path";
import fs from "fs";
import ErrorHandler from "./error.js";
import { UPLOAD_ROOT } from "../config/paths.js";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectId } = req.params;
    // projectId comes from the URL. Only a strict 24-hex id is accepted, so it
    // can never contain "../" and write outside the uploads folder.
    if (!OBJECT_ID_PATTERN.test(projectId || "")) {
      return cb(new ErrorHandler("Invalid project id", 400));
    }

    const uploadPath = path.join(UPLOAD_ROOT, "projects", projectId);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-rar",
  "application/vnd.rar",
  "application/x-tar",
  "application/gzip",
  "application/x-gzip",
  "application/x-7z-compressed",
  "application/octet-stream",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
  "application/javascript",
  "text/javascript",
  "text/css",
  "text/html",
  "application/json",
];

const allowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".tar",
  ".gz",
  ".tgz",
  ".7z",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".txt",
  ".js",
  ".css",
  ".html",
  ".json",
];

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new ErrorHandler(
        `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`,
        400,
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 10,
  },
});

/**
 * Turns multer errors into 400 responses with a `message` field (the
 * frontend reads `message`). Before, file-type errors fell through as 500 and
 * size/count errors used an `error` field the UI never displayed.
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File size limit exceeded. Maximum file size is 10MB.",
      LIMIT_FILE_COUNT: "Too many files uploaded. Maximum is 10 files.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field. Use the 'files' field.",
    };
    return next(new ErrorHandler(messages[err.code] || err.message, 400));
  }
  next(err);
};

export { upload, handleUploadError };
