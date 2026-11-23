import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  axiosInstance,
  getBlobErrorMessage,
  getErrorMessage,
} from "../../lib/axios";
import { toast } from "react-toastify";

export const submitProjectProposal = createAsyncThunk(
  "student/submitProjectProposal",
  async (data, thunkAPI) => {
    try {
      const response = await axiosInstance.post(
        "/student/project-proposal",
        data,
      );
      toast.success("Project proposal submitted successfully");
      return response.data.data?.project || null;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to submit project proposal");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchProject = createAsyncThunk(
  "student/fetchProject",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/student/project");
      return response.data.data?.project || null;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch project");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getSupervisor = createAsyncThunk(
  "student/getSupervisor",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/student/supervisor");
      return response.data.data?.supervisor || null;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch supervisor");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchAllSupervisors = createAsyncThunk(
  "student/fetchAllSupervisors",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/student/fetch-supervisors");
      return response.data.data?.supervisors || [];
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch supervisors");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const requestSupervisor = createAsyncThunk(
  "student/requestSupervisor",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/student/request-supervisor", data);
      thunkAPI.dispatch(getSupervisor());
      toast.success(res.data.message || "Supervisor request sent successfully");
      return res.data.data?.request || null;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to request supervisor");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const uploadFiles = createAsyncThunk(
  "student/uploadFiles",
  async ({ projectId, files }, thunkAPI) => {
    try {
      const form = new FormData();
      for (const file of files) form.append("files", file);
      // Let the browser set the multipart Content-Type (with its boundary).
      const response = await axiosInstance.post(
        `/student/upload/${projectId}`,
        form,
        { timeout: 0 }, // large uploads may take longer than the default timeout
      );

      toast.success(response.data.message || "Files uploaded successfully");
      return response.data.data?.project || null;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to upload files");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchDashboardStats = createAsyncThunk(
  "student/fetchDashboardStats",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/student/fetch-dashboard-stats");
      return res.data.data || null;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch dashboard stats");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getFeedback = createAsyncThunk(
  "student/getFeedback",
  async (projectId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/student/feedback/${projectId}`);
      return res.data.data?.feedback || [];
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch feedback");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const downloadFile = createAsyncThunk(
  "student/downloadFile",
  async ({ projectId, fileId }, thunkAPI) => {
    try {
      const res = await axiosInstance.get(
        `/student/download/${projectId}/${fileId}`,
        { responseType: "blob", timeout: 0 },
      );

      return { blob: res.data, projectId, fileId };
    } catch (error) {
      // With responseType "blob" the error body is a Blob, not JSON.
      const message = await getBlobErrorMessage(error, "Failed to download file");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const studentSlice = createSlice({
  name: "student",
  initialState: {
    project: null,
    files: [],
    supervisors: [],
    dashboardStats: null,
    supervisor: null,
    deadlines: [],
    feedback: [],
    status: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(submitProjectProposal.fulfilled, (state, action) => {
      state.project = action.payload;
      state.files = action.payload?.files || [];
    });
    builder.addCase(fetchProject.fulfilled, (state, action) => {
      state.project = action.payload;
      state.files = action.payload?.files || [];
    });
    builder.addCase(getSupervisor.fulfilled, (state, action) => {
      state.supervisor = action.payload;
    });
    builder.addCase(fetchAllSupervisors.fulfilled, (state, action) => {
      state.supervisors = action.payload || [];
    });
    builder.addCase(fetchDashboardStats.fulfilled, (state, action) => {
      state.dashboardStats = action.payload;
    });
    builder.addCase(getFeedback.fulfilled, (state, action) => {
      state.feedback = action.payload || [];
    });
    builder.addCase(uploadFiles.fulfilled, (state, action) => {
      // The payload is the updated project. The old reducer spread a plain
      // object into an array ("is not iterable") and crashed.
      if (action.payload) {
        state.project = action.payload;
        state.files = action.payload.files || [];
      }
    });
  },
});

export default studentSlice.reducer;
