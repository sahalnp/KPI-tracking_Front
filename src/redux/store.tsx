import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; 
import userReducer from "../features/UserSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user"], // Only persist user data
};


const rootReducer = combineReducers({
    user: userReducer,
});

// wrap root reducer with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// configure store
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, 
    }),
});

export const persistor = persistStore(store);

// Export the RootState type
export type RootState = ReturnType<typeof store.getState>;

export default store;