'use client';

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  Search, Plus, Edit2, Trash2, ArrowUpDown, Loader2, X 
} from "lucide-react";
import { warehouseService, type WarehouseItem, type WarehouseCategory } from "@/services/warehouse.service";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";

export default function InventoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // State
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | WarehouseCategory>("ALL");

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);

  // Form States
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuantity, setFormQuantity] = useState(0);
  const [formMinQuantity, setFormMinQuantity] = useState(0);
  const [formUnit, setFormUnit] = useState("Pcs");
  const [formCategory, setFormCategory] = useState<WarehouseCategory>("CON");

  // Adjust Form States
  const [adjustMode, setAdjustMode] = useState<"restock" | "withdraw">("restock");
  const [adjustQty, setAdjustQty] = useState(1);

  // Fetch items
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await warehouseService.getItems({
        search: search || undefined,
        category: categoryFilter === "ALL" ? undefined : categoryFilter
      });
      setItems(data || []);
    } catch (err: any) {
      showToast({
        title: "Error",
        message: err?.response?.data?.message || "Failed to load inventory items",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  // Add Item Action
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUnit) {
      showToast({ title: "Validation Error", message: "Name and Unit are required", type: "error" });
      return;
    }
    try {
      await warehouseService.createItem({
        code: formCode || undefined,
        name: formName,
        description: formDescription,
        quantity: Number(formQuantity),
        minimumQuantity: Number(formMinQuantity),
        unit: formUnit,
        category: formCategory
      });
      showToast({ title: "Success", message: "Item added successfully", type: "success" });
      setShowAddModal(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      showToast({
        title: "Create Failed",
        message: err?.response?.data?.message || "Failed to create item",
        type: "error"
      });
    }
  };

  // Edit Item Action
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await warehouseService.updateItem(selectedItem.id, {
        code: formCode || undefined,
        name: formName,
        description: formDescription,
        minimumQuantity: Number(formMinQuantity),
        unit: formUnit,
        category: formCategory
      });
      showToast({ title: "Success", message: "Item updated successfully", type: "success" });
      setShowEditModal(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      showToast({
        title: "Update Failed",
        message: err?.response?.data?.message || "Failed to update item",
        type: "error"
      });
    }
  };

  // Delete Item Action
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await warehouseService.deleteItem(id);
      showToast({ title: "Success", message: "Item deleted successfully", type: "success" });
      fetchItems();
    } catch (err: any) {
      showToast({
        title: "Delete Failed",
        message: err?.response?.data?.message || "Failed to delete item",
        type: "error"
      });
    }
  };

  // Adjust Stock Action
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (adjustQty <= 0) {
      showToast({ title: "Error", message: "Quantity must be greater than 0", type: "error" });
      return;
    }
    try {
      await warehouseService.adjustItem(selectedItem.id, {
        mode: adjustMode,
        quantity: Number(adjustQty)
      });
      showToast({ 
        title: "Stock Adjusted", 
        message: `${adjustMode === "restock" ? "Restocked" : "Withdrew"} ${adjustQty} ${selectedItem.unit} successfully`, 
        type: "success" 
      });
      setShowAdjustModal(false);
      setAdjustQty(1);
      fetchItems();
    } catch (err: any) {
      showToast({
        title: "Adjustment Failed",
        message: err?.response?.data?.message || "Failed to adjust stock",
        type: "error"
      });
    }
  };

  const openEditModal = (item: WarehouseItem) => {
    setSelectedItem(item);
    setFormCode(item.code || "");
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormMinQuantity(item.minimumQuantity || 0);
    setFormUnit(item.unit);
    setFormCategory(item.category);
    setShowEditModal(true);
  };

  const openAdjustModal = (item: WarehouseItem) => {
    setSelectedItem(item);
    setAdjustMode("restock");
    setAdjustQty(1);
    setShowAdjustModal(true);
  };

  const resetForm = () => {
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormQuantity(0);
    setFormMinQuantity(0);
    setFormUnit("Pcs");
    setFormCategory("CON");
    setSelectedItem(null);
  };

  const getCategoryLabel = (cat: WarehouseCategory) => {
    switch (cat) {
      case "MED": return "🏥 Medical";
      case "EQU": return "🛠️ Equipment";
      case "CON": return "📦 Consumable";
      default: return cat;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Inventory Control</p>
          <h1 className="text-3xl font-semibold text-white">Stock Directory</h1>
          <p className="text-xs text-white/50">Manage warehouse assets and logs instantly.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] transition px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-[var(--accent)]/10"
        >
          <Plus size={16} />
          Add New Item
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
          />
          <Search size={16} className="absolute left-3 top-3 text-white/40" />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "MED", "EQU", "CON"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium transition ${
                categoryFilter === cat 
                  ? "bg-[var(--accent)] border-[var(--accent)] text-black" 
                  : "bg-[var(--surface-2)] text-white/70 hover:text-white"
              }`}
            >
              {cat === "ALL" ? "🌐 All Categories" : getCategoryLabel(cat as WarehouseCategory)}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <Loader2 className="animate-spin text-[var(--accent)] mb-3" size={32} />
            <p className="text-sm">Fetching stock records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-sm">No items found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-white/60">
                <tr>
                  <th className="px-4 py-3.5">SKU</th>
                  <th className="px-4 py-3.5">Item</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Min Qty</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const minQty = row.minimumQuantity || 0;
                  const isOutOfStock = row.quantity <= 0;
                  const isLowStock = row.quantity <= minQty;

                  return (
                    <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition text-white/80">
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-white tracking-wider">
                        {row.code}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{row.name}</div>
                        {row.description && <div className="text-xs text-white/40 mt-0.5">{row.description}</div>}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium">
                        {getCategoryLabel(row.category)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-white">
                        {row.quantity} <span className="text-xs text-white/40 font-normal">{row.unit}</span>
                      </td>
                      <td className="px-4 py-4 text-white/60">{minQty}</td>
                      <td className="px-4 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openAdjustModal(row)}
                            title="Adjust Stock"
                            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--surface-3)] transition"
                          >
                            <ArrowUpDown size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(row)}
                            title="Edit"
                            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-blue-400 hover:bg-[var(--surface-3)] transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(row.id)}
                            title="Delete"
                            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-rose-400 hover:bg-[var(--surface-3)] transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-semibold text-white">Add New Warehouse Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-102"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as WarehouseCategory)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="CON">📦 Consumable</option>
                    <option value="EQU">🛠️ Equipment</option>
                    <option value="MED">🏥 Medical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic Pump"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Description</label>
                <textarea
                  placeholder="Details about the item..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Initial Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Min Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={formMinQuantity}
                    onChange={(e) => setFormMinQuantity(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pcs"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2.5 text-xs font-semibold text-white/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] px-5 py-2.5 text-xs font-semibold text-black transition"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-semibold text-white">Edit Warehouse Item</h3>
              <button onClick={() => setShowEditModal(false)} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditItem} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-102"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as WarehouseCategory)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="CON">📦 Consumable</option>
                    <option value="EQU">🛠️ Equipment</option>
                    <option value="MED">🏥 Medical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic Pump"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Description</label>
                <textarea
                  placeholder="Details about the item..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Min Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={formMinQuantity}
                    onChange={(e) => setFormMinQuantity(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pcs"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2.5 text-xs font-semibold text-white/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] px-5 py-2.5 text-xs font-semibold text-black transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-semibold text-white">Adjust Stock Quantity</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-white/60 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdjustStock} className="space-y-4 mt-4">
              <div className="rounded-xl bg-[var(--surface-2)] p-4 border border-[var(--border)]">
                <div className="text-xs uppercase tracking-wide text-white/40">Item Code / Name</div>
                <div className="text-sm font-semibold text-white mt-1">{selectedItem.code} - {selectedItem.name}</div>
                <div className="text-xs text-white/60 mt-1">Current Stock: <span className="text-white font-semibold">{selectedItem.quantity} {selectedItem.unit}</span></div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setAdjustMode("restock")}
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                      adjustMode === "restock"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-[var(--surface-2)] border-[var(--border)] text-white/60"
                    }`}
                  >
                    📈 Restock (Inbound)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode("withdraw")}
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                      adjustMode === "withdraw"
                        ? "bg-rose-500/10 border-rose-500 text-rose-400"
                        : "bg-[var(--surface-2)] border-[var(--border)] text-white/60"
                    }`}
                  >
                    📉 Withdraw (Outbound)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Quantity to Adjust ({selectedItem.unit})</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg(--surface-3)] px-4 py-2.5 text-xs font-semibold text-white/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2.5 text-xs font-semibold text-black transition ${
                    adjustMode === "restock" ? "bg-emerald-400 hover:bg-emerald-500" : "bg-rose-400 hover:bg-rose-500"
                  }`}
                >
                  Confirm Adjustment
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
