import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageSquare, CheckCircle, X, Loader } from "lucide-react";
import {
  getAssignedStudents,
  addFeedback,
  markComplete,
} from "../../store/slices/teacherSlice.js";

const AssignedStudents = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    title: "",
    message: "",
    type: "",
  });
  const [sortBy, setSortBy] = useState("name");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getAssignedStudents());
  }, [dispatch]);

  const { assignedStudents, loading, error } = useSelector(
    (state) => state.teacher,
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border border-green-300";
      case "approved":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case "rejected":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    }
  };

  const getStatusText = (status) => {
    if (!status) return "No Project";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleFeedback = (student) => {
    setSelectedStudent(student);
    setFeedbackData({ title: "", message: "", type: "general" });
    setShowFeedbackModal(true);
  };

  const handleMarkComplete = (student) => {
    setSelectedStudent(student);
    setShowCompleteModal(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setFeedbackData({ title: "", message: "", type: "general" });
    setShowFeedbackModal(false);
    setShowCompleteModal(false);
  };

  // Close the modal only when the request succeeded, so typed feedback is
  // not lost on an error.
  const submitFeedback = async () => {
    if (
      !selectedStudent?.project?._id ||
      !feedbackData.title.trim() ||
      !feedbackData.message.trim()
    ) {
      return;
    }
    setIsSubmitting(true);
    const result = await dispatch(
      addFeedback({
        projectId: selectedStudent.project._id,
        payload: feedbackData,
      }),
    );
    setIsSubmitting(false);
    if (addFeedback.fulfilled.match(result)) closeModal();
  };

  const confirmMarkComplete = async () => {
    if (!selectedStudent?.project?._id) return;
    setIsSubmitting(true);
    const result = await dispatch(markComplete(selectedStudent.project._id));
    setIsSubmitting(false);
    if (markComplete.fulfilled.match(result)) closeModal();
  };

  const sortedStudents = [...(assignedStudents || [])].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "lastActivity":
        return (
          new Date(b.project?.updatedAt || 0) -
          new Date(a.project?.updatedAt || 0)
        );
      default:
        return 0;
    }
  });

  const stats = [
    {
      label: "Total Students",
      value: sortedStudents.length,
      bg: "bg-blue-50",
      text: "text-blue-700",
      sub: "text-blue-600",
    },
    {
      label: "Projects Completed",
      value: sortedStudents.filter((s) => s.project?.status === "completed")
        .length,
      bg: "bg-green-50",
      text: "text-green-700",
      sub: "text-green-600",
    },
    {
      label: "In Progress",
      value: sortedStudents.filter((s) => s.project?.status === "approved")
        .length,
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      sub: "text-yellow-600",
    },
    {
      label: "Total Projects",
      value: sortedStudents.filter((s) => !!s.project).length,
      bg: "bg-purple-50",
      text: "text-purple-700",
      sub: "text-purple-600",
    },
  ];

  if (loading) {
    return <Loader className="animate-spin w-16 h-16" />;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 font-medium">
        Error loading students
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/*HEADER*/}
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Assigned Students</h1>
            <p className="card-subtitle">
              Manage the students assigned to you.
            </p>
          </div>

          <div className="flex justify-end mb-4">
            <select
              className="input w-48"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by name</option>
              <option value="lastActivity">Sort by last activity</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {stats.map((item) => {
              return (
                <div key={item.label} className={`${item.bg} p-4 rounded-lg`}>
                  <p className={`text-sm ${item.sub}`}>{item.label}</p>
                  <p className={`text-2xl ${item.text}`}>{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* STUDENTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedStudents.map((student) => (
            <div
              key={student._id}
              className="card hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {student.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "S"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {student.name}
                    </h3>
                    <p className="text-sm text-slate-600">{student.email}</p>
                  </div>
                </div>

                {/* STATUS BADGE*/}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(student.project?.status)}
            `}
                >
                  {getStatusText(student.project?.status)}
                </span>
              </div>

              <div className="mb-5">
                <h4 className="font-medium text-slate-700 mb-1">
                  {student.project?.title || "No project yet"}
                </h4>
                <p className="text-xs text-slate-500">
                  Last Update:{" "}
                  {new Date(
                    student.project?.updatedAt || new Date(),
                  ).toLocaleDateString()}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleFeedback(student)}
                  disabled={!student.project?._id}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white
          text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-4 h-4" /> Feedback
                </button>

                <button
                  onClick={() => handleMarkComplete(student)}
                  disabled={student.project?.status !== "approved"}
                  title={
                    student.project?.status === "approved"
                      ? ""
                      : "Only approved projects can be marked complete"
                  }
                  className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg transition
          ${
            student.project?.status !== "approved"
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-green-700"
          }`}
                >
                  <CheckCircle className="w-4 h-4" /> Mark Complete
                </button>
              </div>
            </div>
          ))}

          {sortedStudents.length === 0 && (
            <div className="card text-center py-10 text-slate-600">
              No assigned students found
            </div>
          )}
        </div>

        {/*Feedback Modal*/}
        {showFeedbackModal && selectedStudent && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md transform scale-100 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800">
                    Provide Feedback
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Project Info*/}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-600">
                        Project:
                      </span>
                      <span className="ml-2 text-slate-800">
                        {selectedStudent.project?.title || "No title"}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium text-slate-600 mb-4">
                        Student:
                      </span>
                      <span className="ml-2 text-slate-800">
                        {selectedStudent?.name || "No name"}
                      </span>
                    </div>

                    {selectedStudent.project?.deadline && (
                      <div>
                        <span className="font-medium text-slate-600">
                          Deadline:
                        </span>
                        <span className="ml-2 text-slate-800">
                          {new Date(
                            selectedStudent.project?.deadline,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="font-medium text-slate-600">
                        Last Updated:
                      </span>
                      <span className="ml-2 text-slate-800">
                        {(selectedStudent.project?.updatedAt
                          ? new Date(selectedStudent.project.updatedAt)
                          : new Date()
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Form*/}
                  <div className="space-y-4">
                    <div className="mt-5">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Feedback Title
                      </label>
                      <input
                        type="text"
                        value={feedbackData.title}
                        maxLength={200}
                        onChange={(e) =>
                          setFeedbackData({
                            ...feedbackData,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2
                focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter feedback title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Feedback Type
                      </label>

                      <select
                        value={feedbackData.type}
                        onChange={(e) =>
                          setFeedbackData({
                            ...feedbackData,
                            type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2
                focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                        <option value="general">General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Feedback Message
                      </label>

                      <textarea
                        value={feedbackData.message}
                        onChange={(e) =>
                          setFeedbackData({
                            ...feedbackData,
                            message: e.target.value,
                          })
                        }
                        rows={4}
                        maxLength={1000}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2
                focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your feedback message"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={closeModal} className="btn-danger">
                      Cancel
                    </button>
                    <button
                      className="btn-primary disabled:opacity-50"
                      onClick={submitFeedback}
                      disabled={
                        isSubmitting ||
                        !feedbackData.title.trim() ||
                        !feedbackData.message.trim()
                      }
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* complete modal */}
        {showCompleteModal && selectedStudent && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex backdrop-blur-sm items-center justify-center z-50"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md transform scale-100 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800">
                    Mark Project as Complete?
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-600">
                        Student
                      </span>
                      <span className="ml-2 text-slate-800">
                        {selectedStudent.name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">
                        Project
                      </span>
                      <span className="ml-2 text-slate-800">
                        {selectedStudent.project?.title || "No title"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 mb-6">
                  Are you sure to mark this project as completed? This action
                  cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-danger">
                    Cancel
                  </button>
                  <button
                    onClick={confirmMarkComplete}
                    className="btn-primary disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Mark as Completed"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AssignedStudents;
