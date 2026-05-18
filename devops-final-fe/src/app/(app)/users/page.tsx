const users = [
  { id: "USR-001", name: "Kaho Koyanagi", role: "Admin", status: "Active" },
  { id: "USR-014", name: "Neo Tanaka", role: "Super User", status: "Active" },
  { id: "USR-021", name: "Ploy Ware", role: "Warehouse Staff", status: "Active" },
  { id: "USR-034", name: "Mint Lee", role: "Inventory Staff", status: "Pending" },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Administration</p>
          <h1 className="text-3xl font-semibold text-white">Users & Roles</h1>
        </div>
        <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black">
          Invite User
        </button>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-white/60">
              <tr>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)] text-white/80">
                  <td className="px-4 py-3 font-medium text-white">{row.id}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[var(--border)] px-2 py-1 text-xs">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
