import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Feedback cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: ["positive", "general", "negative"],
      default: "general",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Feedback title cannot exceed 200 characters"],
    },
  },
  { timestamps: true },
);

const projectSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student Id is required"],
    },
    title: {
      type: String,
      trim: true,
      required: [true, "Project Title is required"],
      maxlength: [200, "Project Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Description is required"],
      maxlength: [1000, "Project Description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    files: [
      {
        originalName: {
          type: String,
          required: true,
        },
        // Path relative to the server folder, e.g. "uploads/projects/<id>/<file>"
        // (older records may contain an absolute path; see fileServices).
        fileUrl: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          default: 0,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    feedback: [feedbackSchema],
    deadline: {
      type: Date,
    },
  },
  {
    // createdAt / updatedAt are managed automatically.
    timestamps: true,
  },
);

// Indexes for the most common queries
projectSchema.index({ student: 1, createdAt: -1 });
projectSchema.index({ supervisor: 1 });
projectSchema.index({ status: 1 });

export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
