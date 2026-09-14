"use client";

import React, { useState, useEffect } from "react";
import { 
  Flame, Package, Search, ArrowLeft, Loader2, Award, TrendingUp 
} from "lucide-react";
import Link from "next/link";

export default function BestSellingProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchBestSellingData();
  }, []);

  const fetchBestSellingData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { "Authorization": `Bearer ${token}` };

      const [prodRes, orderRes] = await Promise.all([
        fetch(`${apiUrl}/products`, { headers }),
        fetch(`${apiUrl}/orders`, { headers })
      ]);

      if (prodRes.ok && orderRes.ok) {
        const allProducts: any[] = await prodRes.json();
        const allOrders: any[] = await orderRes.json();

        // 🚀 আইডি ও নাম দুইভাবেই ট্র্যাক করার ম্যাপ
        const salesById: Record<string, { sold: number; totalRevenue: number }> = {};
        const salesByName: Record<string, { sold: number; totalRevenue: number }> = {};

        // ট্র্যাশ বা ডিলিট হওয়া ছাড়া বাকি সব অর্ডারের আইটেম হিসাব করা
        allOrders.forEach((order: any) => {
          if (!order.isDeleted && order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const qty = Number(item.quantity) || 1;
              const price = Number(item.price) || 0;

              // ১. বিভিন্ন সম্ভাব্য ফিল্ড থেকে প্রোডাক্ট আইডি বের করা
              const rawId = item.productId || item.product?.id || item.id;
              if (rawId) {
                const pId = String(rawId);
                if (!salesById[pId]) {
                  salesById[pId] = { sold: 0, totalRevenue: 0 };
                }
                salesById[pId].sold += qty;
                salesById[pId].totalRevenue += qty * price;
              }

              // ২. নাম দিয়েও ম্যাপ করা (যদি আইডি মিসম্যাচ হয়)
              const pName = (item.product?.name || item.name || "").trim().toLowerCase();
              if (pName) {
                if (!salesByName[pName]) {
                  salesByName[pName] = { sold: 0, totalRevenue: 0 };
                }
                salesByName[pName].sold += qty;
                salesByName[pName].totalRevenue += qty * price;
              }
            });
          }
        });

        // প্রোডাক্টগুলোর সাথে সেলস ডাটা যুক্ত করা
        const processedProducts = allProducts
          .filter((p: any) => !p.isDeleted)
          .map((p: any) => {
            const pId = String(p.id);
            const pName = (p.name || "").trim().toLowerCase();

            // প্রথমে আইডি দিয়ে খুঁজবে, না পেলে নাম দিয়ে
            const stats = salesById[pId] || salesByName[pName] || {
              sold: Number(p.soldCount) || 0,
              totalRevenue: (Number(p.soldCount) || 0) * (Number(p.price) || 0)
            };

            const sold = stats.sold;
            const revenue = stats.totalRevenue > 0 ? stats.totalRevenue : sold * (Number(p.price) || 0);

            return {
              ...p,
              soldCount: sold,
              totalRevenue: revenue
            };
          })
          .sort((a: any, b: any) => b.soldCount - a.soldCount); // সর্বোচ্চ বিক্রি হওয়াগুলো ক্রমানুসারে থাকবে

        setProducts(processedProducts);
      }
    } catch (error) {
      console.error("Failed to fetch best selling data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductImage = (product: any) => {
    if (product.imageUrl) {
      return product.imageUrl.startsWith("http") ? product.imageUrl : `${apiUrl}${product.imageUrl}`;
    }
    return null;
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-500 font-medium">বেস্ট সেলিং ডাটা হিসাব করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-12 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-4 sm:p-6 font-sans transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white dark:bg-[#1a2421] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Flame className="text-amber-500" size={26} /> Best Selling Products
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Top performing products ranked by total sales volume and revenue.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product name or SKU..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10">
          <Package size={48} className="mx-auto text-gray-400 mb-3 opacity-50" />
          <p className="text-slate-600 dark:text-gray-400 font-bold">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredProducts.map((product, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;
            const totalRevenue = product.totalRevenue || 0;

            return (
              <div 
                key={product.id || index}
                className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative group"
              >
                {/* Ranking Badge */}
                <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-md ${
                  rank === 1 ? 'bg-amber-500 text-white' :
                  rank === 2 ? 'bg-slate-400 text-white' :
                  rank === 3 ? 'bg-amber-700 text-white' : 'bg-black/60 backdrop-blur-md text-white'
                }`}>
                  {isTopThree && <Award size={12} />} #{rank}
                </div>

                {/* Product Image */}
                <div className="w-full h-48 bg-gray-100 dark:bg-white/5 relative overflow-hidden flex items-center justify-center">
                  {getProductImage(product) ? (
                    <img 
                      src={getProductImage(product)} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <Package className="text-gray-400" size={40} />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 truncate">
                      SKU: {product.sku || 'N/A'}
                    </p>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/5 text-xs">
                    

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium flex items-center gap-1">
                        <TrendingUp size={12} className="text-emerald-500" /> Sold:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {product.soldCount || 0} Pcs
                      </span>
                    </div>

                    {/* Price & Total Sale Row */}
                    <div className="pt-2 border-t border-dashed border-gray-100 dark:border-white/5 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-400">Price:</span>
                        <span className="font-bold text-slate-700 dark:text-gray-300">৳ {product.price || 0}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Sale:</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ৳ {totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}