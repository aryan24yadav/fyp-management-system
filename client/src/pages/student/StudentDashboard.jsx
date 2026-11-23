import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats } from "../../store/slices/studentSlice";
import { Link } from "react-router-dom";
import { MessageCircle, Bell, MessageCircleWarning } from "lucide-react";
const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { dashboardStats } = useSelector((state) => state.student);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const project = dashboardStats?.project || {};
  const supervisorName = dashboardStats?.supervisorName || "N/A";
  const upcomingDeadlines = dashboardStats?.upcomingDeadlines || [];
  const topNotifications = dashboardStats?.topNotifications || [];
  // The API already returns the two newest feedback items, newest first.
  // (.slice(-2).reverse() flipped the order, so "Recent Feedback" showed the older one.)
  const feedbackList = dashboardStats?.feedbackNotifications || [];

  const formatDate = (dateStr) => {
    if (!dateStr) {
      return "N/A";
    }
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };


  return (
    <>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {authUser?.name || "Student"}
          </h1>
          <p className="text-blue-100">
            Here's what's happening with your project today
          </p>
        </div>

        {/* Quick State */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg"> 🏆 </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Project Title
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {project?.title || "No Project"}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg"> 🏆 </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Supervisor</p>
                <p className="text-lg font-semibold text-slate-800">
                  {supervisorName || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg"> 🏆 </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Next Deadline
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {formatDate(project?.deadline)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg"> 🏆 </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Recent FeedBack
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {feedbackList?.length
                    ? formatDate(feedbackList[0]?.createdAt)
                    : "No Feedback Yet"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Overview */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Project Overview</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Project Title
                </label>
                <p className="text-slate-800 font-medium">
                  {project?.title || "No project assigned"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Project Description
                </label>
                <p className="text-slate-800 font-medium">
                  {project?.description || "No Description provided"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">
                  Status
                </label>
                <span
                  className={`inline-flex items-center px-2 py-[2px] rounded-full text-sm font-medium capitalize
                        ${
                          project?.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : project?.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : project?.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : project?.status === "completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                        }`}
                >
                  {project?.status || "Unknown"}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Submission DeadLine
                </label>
                <p className="text-slate-800 font-medium">
                  {formatDate(project?.deadline)}
                </p>
              </div>
            </div>
          </div>

          {/* Latest Feedback*/}

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="card-title"> Latest Feedback</h2>
              <Link
                to={"/student/feedback"}
                className="text-sm bg-blue-500 text-white
                  px-3 py-1 rounded-full font-medium
                  hover:bg-blue-600 transition-all duration-300"
              >
                View All
              </Link>
            </div>

            {feedbackList && feedbackList.length > 0 ? (
              <div className="space-y-4 p-4">
                {feedbackList.map((feedback) => {
                  return (
                    <div
                      key={feedback._id}
                      className="border
                            border-slate-200 rounded-lg p-4
                            hover:shadow-md transition-shadow"
                    >
                      <div
                        className="flex items-center
                              justify-between mb-2"
                      >
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-5 h-5 text-blue-500" />

                          <h3 className="font-medium text-slate-800">
                            {feedback.title || "Supervisor Feedback"}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatDate(feedback.createdAt)}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-700 text-sm leading-relaxed">
                          {feedback.message}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xs text-slate-500">
                          - {supervisorName || "Supervisor"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle
                  className="w-10 h-10
                      text-slate-300 mx-auto mb-3"
                />
                <p className="text-slate-500 text-sm">No feedback yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming DeadLines & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Upcoming DeadLines</h2>
            </div>

            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((d, i) => {
                  return (
                    <div
                      key={i}
                      className="flex items-center
                      justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{d.title}</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(d.deadline)}
                        </p>
                      </div>

                      <div
                        className={`badge badge-pending capitalize font-semibold`}
                      >
                        {" "}
                        upcoming{" "}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircleWarning
                  className="w-10 h-10
                      text-slate-300 mx-auto mb-3"
                />
                <p className="text-slate-500 text-sm">
                  No upcoming deadlines yet.
                </p>
              </div>
            )}
          </div>

          {/* recent Notification*/}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Notifications</h2>
            </div>
              {topNotifications && topNotifications.length > 0 ? (
                <div className="space-y-3">
                  {topNotifications.map((n) => {
                    return (
                      <div
                        key={n._id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <p className="font-medium text-slate-800">
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell
                    className="w-10 h-10
                      text-slate-300 mx-auto mb-3"
                  />
                  <p className="text-slate-500 text-sm">
                    No new Notifications.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
