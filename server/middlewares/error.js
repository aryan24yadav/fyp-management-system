/**
 * An Error that carries an HTTP status code. Throw it (or pass it to next())
 * from any controller/service; errorMiddleware turns it into a JSON response.
 */
class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: "File size limit exceeded. Maximum file size is 10MB.",
  LIMIT_FILE_COUNT: "Too many files uploaded. Maximum is 10 files.",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field. Use the 'files' field.",
};

/** Converts known library errors (Mongoose, JWT, multer, body-parser) to ErrorHandler. */
const normalizeError = (err) => {
  if (err instanceof ErrorHandler) return err;

  if (err?.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(", ") || "field";
    return new ErrorHandler(`Duplicate value entered for ${fields}`, 409);
  }
  if (err?.name === "ValidationError" && err.errors) {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return new ErrorHandler(message, 400);
  }
  if (err?.name === "CastError") {
    return new ErrorHandler(`Invalid ${err.path}`, 400);
  }
  if (err?.name === "JsonWebTokenError") {
    return new ErrorHandler("Invalid session, please log in again", 401);
  }
  if (err?.name === "TokenExpiredError") {
    return new ErrorHandler("Session expired, please log in again", 401);
  }
  if (err?.name === "MulterError") {
    return new ErrorHandler(MULTER_MESSAGES[err.code] || err.message, 400);
  }
  if (err?.type === "entity.parse.failed") {
    return new ErrorHandler("Malformed JSON in request body", 400);
  }
  if (err?.type === "entity.too.large") {
    return new ErrorHandler("Request body is too large", 413);
  }

  const wrapped = new ErrorHandler(
    err?.message || "Internal Server Error",
    err?.statusCode || err?.status || 500,
  );
  wrapped.stack = err?.stack;
  return wrapped;
};

export const errorMiddleware = (err, req, res, next) => {
  const error = normalizeError(err);
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  if (res.headersSent) {
    return next(err);
  }

  // Never leak internal error details to clients in production.
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : error.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default ErrorHandler;
