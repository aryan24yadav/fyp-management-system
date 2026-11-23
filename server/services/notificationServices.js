import { Notification } from "../models/notification.js";

export const createNotification = async (notificationData) => {
  return await Notification.create(notificationData);
};

/**
 * Creates an in-app notification. Notifications are a side effect, so a
 * failure here is logged and swallowed: it must never fail (or crash) the
 * main action that triggered it.
 */
export const notifyUser = async (
  userId,
  message,
  type = "general",
  link = null,
  priority = "low",
) => {
  try {
    return await createNotification({
      user: userId,
      message: String(message).slice(0, 1000),
      type,
      link,
      priority,
    });
  } catch (error) {
    console.error(`Failed to create notification for ${userId}: ${error.message}`);
    return null;
  }
};

export const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { returnDocument: "after" },
  );
};

export const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true },
  );
};

export const deleteNotification = async (notificationId, userId) => {
  return await Notification.findOneAndDelete({
    _id: notificationId,
    user: userId,
  });
};
