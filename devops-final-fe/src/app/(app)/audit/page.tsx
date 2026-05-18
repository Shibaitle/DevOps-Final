'use client';

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  Search, Loader2, Info, X, Clock, ShieldAlert, ArrowRight, Eye 
} from "lucide-react";
import { auditService, type AuditLog } from "@/services/audit.service";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";

export default function AuditPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = user?.role_name?.toLowerCase().includes("admin");

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let data: AuditLog[] = [];
      if (search.trim()) {
        data = await auditService.searchLogs(search);
      } else {
        data = await auditService.getLogs();
      }
      setLogs(data || []);
    } catch (err: any) {
      showToast({
        title: "Forbidden",
        message: err?.response?.data?.message || "Failed to load audit logs. Admin credentials required.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("INSERT")) {
      return (
        <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
          INSERT
        </span>
      );
    }
    if (act.includes("UPDATE") || act.includes("PATCH") || act.includes("EDIT")) {
      return (
        <span className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
          UPDATE
        </span>
      );
    }
    if (act.includes("DELETE") || act.includes("REMOVE")) {
      return (
        <span className="inline-flex rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
          DELETE
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
        {action}
      </span>
    );
  };

  const formatJson = (val?: string) => {
    if (!val) return "None";
    try {
      const obj = JSON.parse(val);
      return JSON.stringify(obj, null, 2);
    } catch {
      return val;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
        <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <ShieldAlert size={48} className="animate-bounce" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-white/50 mt-1 max-w-sm">
            Only designated Admin accounts are authorized to inspect the system audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Security Compliance</p>
        <h1 className="text-3xl font-semibold text-white">System Audit Log</h1>
        <p className="text-xs text-white/50">Immutable logs detailing insert, update, and delete actions across all database tables.</p>
      </header>

      {/* Search Bar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="Search logs by action, table name, operator, or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
          />
          <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
        </form>
        <button 
          type="submit" 
          onClick={fetchLogs}
          className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] transition px-5 py-2.5 text-xs font-semibold text-black"
        >
          Search
        </button>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <Loader2 className="animate-spin text-[var(--accent)] mb-3" size={32} />
            <p className="text-sm">Fetching system activities...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-sm">No audit entries found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-white/60">
                <tr>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Table</th>
                  <th className="px-4 py-3.5">Record ID</th>
                  <th className="px-4 py-3.5">Operator ID</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row, idx) => (
                  <tr key={idx} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition text-white/80">
                    <td className="px-4 py-4">
                      {getActionBadge(row.action)}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-white/90">
                      {row.table_name}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-white/50">
                      {row.record_id}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-white/60">
                      {row.user_id}
                    </td>
                    <td className="px-4 py-4 text-xs text-white/50">
                      {row.created_at ? new Date(row.created_at).toLocaleString('th-TH', { hour12: false }) : ""}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(row)}
                        className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--surface-3)] transition inline-flex items-center gap-1 text-xs"
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Log Modal */}
      {selectedLog && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Inspect Compliance Event</h3>
                {getActionBadge(selectedLog.action)}
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl bg-[var(--surface-2)] p-4 border border-[var(--border)] text-xs">
                <div>
                  <div className="text-white/40 uppercase">Table affected</div>
                  <div className="font-semibold text-white mt-1 font-mono">{selectedLog.table_name}</div>
                </div>
                <div>
                  <div className="text-white/40 uppercase">Record target id</div>
                  <div className="font-semibold text-white mt-1 font-mono">{selectedLog.record_id}</div>
                </div>
                <div>
                  <div className="text-white/40 uppercase">operator uuid</div>
                  <div className="font-semibold text-white mt-1 font-mono">{selectedLog.user_id}</div>
                </div>
                <div>
                  <div className="text-white/40 uppercase">timestamp</div>
                  <div className="font-semibold text-white mt-1">
                    {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : ""}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-rose-400/80 mb-1.5 flex items-center gap-1">
                    <span>Previous State (Old Value)</span>
                  </div>
                  <pre className="text-xs font-mono bg-black/40 border border-[var(--border)] rounded-xl p-4 text-rose-300/85 overflow-x-auto max-h-[40vh]">
                    {formatJson(selectedLog.old_value)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-emerald-400/80 mb-1.5 flex items-center gap-1">
                    <span>Next State (New Value)</span>
                    <ArrowRight size={12} className="text-emerald-500" />
                  </div>
                  <pre className="text-xs font-mono bg-black/40 border border-[var(--border)] rounded-xl p-4 text-emerald-300/85 overflow-x-auto max-h-[40vh]">
                    {formatJson(selectedLog.new_value)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border)] mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-5 py-2.5 text-xs font-semibold text-white transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
