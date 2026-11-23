import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchProject,
  submitProjectProposal,
} from "../../store/slices/studentSlice";

const SubmitProposal = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { project } = useSelector((state) => state.student);

  useEffect(() => {
    dispatch(fetchProject());
  }, [dispatch]);

  // A new proposal is only allowed when there is none, or the last was rejected.
  const canSubmit = !project || project.status === "rejected";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Wait for the request: before, the button re-enabled immediately and
      // the form was never reset, inviting duplicate submissions.
      await dispatch(submitProjectProposal(formData)).unwrap();
      setFormData({ title: "", description: "" });
      navigate("/student");
    } catch {
      // the thunk already shows an error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Submit Project Proposal</h1>
            <p className="card-subtitle">
              Please fill out all sections to submit your project proposal
            </p>
          </div>

          {!canSubmit && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              You already submitted "{project.title}" (status:{" "}
              <span className="font-semibold capitalize">{project.status}</span>
              ). You can submit a new proposal only if it gets rejected.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Project Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder="Enter project title"
                maxLength={200}
                disabled={!canSubmit}
                required
              />
            </div>

            <div>
              <label className="label">Project Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input min-h-[120px]"
                placeholder="Enter project description"
                maxLength={1000}
                disabled={!canSubmit}
                required
              />
              <p className="text-xs text-slate-500 mt-1 text-right">
                {formData.description.length}/1000
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="btn-primary disabled:opacity-50"
                disabled={isLoading || !canSubmit}
              >
                {isLoading ? "Submitting..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SubmitProposal;
