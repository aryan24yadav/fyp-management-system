import { createSlice } from "@reduxjs/toolkit";

const popupSlice = createSlice({
  name: "popup",
  initialState: {
    isCreateStudentModalOpen: false,
    isCreateTeacherModalOpen: false,
  },
  reducers: {
    toggleCreateStudentModal: (state) => {
      state.isCreateStudentModalOpen = !state.isCreateStudentModalOpen;
    },
    toggleCreateTeacherModal: (state) => {
      state.isCreateTeacherModalOpen = !state.isCreateTeacherModalOpen;
    },
  },
});

export const {toggleCreateStudentModal,toggleCreateTeacherModal} = popupSlice.actions;
export default popupSlice.reducer;
