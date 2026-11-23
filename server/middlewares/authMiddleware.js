import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { asyncHandler } from "./asyncHandler.js";
import ErrorHandler from "./error.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const { token } = req.cookies || {};
  if (!token) {
    return next(new ErrorHandler("Please log in to access this resource", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("+passwordChangedAt");
  if (!user) {
    return next(new ErrorHandler("User no longer exists", 401));
  }

  // Tokens issued before the last password change are no longer valid.
  if (
    user.passwordChangedAt &&
    decoded.iat * 1000 < user.passwordChangedAt.getTime()
  ) {
    return next(
      new ErrorHandler("Password was changed recently, please log in again", 401),
    );
  }

  req.user = user;
  next();
});

export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("Please log in to access this resource", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not authorized. This action can only be performed by: ${roles.join(", ")}.`,
          403,
        ),
      );
    }
    next();
  };
};
