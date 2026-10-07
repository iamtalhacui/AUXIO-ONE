"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useOrgMeQuery } from "@/lib/api/authApi";
import {
  patchOrgUser,
  setOrganisation,
  setPermissions,
} from "@/lib/store/orgAuthSlice";
import { useAppDispatch } from "@/lib/store/hooks";

// Re-check /auth/me on every route change and keep session + branding in sync.
export function useConfirmOrgSession(enabled: boolean) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { data, isSuccess } = useOrgMeQuery(pathname, { skip: !enabled });

  useEffect(() => {
    if (data?.user) {
      dispatch(patchOrgUser(data.user));
    }
    if (data?.organisation) {
      dispatch(setOrganisation(data.organisation));
    }
    if (data?.permissions) {
      dispatch(setPermissions(data.permissions));
    }
  }, [data?.user, data?.organisation, data?.permissions, dispatch]);

  return enabled && isSuccess;
}
