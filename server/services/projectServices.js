import { Project } from "../models/project.js";
import ErrorHandler from "../middlewares/error.js";
import { toStoredPath } from "./fileServices.js";

export const getProjectByStudentId = async (studentId) => {
  return await Project.findOne({ student: studentId }).sort({ createdAt: -1 });
};

export const createProject = async (projectData) => {
  return await Project.create(projectData);
};

export const getProjectById = async (id) => {
  const project = await Project.findById(id)
    .populate("student", "name email")
    .populate("supervisor", "name email")
    .populate("feedback.supervisorId", "name email");

  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }

  return project;
};

export const addFilesToProject = async (projectId, files) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }

  const fileMetaData = files.map((file) => ({
    originalName: file.originalname,
    fileUrl: toStoredPath(file.path), // portable relative path
    fileType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  }));

  project.files.push(...fileMetaData);
  await project.save();
  return project;
};

export const getAllProjects = async (filters = {}) => {
  return await Project.find(filters)
    .populate("student", "name email department")
    .populate("supervisor", "name email department")
    .sort({ createdAt: -1 });
};

export const markComplete = async (projectId) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { status: "completed" },
    { returnDocument: "after", runValidators: true },
  )
    .populate("student", "name email")
    .populate("supervisor", "name email");

  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }

  return project;
};

export const addFeedback = async (
  projectId,
  supervisorId,
  message,
  title,
  type,
) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }

  project.feedback.push({
    supervisorId,
    message,
    title,
    type,
  });

  await project.save();
  await project.populate("feedback.supervisorId", "name email");
  const latestFeedback = project.feedback[project.feedback.length - 1];
  return { project, latestFeedback };
};

export const getProjectsBySupervisor = async (supervisorId) => {
  // Previously the filter was silently ignored and ALL projects were returned.
  return await getAllProjects({ supervisor: supervisorId });
};

export const updateProject = async (id, updatedData) => {
  const project = await Project.findByIdAndUpdate(id, updatedData, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate("student", "name email department")
    .populate("supervisor", "name email department");

  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }

  return project;
};
