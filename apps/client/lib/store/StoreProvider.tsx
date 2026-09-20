"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { hydrateOrgAuth } from "@/lib/store/orgAuthSlice";
import { hydratePlatformAuth } from "@/lib/store/platformAuthSlice";
import { makeStore, type AppStore } from "@/lib/store/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    storeRef.current?.dispatch(hydratePlatformAuth());
    storeRef.current?.dispatch(hydrateOrgAuth());
    // Required for refetchOnFocus / refetchOnReconnect to actually run.
    const unsubscribe = setupListeners(storeRef.current!.dispatch);
    return unsubscribe;
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
