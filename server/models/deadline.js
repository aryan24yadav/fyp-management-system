import mongoose from "mongoose";

const deadlineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Deadline name is required"],
      trim: true,
      maxlength: [100, "Deadline name cannot exceed 100 characters"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due Date is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator Id is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
deadlineSchema.index({ dueDate: 1 });
deadlineSchema.index({ project: 1 });
deadlineSchema.index({ createdBy: 1 });

export const Deadline =
  mongoose.models.Deadline || mongoose.model("Deadline", deadlineSchema);
