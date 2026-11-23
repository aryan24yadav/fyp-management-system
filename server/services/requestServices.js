import { SupervisorRequest } from "../models/supervisorRequest.js";
import { Project } from "../models/project.js";
import ErrorHandler from "../middlewares/error.js";
import { assignSupervisorDirectly } from "./userServices.js";

const DUPLICATE_MESSAGE = "You have already sent a request to this supervisor";

export const createRequest = async (requestData) => {
  const existingRequest = await SupervisorRequest.exists({
    student: requestData.student,
    supervisor: requestData.supervisor,
    status: "pending",
  });
  if (existingRequest) {
    throw new ErrorHandler(DUPLICATE_MESSAGE, 400);
  }

  try {
    // create() already saves; the extra save() call that was here wrote twice.
    return await SupervisorRequest.create(requestData);
  } catch (error) {
    if (error?.code === 11000) throw new ErrorHandler(DUPLICATE_MESSAGE, 400);
    throw error;
  }
};

export const getAllRequests = async (filters) => {
  const [requests, total] = await Promise.all([
    SupervisorRequest.find(filters)
      .populate("student", "name email")
      .populate("supervisor", "name email")
      .sort({ createdAt: -1 }),
    SupervisorRequest.countDocuments(filters),
  ]);
  return { requests, total };
};

const loadPendingRequestFor = async (requestId, teacherId, action) => {
  const request = await SupervisorRequest.findById(requestId)
    .populate("student", "name email")
    .populate("supervisor", "name email");

  if (!request) throw new ErrorHandler("Request not found", 404);
  if (
    !request.supervisor ||
    request.supervisor._id.toString() !== teacherId.toString()
  ) {
    throw new ErrorHandler(`Not authorized to ${action} this request`, 403);
  }
  if (!request.student) {
    throw new ErrorHandler("The student of this request no longer exists", 404);
  }
  if (request.status !== "pending") {
    throw new ErrorHandler(`Request is already ${request.status}`, 400);
  }
  return request;
};

/**
 * Accepting a request now actually assigns the supervisor. Before, it only
 * tried to set status "accepted" (not in the schema enum, so it always failed
 * validation) and never linked the student to the teacher.
 */
export const acceptRequest = async (requestId, teacherId) => {
  const request = await loadPendingRequestFor(requestId, teacherId, "accept");

  const project = await Project.findOne({ student: request.student._id }).sort({
    createdAt: -1,
  });
  if (!project || project.status !== "approved") {
    throw new ErrorHandler(
      "The student's project must be approved by the admin before you can accept this request",
      400,
    );
  }

  // Assigns student <-> teacher (capacity-checked), updates the project and
  // marks this request "approved" / other pending requests "rejected".
  await assignSupervisorDirectly(request.student._id, teacherId);

  request.status = "approved";
  return request;
};

export const rejectRequest = async (requestId, teacherId) => {
  const request = await loadPendingRequestFor(requestId, teacherId, "reject");
  request.status = "rejected";
  await request.save();
  return request;
};
