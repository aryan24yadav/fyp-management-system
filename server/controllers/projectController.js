import * as projectServices from "../services/projectServices.js";
import * as fileServices from "../services/fileServices.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await projectServices.getAllProjects();
  res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    data: { projects },
  });
});

/** Shared download endpoint: Admin, the project's student or its supervisor. */
export const downloadFile = asyncHandler(async (req, res, next) => {
  const { projectId, fileId } = req.params;
  const user = req.user;

  const project = await projectServices.getProjectById(projectId);

  const userId = user._id.toString();
  const hasAccess =
    user.role === "Admin" ||
    project.student?._id.toString() === userId ||
    project.supervisor?._id.toString() === userId;

  if (!hasAccess) {
    return next(
      new ErrorHandler(
        "Not authorized to download files from this project",
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
