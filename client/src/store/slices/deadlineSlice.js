import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, getErrorMessage } from "../../lib/axios";
import { toast } from "react-toastify";

/** Creates or updates the deadline of a project. Returns { deadline, project }. */
export const createDeadline = createAsyncThunk(
  "deadline/createDeadline",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(
        `/deadline/create-deadline/${id}`,
        data,
      );
      toast.success(res.data.message || "Deadline saved");
      return res.data.data || {};
    } catch (error) {
      const message = getErrorMessage(error, "Failed to save deadline");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const deadlineSlice = createSlice({
  name: "deadline",
  initialState: {
    deadlines: [],
    nearby: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createDeadline.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(createDeadline.fulfilled, (state, action) => {
      state.loading = false;
      const item = action.payload?.deadline;
      if (!item) return;
      const index = state.deadlines.findIndex((d) => d._id === item._id);
      if (index === -1) state.deadlines.push(item);
      else state.deadlines[index] = item;
    });
    builder.addCase(createDeadline.rejected, (state) => {
      state.loading = false;
    });
  },
});

export default deadlineSlice.reducer;
