import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { KeyRound, CheckCircle, Mail, ArrowRight } from "lucide-react";
import { Loader } from "lucide-react";
import { forgotPassword } from "../../store/slices/authSlice";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { isRequestingForToken } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email is invalid");
      return;
    }

    setError("");

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || err || "Failed to send reset link");
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Check Your Email
            </h1>
            <p className="text-gray-500 mt-2">
              We've sent a password reset link to
            </p>
            <p className="font-medium text-gray-800 mt-1">{email}</p>
          </div>

          {/* Success Card */}
          <div className="card">
            {/* Email Instructions */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium text-blue-900 mb-1">
                    Check your email
                  </p>
                  <p className="text-blue-800">
                    Click the reset link in the email we sent you. The link
                    expires in 15 minutes.
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-gray-700 pt-0.5">
                    Check your inbox and spam folder
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-gray-700 pt-0.5">
                    Click on the password reset link
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-gray-700 pt-0.5">
                    Create a new password
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to="/login"
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                Back to Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                  setError("");
                }}
                className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Try Another Email
              </button>
            </div>

            {/* Footer Help */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Didn't receive the email?</span>{" "}
                Check your spam folder, or{" "}
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  request a new reset link
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-gray-500">
            Enter your registered email address. We will send you a reset link.
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className={`input ${error && "input-error"}`}
                placeholder="Enter Your Email"
                disabled={isRequestingForToken}
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isRequestingForToken}
            >
              {isRequestingForToken ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin h-4 w-4 text-white" />
                  Sending...
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
