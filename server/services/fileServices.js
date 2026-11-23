import fs from "fs";
import path from "path";
import ErrorHandler from "../middlewares/error.js";
import { SERVER_ROOT, UPLOAD_ROOT } from "../config/paths.js";

/** Converts multer's absolute file path into a portable "uploads/..." path. */
export const toStoredPath = (absolutePath) =>
  path.relative(SERVER_ROOT, absolutePath).split(path.sep).join("/");

/**
 * Resolves a stored file path to an absolute path on this server.
 * New records hold "uploads/projects/<id>/<file>". Older records hold an
 * absolute path from the machine that received the upload (possibly a
 * Windows path); those are re-anchored on this server's uploads folder.
 */
export const resolveStoredPath = (storedPath = "") => {
  const normalized = String(storedPath).replace(/\\/g, "/");
  const index = normalized.lastIndexOf("uploads/");
  const relative = index !== -1 ? normalized.slice(index) : normalized;
  return path.resolve(SERVER_ROOT, relative);
};

/** True only for paths strictly inside the uploads folder (blocks ../ traversal). */
export const isInsideUploads = (absolutePath) => {
  const relative = path.relative(UPLOAD_ROOT, absolutePath);
  return (
    relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)
  );
};

/**
 * Sends a stored file as a download. Errors are passed to `next` so they go
 * through errorMiddleware (never thrown from inside the async callback,
 * which would crash the process).
 */
export const streamDownload = (storedPath, res, originalName, next) => {
  const filePath = resolveStoredPath(storedPath);

  if (!isInsideUploads(filePath) || !fs.existsSync(filePath)) {
    return next(new ErrorHandler("File not found on the server", 404));
  }

  res.download(filePath, originalName, (err) => {
    if (!err) return;
    if (res.headersSent) {
      // The transfer had already started (e.g. client cancelled the download).
      console.warn(`Download interrupted for ${filePath}: ${err.message}`);
      return;
    }
    next(new ErrorHandler("Error downloading file", 500));
  });
};

/** Deletes files that multer already wrote to disk (used when a request fails). */
export const removeUploadedFiles = async (files = []) => {
  await Promise.all(
    files.map((file) =>
      fs.promises.rm(file.path, { force: true }).catch(() => {}),
    ),
  );
};

/** Deletes every file attached to a project, plus the project's folder. */
export const removeProjectFiles = async (project) => {
  if (!project) return;
  await Promise.all(
    (project.files || []).map((file) => {
      const filePath = resolveStoredPath(file.fileUrl);
      if (!isInsideUploads(filePath)) return null;
      return fs.promises.rm(filePath, { force: true }).catch(() => {});
    }),
  );
  const projectDir = path.join(UPLOAD_ROOT, "projects", String(project._id));
  await fs.promises
    .rm(projectDir, { recursive: true, force: true })
    .catch(() => {});
};
