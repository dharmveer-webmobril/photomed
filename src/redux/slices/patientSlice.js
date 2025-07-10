import { createSlice, } from '@reduxjs/toolkit';

const initialState = {
  currentActivePatient: null,
  patientImages: [],
  userSubscription: null
};

export const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    setPatientImages: (state, action) => {
      state.patientImages = action.payload
    },
    setCurrentPatient: (state, action) => {
      state.currentActivePatient = action.payload
    },

    setUserSubscription: (state, action) => {
      state.userSubscription = action.payload;
    },
  },
});
export default patientSlice.reducer;
export const { setPatientImages, setCurrentPatient, setUserSubscription } = patientSlice.actions;