"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Plus, Edit3, Trash2, Box, Tag, 
  AlertTriangle, Layers, Eye, X, Filter, Image as ImageIcon, CheckCircle2, Loader2, RotateCcw
} from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // 🚀 নতুন: KPI কার্ড ফিল্টারিংয়ের জন্য স্টেট
  const [activeKpi, setActiveKpi] = useState("ALL");

  // প্রাইস রেঞ্জের জন্য স্টেট
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/products`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to move this product to trash?")) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("Product moved to trash!");
        setSelectedProduct(null);
        fetchProducts(); 
      } else {
        alert("Failed to move product to trash.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // 🚀 Restore Function
  const handleRestore = async (id: string) => {
    if (!id) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/products/${id}/restore`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("Product restored!");
        setSelectedProduct(null);
        fetchProducts(); 
      } else {
        alert("Failed to restore product.");
      }
    } catch (error) {
      console.error("Restore error:", error);
    }
  };

  // 🚀 Permanent Delete Function
  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/products/${id}/permanent`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("Product permanently deleted!");
        setSelectedProduct(null);
        fetchProducts(); 
      } else {
        alert("Failed to permanently delete product.");
      }
    } catch (error) {
      console.error("Permanent delete error:", error);
    }
  };

  const categories = ["All", "Cotton", "Jamdani", "Half Silk", "Antic", "Mixed Silk"];

  const getStockStatusText = (stock: number) => {
    if (stock <= 0) return "Out of Stock";
    if (stock < 10) return "Low Stock";
    return "In Stock";
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "In Stock": return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
      case "Low Stock": return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
      case "Out of Stock": return "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // 🚀 KPI ক্যালকুলেশন 
  const activeProducts = products.filter(p => !p.isDeleted);
  const trashedProducts = products.filter(p => p.isDeleted);

  const totalProducts = activeProducts.length;
  const lowStockCount = activeProducts.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = activeProducts.filter(p => p.stock <= 0).length;
  const activeCategoriesCount = new Set(activeProducts.map(p => p.category).filter(Boolean)).size;
  const trashCount = trashedProducts.length;

  // 🚀 মাল্টি-লেভেল ফিল্টারিং লজিক
  const filteredProducts = products.filter(product => {
    if (activeKpi === "TRASH" && !product.isDeleted) return false;
    if (activeKpi !== "TRASH" && product.isDeleted) return false; 
    if (activeKpi === "LOW_STOCK" && (product.stock <= 0 || product.stock >= 10)) return false;
    if (activeKpi === "OUT_OF_STOCK" && product.stock > 0) return false;

    const matchCategory = activeCategory === "All" || product.category === activeCategory;
    const matchMin = minPrice === "" || product.price >= Number(minPrice);
    const matchMax = maxPrice === "" || product.price <= Number(maxPrice);
    
    return matchCategory && matchMin && matchMax;
  });

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-6 font-sans transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Box className="text-indigo-600 dark:text-indigo-400" size={24} /> Products Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your catalog, pricing, and stock availability.</p>
        </div>
        
        <Link href="/dashboard/products/create" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors">
          <Plus size={18} /> Add New Product
        </Link>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[
          { id: "ALL", label: "Total Products", value: totalProducts, icon: <Layers size={18} />, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { id: "LOW_STOCK", label: "Low Stock", value: lowStockCount, icon: <AlertTriangle size={18} />, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { id: "OUT_OF_STOCK", label: "Out of Stock", value: outOfStockCount, icon: <X size={18} />, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
          { id: "CATEGORIES", label: "Categories", value: activeCategoriesCount, icon: <Tag size={18} />, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10", noClick: true },
          { id: "TRASH", label: "Trash", value: trashCount, icon: <Trash2 size={18} />, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-white/10" },
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            onClick={() => !kpi.noClick && setActiveKpi(kpi.id)}
            className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
              kpi.noClick ? 'cursor-default border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2421]' : 'cursor-pointer hover:shadow-md'
            } ${
              activeKpi === kpi.id 
                ? `ring-2 ring-indigo-500 border-transparent bg-indigo-50/50 dark:bg-white/5` 
                : `border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2421]`
            }`}
          >
            <div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{kpi.label}</p>
              <h3 className={`text-2xl font-bold ${kpi.color}`}>{isLoading ? "-" : kpi.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ================= TOOLBAR & FILTERS ================= */}
      <div className="bg-white dark:bg-[#1a2421] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 transition-colors">
        
        <div className="relative w-full xl:w-[320px] shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by Product Name, SKU..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-transparent shadow-sm overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 text-[12px] rounded-full transition-colors whitespace-nowrap ${
                  activeCategory === cat 
                    ? "bg-white dark:bg-[#1a2421] text-indigo-600 dark:text-indigo-400 font-bold shadow-sm dark:border dark:border-white/10" 
                    : "text-slate-600 dark:text-gray-400 font-medium hover:text-slate-800 dark:hover:text-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-1.5 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm">
             <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Price:</span>
             <input 
               type="number" 
               placeholder="Min" 
               value={minPrice}
               onChange={(e) => setMinPrice(e.target.value)}
               className="w-16 px-2 py-1 text-xs bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
             />
             <span className="text-gray-400 text-xs">-</span>
             <input 
               type="number" 
               placeholder="Max" 
               value={maxPrice}
               onChange={(e) => setMaxPrice(e.target.value)}
               className="w-16 px-2 py-1 text-xs bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
             />
          </div>
        </div>
      </div>

      {/* ================= PRODUCTS GRID ================= */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Box size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">No products found</h3>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or category selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const statusLabel = getStockStatusText(product.stock);
            return (
              <div 
                key={product.id} 
                className={`bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group ${product.isDeleted ? 'opacity-75 grayscale-[50%]' : ''}`}
              >
                {/* Image Handle */}
                <div className={`h-48 w-full relative bg-gray-100 dark:bg-[#141d1a] flex items-center justify-center`}>
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl.startsWith('http') ? product.imageUrl : `${apiUrl}${product.imageUrl}`} 
                      alt={product.name} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                  ) : (
                    <ImageIcon size={32} className="text-gray-300 dark:text-white/20" />
                  )}
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm backdrop-blur-md ${getStatusColor(statusLabel)}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                      {product.category || "Uncategorized"}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">SKU: {product.sku}</span>
                  </div>
                  
                  <h3 className="text-[15px] font-bold text-slate-800 dark:text-white mt-2 leading-tight line-clamp-2 mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Price</p>
                        <p className="text-lg font-extrabold text-slate-800 dark:text-white">৳ {product.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Stock</p>
                        <p className={`text-[15px] font-bold ${product.stock > 10 ? 'text-slate-700 dark:text-gray-300' : 'text-rose-600 dark:text-rose-400'}`}>
                          {product.stock} <span className="text-xs font-normal">pcs</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 dark:border-white/10">
                      {!product.isDeleted ? (
                        <>
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="flex items-center justify-center gap-1.5 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 rounded-lg text-[12px] font-bold transition-colors"
                          >
                            <Eye size={14} /> Quick View
                          </button>
                          
                          <Link 
                            href={`/dashboard/products/${product.id}/edit`} 
                            className="flex items-center justify-center gap-1.5 py-2 bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-gray-300 rounded-lg text-[12px] font-bold transition-colors"
                          >
                            <Edit3 size={14} /> Edit
                          </Link>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleRestore(product.id)}
                            className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[12px] font-bold transition-colors"
                          >
                            <RotateCcw size={14} /> Restore
                          </button>
                          
                          <button 
                            onClick={() => handlePermanentDelete(product.id)}
                            className="flex items-center justify-center gap-1.5 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[12px] font-bold transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= RIGHT DRAWER ================= */}
      {selectedProduct && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedProduct(null)}
          />
          
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1a2421] shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
            
            <div className={`h-48 w-full relative bg-gray-100 dark:bg-[#141d1a] flex items-center justify-center shrink-0`}>
              {selectedProduct.imageUrl ? (
                <img 
                  src={selectedProduct.imageUrl.startsWith('http') ? selectedProduct.imageUrl : `${apiUrl}${selectedProduct.imageUrl}`} 
                  alt={selectedProduct.name} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              ) : (
                <ImageIcon size={48} className="text-gray-300 dark:text-white/20" />
              )}
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                    {selectedProduct.category || "Uncategorized"}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getStatusColor(getStockStatusText(selectedProduct.stock))}`}>
                    {getStockStatusText(selectedProduct.stock)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  SKU: <span className="font-mono bg-gray-100 dark:bg-white/10 px-1.5 rounded">{selectedProduct.sku}</span>
                </p>
                {selectedProduct.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Selling Price</p>
                  <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">৳ {selectedProduct.price}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Stock</p>
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{selectedProduct.stock} <span className="text-sm font-normal text-gray-500">pcs</span></p>
                </div>
              </div>

              <div>
                <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Product Performance</h3>
                <div className="bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 uppercase">Total Sold</p>
                      <p className="text-[15px] font-bold text-slate-800 dark:text-white">0 Units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Revenue</p>
                    <p className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">৳ 0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* আপডেট করা ড্রয়ার ফুটার */}
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a2421] grid grid-cols-2 gap-3 shrink-0">
              <button 
                onClick={() => selectedProduct.isDeleted ? handlePermanentDelete(selectedProduct.id) : handleDelete(selectedProduct.id)}
                className="py-3 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> {selectedProduct.isDeleted ? "Delete Forever" : "Move to Trash"}
              </button>
              
              {!selectedProduct.isDeleted ? (
                <Link 
                  href={`/dashboard/products/${selectedProduct.id}/edit`} 
                  className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Edit3 size={16}/> Edit Product
                </Link>
              ) : (
                <button 
                  onClick={() => handleRestore(selectedProduct.id)}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <RotateCcw size={16}/> Restore
                </button>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
}