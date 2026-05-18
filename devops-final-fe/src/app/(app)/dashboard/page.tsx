const stats = [
  { label: "Total SKUs", value: "1,248", trend: "+4.2%" },
  { label: "Low Stock", value: "38", trend: "-8.1%" },
  { label: "Inbound Today", value: "92", trend: "+12.4%" },
  { label: "Outbound Today", value: "74", trend: "+6.8%" },
];

const activities = [
  { id: "TX-9021", item: "Hydraulic Pump", qty: "+12", by: "WHS-01", status: "Approved" },
  { id: "TX-9018", item: "Pallet Jack", qty: "-2", by: "INV-07", status: "Pending" },
  { id: "TX-9012", item: "Safety Gloves", qty: "+250", by: "WHS-03", status: "Approved" },
  { id: "TX-9007", item: "Steel Rack", qty: "-4", by: "WHS-01", status: "Rejected" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Warehouse Control</p>
        <h1 className="text-3xl font-semibold text-white">Dashboard Overview</h1>
        <p className="text-sm text-white/60">Live snapshot of stock movement and approvals.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">{stat.label}</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-2xl font-semibold text-white">{stat.value}</span>
              <span className="text-xs font-semibold text-[var(--accent)]">{stat.trend}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <button className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-white/70 hover:text-white">
              View All
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-white/60">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)] text-white/80">
                    <td className="px-4 py-3 font-medium text-white">{row.id}</td>
                    <td className="px-4 py-3">{row.item}</td>
                    <td className="px-4 py-3">{row.qty}</td>
                    <td className="px-4 py-3">{row.by}</td>
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

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="mt-5 space-y-4 text-sm text-white/70">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Inbound</p>
              <p className="mt-2 text-white">Create inbound receipt for new stock.</p>
              <button className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black">
                New Receipt
              </button>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Outbound</p>
              <p className="mt-2 text-white">Issue stock for outbound transfer.</p>
              <button className="mt-4 rounded-lg border border-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent)]">
                New Dispatch
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
