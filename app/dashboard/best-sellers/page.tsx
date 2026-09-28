"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Flame, Box, Loader2, Search, ShoppingBag, BarChart3, CalendarDays } from "lucide-react"

export default function BestSellersPage() {
  const router = useRouter()
  const [rawOrders, setRawOrders] = useState<any[]>([])
  const [rawProducts, setRawProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // 🚀 ডাইনামিক ফিল্টার স্টেট (ডিফল্ট: All Time)
  const [dateFilter, setDateFilter] = useState("All Time")
  const defaultFilters = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "All Time"]

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token")
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        
        // 🚀 ড্যাশবোর্ডের মতো প্রোডাক্ট এবং অর্ডার একসাথেই ফেচ করা হচ্ছে যেন ফিল্টারিং করা সহজ হয়
        const [prodRes, orderRes] = await Promise.all([
          fetch(`${apiUrl}/products?limit=5000`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${apiUrl}/orders?limit=5000`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (prodRes.ok && orderRes.ok) {
          const prodData = await prodRes.json();
          const orderData = await orderRes.json();
          
          setRawProducts(prodData?.data ? prodData.data : (Array.isArray(prodData) ? prodData : []));
          setRawOrders(orderData?.data ? orderData.data : (Array.isArray(orderData) ? orderData : []));
        }
      } catch (error) {
        console.error("Failed to fetch best sellers data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAllData()
  }, [])

  // 🚀 ডাইনামিক ফিল্টার অনুযায়ী ডাটা ক্যালকুলেট করার লজিক
  const processedSarees = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesById: Record<string, number> = {};
    const revenueById: Record<string, number> = {};

    const activeOrders = rawOrders.filter((o: any) => !o.isDeleted);

    activeOrders.forEach((o: any) => {
      const orderDate = new Date(o.createdAt || o.updatedAt);
      orderDate.setHours(0, 0, 0, 0);

      let passesFilter = false;

      if (dateFilter === "Today") {
        passesFilter = orderDate.getTime() === today.getTime();
      } else if (dateFilter === "Yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        passesFilter = orderDate.getTime() === yesterday.getTime();
      } else if (dateFilter === "Last 7 Days") {
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        passesFilter = orderDate.getTime() >= last7.getTime();
      } else if (dateFilter === "Last 30 Days") {
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        passesFilter = orderDate.getTime() >= last30.getTime();
      } else if (/^\d{4}-\d{2}$/.test(dateFilter)) { 
        // 🚀 Month Picker Filter Logic (e.g., 2026-09)
        const [year, month] = dateFilter.split('-');
        passesFilter = orderDate.getMonth() === Number(month) - 1 && orderDate.getFullYear() === Number(year);
      } else {
        passesFilter = true; // All Time
      }

      // যদি অর্ডারটি সিলেক্ট করা সময়ের মধ্যে হয়, তবেই সেলস কাউন্ট হবে
      if (passesFilter && o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const revenue = qty * price;
          const pId = item.productId || item.product?.id || item.id;
          
          if (pId) {
            salesById[String(pId)] = (salesById[String(pId)] || 0) + qty;
            revenueById[String(pId)] = (revenueById[String(pId)] || 0) + revenue;
          }
        });
      }
    });

    const ranked = rawProducts
      .filter((p: any) => !p.isDeleted)
      .map((p: any) => {
        const sold = salesById[String(p.id)] || 0;
        const rev = revenueById[String(p.id)] || 0;
        return { ...p, sold, revenue: rev };
      })
      .filter((p: any) => p.sold > 0) // 🚀 শুধুমাত্র যেগুলোর বিক্রি হয়েছে সেগুলোই দেখাবে
      .sort((a: any, b: any) => b.sold - a.sold);

    return ranked;
  }, [rawOrders, rawProducts, dateFilter]);

  const getImageUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith('http') ? path : `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  }

  const isMonthFormat = /^\d{4}-\d{2}$/.test(dateFilter);

  const getDisplayFilterName = (val: string) => {
    if (/^\d{4}-\d{2}$/.test(val)) {
      const [year, month] = val.split('-');
      const date = new Date(Number(year), Number(month) - 1);
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); 
    }
    return val;
  };

  // সার্চ ফিল্টার লজিক
  const filteredSarees = processedSarees.filter(saree => 
    (saree.name && saree.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (saree.sku && saree.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalItemsSold = filteredSarees.reduce((sum, item) => sum + (item.sold || 0), 0)
  const totalRevenueGenerated = filteredSarees.reduce((sum, item) => sum + (item.revenue || 0), 0)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <p className="text-slate-500 dark:text-gray-400 font-medium">লোডিং বেস্ট সেলার্স...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 p-4 sm:p-6 space-y-6 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen transition-colors duration-300">
      
      {/* ================= Header & Summary ================= */}
      <div className="bg-white dark:bg-[#1a2421] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 rounded-xl transition-colors border border-gray-200 dark:border-transparent shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Flame className="text-amber-500" size={24} /> Best Selling Products
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-0.5">Top performing products ranked by total sales volume and revenue.</p>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
            <div className="bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-100 dark:border-amber-500/20 text-right shrink-0">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">Total Sold <span className="text-[9px] bg-amber-200 dark:bg-amber-600/30 text-amber-800 dark:text-amber-300 px-1.5 rounded">{getDisplayFilterName(dateFilter)}</span></p>
              <p className="text-lg font-black text-amber-700 dark:text-amber-300 flex items-center justify-end gap-1"><ShoppingBag size={16}/> {totalItemsSold}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-right shrink-0">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">Total Revenue <span className="text-[9px] bg-emerald-200 dark:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 px-1.5 rounded">{getDisplayFilterName(dateFilter)}</span></p>
              <p className="text-lg font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-end gap-1"><BarChart3 size={16}/> ৳ {totalRevenueGenerated.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* ================= Filters & Search ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2 border-t border-gray-100 dark:border-white/10 mt-2">
          
          {/* 🚀 Dynamic Month Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-[#141d1a] p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-inner overflow-x-auto w-full md:w-auto max-w-full custom-scrollbar">
            {defaultFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3.5 py-1.5 text-[10px] sm:text-[11px] rounded-lg transition-colors whitespace-nowrap font-bold ${
                  dateFilter === filter 
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100 dark:border-amber-500/20" 
                    : "text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-[#1a2421]"
                }`}
              >
                {filter}
              </button>
            ))}
            
            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 shrink-0"></div>
            
            <input 
              type="month"
              value={isMonthFormat ? dateFilter : ""}
              onChange={(e) => {
                if(e.target.value) {
                  setDateFilter(e.target.value);
                } else {
                  setDateFilter("All Time"); 
                }
              }}
              title="Select Month (Clear to see All Time)"
              className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg outline-none cursor-pointer transition-colors border shrink-0 ${
                isMonthFormat
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm border-amber-100 dark:border-amber-500/20"
                  : dateFilter === "All Time"
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm border-indigo-100 dark:border-indigo-500/20"
                    : "bg-transparent text-slate-500 dark:text-gray-400 border-transparent hover:text-slate-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-[#1a2421]"
              }`}
            />
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search product name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ================= Saree Grid ================= */}
      {filteredSarees.length === 0 ? (
        <div className="bg-white dark:bg-[#1a2421] p-16 sm:p-20 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 gap-3 transition-colors">
          <CalendarDays size={48} className="opacity-40" />
          <h3 className="text-lg font-bold text-slate-600 dark:text-gray-300 text-center">
            {isMonthFormat ? `এই মাসে (${getDisplayFilterName(dateFilter)}) কোনো প্রোডাক্ট বিক্রি হয়নি।` : 'এই সময়ে কোনো প্রোডাক্ট বিক্রি হয়নি।'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredSarees.map((saree, index) => (
            <div key={saree.id || index} className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-lg dark:hover:border-white/20 transition-all p-3 sm:p-4 relative flex flex-col group">
              
              {/* Rank Badge */}
              <div className={`absolute -top-3 -left-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black shadow-md z-10 border-2 dark:border-[#1a2421] border-white
                ${index === 0 ? 'bg-amber-400 text-amber-900' : 
                  index === 1 ? 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-white' : 
                  index === 2 ? 'bg-amber-700 text-white dark:bg-amber-600' : 
                  'bg-white dark:bg-[#141d1a] text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'}`}
              >
                #{index + 1}
              </div>

              {/* Image */}
              <div className="bg-slate-50 dark:bg-[#141d1a] rounded-xl h-36 sm:h-48 mb-3 sm:mb-4 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-white/5">
                {saree.thumbnail || saree.imageUrl ? (
                  <img 
                    src={getImageUrl(saree.thumbnail || saree.imageUrl)} 
                    alt={saree.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                ) : (
                  <span className="text-slate-400 dark:text-gray-600 font-bold text-xs">No Image</span>
                )}
              </div>

              {/* Details */}
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-gray-100 mb-3 sm:mb-4 line-clamp-2 leading-tight" title={saree.name}>
                {saree.name}
              </h4>

              <div className="flex justify-between items-end mt-auto pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-white/10">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Sold</p>
                  <p className="text-base sm:text-lg font-black text-slate-700 dark:text-gray-200">{saree.sold}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Revenue</p>
                  <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">৳ {saree.revenue.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}