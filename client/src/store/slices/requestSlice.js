import { createSlice } from "@reduxjs/toolkit";

// Placeholder slice (supervisor requests currently live in teacherSlice.list).
const requestSlice = createSlice({
  name: "request",
  initialState: {
    list: [],
    selected: null,
  },
  reducers: {},
});

export default requestSlice.reducer;
