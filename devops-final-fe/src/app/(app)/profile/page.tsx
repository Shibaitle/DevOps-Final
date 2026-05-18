'use client';

import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Account</p>
        <h1 className="text-3xl font-semibold text-white">Profile Settings</h1>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">First Name</label>
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white/70"
              value={user?.first_name || ""}
              readOnly
              disabled
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Last Name</label>
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white/70"
              value={user?.last_name || ""}
              readOnly
              disabled
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Email</label>
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white/70"
              value={user?.email || ""}
              readOnly
              disabled
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Role</label>
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-white/70 capitalize"
              value={user?.role_name || ""}
              readOnly
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );
}
