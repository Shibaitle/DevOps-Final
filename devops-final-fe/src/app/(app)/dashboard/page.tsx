'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, AlertTriangle, ArrowRight, Layers, Loader2, ClipboardList, CheckCircle2, Clock, XCircle 
} from "lucide-react";
import { 
  warehouseService, 
  type WarehouseItem, 
  type WarehouseTransaction 
} from "@/services/warehouse.service";
import { useToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const { showToast } = useToast();
  
  // State
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [allItems, allTxs] = await Promise.all([
        warehouseService.getItems(),
        warehouseService.getTransactions()
      ]);
      setItems(allItems || []);
      setTransactions(allTxs || []);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err?.response?.data?.message || "Failed to load dashboard data",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate Stats
  const totalSKUs = items.length;
  const lowStockCount = items.filter(
    item => item.quantity <= (item.minimumQuantity || 0)
  ).length;

  const todayStr = new Date().toDateString();
  
  const inboundToday = transactions.filter(tx => {
    const isToday = tx.date ? new Date(tx.date).toDateString() === todayStr : false;
    const isInbound = tx.type === "เติมสินค้า" || tx.type === "เพิ่มสินค้าใหม่";
    return isToday && isInbound && tx.approvalStatus === "อนุมัติ";
  }).reduce((sum, tx) => sum + tx.quantity, 0);

  const outboundToday = transactions.filter(tx => {
    const isToday = tx.date ? new Date(tx.date).toDateString() === todayStr : false;
    const isOutbound = tx.type === "เบิกสินค้า";
    return isToday && isOutbound && tx.approvalStatus === "อนุมัติ";
  }).reduce((sum, tx) => sum + Math.abs(tx.quantity), 0);

  const recentTxs = transactions.slice(0, 5);

  const stats = [
    { 
      label: "Total SKUs", 
      value: totalSKUs, 
      desc: "Registered assets",
      icon: <Layers className="text-[var(--accent)]" size={20} />
    },
    { 
      label: "Low Stock Items", 
      value: lowStockCount, 
      desc: "Requires attention",
      icon: <AlertTriangle className={lowStockCount > 0 ? "text-amber-400" : "text-emerald-400"} size={20} />,
      highlight: lowStockCount > 0
    },
    { 
      label: "Approved Inbound Today", 
      value: inboundToday, 
      desc: "Units restocked",
      icon: <TrendingUp className="text-emerald-400" size={20} />
    },
    { 
      label: "Approved Outbound Today", 
      value: outboundToday, 
      desc: "Units dispatched",
      icon: <TrendingUp className="text-rose-400 rotate-90" size={20} />
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "อนุมัติ":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 size={10} /> Approved
          </span>
        );
      case "ไม่อนุมัติ":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs text-rose-400 font-semibold">
            <XCircle size={10} /> Rejected
          </span>
        );
      case "รออนุมัติ":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400 font-semibold">
            <Clock size={10} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Warehouse Control</p>
        <h1 className="text-3xl font-semibold text-white">Dashboard Overview</h1>
        <p className="text-xs text-white/50">Live status snapshot of stock movements, alerts, and pending requests.</p>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 text-white/50">
          <Loader2 className="animate-spin text-[var(--accent)] mb-3" size={36} />
          <p className="text-sm">Synchronizing dashboard analytics...</p>
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl border bg-[var(--surface)] p-5 transition hover:translate-y-[-2px] duration-300 ${
                  stat.highlight 
                    ? "border-amber-500/30 shadow-lg shadow-amber-500/5 bg-gradient-to-br from-[var(--surface)] to-amber-500/5" 
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-white/40">{stat.label}</p>
                  {stat.icon}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-white">{stat.value}</span>
                  <span className="text-xs text-white/40">{stat.desc}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Main Content Sections */}
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Recent Activity Table */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-1.5">
                  <ClipboardList size={18} className="text-[var(--accent)]" />
                  Recent Movements
                </h2>
                <Link
                  href="/transactions"
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-white/70 hover:text-white transition hover:bg-[var(--surface-2)]"
                >
                  View All Logs
                </Link>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)]">
                {recentTxs.length === 0 ? (
                  <div className="text-center py-10 text-white/40 text-xs">
                    No recent transaction logs found.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--surface-2)] text-white/60">
                      <tr>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Operator</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTxs.map((row) => {
                        const isRestock = row.type === "เติมสินค้า" || row.type === "เพิ่มสินค้าใหม่";
                        return (
                          <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/30 transition text-white/80">
                            <td className="px-4 py-3.5 font-mono text-xs text-white/70">{row.code}</td>
                            <td className="px-4 py-3.5 font-medium text-white">{row.itemName}</td>
                            <td className={`px-4 py-3.5 font-semibold ${isRestock ? "text-emerald-400" : "text-rose-400"}`}>
                              {isRestock ? `+${row.quantity}` : `-${Math.abs(row.quantity)}`}
                            </td>
                            <td className="px-4 py-3.5 text-white/60">{row.operator}</td>
                            <td className="px-4 py-3.5">{getStatusBadge(row.approvalStatus)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Quick Operations</h2>
                <p className="text-xs text-white/40 mt-1">Easily initiate new movements and stock checks.</p>
                
                <div className="mt-5 space-y-4 text-sm text-white/70">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Restock / Add Item</p>
                      <p className="mt-1 text-xs text-white/60">Register new items or top-up depleted inventory assets.</p>
                    </div>
                    <Link
                      href="/inventory"
                      className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-2)] px-4 py-2 text-xs font-semibold text-black transition"
                    >
                      Go to Inventory Directory <ArrowRight size={12} />
                    </Link>
                  </div>
                  
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400">Withdraw / Movement Queue</p>
                      <p className="mt-1 text-xs text-white/60">Disburse warehouse stock and authorize approval requests.</p>
                    </div>
                    <Link
                      href="/transactions"
                      className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--accent)] hover:bg-[var(--accent)]/10 px-4 py-2 text-xs font-semibold text-[var(--accent)] transition"
                    >
                      Authorize Movements <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
