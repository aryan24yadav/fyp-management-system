import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  axiosInstance,
  getBlobErrorMessage,
  getErrorMessage,
} from "../../lib/axios";
import { toast } from "react-toastify";

export const getTeacherDashboardStats = createAsyncThunk(
  "teacher/getDashboardStats",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/teacher/fetch-dashboard-stats");
      return res.data.data?.dashboardStats || null;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to fetch teacher dashboard stats",
      );
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// The server always scopes requests to the logged-in teacher.
export const getTeacherRequests = createAsyncThunk(
  "teacher/getRequests",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/teacher/requests");
      return res.data.data?.requests || [];
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch requests");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const acceptRequest = createAsyncThunk(
  "teacher/acceptRequest",
  async (requestId, thunkAPI) => {
    try {
      const res = await axiosInstance.put(
        `/teacher/requests/${requestId}/accept`,
      );
      toast.success(res.data.message || "Request accepted successfully");
      return res.data.data?.request;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to accept request");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const rejectRequest = createAsyncThunk(
  "teacher/rejectRequest",
  async (requestId, thunkAPI) => {
    try {
      const res = await axiosInstance.put(
        `/teacher/requests/${requestId}/reject`,
      );
      toast.success(res.data.message || "Request rejected successfully");
      return res.data.data?.request;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to reject request");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const markComplete = createAsyncThunk(
  "teacher/markComplete",
  async (projectId, thunkAPI) => {
    try {
      const res = await axiosInstance.post(
        `/teacher/mark-complete/${projectId}`,
      );
      toast.success(res.data.message || "Marked as completed");
      return { projectId, project: res.data.data?.project };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to mark complete");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const downloadTeacherFile = createAsyncThunk(
  "teacher/downloadFile",
  async ({ projectId, fileId }, thunkAPI) => {
    try {
      const res = await axiosInstance.get(
        `/teacher/download/${projectId}/${fileId}`,
        { responseType: "blob", timeout: 0 },
      );

      return { blob: res.data, projectId, fileId };
    } catch (error) {
      const message = await getBlobErrorMessage(error, "Failed to download file");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getFiles = createAsyncThunk(
  "teacher/getFiles",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/teacher/files`);
      return res.data?.data?.files || [];
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch teacher files");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const addFeedback = createAsyncThunk(
  "teacher/addFeedback",
  async ({ projectId, payload }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(
        `/teacher/feedback/${projectId}`,
        payload,
      );
      toast.success(res.data.message || "Feedback added successfully");
      return {
        projectId,
        feedback: res.data.data?.feedback,
        project: res.data.data?.project,
      };
    } catch (error) {
      const message = getErrorMessage(error, "Failed to add feedback");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getAssignedStudents = createAsyncThunk(
  "teacher/getAssignedStudents",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/teacher/assigned-students`);
      return res.data.data?.students || [];
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch assigned students");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState: {
    assignedStudents: [],
    files: [],
    pendingRequests: [],
    dashboardStats: null,
    statsLoading: false,
    loading: false,
    error: null,
    list: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAssignedStudents.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAssignedStudents.fulfilled, (state, action) => {
      state.loading = false;
      state.assignedStudents = action.payload || [];
    });
    builder.addCase(getAssignedStudents.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch assigned students";
    });
    builder.addCase(addFeedback.fulfilled, (state, action) => {
      const { projectId, project } = action.payload;
      state.assignedStudents = state.assignedStudents.map((s) =>
        s.project?._id === projectId && project
          ? { ...s, project: { ...s.project, feedback: project.feedback } }
          : s,
      );
    });
    builder.addCase(markComplete.fulfilled, (state, action) => {
      const { projectId } = action.payload;
      state.assignedStudents = state.assignedStudents.map((s) =>
        s.project?._id === projectId
          ? { ...s, project: { ...s.project, status: "completed" } }
          : s,
      );
    });

    builder.addCase(getTeacherDashboardStats.pending, (state) => {
      state.statsLoading = true;
    });
    builder.addCase(getTeacherDashboardStats.fulfilled, (state, action) => {
      state.statsLoading = false;
      state.dashboardStats = action.payload;
    });
    builder.addCase(getTeacherDashboardStats.rejected, (state) => {
      state.statsLoading = false;
    });
    builder.addCase(getFiles.fulfilled, (state, action) => {
      state.files = action.payload || [];
    });
    builder.addCase(getTeacherRequests.fulfilled, (state, action) => {
      state.list = action.payload || [];
    });
    builder.addCase(acceptRequest.fulfilled, (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      // Keep latestProject (not part of the accept response).
      state.list = state.list.map((r) =>
        r._id === updated._id ? { ...r, status: updated.status } : r,
      );
    });
    builder.addCase(rejectRequest.fulfilled, (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      state.list = state.list.map((r) =>
        r._id === updated._id ? { ...r, status: updated.status } : r,
      );
    });
  },
});

export default teacherSlice.reducer;
