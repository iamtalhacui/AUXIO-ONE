import { Suspense } from "react";
import { LoginBranding } from "@/components/auth/LoginBranding";
import { AcceptInviteForm } from "@/components/auth/AcceptInviteForm";

export default function AcceptInvitePage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <LoginBranding />
      <Suspense fallback={<div className="flex flex-1 items-center justify-center">Loading...</div>}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
