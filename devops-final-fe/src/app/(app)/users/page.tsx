'use client';

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  UserPlus, ShieldAlert, Trash2, Loader2, Check, X, Search, Mail, User, Power
} from "lucide-react";
import { adminService, type AdminUser } from "@/services/admin.service";
import { authService } from "@/services/auth.service";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";

export default function UsersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdmin = user?.role_name?.toLowerCase().includes("admin");

  // SSR Safe Portal Mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // State
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Form State
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formNickname, setFormNickname] = useState("");
  const [formGender, setFormGender] = useState("Other");
  const [formRole, setFormRole] = useState("warehouse");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllUsers();
      setUsersList(data || []);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
        title: "Access Denied",
        message: error?.response?.data?.message || "Failed to load users list",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, fetchUsers]);

  // Invite User Submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formEmail || !formPassword || !formFirstName || !formLastName) {
      showToast({ title: "Validation Error", message: "Please fill out all required fields", type: "error" });
      return;
    }

    try {
      await authService.register({
        username: formUsername,
        email: formEmail,
        password: formPassword,
        first_name: formFirstName,
        last_name: formLastName,
        nickname: formNickname || undefined,
        gender: formGender,
        role_name: formRole
      });

      showToast({ 
        title: "Account Created", 
        message: `Successfully invited user '${formUsername}'. Ready for activation!`, 
        type: "success" 
      });
      setShowInviteModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
        title: "Invite Failed",
        message: error?.response?.data?.message || "Failed to invite new user",
        type: "error"
      });
    }
  };

  // Toggle User Approval (Active / Pending)
  const handleToggleApproval = async (targetUser: AdminUser) => {
    const nextState = !targetUser.is_approve;
    try {
      await adminService.updateUserApproval(targetUser.user_id, nextState);
      showToast({ 
        title: nextState ? "User Activated" : "User Suspended", 
        message: `${targetUser.first_name} is now ${nextState ? "Active" : "Pending Approval"}`, 
        type: "success" 
      });
      fetchUsers();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
        title: "Update Failed",
        message: error?.response?.data?.message || "Failed to change user approval status",
        type: "error"
      });
    }
  };

  // Delete User Account
  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (targetUser.user_id === user?.user_id) {
      showToast({ title: "Operation Blocked", message: "You cannot delete your own admin account!", type: "error" });
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete the user account for ${targetUser.first_name}?`)) return;

    try {
      await adminService.deleteUser(targetUser.user_id);
      showToast({ title: "User Deleted", message: "Account removed successfully", type: "success" });
      fetchUsers();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast({
        title: "Deletion Failed",
        message: error?.response?.data?.message || "Failed to delete user",
        type: "error"
      });
    }
  };

  const resetForm = () => {
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormFirstName("");
    setFormLastName("");
    setFormNickname("");
    setFormGender("Other");
    setFormRole("warehouse");
  };

  const getRoleBadge = (roleName?: string) => {
    const role = roleName?.toLowerCase() || "";
    if (role.includes("admin")) {
      return <span className="inline-flex rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-400">🛡️ Admin</span>;
    }
    if (role.includes("super")) {
      return <span className="inline-flex rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-xs font-semibold text-purple-400">⚡ Super User</span>;
    }
    if (role.includes("warehouse")) {
      return <span className="inline-flex rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-xs font-semibold text-blue-400">🏭 Warehouse</span>;
    }
    if (role.includes("inventory")) {
      return <span className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-400">📦 Inventory</span>;
    }
    return <span className="inline-flex rounded-full bg-slate-500/10 border border-slate-500/30 px-2 py-0.5 text-xs font-semibold text-slate-400">{role || "Staff"}</span>;
  };

  // Filter logic
  const filteredUsers = usersList.filter((item) => {
    const matchesSearch = 
      item.username.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.first_name.toLowerCase().includes(search.toLowerCase()) ||
      item.last_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = 
      roleFilter === "ALL" || 
      (item.role?.name || "").toLowerCase().includes(roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
        <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <ShieldAlert size={48} className="animate-bounce" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-white/50 mt-1 max-w-sm">
            Only designated Admin accounts are authorized to access the User Directory and role assignment controls.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Administration</p>
          <h1 className="text-3xl font-semibold text-white">Users & Roles</h1>
          <p className="text-xs text-white/50">Authorize accounts, update access levels, and invite new staff members.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowInviteModal(true); }}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] transition px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-[var(--accent)]/10"
        >
          <UserPlus size={16} />
          Invite User
        </button>
      </header>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search users by name, username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
          />
          <Search size={16} className="absolute left-3 top-3.5 text-white/40" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "admin", "superuser", "warehouse", "inventory", "requester"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium transition ${
                roleFilter === r 
                  ? "bg-[var(--accent)] border-[var(--accent)] text-black" 
                  : "bg-[var(--surface-2)] text-white/70 hover:text-white"
              }`}
            >
              {r === "ALL" ? "🌐 All Roles" : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <Loader2 className="animate-spin text-[var(--accent)] mb-3" size={32} />
            <p className="text-sm">Retrieving users list...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-sm">No registered users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-white/60">
                <tr>
                  <th className="px-4 py-3.5">Name / Username</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Authorize Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((row) => (
                  <tr key={row.user_id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition text-white/80">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {row.first_name} {row.last_name}
                        {row.nickname && <span className="text-xs text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">({row.nickname})</span>}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
                        <User size={12} /> {row.username}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      <span className="flex items-center gap-1"><Mail size={12} className="text-white/30" /> {row.email}</span>
                    </td>
                    <td className="px-4 py-4">
                      {getRoleBadge(row.role?.name)}
                    </td>
                    <td className="px-4 py-4">
                      {row.is_approve ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Toggle active status */}
                        <button
                          onClick={() => handleToggleApproval(row)}
                          title={row.is_approve ? "Deactivate User" : "Activate User"}
                          className={`p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition ${
                            row.is_approve ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {row.is_approve ? <Power size={14} /> : <Check size={14} />}
                        </button>
                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(row)}
                          disabled={row.user_id === user?.user_id}
                          title="Delete User"
                          className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-rose-400 hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite/Register User Modal */}
      {showInviteModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-semibold text-white">Invite / Create Staff Account</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. staff_member"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Assign Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="warehouse">🏭 Warehouse Staff</option>
                    <option value="inventory">📦 Inventory Staff</option>
                    <option value="requester">👥 Requester</option>
                    <option value="superuser">⚡ Super User</option>
                    <option value="admin">🛡️ Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. email@domain.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Nickname</label>
                  <input
                    type="text"
                    placeholder="Optional nickname"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2.5 text-xs font-semibold text-white/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] px-5 py-2.5 text-xs font-semibold text-black transition"
                >
                  Create Account
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
