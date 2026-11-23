import rateLimit from "express-rate-limit";

const limitResponse = (message) => ({ success: false, message });

/** Broad safety net for the whole API (per IP). */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT) || 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitResponse("Too many requests, please try again later."),
});

/** Strict limit for login / password-reset endpoints to slow down brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: limitResponse(
    "Too many attempts from this IP, please try again in 15 minutes.",
  ),
});
