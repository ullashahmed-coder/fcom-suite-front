"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Plus, Edit3, Trash2, Box, Tag, 
  AlertTriangle, Layers, Eye, X, Filter, Image as ImageIcon, 
  CheckCircle2, Loader2, RotateCcw, Flame, TrendingUp, Download, Copy
} from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [activeKpi, setActiveKpi] = useState("ALL");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // 🚀 ইম্পোর্ট পপআপের স্টেট 
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // 🚀 স্টোর কোডের স্টেট
  const [myStoreCode, setMyStoreCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // 🚀 প্রাইস আপডেটের স্টেট
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchProductsAndOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { "Authorization": `Bearer ${token}` };

      const [prodRes, orderRes, codeRes] = await Promise.all([
        fetch(`${apiUrl}/products`, { headers }),
        fetch(`${apiUrl}/orders`, { headers }),
        fetch(`${apiUrl}/products/store/code`, { headers }) 
      ]);

      if (codeRes.ok) {
        const codeData = await codeRes.json();
        setMyStoreCode(codeData.secretCode);
      }
      
      if (prodRes.ok) {
        const allProducts = await prodRes.json();
        let allOrders = [];
        if (orderRes.ok) {
          allOrders = await orderRes.json();
        }

        const salesById: Record<string, { sold: number; revenue: number }> = {};
        const salesByName: Record<string, { sold: number; revenue: number }> = {};

        allOrders.forEach((order: any) => {
          if (!order.isDeleted && order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const qty = Number(item.quantity) || 1;
              const price = Number(item.price) || 0;
              const pId = item.productId || item.product?.id || item.id;
              
              if (pId) {
                const idStr = String(pId);
                if (!salesById[idStr]) salesById[idStr] = { sold: 0, revenue: 0 };
                salesById[idStr].sold += qty;
                salesById[idStr].revenue += qty * price;
              }

              const pName = (item.product?.name || item.name || "").trim().toLowerCase();
              if (pName) {
                if (!salesByName[pName]) salesByName[pName] = { sold: 0, revenue: 0 };
                salesByName[pName].sold += qty;
                salesByName[pName].revenue += qty * price;
              }
            });
          }
        });

        const updatedProducts = allProducts.map((p: any) => {
          const stats = salesById[String(p.id)] || salesByName[(p.name || "").trim().toLowerCase()] || { sold: p.soldCount || 0, revenue: (p.soldCount || 0) * (p.price || 0) };
          return {
            ...p,
            soldCount: stats.sold,
            totalRevenue: stats.revenue
          };
        });

        setProducts(updatedProducts);
      }
    } catch (error) {
      console.error("Failed to fetch products or orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndOrders();
  }, []);

  // 🚀 ড্রয়ার বা পপআপ ওপেন থাকলে মোবাইলের নিচের ন্যাভবার হাইড করার কন্ডিশন
  useEffect(() => {
    const bottomNav = document.getElementById("mobile-bottom-nav");
    
    if (bottomNav) {
      if (selectedProduct || isImportModalOpen || isPriceModalOpen) {
        bottomNav.style.display = "none";
      } else {
        bottomNav.style.display = "";
      }
    }
    
    return () => {
      if (bottomNav) bottomNav.style.display = "";
    };
  }, [selectedProduct, isImportModalOpen, isPriceModalOpen]);

  // 🚀 স্টোর কোড জেনারেট করার ফাংশন
  const handleGenerateStoreCode = async () => {
    setIsGeneratingCode(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/products/store/generate-code`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyStoreCode(data.secretCode);
        alert("আপনার স্টোরের জন্য নতুন সিক্রেট কোড তৈরি হয়েছে!");
      }
    } catch (error) {
      console.error("Generate code error:", error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // 🚀 স্টোর কোড কপি করার ফাংশন
  const handleCopyCode = () => {
    if (myStoreCode) {
      navigator.clipboard.writeText(myStoreCode);
      alert("কোড কপি করা হয়েছে: " + myStoreCode);
    }
  };

  // 🚀 স্টোর লেভেল ইম্পোর্ট ফাংশন (পেজ রিলোড ফিক্সড)
  const handleImportByCode = async () => {
    if (!secretCode) {
      alert("দয়া করে স্টোরের সিক্রেট কোডটি বসান!");
      return;
    }

    setIsImporting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/products/import-by-code`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          secretCode: secretCode.trim() 
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "প্রোডাক্টগুলো সফলভাবে ইম্পোর্ট করা হয়েছে!");
        setIsImportModalOpen(false);
        setSecretCode("");
        fetchProductsAndOrders(); 
      } else {
        alert(data.message || "প্রোডাক্ট ইম্পোর্ট করতে সমস্যা হয়েছে!");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("সার্ভার এরর! কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setIsImporting(false);
    }
  };

  // 🚀 দাম আপডেট করার ফাংশন (পেজ রিলোড ফিক্সড, অ্যালার্ট সরানো হয়েছে)
  const handleUpdatePrice = async () => {
    if (!selectedProduct?.sharedId || !newPrice) return;

    setIsUpdatingPrice(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/products/shared/${selectedProduct.sharedId}/price`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ customPrice: Number(newPrice) })
      });

      const data = await res.json();

      if (res.ok) {
        // 🚀 কোনো অ্যালার্ট ছাড়াই সরাসরি পপআপ ক্লোজ এবং ড্রয়ারে দাম আপডেট
        setIsPriceModalOpen(false);
        setNewPrice("");
        setSelectedProduct((prev: any) => ({ ...prev, price: Number(newPrice) }));
        fetchProductsAndOrders(); // ব্যাকগ্রাউন্ডে লিস্ট আপডেট হবে
      } else {
        alert(data.message || "দাম আপডেট করতে সমস্যা হয়েছে!");
      }
    } catch (error) {
      console.error("Update price error:", error);
      alert("সার্ভার এরর! কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

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
        fetchProductsAndOrders(); 
      } else {
        alert("Failed to move product to trash.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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
        fetchProductsAndOrders(); 
      } else {
        alert("Failed to restore product.");
      }
    } catch (error) {
      console.error("Restore error:", error);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/products/${id}/permanent`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Product permanently deleted!");
        setSelectedProduct(null);
        fetchProductsAndOrders(); 
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

  const activeProducts = products.filter(p => !p.isDeleted);
  const trashedProducts = products.filter(p => p.isDeleted);

  const totalProducts = activeProducts.length;
  const lowStockCount = activeProducts.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = activeProducts.filter(p => p.stock <= 0).length;
  const bestSellersCount = activeProducts.filter(p => (p.soldCount || 0) > 0).length;
  const trashCount = trashedProducts.length;

  const filteredProducts = products.filter(product => {
    if (activeKpi === "TRASH" && !product.isDeleted) return false;
    if (activeKpi !== "TRASH" && product.isDeleted) return false; 
    if (activeKpi === "LOW_STOCK" && (product.stock <= 0 || product.stock >= 10)) return false;
    if (activeKpi === "OUT_OF_STOCK" && product.stock > 0) return false;
    if (activeKpi === "BEST_SELLING" && (product.soldCount || 0) <= 0) return false;

    const matchCategory = activeCategory === "All" || product.category === activeCategory;
    const matchMin = minPrice === "" || product.price >= Number(minPrice);
    const matchMax = maxPrice === "" || product.price <= Number(maxPrice);
    const matchSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchCategory && matchMin && matchMax && matchSearch;
  }).sort((a, b) => {
    if (activeKpi === "BEST_SELLING") {
      return (b.soldCount || 0) - (a.soldCount || 0);
    }
    return 0;
  });

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-4 sm:p-6 font-sans transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Box className="text-indigo-600 dark:text-indigo-400" size={24} /> Products Inventory
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your catalog, pricing, and stock availability.</p>
          
          {/* 🚀 স্টোর সিক্রেট কোড ডিসপ্লে */}
          <div className="mt-3 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-2 rounded-lg w-fit">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Store Secret Code:</span>
            {myStoreCode ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-slate-800 dark:text-white bg-white dark:bg-[#1a2421] px-2 py-0.5 rounded shadow-sm">
                  {myStoreCode}
                </span>
                <button onClick={handleCopyCode} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1" title="Copy Code">
                  <Copy size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGenerateStoreCode} 
                disabled={isGeneratingCode}
                className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded shadow-sm hover:bg-indigo-700 font-bold transition-colors flex items-center gap-1"
              >
                {isGeneratingCode ? <Loader2 size={12} className="animate-spin"/> : "Generate Now"}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-md transition-colors"
          >
            <Download size={18} /> Import Store Catalog
          </button>
          <Link href="/dashboard/products/create" className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-md transition-colors">
            <Plus size={18} /> Add New Product
          </Link>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { id: "ALL", label: "Total Products", value: totalProducts, icon: <Layers size={18} />, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { id: "BEST_SELLING", label: "Best Selling", value: bestSellersCount, icon: <Flame size={18} />, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { id: "LOW_STOCK", label: "Low Stock", value: lowStockCount, icon: <AlertTriangle size={18} />, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { id: "OUT_OF_STOCK", label: "Out of Stock", value: outOfStockCount, icon: <X size={18} />, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
          { id: "TRASH", label: "Trash", value: trashCount, icon: <Trash2 size={18} />, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-white/10", span: "col-span-2 md:col-span-1" },
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            onClick={() => setActiveKpi(kpi.id)}
            className={`p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all cursor-pointer hover:shadow-md ${kpi.span || ''} ${
              activeKpi === kpi.id 
                ? `ring-2 ring-indigo-500 border-transparent bg-indigo-50/50 dark:bg-white/5` 
                : `border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2421]`
            }`}
          >
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{kpi.label}</p>
              <h3 className={`text-xl sm:text-2xl font-bold ${kpi.color}`}>{isLoading ? "-" : kpi.value}</h3>
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ================= TOOLBAR & FILTERS ================= */}
      <div className="bg-white dark:bg-[#1a2421] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 transition-colors">
        
        <div className="relative w-full xl:w-[300px] shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Product Name, SKU..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-transparent shadow-sm overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                  activeCategory === cat 
                    ? "bg-white dark:bg-[#1a2421] text-indigo-600 dark:text-indigo-400 font-bold shadow-sm" 
                    : "text-slate-600 dark:text-gray-400 font-medium hover:text-slate-800 dark:hover:text-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const statusLabel = getStockStatusText(product.stock);
            const soldCount = product.soldCount || 0;
            const totalRev = product.totalRevenue || soldCount * (product.price || 0);

            return (
              <div 
                key={product.id} 
                className={`bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group ${product.isDeleted ? 'opacity-75 grayscale-[50%]' : ''}`}
              >
                {/* Image Handle */}
                <div 
                  className={`h-36 sm:h-44 w-full relative bg-gray-100 dark:bg-[#141d1a] flex items-center justify-center cursor-pointer`}
                  onClick={() => setSelectedProduct(product)}
                >
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl.startsWith('http') ? product.imageUrl : `${apiUrl}${product.imageUrl}`} 
                      alt={product.name} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <ImageIcon size={32} className="text-gray-300 dark:text-white/20" />
                  )}

                  {soldCount > 0 && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500 text-white shadow-sm flex items-center gap-1">
                        <Flame size={10} /> Best Seller
                      </span>
                    </div>
                  )}

                  {product.isImported && (
                    <div className="absolute bottom-2.5 left-2.5 z-10">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                        <Download size={10} /> Imported
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shadow-sm backdrop-blur-md ${getStatusColor(statusLabel)}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* DETAILS SECTION */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {product.category || "Uncategorized"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">SKU: {product.sku}</span>
                  </div>
                  
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mt-1 leading-snug line-clamp-1 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {product.name}
                  </h3>

                  {/* Sold & Revenue Info Card */}
                  <div className="mb-3 bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                      <TrendingUp size={12} className="text-emerald-500" /> Sold: <strong className="text-slate-800 dark:text-white">{soldCount} pcs</strong>
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      ৳ {totalRev.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-3 bg-gray-50 dark:bg-[#141d1a] p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Price</p>
                        <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white">৳ {product.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Stock</p>
                        <p className={`text-xs sm:text-sm font-bold ${product.stock > 10 ? 'text-slate-700 dark:text-gray-300' : 'text-rose-600 dark:text-rose-400'}`}>
                          {product.stock} <span className="text-[10px] font-normal">pcs</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                      {!product.isDeleted ? (
                        <>
                          {!product.isImported ? (
                            <Link 
                              href={`/dashboard/products/${product.id}/edit`} 
                              className="flex items-center justify-center gap-1.5 py-1.5 bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-gray-300 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              <Edit3 size={13} /> Edit
                            </Link>
                          ) : (
                            <button 
                              onClick={() => {
                                setSelectedProduct(product);
                                setNewPrice(product.price.toString());
                                setIsPriceModalOpen(true);
                              }}
                              className="flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 hover:text-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              <Tag size={13} /> Change Price
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-50/50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleRestore(product.id)}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            <RotateCcw size={13} /> Restore
                          </button>
                          
                          <button 
                            onClick={() => handlePermanentDelete(product.id)}
                            className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            <Trash2 size={13} /> Delete
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                    {selectedProduct.category || "Uncategorized"}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getStatusColor(getStockStatusText(selectedProduct.stock))}`}>
                    {getStockStatusText(selectedProduct.stock)}
                  </span>
                  {selectedProduct.isImported && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center gap-1">
                      <Download size={10} /> Imported
                    </span>
                  )}
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
                      <p className="text-[15px] font-bold text-slate-800 dark:text-white">{selectedProduct.soldCount || 0} Units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Revenue</p>
                    <p className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">৳ {(selectedProduct.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a2421] grid grid-cols-2 gap-3 shrink-0">
              <button 
                onClick={() => selectedProduct.isDeleted ? handlePermanentDelete(selectedProduct.id) : handleDelete(selectedProduct.id)}
                className="py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> {selectedProduct.isDeleted ? "Delete Forever" : "Move to Trash"}
              </button>
              
              {!selectedProduct.isDeleted ? (
                !selectedProduct.isImported ? (
                  <Link 
                    href={`/dashboard/products/${selectedProduct.id}/edit`} 
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Edit3 size={16}/> Edit Product
                  </Link>
                ) : (
                  <button 
                    onClick={() => {
                      setNewPrice(selectedProduct.price.toString());
                      setIsPriceModalOpen(true);
                    }}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Tag size={16}/> Change Price
                  </button>
                )
              ) : (
                <button 
                  onClick={() => handleRestore(selectedProduct.id)}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <RotateCcw size={16}/> Restore
                </button>
              )}
            </div>

          </div>
        </>
      )}

      {/* ================= 🚀 IMPORT MODAL ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Download size={20} className="text-emerald-600" /> Import Store Catalog
              </h3>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-rose-500 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Store Secret Code
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. CHORKA-MASTER"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-center tracking-widest font-mono text-lg"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the secret code of the master store to instantly import all their active products.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleImportByCode}
                  disabled={isImporting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-70"
                >
                  {isImporting ? <Loader2 size={18} className="animate-spin" /> : "Import All Products"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 🚀 UPDATE PRICE MODAL ================= */}
      {isPriceModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Tag size={20} className="text-emerald-600" /> Update Price
              </h3>
              <button 
                onClick={() => setIsPriceModalOpen(false)}
                className="text-gray-400 hover:text-rose-500 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-gray-100 dark:border-white/5">
                  Updating retail price for <strong className="text-slate-800 dark:text-white block mt-1">{selectedProduct.name}</strong>
                </p>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  New Selling Price (৳)
                </label>
                <input 
                  type="number"
                  required
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-xl font-bold"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleUpdatePrice}
                  disabled={isUpdatingPrice}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-70"
                >
                  {isUpdatingPrice ? <Loader2 size={18} className="animate-spin" /> : "Save Price"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}