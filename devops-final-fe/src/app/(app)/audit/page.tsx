const audits = [
  { id: "AL-2001", action: "Update", table: "warehouse_items", operator: "admin", time: "10:42" },
  { id: "AL-1998", action: "Insert", table: "warehouse_transactions", operator: "superuser", time: "09:18" },
  { id: "AL-1995", action: "Delete", table: "users", operator: "admin", time: "08:05" },
];

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Audit</p>
        <h1 className="text-3xl font-semibold text-white">Audit Log</h1>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-white/60">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)] text-white/80">
                  <td className="px-4 py-3 font-medium text-white">{row.id}</td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3">{row.table}</td>
                  <td className="px-4 py-3">{row.operator}</td>
                  <td className="px-4 py-3">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
