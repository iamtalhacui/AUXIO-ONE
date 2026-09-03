import { PlatformLoginForm } from "@/components/auth/PlatformLoginForm";

export default function PlatformLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <PlatformLoginForm />
      </div>
    </div>
  );
}
