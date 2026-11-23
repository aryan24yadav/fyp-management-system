import crypto from "crypto";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { User, RESET_PASSWORD_TTL_MINUTES } from "../models/user.js";
import { generateToken, getCookieOptions } from "../utils/generateToken.js";
import { sendEmail, trySendEmail } from "../services/emailServices.js";
import {
  generateForgotPasswordEmailTemplate,
  generateResetPasswordEmailTemplate,
} from "../utils/emailTemplates.js";
import { getFrontendUrl } from "../utils/frontendUrl.js";

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

/**
 * Public self-registration. Only creates *Student* accounts and is disabled
 * unless ALLOW_PUBLIC_REGISTRATION=true. Teachers/Admins are created by an
 * Admin (or by `npm run seed:admin` for the first Admin).
 */
export const register = asyncHandler(async (req, res, next) => {
  if (process.env.ALLOW_PUBLIC_REGISTRATION !== "true") {
    return next(
      new ErrorHandler(
        "Public registration is disabled. Please contact the administrator.",
        403,
      ),
    );
  }

  const { name, password, department } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!name || !email || !password) {
    return next(new ErrorHandler("Name, email and password are required", 400));
  }

  const exists = await User.exists({ email });
  if (exists) {
    return next(new ErrorHandler("User already exists", 409));
  }

  // Role is never taken from the request body (prevents self-promotion to Admin).
  const user = await User.create({
    name,
    email,
    password,
    department,
    role: "Student",
  });
  generateToken(user, 201, "User registered successfully", res);
});

export const login = asyncHandler(async (req, res, next) => {
  const { password, role } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!email || !password || !role) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  // Same message for "no such user" and "wrong password" so attackers cannot
  // find out which e-mail addresses are registered.
  if (!user || !(await user.comparePassword(password))) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler("Selected role does not match this account", 403),
    );
  }

  generateToken(user, 200, "User logged in successfully", res);
});

export const logout = asyncHandler(async (req, res) => {
  // Must use the same attributes the cookie was set with, otherwise browsers
  // (especially with SameSite=None; Secure in production) keep the old cookie.
  res
    .status(200)
    .clearCookie("token", getCookieOptions())
    .json({ success: true, message: "User logged out successfully" });
});

export const getUser = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const genericResponse = {
    success: true,
    message:
      "If an account exists for this email, a password reset link has been sent.",
  };

  const user = await User.findOne({ email });
  if (!user) {
    // Do not reveal whether the e-mail is registered.
    return res.status(200).json(genericResponse);
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;
  const message = generateForgotPasswordEmailTemplate(
    user.name,
    resetPasswordUrl,
    RESET_PASSWORD_TTL_MINUTES,
  );

  try {
    await sendEmail({
      to: user.email,
      subject: "FYP SYSTEM - Reset your password",
      message,
    });
  } catch (error) {
    // Roll back the token so an unusable reset link is not left behind.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error(`Password reset email failed: ${error.message}`);
    return next(
      new ErrorHandler(
        "Could not send the reset email right now. Please try again later.",
        500,
      ),
    );
  }

  res.status(200).json(genericResponse);
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return next(new ErrorHandler("All fields are required", 400));
  }
  if (password !== confirmPassword) {
    return next(
      new ErrorHandler("Password and Confirm Password do not match", 400),
    );
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorHandler("Reset link is invalid or has expired", 400));
  }

  user.password = password; // hashed by the pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  await trySendEmail({
    to: user.email,
    subject: "FYP SYSTEM - Password changed",
    message: generateResetPasswordEmailTemplate(
      user.name,
      `${getFrontendUrl()}/login`,
    ),
  });

  generateToken(user, 200, "Password reset successfully", res);
});

/** Logged-in user changes their own password. */
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("All fields are required", 400));
  }
  if (newPassword !== confirmPassword) {
    return next(
      new ErrorHandler("New Password and Confirm Password do not match", 400),
    );
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.comparePassword(currentPassword))) {
    return next(new ErrorHandler("Current password is incorrect", 400));
  }

  user.password = newPassword;
  await user.save();
  generateToken(user, 200, "Password updated successfully", res);
});
