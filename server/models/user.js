import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const RESET_PASSWORD_TTL_MINUTES = 15;

const SENSITIVE_FIELDS = [
  "password",
  "resetPasswordToken",
  "resetPasswordExpire",
  "passwordChangedAt",
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [30, "Name cannot be more than 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    role: {
      type: String,
      default: "Student",
      enum: ["Student", "Teacher", "Admin"],
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    department: {
      type: String,
      trim: true,
      maxlength: [30, "Department cannot be more than 30 characters"],
    },
    // NOTE: the field name "experties" (sic) is kept for compatibility with
    // existing documents and the frontend.
    experties: {
      type: [String],
      default: [],
    },
    maxStudents: {
      type: Number,
      default: 10,
      min: [1, "Min 1 student is required"],
    },
    // Teacher only: students currently supervised by this teacher.
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Student only: the assigned supervisor (a Teacher).
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Student only: the student's current project.
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Never send password hashes or reset tokens to a client, even when a
      // document that was loaded with them is returned in a response.
      transform(doc, ret) {
        SENSITIVE_FIELDS.forEach((field) => delete ret[field]);
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1 });
userSchema.index({ supervisor: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
  if (!this.isNew) {
    // 1s back-dating keeps the token issued right after this save valid.
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + RESET_PASSWORD_TTL_MINUTES * 60 * 1000;
  return resetToken;
};

userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.hasCapacity = function () {
  if (this.role !== "Teacher") return false;
  return (this.assignedStudents?.length || 0) < this.maxStudents;
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
