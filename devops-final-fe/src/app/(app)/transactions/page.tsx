const transactions = [
  { id: "TX-9032", type: "Inbound", item: "Steel Rack", qty: 10, status: "Pending" },
  { id: "TX-9031", type: "Outbound", item: "Safety Gloves", qty: 120, status: "Approved" },
  { id: "TX-9030", type: "Adjustment", item: "Hydraulic Pump", qty: -1, status: "Review" },
  { id: "TX-9029", type: "Inbound", item: "Stretch Film", qty: 400, status: "Approved" },
];

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Transactions</p>
          <h1 className="text-3xl font-semibold text-white">Movement Queue</h1>
        </div>
        <button className="rounded-lg border border-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent)]">
          New Transaction
        </button>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-white/60">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)] text-white/80">
                  <td className="px-4 py-3 font-medium text-white">{row.id}</td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3">{row.item}</td>
                  <td className="px-4 py-3">{row.qty}</td>
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
