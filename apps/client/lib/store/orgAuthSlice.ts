import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  OrgLoginResponse,
  OrgSummary,
  OrgUser,
  RolePermissionsPayload,
} from "@/lib/api/types";

const STORAGE_KEY = "auxio_org_auth";

type OrgAuthState = {
  accessToken: string | null;
  user: OrgUser | null;
  organisation: OrgSummary | null;
  permissions: RolePermissionsPayload | null;
  hydrated: boolean;
};

const initialState: OrgAuthState = {
  accessToken: null,
  user: null,
  organisation: null,
  permissions: null,
  hydrated: false,
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
      permissions: state.permissions,
    }),
  );
}

function normalizeOrganisation(org: OrgSummary | null | undefined): OrgSummary | null {
  if (!org) return null;
  return {
    ...org,
    tradingName: org.tradingName ?? null,
    tagline: org.tagline ?? null,
    brandColor: org.brandColor ?? "#0f766e",
    hasLogo: Boolean(org.hasLogo),
  };
}

const orgAuthSlice = createSlice({
  name: "orgAuth",
  initialState,
  reducers: {
    hydrateOrgAuth(state) {
      if (typeof window === "undefined") {
        state.hydrated = true;
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as OrgAuthState;
          state.accessToken = parsed.accessToken ?? null;
          state.user = parsed.user ?? null;
          state.organisation = normalizeOrganisation(parsed.organisation);
          state.permissions = parsed.permissions ?? null;
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      state.hydrated = true;
    },
    setOrgCredentials(state, action: PayloadAction<OrgLoginResponse>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.organisation = normalizeOrganisation(action.payload.organisation);
      state.permissions = action.payload.permissions ?? null;
      persist(state);
    },
    patchOrgUser(state, action: PayloadAction<Partial<OrgUser>>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      persist(state);
    },
    setOrganisation(state, action: PayloadAction<OrgSummary>) {
      state.organisation = normalizeOrganisation(action.payload);
      persist(state);
    },
    setPermissions(state, action: PayloadAction<RolePermissionsPayload>) {
      state.permissions = action.payload;
      persist(state);
    },
    logoutOrg(state) {
      state.accessToken = null;
      state.user = null;
      state.organisation = null;
      state.permissions = null;
      persist(state);
    },
  },
});

export const {
  hydrateOrgAuth,
  setOrgCredentials,
  patchOrgUser,
  setOrganisation,
  setPermissions,
  logoutOrg,
} = orgAuthSlice.actions;
export default orgAuthSlice.reducer;
