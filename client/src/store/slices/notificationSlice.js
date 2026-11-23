import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, getErrorMessage } from "../../lib/axios";
import { toast } from "react-toastify";

export const getNotifications = createAsyncThunk(
  "getNotifications",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/notification");
      return res.data?.data || res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch notifications");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const markAsRead = createAsyncThunk(
  "markAsRead",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.put(`/notification/${id}/read`);
      return id;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update notification");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const markAllAsRead = createAsyncThunk(
  "markAllAsRead",
  async (_, thunkAPI) => {
    try {
      await axiosInstance.put("/notification/read-all");
      return true;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update notifications");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteNotification = createAsyncThunk(
  "deleteNotification",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/notification/${id}/delete`);
      return id;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete notification");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    list: [],
    unreadCount: 0,
    readCount: 0,
    highPriorityMessages: 0,
    thisWeekNotifications: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getNotifications.fulfilled, (state, action) => {
      state.loading = false;
      // The list itself was never stored before, so the page was always empty.
      state.list = action.payload?.notifications || [];
      state.unreadCount = action.payload?.unreadOnly || 0;
      state.readCount = action.payload?.readOnly || 0;
      state.highPriorityMessages = action.payload?.highPriorityMessages || 0;
      state.thisWeekNotifications = action.payload?.thisWeekNotifications || 0;
    });
    builder.addCase(getNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch notifications";
    });

    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const target = state.list.find((n) => n._id === action.payload);
      if (target && !target.isRead) {
        target.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.readCount += 1;
      }
    });

    builder.addCase(markAllAsRead.fulfilled, (state) => {
      state.list = state.list.map((n) => ({ ...n, isRead: true }));
      state.readCount += state.unreadCount;
      state.unreadCount = 0;
    });

    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      const removed = state.list.find((n) => n._id === action.payload);
      state.list = state.list.filter((n) => n._id !== action.payload);

      if (removed) {
        if (removed.isRead) {
          state.readCount = Math.max(0, state.readCount - 1);
        } else {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        if (removed.priority === "high") {
          state.highPriorityMessages = Math.max(
            0,
            state.highPriorityMessages - 1,
          );
        }
      }
    });
  },
});

export default notificationSlice.reducer;
