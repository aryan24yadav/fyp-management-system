import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/user.js";
import { Project } from "../models/project.js";
import { Notification } from "../models/notification.js";
import { SupervisorRequest } from "../models/supervisorRequest.js";
import * as projectServices from "../services/projectServices.js";
import * as requestServices from "../services/requestServices.js";
import * as notificationServices from "../services/notificationServices.js";
import * as fileServices from "../services/fileServices.js";
import { trySendEmail } from "../services/emailServices.js";
import {
  generateRequestAcceptedTemplate,
  generateRequestRejectedTemplate,
} from "../utils/emailTemplates.js";

const FEEDBACK_TYPES = ["positive", "general", "negative"];
const REQUEST_STATUSES = ["pending", "approved", "rejected"];

/** Throws 403 unless the logged-in teacher supervises this project. */
const assertSupervisorOf = (project, teacherId, action) => {
  // project.supervisor is null when no supervisor is assigned yet; the old
  // code crashed here with "Cannot read properties of null (reading '_id')".
  if (
    !project.supervisor ||
    project.supervisor._id.toString() !== teacherId.toString()
  ) {
    throw new ErrorHandler(`Not authorized to ${action} for this project`, 403);
  }
};

export const getTeacherDashboardStats = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  const [
    totalPendingRequests,
    completedProjects,
    totalAssignedStudents,
    recentNotifications,
  ] = await Promise.all([
    SupervisorRequest.countDocuments({ supervisor: teacherId, status: "pending" }),
    Project.countDocuments({ supervisor: teacherId, status: "completed" }),
    User.countDocuments({ supervisor: teacherId, role: "Student" }),
    Notification.find({ user: teacherId }).sort({ createdAt: -1 }).limit(5),
  ]);

  res.status(200).json({
    success: true,
    message: "Teacher stats fetched successfully",
    data: {
      dashboardStats: {
        totalPendingRequests,
        completedProjects,
        totalAssignedStudents,
        recentNotifications,
      },
    },
  });
});

export const getRequests = asyncHandler(async (req, res) => {
  // Always scoped to the logged-in teacher. Previously the supervisor id came
  // from the query string, so any teacher could read every request.
  const filters = { supervisor: req.user._id };
  if (REQUEST_STATUSES.includes(req.query.status)) {
    filters.status = req.query.status;
  }

  const { requests, total } = await requestServices.getAllRequests(filters);

  // One query for all students' latest projects instead of one per request.
  const studentIds = requests.map((r) => r.student?._id).filter(Boolean);
  const projects = await Project.find({ student: { $in: studentIds } })
    .sort({ createdAt: -1 })
    .lean();
  const latestByStudent = new Map();
  for (const project of projects) {
    const key = project.student.toString();
    if (!latestByStudent.has(key)) latestByStudent.set(key, project);
  }

  const updatedRequests = requests.map((reqDoc) => {
    const requestObj = reqDoc.toObject();
    const key = requestObj.student?._id?.toString();
    return { ...requestObj, latestProject: latestByStudent.get(key) || null };
  });

  res.status(200).json({
    success: true,
    message: "Requests fetched successfully",
    data: { requests: updatedRequests, total },
  });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await requestServices.acceptRequest(requestId, req.user._id);

  await notificationServices.notifyUser(
    request.student._id,
    `Congratulations! Your supervisor request has been accepted by ${req.user.name}`,
    "approval",
    "/student/supervisor",
    "low",
  );

  // E-mail is best effort: the request is already accepted at this point.
  await trySendEmail({
    to: request.student.email,
    subject: "FYP SYSTEM - Supervisor Request Accepted",
    message: generateRequestAcceptedTemplate(req.user.name),
  });

  res.status(200).json({
    success: true,
    message: "Request accepted successfully",
    data: { request },
  });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await requestServices.rejectRequest(requestId, req.user._id);

  await notificationServices.notifyUser(
    request.student._id,
    `Your supervisor request has been rejected by ${req.user.name}. You can request another supervisor.`,
    "rejection",
    "/student/supervisor",
    "medium",
  );

  await trySendEmail({
    to: request.student.email,
    subject: "FYP SYSTEM - Supervisor Request Rejected",
    message: generateRequestRejectedTemplate(req.user.name),
  });

  res.status(200).json({
    success: true,
    message: "Request rejected successfully",
    data: { request },
  });
});

export const getAssignedStudents = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  const students = await User.find({ supervisor: teacherId, role: "Student" })
    .sort({ createdAt: -1 })
    .lean();

  // Attach each student's latest project. This does not depend on
  // User.project being set (older accounts don't have it); the old
  // populate("project") threw because the field was missing from the schema.
  const projects = await Project.find({
    student: { $in: students.map((s) => s._id) },
  })
    .sort({ createdAt: -1 })
    .lean();
  const latestByStudent = new Map();
  for (const project of projects) {
    const key = project.student.toString();
    if (!latestByStudent.has(key)) latestByStudent.set(key, project);
  }

  // password / reset-token fields are `select: false`, so lean() omits them.
  const result = students.map((student) => ({
    ...student,
    project: latestByStudent.get(student._id.toString()) || null,
  }));

  res.status(200).json({
    success: true,
    data: {
      students: result,
      total: result.length,
    },
  });
});

export const markComplete = asyncHandler(async (req, res, next) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;

  const project = await projectServices.getProjectById(projectId);
  assertSupervisorOf(project, teacherId, "mark complete");

  if (project.status === "completed") {
    return next(new ErrorHandler("Project is already completed", 400));
  }
  if (project.status !== "approved") {
    return next(
      new ErrorHandler("Only approved projects can be marked as completed", 400),
    );
  }

  const updatedProject = await projectServices.markComplete(projectId);

  await notificationServices.notifyUser(
    project.student?._id,
    `Your project has been marked as completed by ${req.user.name}`,
    "general",
    "/student",
    "low",
  );

  res.status(200).json({
    success: true,
    data: {
      project: updatedProject,
    },
    message: "Project marked as completed",
  });
});

export const addFeedback = asyncHandler(async (req, res, next) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;
  const title = req.body.title?.trim();
  const message = req.body.message?.trim();
  const type = FEEDBACK_TYPES.includes(req.body.type) ? req.body.type : "general";

  if (!message || !title) {
    return next(
      new ErrorHandler("Feedback title and message are required", 400),
    );
  }

  const project = await projectServices.getProjectById(projectId);
  assertSupervisorOf(project, teacherId, "add feedback");

  const { project: updatedProject, latestFeedback } =
    await projectServices.addFeedback(projectId, teacherId, message, title, type);

  await notificationServices.notifyUser(
    project.student?._id,
    `Feedback added to your project by ${req.user.name}`,
    "feedback",
    "/student/feedback",
    type === "negative" ? "high" : "low",
  );

  res.status(201).json({
    success: true,
    message: "Feedback posted successfully",
    data: { project: updatedProject, feedback: latestFeedback },
  });
});

export const getFiles = asyncHandler(async (req, res) => {
  const projects = await projectServices.getProjectsBySupervisor(req.user._id);

  const allFiles = projects.flatMap((project) =>
    project.files.map((file) => ({
      ...file.toObject(),
      projectId: project._id,
      projectTitle: project.title,
      studentName: project.student?.name || "Unknown student",
      studentEmail: project.student?.email || null,
    })),
  );

  res.status(200).json({
    success: true,
    message: "Files fetched",
    data: {
      files: allFiles,
    },
  });
});

export const downloadFile = asyncHandler(async (req, res, next) => {
  const { projectId, fileId } = req.params;

  const project = await projectServices.getProjectById(projectId);
  assertSupervisorOf(project, req.user._id, "download files");

  const file = project.files.id(fileId);
  if (!file) {
    return next(new ErrorHandler("File not found", 404));
  }

  fileServices.streamDownload(file.fileUrl, res, file.originalName, next);
});
