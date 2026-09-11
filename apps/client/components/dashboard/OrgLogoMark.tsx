"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";

type OrgLogoMarkProps = {
  className?: string;
  fallback: string;
};

// Fetches authenticated org logo as a blob URL for <img> usage.
export function OrgLogoMark({ className, fallback }: OrgLogoMarkProps) {
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const hasLogo = useAppSelector((state) => state.orgAuth.organisation?.hasLogo);
  const brandColor = useAppSelector(
    (state) => state.orgAuth.organisation?.brandColor ?? "#0f766e",
  );
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!hasLogo || !accessToken) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";

    (async () => {
      try {
        const res = await fetch(`${base}/organisation/logo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hasLogo, accessToken]);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={className ?? "h-9 w-9 rounded-lg object-cover"} />
    );
  }

  return (
    <span
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
      }
      style={{ backgroundColor: brandColor }}
    >
      {fallback}
    </span>
  );
}
