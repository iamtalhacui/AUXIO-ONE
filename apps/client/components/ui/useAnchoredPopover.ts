"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type AnchoredBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
};

/** Positions a fixed portal menu under (or above) an anchor element within the viewport. */
export function useAnchoredPopover(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  opts?: { minWidth?: number; maxWidth?: number; preferredHeight?: number },
) {
  const [box, setBox] = useState<AnchoredBox | null>(null);
  const minWidth = opts?.minWidth ?? 0;
  const maxWidth = opts?.maxWidth ?? 360;
  const preferredHeight = opts?.preferredHeight ?? 280;

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }

    function measure() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const pad = 8;
      const width = Math.min(
        maxWidth,
        Math.max(minWidth || rect.width, Math.min(rect.width, window.innerWidth - pad * 2)),
      );
      let left = rect.left;
      if (left + width > window.innerWidth - pad) {
        left = window.innerWidth - pad - width;
      }
      left = Math.max(pad, left);

      const spaceBelow = window.innerHeight - rect.bottom - pad;
      const spaceAbove = rect.top - pad;
      const openUp = spaceBelow < preferredHeight * 0.6 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        160,
        Math.min(preferredHeight, openUp ? spaceAbove - 4 : spaceBelow - 4),
      );

      setBox({
        top: openUp ? rect.top : rect.bottom + 4,
        left,
        width,
        maxHeight,
        openUp,
      });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, anchorRef, minWidth, maxWidth, preferredHeight]);

  return box;
}
