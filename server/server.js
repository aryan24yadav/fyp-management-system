// Load environment variables before any other module reads process.env.
import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = Number(process.env.PORT) || 4000;

// Fail fast with a clear message instead of crashing later on the first request.
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnv.join(", ")}. ` +
      "Copy server/.env.example to server/.env and fill it in.",
  );
  process.exit(1);
}

let server;

const start = async () => {
  // Only accept HTTP traffic once the database is reachable.
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

let shuttingDown = false;
const shutdown = (reason, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${reason}: shutting down gracefully...`);

  // Force-exit if open connections keep the process alive for too long.
  setTimeout(() => process.exit(exitCode), 10_000).unref();

  const closeDb = () =>
    mongoose.connection
      .close(false)
      .catch(() => {})
      .finally(() => process.exit(exitCode));

  // Stop accepting new requests, let in-flight requests finish, then close the DB.
  if (server) server.close(closeDb);
  else closeDb();
};

start().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
