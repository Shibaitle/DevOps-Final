const inventory = [
  { sku: "FX-1103", name: "Safety Helmet", category: "PPE", stock: 240, status: "Healthy" },
  { sku: "FX-1128", name: "Steel Rack", category: "Storage", stock: 32, status: "Low" },
  { sku: "FX-1201", name: "Hydraulic Pump", category: "Equipment", stock: 8, status: "Critical" },
  { sku: "FX-1334", name: "Stretch Film", category: "Packing", stock: 640, status: "Healthy" },
];

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Inventory</p>
          <h1 className="text-3xl font-semibold text-white">Stock Directory</h1>
        </div>
        <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black">
          Add New Item
        </button>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center gap-3 pb-4 text-sm text-white/60">
          <span className="rounded-full border border-[var(--border)] px-3 py-1">All Categories</span>
          <span className="rounded-full border border-[var(--border)] px-3 py-1">Low Stock</span>
          <span className="rounded-full border border-[var(--border)] px-3 py-1">Critical</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-white/60">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row) => (
                <tr key={row.sku} className="border-t border-[var(--border)] text-white/80">
                  <td className="px-4 py-3 font-medium text-white">{row.sku}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3">{row.stock}</td>
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
