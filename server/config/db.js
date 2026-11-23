import mongoose from "mongoose";

/**
 * Connects to MongoDB. Throws on failure so the caller (server.js) can stop
 * the process instead of running an API that cannot reach its database.
 */
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "projectManagementSystem",
    serverSelectionTimeoutMS: 10_000,
  });

  console.log(`MongoDB connected: ${conn.connection.host}`);

  mongoose.connection.on("error", (error) => {
    console.error(`MongoDB connection error: ${error.message}`);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  return conn;
};

export default connectDB;
