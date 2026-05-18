export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden flex-col justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-white lg:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">ForgeStock</p>
            <h1 className="mt-4 text-4xl font-semibold">Warehouse Ops Console</h1>
            <p className="mt-4 text-sm text-white/60">
              Industrial-grade control surface for inventory, approvals, and audit trails.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-white/60">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Realtime</p>
            <p className="mt-3 text-white">Sync inventory, move stock, and trace every change.</p>
          </div>
        </div>
        <div className="page-reveal flex items-center justify-center">{children}</div>
      </div>
    </div>
  );
}
