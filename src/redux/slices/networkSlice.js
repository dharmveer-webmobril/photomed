// redux/slices/networkSlice.js
import { createSlice } from '@reduxjs/toolkit';

const networkSlice = createSlice({
    name: 'network',
    initialState: {
        isConnected: true, // Default to 'true' assuming app starts with a connection
    },
    reducers: {
        setNetworkStatus: (state, action) => {
            state.isConnected = action.payload;
        },
    },
});

export const { setNetworkStatus } = networkSlice.actions;
export default networkSlice.reducer;
