import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser, LoginResponse } from "@/lib/api/types";

const AUTH_STORAGE_KEY = "auxio_auth";

export type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  mustChangePassword: boolean;
};

const emptyState: AuthState = {
  accessToken: null,
  user: null,
  mustChangePassword: false,
};

function readStoredAuth(): AuthState {
  if (typeof window === "undefined") return emptyState;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return emptyState;
    return JSON.parse(raw) as AuthState;
  } catch {
    return emptyState;
  }
}

function persistAuth(state: AuthState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

const authSlice = createSlice({
  name: "auth",
  initialState: emptyState,
  reducers: {
    hydrateAuth(state) {
      const stored = readStoredAuth();
      state.accessToken = stored.accessToken;
      state.user = stored.user;
      state.mustChangePassword = stored.mustChangePassword;
    },
    setCredentials(state, action: PayloadAction<LoginResponse>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.mustChangePassword = action.payload.mustChangePassword;
      persistAuth(state);
    },
    completePasswordChange(
      state,
      action: PayloadAction<Pick<LoginResponse, "user" | "mustChangePassword">>,
    ) {
      state.mustChangePassword = action.payload.mustChangePassword;
      state.user = action.payload.user;
      persistAuth(state);
    },
    updateUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      persistAuth(state);
    },
    logout(state) {
      state.accessToken = null;
      state.user = null;
      state.mustChangePassword = false;
      clearStoredAuth();
    },
  },
});

export const { hydrateAuth, setCredentials, completePasswordChange, updateUser, logout } =
  authSlice.actions;

export default authSlice.reducer;
