import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/lib/api/authApi";
import { platformAuthApi } from "@/lib/api/platformAuthApi";
import orgAuthReducer from "@/lib/store/orgAuthSlice";
import platformAuthReducer from "@/lib/store/platformAuthSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      platformAuth: platformAuthReducer,
      orgAuth: orgAuthReducer,
      [platformAuthApi.reducerPath]: platformAuthApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(platformAuthApi.middleware, authApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
