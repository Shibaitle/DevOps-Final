import { Suspense } from "react";
import { LoginForm } from "@/components/features/staff-auth/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
