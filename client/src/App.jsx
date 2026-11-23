import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { Loader } from "lucide-react";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Dashboard Layouts
import DashboardLayout from "./components/layout/DashboardLayout";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import SubmitProposal from "./pages/student/SubmitProposal";
import UploadFiles from "./pages/student/UploadFiles";
import SupervisorPage from "./pages/student/SupervisorPage";
import FeedbackPage from "./pages/student/FeedbackPage";
import NotificationsPage from "./pages/student/NotificationsPage";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import PendingRequests from "./pages/teacher/PendingRequests";
import AssignedStudents from "./pages/teacher/AssignedStudents";
import TeacherFiles from "./pages/teacher/TeacherFiles";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import AssignSupervisor from "./pages/admin/AssignSupervisor";
import DeadlinesPage from "./pages/admin/DeadlinesPage";
import ProjectsPage from "./pages/admin/ProjectsPage";
import NotFound from "./pages/NotFound";
import { getUser } from "./store/slices/authSlice";
import { getHomePath } from "./lib/routes";

const FullScreenLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader className="animate-spin h-12 w-12 text-blue-500" />
  </div>
);

/**
 * Declared OUTSIDE App on purpose: a component defined inside another
 * component is a new type on every render, so React unmounted and remounted
 * the whole dashboard (losing all page state) whenever App re-rendered.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);

  // Still verifying the session: don't redirect yet.
  if (isCheckingAuth) return <FullScreenLoader />;
  if (!authUser) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(authUser.role)) {
    return <Navigate to={getHomePath(authUser.role)} replace />;
  }
  return children;
};

const HomeRedirect = () => {
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);
  if (isCheckingAuth) return <FullScreenLoader />;
  return (
    <Navigate to={authUser ? getHomePath(authUser.role) : "/login"} replace />
  );
};

const App = () => {
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Restore the session from the httpOnly cookie. Each page fetches its own
  // data, so there is no role-specific prefetching here any more (it caused
  // duplicate requests).
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  if (isCheckingAuth && !authUser) {
    return <FullScreenLoader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <DashboardLayout userRole="Student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="submit-proposal" element={<SubmitProposal />} />
          <Route path="upload-files" element={<UploadFiles />} />
          <Route path="supervisor" element={<SupervisorPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <DashboardLayout userRole="Teacher" />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="pending-requests" element={<PendingRequests />} />
          <Route path="assigned-students" element={<AssignedStudents />} />
          <Route path="files" element={<TeacherFiles />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <DashboardLayout userRole="Admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="teachers" element={<ManageTeachers />} />
          <Route path="assign-supervisor" element={<AssignSupervisor />} />
          <Route path="deadlines" element={<DeadlinesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">
                  Unauthorized Access
                </h1>
                <p className="text-slate-600 mb-4">
                  You don't have permission to access this page.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="btn-primary"
                >
                  Go Back
                </button>
              </div>
            </div>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer theme="dark" position="top-center" />
    </BrowserRouter>
  );
};

export default App;
