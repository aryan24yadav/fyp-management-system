import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { KeyRound, Loader } from "lucide-react";

import { resetPassword } from "../../store/slices/authSlice";

const ResetPasswordPage = () => {
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isUpdatingPassword } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("This reset link is invalid. Please request a new one.");
      return;
    }
    if (!validateForm()) return;

    try {
      await dispatch(
        resetPassword({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      ).unwrap();

      // The thunk already shows the success toast. The user is now logged
      // in; /login forwards them to their dashboard.
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err?.message || err || "Failed to reset password. Please try again.",
      );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full ">
          {/*Header*/}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full mb-4">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-500">Enter your new password</p>
          </div>

          {/*Reset Password Form*/}

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/*Password*/}
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input ${errors.password && "input-error"}`}
                  placeholder="Enter Your Password "
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/*Confirm Password*/}
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input ${errors.confirmPassword && "input-error"}`}
                  placeholder="Confirm Your Password "
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Reset Password button */}
              <button
                type="submit"
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin mr-2 h-4 w-4 text-white" />
                    Resetting...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                Remembered your password?{" "}
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
