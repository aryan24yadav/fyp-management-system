import express from "express";
import {
  register,
  login,
  logout,
  getUser,
  forgotPassword,
  resetPassword,
  updatePassword,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
// Logout must work even with an expired/invalid token, so no isAuthenticated.
router.post("/logout", logout);
router.get("/me", isAuthenticated, getUser);
router.get("/getUser", isAuthenticated, getUser); // kept for backwards compatibility
router.post("/Password/forgot", authLimiter, forgotPassword);
router.put("/Password/reset/:token", authLimiter, resetPassword);
router.put("/Password/update", isAuthenticated, authLimiter, updatePassword);

export default router;
