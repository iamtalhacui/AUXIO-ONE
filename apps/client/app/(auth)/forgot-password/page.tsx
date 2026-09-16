import { LoginBranding } from "@/components/auth/LoginBranding";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <LoginBranding />
      <ForgotPasswordForm />
    </div>
  );
}
