"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/auth.service";
import { getAuthErrorMessage } from "@/lib/error-messages";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title?: string; message: string } | null>(null);

  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "" });
  const registeredQuery = searchParams.get("registered");
  const isRegisteredFlow = registeredQuery === "pending_approval" || registeredQuery === "true";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const isEmail = formData.usernameOrEmail.includes("@");

      const credentials = {
        ...(isEmail
          ? { email: formData.usernameOrEmail }
          : { username: formData.usernameOrEmail }),
        password: formData.password,
        remember: rememberMe };

      const userData = await authService.login(credentials);
      
      // Redirect based on role (now using mapped role)
      const normalizedRole = userData.role_name?.toLowerCase();
      
      switch (normalizedRole) {
        case "admin":
          router.push("/users");
          break;
        case "inventory":
          router.push("/inventory");
          break;
        case "superuser":
        case "warehouse":
        default:
          router.push("/dashboard");
          break;
      }
    } catch (err) {
      const friendlyError = getAuthErrorMessage(err);
      setError(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <h2 className="text-2xl font-semibold text-white">Sign in</h2>
      <p className="mt-2 text-sm text-white/60">Access your warehouse control room.</p>

      <form onSubmit={onSubmit} className="space-y-5">
        {isRegisteredFlow && !error && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-body-small mb-1">สมัครใช้งานสำเร็จแล้ว</p>
                <p className="text-body-small">
                  บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ กรุณารอการยืนยันก่อนเข้าสู่ระบบ
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                {error.title && (
                  <p className="font-semibold text-body-small mb-1">{error.title}</p>
                )}
                <p className="text-body-small">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-sm font-medium text-white/70">
            Username or email<span className="text-[var(--accent)]">*</span>
          </label>
          <Input
            name="usernameOrEmail"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            placeholder="you@warehouse.com"
            type="text"
            className="h-11 border-[var(--border)] bg-[var(--surface-2)] text-white placeholder:text-white/40"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-sm font-medium text-white/70">
            Password<span className="text-[var(--accent)]">*</span>
          </label>
          <div className="relative">
            <Input
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="รหัสผ่าน"
              type={showPassword ? "text" : "password"}
              className="h-11 border-[var(--border)] pr-10 bg-[var(--surface-2)] text-white placeholder:text-white/40"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isLoading}
          />
          <label htmlFor="remember" className="text-xs text-white/60 cursor-pointer select-none">
            Remember me
          </label>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            className="h-12 w-full bg-[var(--accent)] text-black font-semibold tracking-wide transition-colors hover:bg-[var(--accent-2)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </div>

        <div className="pt-2 text-right text-xs text-white/40">
          Need access? Contact the admin.
        </div>
      </form>
    </div>
  );
}
