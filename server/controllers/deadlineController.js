import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Deadline } from "../models/deadline.js";
import { getProjectById, updateProject } from "../services/projectServices.js";
import { notifyUser } from "../services/notificationServices.js";

/** Creates the project's deadline, or updates it if one already exists. */
export const createDeadline = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, dueDate } = req.body;

  if (!dueDate) {
    return next(new ErrorHandler("Please provide the due date", 400));
  }

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return next(new ErrorHandler("Due date is not a valid date", 400));
  }
  // A date-only value ("YYYY-MM-DD") is parsed as UTC midnight, so allow one
  // day of slack to avoid rejecting "today" for users in other time zones.
  if (due.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    return next(new ErrorHandler("Due date cannot be in the past", 400));
  }

  const project = await getProjectById(id); // throws 404 if missing

  if (project.status === "completed") {
    return next(new ErrorHandler("Project is already completed", 400));
  }
  if (project.status !== "approved") {
    return next(new ErrorHandler("Project is not approved", 400));
  }

  // Deadline.name is limited to 100 chars, project titles to 200.
  const deadlineName = String(name || project.title).trim().slice(0, 100);

  // One deadline per project: "Create/Update" now updates instead of piling up duplicates.
  const deadline = await Deadline.findOneAndUpdate(
    { project: project._id },
    { name: deadlineName, dueDate: due, createdBy: req.user._id },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  ).populate("createdBy", "name email");

  const updatedProject = await updateProject(project._id, { deadline: due });

  if (project.student) {
    await notifyUser(
      project.student._id,
      `Your project deadline has been set to ${due.toDateString()}`,
      "deadline",
      "/student",
      "medium",
    );
  }

  return res.status(201).json({
    success: true,
    message: "Deadline saved successfully",
    data: { deadline, project: updatedProject },
  });
});
