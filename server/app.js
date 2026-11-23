import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import mongoose from "mongoose";
import ErrorHandler, { errorMiddleware } from "./middlewares/error.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import authRouter from "./router/userRoutes.js";
import adminRouter from "./router/adminRoutes.js";
import studentRouter from "./router/studentRoutes.js";
import notificationRouter from "./router/notificationRoutes.js";
import projectRouter from "./router/projectRoutes.js";
import deadlineRouter from "./router/deadlineRoutes.js";
import teacherRouter from "./router/teacherRoutes.js";
import { UPLOAD_ROOT } from "./config/paths.js";

const app = express();

app.disable("x-powered-by");

// Needed behind a reverse proxy (Render, Railway, Nginx...) so that
// req.ip and rate limiting see the real client IP. Example: TRUST_PROXY=1
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  const asNumber = Number(trustProxy);
  app.set(
    "trust proxy",
    trustProxy === "true" ? true : Number.isNaN(asNumber) ? trustProxy : asNumber,
  );
}

/// CORS: allows the React frontend (FRONTEND_URL, comma-separated for several
/// origins) to call this API with cookies (credentials: true).
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

/// Body parsers (JSON + HTML forms) and cookie parser. The size limit stops
/// oversized payloads from exhausting memory; file uploads go through multer.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api", apiLimiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/deadline", deadlineRouter);
app.use("/api/v1/teacher", teacherRouter);

/// Unknown routes return a JSON 404 instead of Express's HTML page.
app.use((req, res, next) => {
  next(new ErrorHandler(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

/// The error middleware must be registered last.
app.use(errorMiddleware);

export default app;
