import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", isAuthenticated, getNotifications);

// State-changing actions use PUT/DELETE, never GET (GET requests can be
// triggered by link prefetching or an <img> tag on another site).
router.put("/read-all", isAuthenticated, markAllAsRead);
router.put("/:id/read", isAuthenticated, markAsRead);
router.delete("/:id/delete", isAuthenticated, deleteNotification);

export default router;
