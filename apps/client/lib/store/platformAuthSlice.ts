import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PlatformLoginResponse, PlatformUser } from "@/lib/api/types";

const STORAGE_KEY = "auxio_platform_auth";

type PlatformAuthState = {
  accessToken: string | null;
  user: PlatformUser | null;
};

const initialState: PlatformAuthState = {
  accessToken: null,
  user: null,
};

function persist(state: PlatformAuthState) {
  if (typeof window === "undefined") return;
  if (!state.accessToken || !state.user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ accessToken: state.accessToken, user: state.user }),
  );
}

const platformAuthSlice = createSlice({
  name: "platformAuth",
  initialState,
  reducers: {
    hydratePlatformAuth(state) {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as PlatformAuthState;
        state.accessToken = parsed.accessToken ?? null;
        state.user = parsed.user ?? null;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    setPlatformCredentials(state, action: PayloadAction<PlatformLoginResponse>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      persist(state);
    },
    logoutPlatform(state) {
      state.accessToken = null;
      state.user = null;
      persist(state);
    },
  },
});

export const { hydratePlatformAuth, setPlatformCredentials, logoutPlatform } =
  platformAuthSlice.actions;
export default platformAuthSlice.reducer;
