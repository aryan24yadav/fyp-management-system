import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Deadline } from "../models/deadline.js";
import { Project } from "../models/project.js";
import { getProjectById } from "../services/projectServices.js";

export const createDeadline = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, dueDate } = req.body;

  if (!name || !dueDate) {
    return next(
      new ErrorHandler("Please provide all the required fields", 400),
    );
  }

  const project = await getProjectById(id);
  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  if (project.status === "completed") {
    return next(new ErrorHandler("project is already completed", 400));
  }

  if (project.status !== "approved") {
    return next(new ErrorHandler("project is not approved", 400));
  }

  const deadlineData = {
    name,
    dueDate: new Date(dueDate),
    createdBy: req.user._id,
    project: project || null,
  };

  const deadline = await Deadline.create(deadlineData);

  await deadline.populate([{ path: "createdBy", select: "name email" }]);

  if (project) {
    await Project.findByIdAndUpdate(
      project._id,
      { deadline: dueDate },
      { new: true, runValidators: true },
    );
  }

  return res.status(201).json({
    success: true,
    message: "Deadline created successfully",
    data: { deadline },
  });
});
