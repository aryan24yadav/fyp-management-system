import { asyncHandler } from "../middlewares/asyncHandler.js";
import { User } from "../models/user.js";
import { getProjectByStudentId } from "./projectServices.js";
import { Project } from "../models/project.js";
import ErrorHandler from "../middlewares/error.js";

export const createUser = async (userData) => {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    throw new Error("error creating user : " + error.message);
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
    return user;
  } catch (error) {
    throw new Error("error updating user : " + error.message);
  }
};

export const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );
    return user;
  } catch (error) {
    throw new Error("error fetching user : " + error.message);
  }
};

export const deleteUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      // fix
      // throw new Error("User not found",404);
      throw new ErrorHandler("User not found", 404);
    }
    return await user.deleteOne();
  } catch (error) {
    throw new Error("error deleting user : " + error.message);
  }
};

export const getAllUsers = async () => {
  const query = { role: { $ne: "Admin" } };
  try {
    const users = await User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 });
    return users;
  } catch (error) {
    throw new Error("error fetching users : " + error.message);
  }
};

export const assignSupervisorDirectly = async (studentId, supervisorId) => {
  const student = await User.findOne({ _id: studentId, role: "Student" });
  const supervisor = await User.findOne({ _id: supervisorId, role: "Teacher" });
  if (!student || !supervisor) {
    throw new Error("Student or Supervisor not Found");
  }
  if (!supervisor.hasCapacity()) {
    throw new Error("Supervisor has reached maximum student capacity");
  }

  student.supervisor = supervisorId;
  supervisor.assignedStudents.push(studentId);
  await Promise.all([student.save(), supervisor.save()]);
  return { student, supervisor };
};
