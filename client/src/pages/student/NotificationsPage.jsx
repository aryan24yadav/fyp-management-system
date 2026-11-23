import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getNotifications,
  deleteNotification,
  markAllAsRead,
  markAsRead,
} from "../../store/slices/notificationSlice";
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  ChevronDown,
  Clock5,
  MessageCircle,
  Settings,
  User,
  Clock,
  CheckCircle2,
  BellOff,
} from "lucide-react";
const NotificationsPage = () => {
  const dispatch = useDispatch();
  const {
    list: notifications,
    unreadCount,
    readCount,
    highPriorityMessages,
    thisWeekNotifications,
    loading,
  } = useSelector((state) => state.notification);

  useEffect(() => {
    dispatch(getNotifications());
  }, [dispatch]);

  const markAsReadHandler = (id) => {
    dispatch(markAsRead(id));
  };

  const markAllAsReadHandler = () => {
    dispatch(markAllAsRead());
  };

  const deleteNotificationHandler = (id) => {
    dispatch(deleteNotification(id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "feedback":
        return <MessageCircle className="w-6 h-6 text-blue-500" />;

      case "deadline":
        return <Clock5 className="w-6 h-6 text-red-500" />;

      case "approval":
        return <BadgeCheck className="w-6 h-6 text-green-500" />;

      case "meeting":
        return <Calendar className="w-6 h-6 text-purple-500" />;

      case "system":
        return <Settings className="w-6 h-6 text-gray-500" />;

      default:
        // Custom combined icon (User + Down Arrow)
        return (
          <div
            className="relative w-6 h-6 text-slate-500
        flex items-center justify-center"
          >
            <User className="w-5 h-5 absolute" />
            <ChevronDown className="w-4 h-4 absolute top-4" />
          </div>
        );
    }
  };

  // "border-1-red-500" is not a Tailwind class; use a coloured left border.
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-yellow-500";
      case "low":
        return "border-l-4 border-l-green-500";
      default:
        return "border-l-4 border-l-slate-300";
    }
  };

  const getTitle = (type = "general") =>
    type.charAt(0).toUpperCase() + type.slice(1);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();

    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const stats = [
    {
      title: "Total",
      value: unreadCount + readCount,
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      textColor: "text-blue-600",
      titleColor: "text-blue-800",
      valueColor: "text-blue-900",
      Icon: User,
    },
    {
      title: "Unread",
      value: unreadCount,
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      textColor: "text-red-600",
      titleColor: "text-red-800",
      valueColor: "text-red-900",
      Icon: AlertCircle,
    },
    {
      title: "High Priority",
      value: highPriorityMessages,
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      textColor: "text-yellow-600",
      titleColor: "text-yellow-800",
      valueColor: "text-yellow-900",
      Icon: Clock,
    },
    {
      title: "This Week",
      value: thisWeekNotifications,
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      textColor: "text-green-600",
      titleColor: "text-green-800",
      valueColor: "text-green-900",
      Icon: CheckCircle2,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="card">
          {/* CARD HEADER */}
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="card-title"> Notifications </h1>
                <p className="card-subtitle">
                  Manage your notification preferences and settings.
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  className="btn-outline btn-small"
                  onClick={markAllAsReadHandler}
                >
                  Mark all as Read ({unreadCount})
                </button>
              )}
            </div>
          </div>

          {/* NOTIFICATION STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {stats.map((item, i) => {
              return (
                <div key={i} className={`${item.bg} rounded-lg p-4`}>
                  <div className="flex items-center">
                    <div className={`p-2 ${item.iconBg} rounded-lg`}>
                      <item.Icon className={`w-5 h-5 ${item.textColor}`} />
                    </div>

                    <div className="ml-3">
                      <p className={`text-xs font-medium ${item.titleColor}`}>
                        {item.title}
                      </p>
                      <p className={`text-sm font-medium ${item.valueColor}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* NOTIFICATION LIST */}
          <div className="space-y-3">
            {notifications.map((notification) => {
              return (
                <div
                  key={notification._id}
                  className={`relative flex gap-4
                  rounded-xl border p-4 transition-all ${
                    !notification.isRead
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white hover:bg-slate-50"
                  }
                  ${getPriorityColor(notification.priority)} `}
                >
                  <div className="flex items-start space-x-4 w-full">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className={`font-medium ${
                            !notification.isRead
                              ? "text-slate-900"
                              : "text-slate-700"
                          }`}
                        >
                          {getTitle(notification.type)}
                          {!notification.isRead && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                          )}
                        </h3>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-500">
                            {formatDate(notification.createdAt)}
                          </span>
                          <span
                            className={`badge capitalize ${
                              notification.priority === "high"
                                ? "badge-rejected"
                                : notification.priority === "medium"
                                  ? "badge-pending"
                                  : "badge-approved"
                            }`}
                          >
                            {notification.priority}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed mb-3">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span
                          className={`badge capitalize ${
                            notification.type === "feedback"
                              ? "bg-blue-100 text-blue-800"
                              : notification.type === "deadline"
                                ? "bg-red-100 text-red-800"
                                : notification.type === "approval"
                                  ? "bg-green-100 text-green-800"
                                  : notification.type === "meeting"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {notification.type}
                        </span>

                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <button
                              className="text-sm text-blue-600 hover:text-blue-500"
                              onClick={() =>
                                markAsReadHandler(notification._id)
                              }
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            className="text-sm text-red-600 hover:text-red-500"
                            onClick={() =>
                              deleteNotificationHandler(notification._id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {loading && notifications.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Loading notifications...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center mb-3 text-slate-600">
                <BellOff className="w-12 h-12" />
              </div>
              <p className="text-slate-500">
                You're all caught up! No new notifications.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
