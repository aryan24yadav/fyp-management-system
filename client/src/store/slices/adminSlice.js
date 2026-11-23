import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, getErrorMessage } from "../../lib/axios";
import { toast } from "react-toastify";
import { createDeadline } from "./deadlineSlice";

export const createStudent = createAsyncThunk(
  "createStudent",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/admin/create-student", data);
      toast.success("Student created successfully");
      return res.data.data.user;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create student");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const updateStudent = createAsyncThunk(
  "updateStudent",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/admin/update-student/${id}`, data);
      toast.success(res.data.message || "Student updated successfully");
      return res.data.data.user;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update student");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteStudent = createAsyncThunk(
  "deleteStudent",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/admin/delete-student/${id}`);
      toast.success(res.data.message || "Student deleted successfully");
      return id;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete student");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getAllUsers = createAsyncThunk(
  "getAllUsers",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/admin/users`);
      return res.data.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch users");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const createTeacher = createAsyncThunk(
  "createTeacher",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/admin/create-teacher", data);
      toast.success(res.data.message || "Teacher created successfully");
      return res.data.data.user;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create teacher");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const updateTeacher = createAsyncThunk(
  "updateTeacher",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/admin/update-teacher/${id}`, data);
      toast.success(res.data.message || "Teacher updated successfully");
      return res.data.data.user;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update teacher");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteTeacher = createAsyncThunk(
  "deleteTeacher",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/admin/delete-teacher/${id}`);
      toast.success(res.data.message || "Teacher deleted successfully");
      return id;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete teacher");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getAllProjects = createAsyncThunk(
  "getAllProjects",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/admin/projects`);
      return res.data.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch projects");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getDashBoardStats = createAsyncThunk(
  "getDashBoardStats",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/admin/fetch-dashboard-stats`);
      return res.data.data.stats;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch dashboard stats");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const assignSupervisor = createAsyncThunk(
  "assignSupervisor",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/admin/assign-supervisor`, data);
      toast.success(res.data.message || "Supervisor assigned successfully");
      return res.data.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to assign supervisor");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const approveProject = createAsyncThunk(
  "approveProject",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/admin/project/${id}`, {
        status: "approved",
      });
      toast.success(res.data.message || "Project approved successfully");
      return id;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to approve project");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const rejectProject = createAsyncThunk(
  "rejectProject",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/admin/project/${id}`, {
        status: "rejected",
      });
      toast.success(res.data.message || "Project rejected successfully");
      return id;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to reject project");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getProject = createAsyncThunk(
  "getProject",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/admin/project/${id}`);
      return res.data?.data?.project || null;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch project");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    students: [],
    teachers: [],
    projects: [],
    users: [],
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createStudent.fulfilled, (state, action) => {
        if (state.users) state.users.unshift(action.payload);
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        if (state.users) {
          state.users = state.users.map((u) =>
            u._id === action.payload._id ? { ...u, ...action.payload } : u,
          );
        }
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        if (state.users) {
          state.users = state.users.filter((u) => u._id !== action.payload);
        }
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.users = action.payload.users;
      })
      .addCase(createTeacher.fulfilled, (state, action) => {
        if (state.users) state.users.unshift(action.payload);
      })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        if (state.users) {
          state.users = state.users.map((u) =>
            u._id === action.payload._id ? { ...u, ...action.payload } : u,
          );
        }
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        if (state.users) {
          state.users = state.users.filter((u) => u._id !== action.payload);
        }
      })
      .addCase(getAllProjects.fulfilled, (state, action) => {
        state.projects = action.payload.projects;
      })
      .addCase(getDashBoardStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(approveProject.fulfilled, (state, action) => {
        const projectId = action.payload;
        state.projects = state.projects.map((p) =>
          p._id === projectId ? { ...p, status: "approved" } : p,
        );
      })
      .addCase(rejectProject.fulfilled, (state, action) => {
        const projectId = action.payload;
        state.projects = state.projects.map((p) =>
          p._id === projectId ? { ...p, status: "rejected" } : p,
        );
      })
      // Keep the projects table in sync after a deadline is saved.
      .addCase(createDeadline.fulfilled, (state, action) => {
        const updated = action.payload?.project;
        if (!updated?._id) return;
        state.projects = state.projects.map((p) =>
          p._id === updated._id ? { ...p, ...updated } : p,
        );
      });
  },
});

export default adminSlice.reducer;
