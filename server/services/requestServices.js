import { SupervisorRequest } from "../models/supervisorRequest.js";
import ErrorHandler from "../middlewares/error.js";

export const createRequest = async (requestData) => {
  const existingRequest = await SupervisorRequest.findOne({
    student: requestData.student,
    supervisor: requestData.supervisor,
    status: "pending",
  });

  if (existingRequest) {
    throw new ErrorHandler(
      "You have already sent a request to this supervisor",
      400,
    );
  }

  const request = await SupervisorRequest.create(requestData);
  return await request.save();
};

export const getAllRequests = async (filters) => {
  const requests = await SupervisorRequest.find(filters)
    .populate("student", "name email")
    .populate("supervisor", "name email")
    .sort({ createdAt: -1 });

  const total = await SupervisorRequest.countDocuments(filters);
  return { requests, total };
};

export const acceptRequest = async (requestId, teacherId) => {
  const request = await SupervisorRequest.findById(requestId)
    .populate("student", "name email supervisor project")
    .populate("supervisor", "name email assignedStudents maxStudents");

  if (!request) throw new ErrorHandler("Request not Found", 404);
  if (request.supervisor._id.toString() !== teacherId.toString()) {
    throw new ErrorHandler("Not authorized to accept this request", 403);
  }
  if (request.status !== "pending") {
    throw new ErrorHandler("Request is already accepted or rejected", 400);
  }

  request.status = "accepted";
  await request.save();

  return request;
};
export const rejectRequest = async (requestId, teacherId) => {
  const request = await SupervisorRequest.findById(requestId)
    .populate("student", "name email")
    .populate("supervisor", "name email");

  if (!request) throw new ErrorHandler("Request not Found", 404);
  if (request.supervisor._id.toString() !== teacherId.toString()) {
    throw new ErrorHandler("Not authorized to reject this request", 403);
  }
  if (request.status !== "pending") {
    throw new ErrorHandler("Request is already accepted or rejected", 400);
  }

  request.status = "rejected";
  await request.save();

  return request;
};
