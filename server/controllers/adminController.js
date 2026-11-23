import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/user.js";
import { Project } from "../models/project.js";
import { SupervisorRequest } from "../models/supervisorRequest.js";
import * as userServices from "../services/userServices.js";
import * as projectServices from "../services/projectServices.js";
import * as notificationService from "../services/notificationServices.js";

const PROJECT_STATUSES = ["pending", "approved", "rejected", "completed"];

export const createStudent = asyncHandler(async (req, res, next) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password || !department) {
    return next(new ErrorHandler("All fields are required", 400));
  }
  const user = await userServices.createUser({
    name,
    email,
    password,
    role: "Student",
    department,
  });
  res.status(201).json({
    success: true,
    message: "Student created successfully",
    data: { user }, // toJSON removes the password hash
  });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const user = await userServices.updateUser(req.params.id, req.body, "Student");
  res.status(200).json({
    success: true,
    message: "Student updated successfully",
    data: { user },
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await userServices.deleteUser(req.params.id, "Student");
  res.status(200).json({
    success: true,
    message: "Student deleted successfully",
  });
});

export const createTeacher = asyncHandler(async (req, res, next) => {
  const { name, email, password, department, maxStudents, experties } =
    req.body;
  const expertise = userServices.normalizeExpertise(experties);
  const capacity = Number(maxStudents);

  if (!name || !email || !password || !department || expertise.length === 0) {
    return next(new ErrorHandler("All fields are required", 400));
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    return next(new ErrorHandler("Max students must be a whole number of at least 1", 400));
  }

  const user = await userServices.createUser({
    name,
    email,
    password,
    role: "Teacher",
    department,
    maxStudents: capacity,
    experties: expertise,
  });
  res.status(201).json({
    success: true,
    message: "Teacher created successfully",
    data: { user },
  });
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const user = await userServices.updateUser(req.params.id, req.body, "Teacher");
  res.status(200).json({
    success: true,
    message: "Teacher updated successfully",
    data: { user },
  });
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  await userServices.deleteUser(req.params.id, "Teacher");
  res.status(200).json({
    success: true,
    message: "Teacher deleted successfully",
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userServices.getAllUsers();
  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: { users },
  });
});

export const assignSupervisor = asyncHandler(async (req, res, next) => {
  const { studentId, supervisorId } = req.body;

  if (!studentId || !supervisorId) {
    return next(
      new ErrorHandler("Student ID and Supervisor ID are required", 400),
    );
  }

  // Use the student's *latest* project (findOne without sort could pick an old one).
  const project = await projectServices.getProjectByStudentId(studentId);

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }
  if (project.status !== "approved") {
    return next(
      new ErrorHandler("Project must be approved before assigning a supervisor", 400),
    );
  }
  if (project.supervisor) {
    return next(new ErrorHandler("Supervisor already assigned", 400));
  }

  // Capacity-checked, race-safe assignment; also updates the project.
  const { student, supervisor } = await userServices.assignSupervisorDirectly(
    studentId,
    supervisorId,
  );

  await Promise.all([
    notificationService.notifyUser(
      studentId,
      `You have been assigned a supervisor: ${supervisor.name}`,
      "approval",
      "/student/supervisor",
      "low",
    ),
    notificationService.notifyUser(
      supervisorId,
      `The student ${student.name} has been assigned to you`,
      "general",
      "/teacher/assigned-students",
      "low",
    ),
  ]);

  res.status(200).json({
    success: true,
    message: "Supervisor assigned",
    data: { student, supervisor },
  });
});

export const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await projectServices.getAllProjects();
  res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    data: { projects },
  });
});

export const getDashBoardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalProjects,
    pendingRequests,
    completedProjects,
    pendingProjects,
  ] = await Promise.all([
    User.countDocuments({ role: "Student" }),
    User.countDocuments({ role: "Teacher" }),
    Project.countDocuments(),
    SupervisorRequest.countDocuments({ status: "pending" }),
    Project.countDocuments({ status: "completed" }),
    Project.countDocuments({ status: "pending" }),
  ]);
  res.status(200).json({
    success: true,
    message: "Dashboard stats fetched successfully",
    data: {
      stats: {
        totalStudents,
        totalTeachers,
        totalProjects,
        pendingRequests,
        completedProjects,
        pendingProjects,
      },
    },
  });
});

export const getProject = asyncHandler(async (req, res) => {
  // Route is Admin-only (see adminRoutes), so no extra ownership check needed.
  const project = await projectServices.getProjectById(req.params.id);
  res.status(200).json({
    success: true,
    data: { project },
  });
});

/**
 * Admin edits a project (approve / reject / edit details). Only whitelisted
 * fields are applied: passing req.body straight through allowed overwriting
 * `student`, `files`, `feedback` or `supervisor` and corrupting the
 * student <-> supervisor bookkeeping.
 */
export const updatedProjectServices = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, status, deadline } = req.body;

  const existing = await Project.findById(id);
  if (!existing) {
    return next(new ErrorHandler("Project not found", 404));
  }

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (deadline !== undefined) updates.deadline = deadline || null;
  if (status !== undefined) {
    if (!PROJECT_STATUSES.includes(status)) {
      return next(new ErrorHandler(`Invalid status: ${status}`, 400));
    }
    updates.status = status;
  }

  const updatedProject = await projectServices.updateProject(id, updates);

  if (status && status !== existing.status) {
    const messages = {
      approved: `Your project proposal "${updatedProject.title}" has been approved. You can now request a supervisor.`,
      rejected: `Your project proposal "${updatedProject.title}" was rejected. You can submit a new proposal.`,
      completed: `Your project "${updatedProject.title}" has been marked as completed.`,
      pending: `Your project "${updatedProject.title}" is back under review.`,
    };
    await notificationService.notifyUser(
      existing.student,
      messages[status],
      status === "approved" ? "approval" : status === "rejected" ? "rejection" : "general",
      "/student",
      status === "rejected" ? "high" : "medium",
    );
  }

  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: { project: updatedProject },
  });
});
