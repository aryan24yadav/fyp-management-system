import mongoose from "mongoose";

const supervisorRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student Id is required"],
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supervisor Id is required"],
    },
    message: {
      type: String,
      trim: true,
      required: [true, "Message is required"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
supervisorRequestSchema.index({ student: 1, status: 1 });
supervisorRequestSchema.index({ supervisor: 1, status: 1 });
supervisorRequestSchema.index({ status: 1 });
// A student can have at most ONE pending request per supervisor. Enforced by
// the database so two simultaneous clicks cannot create duplicates.
supervisorRequestSchema.index(
  { student: 1, supervisor: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export const SupervisorRequest =
  mongoose.models.SupervisorRequest ||
  mongoose.model("SupervisorRequest", supervisorRequestSchema);
