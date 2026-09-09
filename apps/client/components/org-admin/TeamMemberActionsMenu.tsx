"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type TeamMemberActionsMenuProps = {
  memberId: string;
  memberRoleCode?: string | null;
};

// View / Edit shortcuts. Org Admin rows only get View.
export function TeamMemberActionsMenu({ memberId, memberRoleCode }: TeamMemberActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOrgAdmin = memberRoleCode === "ORG_ADMIN";

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isOrgAdmin) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:border-primary/30 hover:text-foreground"
        aria-label="Member actions"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <Link
            href={`/org-admin/team/${memberId}/review`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted"
          >
            View
          </Link>
          <Link
            href={`/org-admin/team/${memberId}/edit`}
            onClick={() => setOpen(false)}
            className="block border-t border-border/60 px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted"
          >
            Edit
          </Link>
        </div>
      ) : null}
    </div>
  );
}
