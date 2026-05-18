'use client';

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  Check, X, Clock, CheckCircle2, XCircle, Plus, Loader2, Filter, AlertCircle 
} from "lucide-react";
import { 
  warehouseService, 
  type WarehouseTransaction, 
  type WarehouseItem,
  type WarehouseApprovalStatus,
  type WarehouseTransactionType
} from "@/services/warehouse.service";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdminOrSuperuser = 
    user?.role_name?.toLowerCase().includes("admin") || 
    user?.role_name?.toLowerCase().includes("super");

  // State
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | WarehouseApprovalStatus>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | WarehouseTransactionType>("ALL");

  // Modal State
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // New Transaction Form State
  const [selectedItemId, setSelectedItemId] = useState("");
  const [txMode, setTxMode] = useState<"restock" | "withdraw">("restock");
  const [txQty, setTxQty] = useState(1);

  // Rejection Form State
  const [rejectReason, setRejectReason] = useState("");

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await warehouseService.getTransactions({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        type: typeFilter === "ALL" ? undefined : typeFilter
      });
      setTransactions(data || []);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
        title: "Error",
        message: error?.response?.data?.message || "Failed to load transactions queue",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, showToast]);

  const fetchItems = useCallback(async () => {
    try {
      const data = await warehouseService.getItems();
      setItems(data || []);
      if (data && data.length > 0) {
        setSelectedItemId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load warehouse items for dropdown", err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Approve Transaction Handler
  const handleApprove = async (id: string) => {
    try {
      await warehouseService.approveTransactions([id]);
      showToast({ title: "Approved", message: "Transaction approved successfully", type: "success" });
      fetchTransactions();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
        title: "Approval Failed",
        message: error?.response?.data?.message || "Failed to approve transaction",
        type: "error"
      });
    }
  };

  // Reject Transaction Submit
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId) return;
    if (!rejectReason.trim()) {
      showToast({ title: "Validation Error", message: "Rejection reason is required", type: "error" });
      return;
    }
    try {
      await warehouseService.rejectTransactions([selectedTxId], rejectReason);
      showToast({ title: "Rejected", message: "Transaction rejected successfully", type: "success" });
      setShowRejectModal(false);
      setSelectedTxId(null);
      setRejectReason("");
      fetchTransactions();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
        title: "Rejection Failed",
        message: error?.response?.data?.message || "Failed to reject transaction",
        type: "error"
      });
    }
  };

  // Create Transaction Handler
  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      showToast({ title: "Error", message: "Please select an item", type: "error" });
      return;
    }
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    if (txQty <= 0) {
      showToast({ title: "Error", message: "Quantity must be greater than 0", type: "error" });
      return;
    }

    try {
      await warehouseService.adjustItem(selectedItemId, {
        mode: txMode,
        quantity: Number(txQty)
      });
      showToast({ 
        title: "Transaction Created", 
        message: `Stock adjustment requested for ${item.name}`, 
        type: "success" 
      });
      setShowNewTxModal(false);
      setTxQty(1);
      fetchTransactions();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
        title: "Transaction Failed",
        message: error?.response?.data?.message || "Failed to create transaction",
        type: "error"
      });
    }
  };

  const getStatusBadge = (status: WarehouseApprovalStatus) => {
    switch (status) {
      case "อนุมัติ":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case "ไม่อนุมัติ":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
            <XCircle size={12} /> Rejected
          </span>
        );
      case "รออนุมัติ":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            <Clock size={12} /> Pending Review
          </span>
        );
    }
  };

  const getTxTypeBadge = (type: string) => {
    const isRestock = type === "เติมสินค้า" || type === "เพิ่มสินค้าใหม่";
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${
        isRestock 
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
      }`}>
        {isRestock ? "📈 Inbound" : "📉 Outbound"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Operations Log</p>
          <h1 className="text-3xl font-semibold text-white">Movement Queue</h1>
          <p className="text-xs text-white/50">Authorize and review all real-time inventory movements.</p>
        </div>
        <button 
          onClick={() => setShowNewTxModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 transition px-4 py-2.5 text-xs font-semibold shadow-lg shadow-[var(--accent)]/5"
        >
          <Plus size={16} />
          New Transaction
        </button>
      </header>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-white/40 mr-2 flex items-center gap-1"><Filter size={12}/> Status</span>
          {(["ALL", "รออนุมัติ", "อนุมัติ", "ไม่อนุมัติ"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium transition ${
                statusFilter === status 
                  ? "bg-[var(--accent)] border-[var(--accent)] text-black" 
                  : "bg-[var(--surface-2)] text-white/70 hover:text-white"
              }`}
            >
              {status === "ALL" ? "🌐 All" : status === "รออนุมัติ" ? "⏳ Pending" : status === "อนุมัติ" ? "✅ Approved" : "❌ Rejected"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-white/40 mr-2">Type</span>
          {(["ALL", "เติมสินค้า", "เบิกสินค้า"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium transition ${
                typeFilter === type 
                  ? "bg-[var(--accent)] border-[var(--accent)] text-black" 
                  : "bg-[var(--surface-2)] text-white/70 hover:text-white"
              }`}
            >
              {type === "ALL" ? "🌐 All" : type === "เติมสินค้า" ? "📈 Inbound" : "📉 Outbound"}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <Loader2 className="animate-spin text-[var(--accent)] mb-3" size={32} />
            <p className="text-sm">Loading movement logs...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-sm">No transaction records found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-white/60">
                <tr>
                  <th className="px-4 py-3.5">ID</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Item</th>
                  <th className="px-4 py-3.5">Qty</th>
                  <th className="px-4 py-3.5">Operator</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  {isAdminOrSuperuser && <th className="px-4 py-3.5 text-right">Authorize</th>}
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition text-white/80">
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-white tracking-wider">
                      {row.code}
                    </td>
                    <td className="px-4 py-4">
                      {getTxTypeBadge(row.type)}
                    </td>
                    <td className="px-4 py-4 font-medium text-white">
                      <div>{row.itemName}</div>
                      <div className="text-xs text-white/40 mt-0.5">Code: {row.itemCode}</div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-white">
                      {row.quantity}
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      {row.operator}
                    </td>
                    <td className="px-4 py-4 text-xs text-white/50">
                      {row.date ? new Date(row.date).toLocaleString('th-TH', { hour12: false }) : ""}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(row.approvalStatus)}
                      {row.rejectionReason && (
                        <div className="text-rose-400/80 text-xs mt-1 bg-rose-500/5 border border-rose-500/10 rounded-lg p-1.5 flex items-start gap-1 max-w-[200px]">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          <span>Reason: {row.rejectionReason}</span>
                        </div>
                      )}
                    </td>
                    {isAdminOrSuperuser && (
                      <td className="px-4 py-4 text-right">
                        {row.approvalStatus === "รออนุมัติ" ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(row.id)}
                              title="Approve Action"
                              className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/20 transition"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => { setSelectedTxId(row.id); setShowRejectModal(true); }}
                              title="Reject Action"
                              className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20 transition"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-white/30 font-medium italic">Handled</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      {showNewTxModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-semibold text-white">Create Stock Transaction</h3>
              <button onClick={() => setShowNewTxModal(false)} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTx} className="space-y-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Select Item</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.code}] {item.name} (Current: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Movement Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setTxMode("restock")}
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                      txMode === "restock"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-[var(--surface-2)] border-[var(--border)] text-white/60"
                    }`}
                  >
                    📈 Restock (Inbound)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxMode("withdraw")}
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                      txMode === "withdraw"
                        ? "bg-rose-500/10 border-rose-500 text-rose-400"
                        : "bg-[var(--surface-2)] border-[var(--border)] text-white/60"
                    }`}
                  >
                    📉 Withdraw (Outbound)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Quantity</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={txQty}
                  onChange={(e) => setTxQty(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowNewTxModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2.5 text-xs font-semibold text-white/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2.5 text-xs font-semibold text-black transition ${
                    txMode === "restock" ? "bg-emerald-400 hover:bg-emerald-500" : "bg-rose-400 hover:bg-rose-500"
                  }`}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-semibold text-white">Provide Rejection Reason</h3>
              <button onClick={() => { setShowRejectModal(false); setSelectedTxId(null); }} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Why is this transaction rejected?</label>
                <textarea
                  required
                  placeholder="Type rejection description..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)] animate-pulse"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => { setShowRejectModal(false); setSelectedTxId(null); }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2.5 text-xs font-semibold text-white/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-500 hover:bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white transition"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
