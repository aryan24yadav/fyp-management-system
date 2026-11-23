import { User } from "../models/user.js";
import { Project } from "../models/project.js";
import { SupervisorRequest } from "../models/supervisorRequest.js";
import { Notification } from "../models/notification.js";
import { Deadline } from "../models/deadline.js";
import ErrorHandler from "../middlewares/error.js";
import { removeProjectFiles } from "./fileServices.js";
import { notifyUser } from "./notificationServices.js";

/** Accepts ["AI", "ML"], "AI, ML" or "AI" and returns a clean string array. */
export const normalizeExpertise = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

/** Fields an Admin may edit, per role. Everything else in the body is ignored. */
const UPDATABLE_FIELDS = {
  Student: ["name", "email", "department"],
  Teacher: ["name", "email", "department", "experties", "maxStudents"],
  Admin: ["name", "email", "department"],
};

// Errors are NOT wrapped in a generic Error any more: that hid the HTTP status
// (404/409/400) and turned validation and duplicate-email errors into 500s.
export const createUser = async (userData) => {
  return await User.create(userData);
};

/**
 * Updates a user with a field whitelist and runs it through save(), so the
 * pre-save hook hashes a new password (findByIdAndUpdate stored it in plain
 * text before) and schema validators run.
 */
export const updateUser = async (userId, updateData = {}, expectedRole) => {
  const user = await User.findById(userId);
  if (!user || (expectedRole && user.role !== expectedRole)) {
    throw new ErrorHandler(`${expectedRole || "User"} not found`, 404);
  }

  for (const field of UPDATABLE_FIELDS[user.role] || []) {
    if (updateData[field] === undefined) continue;
    if (field === "experties") {
      user.experties = normalizeExpertise(updateData.experties);
    } else if (field === "maxStudents") {
      user.maxStudents = Number(updateData.maxStudents);
    } else {
      user[field] = updateData[field];
    }
  }

  if (updateData.password) {
    user.password = updateData.password; // hashed by the pre-save hook
  }

  if (
    user.role === "Teacher" &&
    user.maxStudents < (user.assignedStudents?.length || 0)
  ) {
    throw new ErrorHandler(
      `Max students cannot be lower than the ${user.assignedStudents.length} students already assigned`,
      400,
    );
  }

  await user.save();
  return user;
};

export const getUserById = async (userId) => {
  return await User.findById(userId);
};

/**
 * Deletes a user and cleans up everything that references them, so no
 * dangling ids are left behind (those caused crashes like
 * "Cannot read properties of null (reading '_id')").
 */
export const deleteUser = async (userId, expectedRole) => {
  const user = await User.findById(userId);
  if (!user || (expectedRole && user.role !== expectedRole)) {
    throw new ErrorHandler(`${expectedRole || "User"} not found`, 404);
  }

  if (user.role === "Student") {
    const projects = await Project.find({ student: user._id });
    await Promise.all(projects.map((p) => removeProjectFiles(p)));
    const projectIds = projects.map((p) => p._id);

    await Promise.all([
      Deadline.deleteMany({ project: { $in: projectIds } }),
      Project.deleteMany({ student: user._id }),
      SupervisorRequest.deleteMany({ student: user._id }),
      User.updateMany(
        { assignedStudents: user._id },
        { $pull: { assignedStudents: user._id } },
      ),
    ]);
  }

  if (user.role === "Teacher") {
    const students = await User.find({ supervisor: user._id }).select("_id");

    await Promise.all([
      User.updateMany({ supervisor: user._id }, { $set: { supervisor: null } }),
      Project.updateMany(
        { supervisor: user._id },
        { $set: { supervisor: null } },
      ),
      SupervisorRequest.deleteMany({ supervisor: user._id }),
    ]);

    await Promise.all(
      students.map((s) =>
        notifyUser(
          s._id,
          `Your supervisor ${user.name} has been removed. Please request a new supervisor.`,
          "system",
          "/student/supervisor",
          "high",
        ),
      ),
    );
  }

  await Notification.deleteMany({ user: user._id });
  await user.deleteOne();
  return user;
};

export const getAllUsers = async () => {
  return await User.find({ role: { $ne: "Admin" } }).sort({ createdAt: -1 });
};

/**
 * Links a student and a teacher. Uses conditional atomic updates so two
 * concurrent requests cannot over-fill a teacher or give a student two
 * supervisors. Also updates the student's project(s) and closes any other
 * pending supervisor requests of the student.
 */
export const assignSupervisorDirectly = async (studentId, supervisorId) => {
  const supervisorExists = await User.exists({
    _id: supervisorId,
    role: "Teacher",
  });
  if (!supervisorExists) {
    throw new ErrorHandler("Supervisor not found", 404);
  }

  // 1) Claim the student only if they have no supervisor yet.
  const student = await User.findOneAndUpdate(
    { _id: studentId, role: "Student", supervisor: null },
    { $set: { supervisor: supervisorId } },
    { returnDocument: "after" },
  );
  if (!student) {
    const studentExists = await User.exists({ _id: studentId, role: "Student" });
    throw studentExists
      ? new ErrorHandler("Student already has a supervisor", 400)
      : new ErrorHandler("Student not found", 404);
  }

  // 2) Add the student to the teacher only while the teacher has capacity.
  const supervisor = await User.findOneAndUpdate(
    {
      _id: supervisorId,
      role: "Teacher",
      $expr: {
        $lt: [{ $size: { $ifNull: ["$assignedStudents", []] } }, "$maxStudents"],
      },
    },
    { $addToSet: { assignedStudents: student._id } },
    { returnDocument: "after" },
  );
  if (!supervisor) {
    // Roll back step 1.
    await User.updateOne({ _id: student._id }, { $set: { supervisor: null } });
    throw new ErrorHandler(
      "Supervisor has reached maximum student capacity",
      400,
    );
  }

  await Promise.all([
    Project.updateMany(
      { student: student._id, status: { $ne: "rejected" } },
      { $set: { supervisor: supervisor._id } },
    ),
    // The request to this supervisor (if any) is now approved...
    SupervisorRequest.updateMany(
      { student: student._id, supervisor: supervisor._id, status: "pending" },
      { $set: { status: "approved" } },
    ),
    // ...and requests to other supervisors are no longer relevant.
    SupervisorRequest.updateMany(
      {
        student: student._id,
        supervisor: { $ne: supervisor._id },
        status: "pending",
      },
      { $set: { status: "rejected" } },
    ),
  ]);

  return { student, supervisor };
};
