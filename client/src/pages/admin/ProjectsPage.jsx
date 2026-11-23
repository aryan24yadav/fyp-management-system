// `Plus` was used but never imported, so this whole page crashed on render
// with "Plus is not defined".
import {
  AlertTriangle,
  CheckCircle2,
  Folder,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  approveProject,
  getAllProjects,
  getProject,
  rejectProject,
} from "../../store/slices/adminSlice";
import { downloadProjectFile } from "../../store/slices/projectSlice";
import { downloadWithThunk } from "../../lib/download";

const ProjectsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupervisor, setFilterSupervisor] = useState("all");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportSearch, setReportSearch] = useState("");

  const [showViewModal, setShowViewModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const dispatch = useDispatch();
  const { projects: storeProjects } = useSelector((state) => state.admin);
  const projects = useMemo(() => storeProjects || [], [storeProjects]);

  useEffect(() => {
    dispatch(getAllProjects());
  }, [dispatch]);

  const supervisors = useMemo(() => {
    const set = new Set(
      projects.map((p) => p?.supervisor?.name).filter(Boolean),
    );
    return Array.from(set);
  }, [projects]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      (project.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.student?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;

    const matchesSupervisor =
      filterSupervisor === "all" ||
      project.supervisor?.name === filterSupervisor;

    return matchesSearch && matchesStatus && matchesSupervisor;
  });

  const files = useMemo(() => {
    return projects.flatMap((p) =>
      (p.files || []).map((f) => ({
        projectId: p._id,
        fileId: f._id,
        originalName: f.originalName,
        uploadedAt: f.uploadedAt,
        projectTitle: p.title,
        studentName: p.student?.name,
      })),
    );
  }, [projects]);

  const filteredFiles = files.filter(
    (file) =>
      (file.originalName || "")
        .toLowerCase()
        .includes(reportSearch.toLowerCase()) ||
      (file.projectTitle || "")
        .toLowerCase()
        .includes(reportSearch.toLowerCase()) ||
      (file.studentName || "")
        .toLowerCase()
        .includes(reportSearch.toLowerCase()),
  );

  const handleDownloadFile = (file) =>
    downloadWithThunk(
      dispatch,
      downloadProjectFile,
      { projectId: file.projectId, fileId: file.fileId },
      file.originalName,
    );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    setBusyId(projectId);
    if (newStatus === "approved") {
      await dispatch(approveProject(projectId));
    } else if (newStatus === "rejected") {
      await dispatch(rejectProject(projectId));
    }
    setBusyId(null);
  };

  const handleView = async (projectId) => {
    const res = await dispatch(getProject(projectId));
    if (!getProject.fulfilled.match(res) || !res.payload) return;
    setCurrentProject(res.payload);
    setShowViewModal(true);
  };

  const projectStats = [
    {
      title: "Total Projects",
      value: projects.length,
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
      Icon: Folder,
    },
    {
      title: "Pending Review",
      value: projects.filter((p) => p.status === "pending").length,
      bg: "bg-orange-100",
      iconColor: "text-orange-600",
      Icon: AlertTriangle,
    },
    {
      title: "Completed",
      value: projects.filter((p) => p.status === "completed").length,
      bg: "bg-green-100",
      iconColor: "text-green-600",
      Icon: CheckCircle2,
    },
    {
      title: "Rejected",
      value: projects.filter((p) => p.status === "rejected").length,
      bg: "bg-red-100",
      iconColor: "text-red-600",
      Icon: X,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="card">
          <div className="card-header flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="card-title">All Projects</h1>
              <p className="card-subtitle">View and Manage your projects</p>
            </div>

            <button
              onClick={() => setIsReportOpen(true)}
              className="btn-primary flex items-center space-x-2 mt-4 md:mt-0 "
            >
              <Plus className="w-5 h-5" />
              <span>Download Reports</span>
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {projectStats.map((item, index) => {
            return (
              <div key={index} className="card">
                <div className="flex items-center">
                  <div className={`p-3 ${item.bg} rounded-lg`}>
                    <item.Icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">
                      {item.title}
                    </p>
                    <p className="text-lg font-semibold text-slate-800">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FILTERS */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Projects
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full"
                placeholder="Search..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Status
              </label>
              <select
                className="input w-full"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Projects</option>
                <option value="pending">Pending Projects</option>
                <option value="approved">Approved Projects</option>
                <option value="rejected">Rejected Projects</option>
                <option value="completed">Completed Projects</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter Supervisor
              </label>
              <select
                className="input w-full"
                value={filterSupervisor}
                onChange={(e) => setFilterSupervisor(e.target.value)}
              >
                <option value="all">All Supervisors</option>

                {supervisors.map((supervisor) => {
                  return (
                    <option key={supervisor} value={supervisor}>
                      {supervisor}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Projects Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase
                    tracking-wider"
                  >
                    Project Details
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase
                    tracking-wider"
                  >
                    Student
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase
                    tracking-wider"
                  >
                    Supervisor
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase
                    tracking-wider"
                  >
                    Deadline
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase
                    tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase
                    tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {project.title}
                        </div>
                        <div className="text-sm text-slate-500 max-w-xs truncate">
                          {project.description}
                        </div>
                        <div className="text-xs text-slate-400">
                          Due:{" "}
                          {project.deadline
                            ? new Date(project.deadline).toLocaleDateString()
                            : "Not set"}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {project?.student?.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Last Updated:{" "}
                        {project?.updatedAt
                          ? new Date(project?.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                      {project.supervisor?.name ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {project.supervisor.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                      {project.deadline
                        ? new Date(project.deadline).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex capitalize items-center px-2.5 py-0.5 rounded-full text-xs
                        font-medium ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(project._id)}
                          className="btn-primary"
                        >
                          View
                        </button>
                        {project.status === "pending" && (
                          <>
                            <button
                              className="btn-secondary disabled:opacity-50"
                              disabled={busyId === project._id}
                              onClick={() =>
                                handleStatusChange(project._id, "approved")
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="btn-danger disabled:opacity-50"
                              disabled={busyId === project._id}
                              onClick={() =>
                                handleStatusChange(project._id, "rejected")
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No Projects found matching your criteria
            </div>
          )}
        </div>

        {/* View Modal */}
        {showViewModal && currentProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Project Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Title</label>
                  <div className="input bg-slate-50">
                    {currentProject?.title || "-"}
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <div className="input bg-slate-50">
                    {currentProject.description || "-"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Student</label>
                    <div className="input bg-slate-50">
                      {currentProject?.student?.name || "-"}
                    </div>
                  </div>

                  <div>
                    <label className="label">Supervisor</label>
                    <div className="input bg-slate-50">
                      {currentProject?.supervisor?.name || "-"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Status</label>
                    <div className="input bg-slate-50 capitalize">
                      {currentProject?.status || "-"}
                    </div>
                  </div>

                  <div>
                    <label className="label">Deadline</label>
                    <div className="input bg-slate-50">
                      {currentProject?.deadline
                        ? new Date(currentProject.deadline).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Files</label>
                  {(currentProject.files || []).length === 0 ? (
                    <div className="text-slate-500 text-sm">
                      No files uploaded
                    </div>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {currentProject.files.map((file) => (
                        <li
                          key={file._id || file.fileUrl}
                          className="flex items-center justify-between bg-slate-50 rounded p-2"
                        >
                          <span>{file.originalName}</span>
                          <button
                            className="btn-outline btn-small"
                            onClick={() =>
                              handleDownloadFile({
                                projectId: currentProject._id,
                                fileId: file._id,
                                originalName: file.originalName,
                              })
                            }
                          >
                            Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Report Modal */}
        {isReportOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  All Files
                </h3>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Search by file name, project title or student name"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                />
              </div>

              {filteredFiles.length === 0 ? (
                <div className="text-slate-500">
                  No files found matching your criteria
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((f) => {
                    return (
                      <div
                        key={`${f.projectId}-${f.fileId}`}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded"
                      >
                        <div>
                          <div className="font-medium text-slate-800">
                            {f.originalName}
                          </div>
                          <div className="text-sm text-slate-500">
                            {f.projectTitle} - {f.studentName}
                          </div>
                        </div>
                        <button
                          className="btn-outline btn-small"
                          onClick={() => handleDownloadFile(f)}
                        >
                          Download
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectsPage;
