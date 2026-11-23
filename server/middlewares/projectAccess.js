import { asyncHandler } from "./asyncHandler.js";
import ErrorHandler from "./error.js";
import { Project } from "../models/project.js";

/**
 * Runs BEFORE multer on the upload route: checks that the project exists,
 * belongs to the logged-in student and accepts files. Without this, multer
 * wrote files to disk for any project id before the controller rejected the
 * request, leaving orphaned files behind.
 */
export const authorizeProjectUpload = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }
  if (project.student.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("Not authorized to upload files for this project", 403),
    );
  }
  if (project.status === "rejected" || project.status === "completed") {
    return next(
      new ErrorHandler(`Cannot upload files to a ${project.status} project`, 400),
    );
  }

  req.project = project;
  next();
});
