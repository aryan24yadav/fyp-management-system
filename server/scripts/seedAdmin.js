/**
 * Creates the first Admin account (public registration cannot create Admins).
 *
 *   1. Set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME) in server/.env
 *   2. Run: npm run seed:admin
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { User } from "../models/user.js";

const { ADMIN_NAME = "Admin", ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!process.env.MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running this script.",
  );
  process.exit(1);
}

try {
  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(
      existing.role === "Admin"
        ? `Admin ${email} already exists. Nothing to do.`
        : `A ${existing.role} account already uses ${email}. Choose another ADMIN_EMAIL.`,
    );
  } else {
    await User.create({
      name: ADMIN_NAME,
      email,
      password: ADMIN_PASSWORD,
      role: "Admin",
    });
    console.log(`Admin account created: ${email}`);
  }
} catch (error) {
  console.error(`Failed to create admin: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
