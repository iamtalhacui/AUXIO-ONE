import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OrgLoginResponse, OrgSummary, OrgUser } from "@/lib/api/types";

const STORAGE_KEY = "auxio_org_auth";

type OrgAuthState = {
  accessToken: string | null;
  user: OrgUser | null;
  organisation: OrgSummary | null;
};

const initialState: OrgAuthState = {
  accessToken: null,
  user: null,
  organisation: null,
};

function persist(state: OrgAuthState) {
  if (typeof window === "undefined") return;
  if (!state.accessToken || !state.user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      user: state.user,
      organisation: state.organisation,
    }),
  );
}

const orgAuthSlice = createSlice({
  name: "orgAuth",
  initialState,
  reducers: {
    hydrateOrgAuth(state) {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as OrgAuthState;
        state.accessToken = parsed.accessToken ?? null;
        state.user = parsed.user ?? null;
        state.organisation = parsed.organisation ?? null;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    setOrgCredentials(state, action: PayloadAction<OrgLoginResponse>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.organisation = action.payload.organisation;
      persist(state);
    },
    logoutOrg(state) {
      state.accessToken = null;
      state.user = null;
      state.organisation = null;
      persist(state);
    },
  },
});

export const { hydrateOrgAuth, setOrgCredentials, logoutOrg } = orgAuthSlice.actions;
export default orgAuthSlice.reducer;
