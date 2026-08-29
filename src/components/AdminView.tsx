import { useState, useEffect, useCallback } from "react";
import type { MenuItem, MenuCategory, AdminUser } from "../lib/types";
import { MENU, MENU_CATEGORIES, IMG_FALLBACK } from "../lib/menu";
import { hasRole } from "../lib/auth";
import { IconX as X, IconPlus as Plus, IconEdit2 as Edit2, IconTrash2 as Trash2, IconSave as Save } from "./Icons";

interface AdminViewProps {
  currentUser: AdminUser;
  onClose: () => void;
}

export function AdminView({ currentUser, onClose }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "categories">("menu");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU);
  const [filterCategory, setFilterCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state untuk edit/add
  const [formData, setFormData] = useState<Partial<MenuItem>>({});

  // Handle ESC key untuk keluar dari popup
  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (showDeleteConfirm) {
        setShowDeleteConfirm(null);
      } else if (editingItem || isAdding) {
        setEditingItem(null);
        setIsAdding(false);
        setFormData({});
      } else {
        onClose();
      }
    }
  }, [showDeleteConfirm, editingItem, isAdding, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [handleEscKey]);

  // Cek permission admin
  const isAdmin = hasRole(currentUser, "admin");
  const isStaff = hasRole(currentUser, "staff");

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = filterCategory === "semua" || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle form changes
  const handleFormChange = (field: keyof MenuItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save item (create or update)
  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.category) {
      alert("Mohon lengkapi semua field wajib!");
      return;
    }

    if (editingItem) {
      // Update existing item
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, ...formData } as MenuItem
            : item
        )
      );
      setEditingItem(null);
    } else {
      // Add new item
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: formData.name!,
        category: formData.category as any,
        price: Number(formData.price),
        desc: formData.desc || "",
        img: formData.img || IMG_FALLBACK,
        popular: formData.popular || false,
        spicy: formData.spicy || false,
        available: formData.available ?? true,
      };
      setMenuItems((prev) => [...prev, newItem]);
    }

    setIsAdding(false);
    setFormData({});
  };

  // Delete item
  const handleDelete = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    setShowDeleteConfirm(null);
  };

  // Start editing
  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsAdding(false);
  };

  // Cancel edit/add
  const cancelEdit = () => {
    setEditingItem(null);
    setIsAdding(false);
    setFormData({});
  };

  // Start adding new item
  const startAdd = () => {
    setFormData({
      category: "makanan",
      available: true,
      popular: false,
      spicy: false,
    });
    setIsAdding(true);
    setEditingItem(null);
  };

  // Refresh menu items (untuk sinkronisasi data terbaru)
  useEffect(() => {
    // Force re-render dengan mengupdate state menuItems dari MENU
    setMenuItems([...MENU]);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-playfair">
              Panel Manajemen Menu
            </h2>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1">
              Login sebagai: {currentUser.name} ({currentUser.role})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Tutup panel"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-4 sm:px-6">
          <div className="flex gap-4 sm:gap-8">
            <button
              onClick={() => setActiveTab("menu")}
              className={`py-3 sm:py-4 text-sm sm:text-base font-medium border-b-2 transition-colors ${
                activeTab === "menu"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Kelola Menu
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-3 sm:py-4 text-sm sm:text-base font-medium border-b-2 transition-colors ${
                activeTab === "categories"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Kategori
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "menu" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
                  />
                  
                  {/* Category filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="semua">Semua Kategori</option>
                    {MENU_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.category}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(isAdmin || isStaff) && (
                  <button
                    onClick={startAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Menu
                  </button>
                )}
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow ${
                      !item.available ? "opacity-60" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-40 sm:h-48 bg-gray-100">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = IMG_FALLBACK;
                        }}
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.popular && (
                          <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">
                            ⭐ Populer
                          </span>
                        )}
                        {item.spicy && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                            🌶️ Pedas
                          </span>
                        )}
                        {!item.available && (
                          <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded-full font-medium">
                            Tidak Tersedia
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {(isAdmin || isStaff) && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
                            aria-label="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(item.id)}
                            className="p-1.5 bg-white/90 hover:bg-red-100 rounded-lg shadow-sm transition-colors"
                            aria-label="Hapus"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.desc}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-emerald-700 font-bold text-sm sm:text-base">
                          Rp {item.price.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm sm:text-base">
                    Tidak ada menu yang ditemukan
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Manajemen kategori menu (fitur coming soon)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MENU_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className="border rounded-xl p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cat.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-gray-500 capitalize">
                          ID: {cat.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Edit/Add */}
        {(editingItem || isAdding) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingItem ? "Edit Menu" : "Tambah Menu Baru"}
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Menu *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Nasi Goreng Spesial"
                  />
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori *
                    </label>
                    <select
                      value={formData.category || "makanan"}
                      onChange={(e) => handleFormChange("category", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {MENU_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.category}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga (Rp) *
                    </label>
                    <input
                      type="number"
                      value={formData.price || ""}
                      onChange={(e) => handleFormChange("price", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="25000"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.desc || ""}
                    onChange={(e) => handleFormChange("desc", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Deskripsi menu..."
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Gambar
                  </label>
                  <input
                    type="url"
                    value={formData.img || ""}
                    onChange={(e) => handleFormChange("img", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.popular || false}
                      onChange={(e) => handleFormChange("popular", e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">⭐ Populer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.spicy || false}
                      onChange={(e) => handleFormChange("spicy", e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">🌶️ Pedas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.available ?? true}
                      onChange={(e) => handleFormChange("available", e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">✅ Tersedia</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 sm:p-6 border-t flex justify-end gap-3">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Hapus Menu?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Apakah Anda yakin ingin menghapus menu ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
