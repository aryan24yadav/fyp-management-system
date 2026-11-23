import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance, getBlobErrorMessage } from "../../lib/axios";
import { toast } from "react-toastify";

/** Shared download endpoint (Admin, owner student or supervisor). */
export const downloadProjectFile = createAsyncThunk(
  "project/downloadFile",
  async ({ projectId, fileId }, thunkAPI) => {
    try {
      const res = await axiosInstance.get(
        `/project/${projectId}/files/${fileId}/download`,
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

const projectSlice = createSlice({
  name: "project",
  initialState: {
    projects: [],
    selected: null,
  },
  reducers: {},
});

export default projectSlice.reducer;
