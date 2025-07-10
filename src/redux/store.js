import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authSlice from './slices/authSlice';
import { userApi } from './api/user';
import networkSlice from './slices/networkSlice';
import patientSlice from './slices/patientSlice';

// Combine all reducers
const reducers = combineReducers({
    auth: authSlice,
    network: networkSlice,
    patient:patientSlice,
    [userApi.reducerPath]: userApi.reducer,
});

// Redux Persist Configuration
const persistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    whitelist: ['auth'], // Only persist the 'auth' slice
};

// Persisted Reducer
const persistedReducer = persistReducer(persistConfig, reducers);

// Configure Store with Middleware Optimization
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            // Disable serializable check or raise threshold if needed
            serializableCheck: {
                warnAfter: 64, // Increase threshold to avoid warnings
                ignoredActions: ['persist/PERSIST'], // Ignore redux-persist actions
            },
        }).concat(userApi.middleware), // Include RTK Query middleware
});

// Persistor for Redux Persist
export const persistor = persistStore(store);
