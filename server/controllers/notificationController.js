import { asyncHandler } from "../middlewares/asyncHandler.js";
import { Notification } from "../models/notification.js";
import ErrorHandler from "../middlewares/error.js";
import * as notificationServices from "../services/notificationServices.js";

const MAX_LIMIT = 500;

const getWeekRange = () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { startOfWeek, endOfWeek };
};

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Admins also see every "request" notification as a system activity feed.
  const query =
    req.user.role === "Admin"
      ? { $or: [{ user: userId }, { type: "request" }] }
      : { user: userId };

  const limit = Math.min(Number(req.query.limit) || 100, MAX_LIMIT);
  const { startOfWeek, endOfWeek } = getWeekRange();

  // Counts are computed by the database instead of loading every document.
  const [
    notifications,
    unreadOnly,
    readOnly,
    highPriorityMessages,
    thisWeekNotifications,
  ] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ ...query, isRead: false }),
    Notification.countDocuments({ ...query, isRead: true }),
    Notification.countDocuments({ ...query, priority: "high" }),
    Notification.countDocuments({
      ...query,
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    }),
  ]);

  res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    data: {
      notifications,
      unreadOnly,
      readOnly,
      highPriorityMessages,
      thisWeekNotifications,
    },
  });
});

export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await notificationServices.markAsRead(
    req.params.id,
    req.user._id,
  );

  if (!notification) {
    return next(new ErrorHandler("Notification not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: { notification },
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationServices.markAllAsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await notificationServices.deleteNotification(
    req.params.id,
    req.user._id,
  );

  if (!notification) {
    return next(new ErrorHandler("Notification not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
});
