import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/user.js";
import { Project } from "../models/project.js";
import { Notification } from "../models/notification.js";
import { Deadline } from "../models/deadline.js";
import * as projectServices from "../services/projectServices.js";
import * as requestService from "../services/requestServices.js";
import * as notificationService from "../services/notificationServices.js";
import * as fileServices from "../services/fileServices.js";

export const getStudentProject = asyncHandler(async (req, res) => {
  const project = await projectServices.getProjectByStudentId(req.user._id);

  if (!project) {
    return res.status(200).json({
      success: true,
      data: { project: null },
      message: "You don't have any project",
    });
  }

  return res.status(200).json({
    success: true,
    data: { project },
  });
});

export const submitProposal = asyncHandler(async (req, res, next) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  const studentId = req.user._id;

  if (!title || !description) {
    return next(
      new ErrorHandler("Project title and description are required", 400),
    );
  }

  const existingProject =
    await projectServices.getProjectByStudentId(studentId);

  if (existingProject && existingProject.status !== "rejected") {
    return next(
      new ErrorHandler(
        "You already have a project. You can only submit a new proposal if your previous project was rejected.",
        400,
      ),
    );
  }

  if (existingProject) {
    // Replace the rejected proposal: also remove its files and deadlines.
    await fileServices.removeProjectFiles(existingProject);
    await Deadline.deleteMany({ project: existingProject._id });
    await Project.findByIdAndDelete(existingProject._id);
  }

  const project = await projectServices.createProject({
    student: studentId,
    title,
    description,
    supervisor: req.user.supervisor || null,
  });

  // The schema field is `project` (the old code wrote a non-existent `projectId`).
  await User.findByIdAndUpdate(studentId, { project: project._id });

  return res.status(201).json({
    success: true,
    data: { project },
    message: "Project proposal submitted successfully",
  });
});

export const uploadFiles = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  if (!req.files || req.files.length === 0) {
    return next(new ErrorHandler("Please upload at least one file", 400));
  }

  try {
    const updatedProject = await projectServices.addFilesToProject(
      projectId,
      req.files,
    );

    return res.status(200).json({
      success: true,
      data: { project: updatedProject },
      message: "Files uploaded successfully",
    });
  } catch (error) {
    // Don't leave files on disk that are not referenced by the project.
    await fileServices.removeUploadedFiles(req.files);
    throw error;
  }
});

export const getAvailableSupervisors = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "Teacher" })
    .select("name email department experties maxStudents assignedStudents")
    .sort({ name: 1 })
    .lean();

  // Send capacity info but not the ids of other students.
  const supervisors = teachers.map(({ assignedStudents = [], ...teacher }) => ({
    ...teacher,
    assignedCount: assignedStudents.length,
    isFull: assignedStudents.length >= (teacher.maxStudents || 0),
  }));

  res.status(200).json({
    success: true,
    data: { supervisors },
    message: "Available Supervisors fetched successfully",
  });
});

export const getSupervisor = asyncHandler(async (req, res) => {
  const student = await User.findById(req.user._id).populate(
    "supervisor",
    "name email department experties",
  );

  if (!student?.supervisor) {
    return res.status(200).json({
      success: true,
      data: { supervisor: null },
      message: "You don't have any supervisor",
    });
  }

  return res.status(200).json({
    success: true,
    data: { supervisor: student.supervisor },
  });
});

export const requestSupervisor = asyncHandler(async (req, res, next) => {
  const student = req.user;
  const { teacherId } = req.body;
  const message = req.body.message?.trim();

  if (!teacherId || !message) {
    return next(new ErrorHandler("Supervisor and message are required", 400));
  }

  if (student.supervisor) {
    return next(new ErrorHandler("You already have a supervisor", 400));
  }

  const project = await projectServices.getProjectByStudentId(student._id);
  if (!project || project.status === "rejected") {
    return next(
      new ErrorHandler(
        "Submit a project proposal before requesting a supervisor",
        400,
      ),
    );
  }

  const supervisor = await User.findById(teacherId);

  if (!supervisor || supervisor.role !== "Teacher") {
    return next(new ErrorHandler("Invalid supervisor", 400));
  }

  if ((supervisor.assignedStudents?.length || 0) >= supervisor.maxStudents) {
    return next(new ErrorHandler("This supervisor is already full", 400));
  }

  const request = await requestService.createRequest({
    student: student._id,
    supervisor: teacherId,
    message,
  });

  await notificationService.notifyUser(
    teacherId,
    `New supervisor request from ${student.name}`,
    "request",
    "/teacher/pending-requests",
    "medium",
  );

  return res.status(201).json({
    success: true,
    data: { request },
    message: "Supervisor request sent successfully",
  });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const now = new Date();

  const [project, upcomingDeadlines, topNotifications] = await Promise.all([
    Project.findOne({ student: studentId })
      .sort({ createdAt: -1 })
      .populate("supervisor", "name")
      .lean(),
    Project.find({ student: studentId, deadline: { $gte: now } })
      .select("title description deadline")
      .sort({ deadline: 1 })
      .limit(3)
      .lean(),
    Notification.find({ user: studentId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  // Newest first; the dashboard shows the first two.
  const feedbackNotifications = [...(project?.feedback || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 2);

  res.status(200).json({
    success: true,
    data: {
      project,
      upcomingDeadlines,
      topNotifications,
      feedbackNotifications,
      supervisorName: project?.supervisor?.name || null,
    },
    message: "Dashboard stats fetched successfully",
  });
});

export const getFeedback = asyncHandler(async (req, res, next) => {
  const studentId = req.user._id;
  const { projectId } = req.params;
  const project = await projectServices.getProjectById(projectId);

  if (project.student?._id.toString() !== studentId.toString()) {
    return next(
      new ErrorHandler("You are not authorized to access this project", 403),
    );
  }

  const sortedFeedback = [...project.feedback]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((f) => ({
      _id: f._id,
      title: f.title,
      message: f.message,
      type: f.type,
      createdAt: f.createdAt,
      // supervisorId is null if that teacher account was deleted
      supervisorName: f.supervisorId?.name || "Former supervisor",
      supervisorEmail: f.supervisorId?.email || null,
    }));

  res.status(200).json({
    success: true,
    data: { feedback: sortedFeedback },
    message: "Feedback fetched successfully",
  });
});

export const downloadFile = asyncHandler(async (req, res, next) => {
  const { projectId, fileId } = req.params;
  const project = await projectServices.getProjectById(projectId);

  if (project.student?._id.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler(
        "You are not authorized to download files from this project",
        403,
      ),
    );
  }

  const file = project.files.id(fileId);
  if (!file) {
    return next(new ErrorHandler("File not found", 404));
  }

  fileServices.streamDownload(file.fileUrl, res, file.originalName, next);
});
