export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer w-full border-t border-[var(--border)] bg-[var(--surface)] py-6 mt-auto">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 text-xs text-white/60 md:flex-row md:justify-between">
        <div>© {currentYear} ForgeStock. Built for DevOps demos.</div>
        <div className="flex items-center gap-2 text-white/50">
          <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
          Warehouse Operations Console
        </div>
      </div>
    </footer>
  );
}