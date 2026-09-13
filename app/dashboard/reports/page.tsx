"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, TrendingUp, DollarSign, ShoppingCart, 
  ArrowUpRight, ArrowDownRight, Download, Map, 
  PieChart, Calendar, Package, Loader2, Image as ImageIcon
} from "lucide-react";

export default function ReportsAnalyticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState("Last 30 Days");
  const dateFilters = ["Today", "Last 7 Days", "Last 30 Days", "This Year", "All Time"];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.filter((o: any) => !o.isDeleted)); 
      }
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getMappedStatus = (status: string) => {
    const s = status?.toUpperCase() || "";
    if (['DELIVERED', 'PARTIAL DELIVERED', 'PARTIAL_DELIVERED'].includes(s)) return 'DELIVERED';
    if (['RETURNED', 'RETURN ACCEPTED'].includes(s)) return 'RETURNED';
    if (['CANCELLED'].includes(s)) return 'CANCELLED';
    if (['SHIPPED', 'IN TRANSIT', 'COURIER_PENDING'].includes(s)) return 'IN_TRANSIT';
    return 'OTHER';
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    orderDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "Today") {
      return orderDate.getTime() === today.getTime();
    } else if (dateFilter === "Last 7 Days") {
      const last7 = new Date(today);
      last7.setDate(today.getDate() - 7);
      return orderDate.getTime() >= last7.getTime();
    } else if (dateFilter === "Last 30 Days") {
      const last30 = new Date(today);
      last30.setDate(today.getDate() - 30);
      return orderDate.getTime() >= last30.getTime();
    } else if (dateFilter === "This Year") {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return orderDate.getTime() >= startOfYear.getTime();
    }
    return true; 
  });

  let totalRevenue = 0;
  let totalOrders = filteredOrders.length;
  
  let deliveredCount = 0;
  let inTransitCount = 0;
  let returnedCount = 0;
  let cancelledCount = 0;

  const productMap: Record<string, { name: string, sales: number, revenue: number, image: string }> = {};
  const districtMap: Record<string, number> = {};
  const revenueByDate: Record<string, number> = {};

  filteredOrders.forEach(order => {
    const status = getMappedStatus(order.status);
    const amount = Number(order.totalAmount) || 0;

    if (status === 'DELIVERED') deliveredCount++;
    else if (status === 'IN_TRANSIT') inTransitCount++;
    else if (status === 'RETURNED') returnedCount++;
    else if (status === 'CANCELLED') cancelledCount++;

    if (status !== 'RETURNED' && status !== 'CANCELLED') {
      totalRevenue += amount;
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + amount;
    }

    const district = order.customer?.district || "Unknown";
    districtMap[district] = (districtMap[district] || 0) + amount;

    if (order.items && Array.isArray(order.items) && status !== 'CANCELLED' && status !== 'RETURNED') {
      order.items.forEach((item: any) => {
        const pName = item.product?.name || "Unknown Product";
        const pId = item.productId || pName;
        const pImage = item.product?.imageUrl || item.product?.thumbnail || "";
        const lineRevenue = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        
        if (!productMap[pId]) {
          productMap[pId] = { name: pName, sales: 0, revenue: 0, image: pImage };
        }
        productMap[pId].sales += (Number(item.quantity) || 0);
        productMap[pId].revenue += lineRevenue;
      });
    }
  });

  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const returnRate = totalOrders > 0 ? ((returnedCount / totalOrders) * 100).toFixed(1) : "0.0";

  const salesData = Object.entries(revenueByDate)
    .map(([label, value]) => ({ label, value, originalDate: new Date(label + ` ${new Date().getFullYear()}`) }))
    .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
    .slice(-7);

  const maxChartValue = Math.max(...salesData.map(d => d.value), 1);

  const productColors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-blue-500"];
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p, idx) => ({ ...p, color: productColors[idx % productColors.length] }));

  const topDistricts = Object.entries(districtMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => {
      const percentage = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : "0";
      return { name, amount, percentage: `${percentage}%` };
    });

  const calculatePercent = (count: number) => totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : "0.0";

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-[#3b82f6]" size={40} />
        <p className="text-slate-500 font-medium">অ্যানালিটিক্স ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-4 sm:p-6 font-sans transition-colors duration-300">
      
      {/* ================= HEADER & TOOLBAR ================= */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-[#3b82f6]" size={22} /> Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your store's performance, revenue, and growth.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Pill Date Filters - Scrollable on mobile */}
          <div className="flex items-center bg-white dark:bg-[#1a2421] p-1 rounded-full border border-gray-200 dark:border-white/10 shadow-sm overflow-x-auto w-full sm:w-auto max-w-full">
            {dateFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3.5 py-1.5 text-[11px] sm:text-[12px] rounded-full transition-colors whitespace-nowrap ${
                  dateFilter === filter 
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-sm border border-blue-100 dark:border-blue-500/20" 
                    : "text-slate-500 dark:text-gray-400 font-medium hover:text-slate-800 dark:hover:text-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-800 dark:bg-white hover:bg-slate-700 dark:hover:bg-gray-100 text-white dark:text-slate-900 rounded-lg text-xs sm:text-sm font-bold shadow-md transition-colors w-full sm:w-auto shrink-0">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS (RESPONSIVE GRID) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
        
        {/* Total Revenue */}
        <div className="bg-white dark:bg-[#1a2421] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-[10px] sm:text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Total Sells</p>
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white truncate">৳ {totalRevenue.toLocaleString('en-IN')}</h3>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-[#1a2421] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
          </div>
          <p className="text-[10px] sm:text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Total Orders</p>
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white">{totalOrders}</h3>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-[#1a2421] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-[10px] sm:text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Avg. Order Value</p>
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white truncate">৳ {avgOrderValue.toLocaleString('en-IN')}</h3>
        </div>

        {/* Return Rate */}
        <div className="bg-white dark:bg-[#1a2421] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <p className="text-[10px] sm:text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Return Rate</p>
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white">{returnRate}%</h3>
        </div>

      </div>

      {/* ================= CHARTS ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-4 sm:p-6 flex flex-col transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <div>
              <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-800 dark:text-white">Revenue Overview</h2>
              <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1"><Calendar size={12}/> Showing data for {dateFilter}</p>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#3b82f6] dark:text-blue-400">৳ {totalRevenue > 1000000 ? (totalRevenue / 1000000).toFixed(2) + 'M' : totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
          
          {/* CSS Bar Chart */}
          <div className="flex-1 flex items-end gap-2 sm:gap-6 h-52 sm:h-56 mt-auto border-b border-gray-100 dark:border-white/5 pb-2 overflow-x-auto">
            {salesData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Revenue Data for this period.</div>
            ) : (
              salesData.map((data, idx) => {
                const heightPercentage = Math.max((data.value / maxChartValue) * 100, 5); 
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 gap-2 group min-w-[32px]">
                    <div className="w-full flex items-end justify-center h-44 sm:h-48 relative">
                       <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ৳ {data.value.toLocaleString('en-IN')}
                       </div>
                       <div 
                         className="w-full max-w-[36px] bg-blue-100 dark:bg-blue-500/20 group-hover:bg-[#3b82f6] dark:group-hover:bg-blue-500 rounded-t-md transition-all duration-500 ease-out cursor-pointer"
                         style={{ height: `${heightPercentage}%` }}
                       ></div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-full">{data.label}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Sales by District */}
        <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-4 sm:p-6 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Map className="text-emerald-500" size={18}/> Top Districts
            </h2>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {topDistricts.length === 0 ? (
               <div className="text-center text-gray-400 py-10 text-xs">No data available</div>
            ) : (
              topDistricts.map((dist, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[12px] sm:text-[13px] font-bold text-slate-700 dark:text-gray-200">{dist.name}</span>
                    <div className="text-right flex items-center gap-1.5">
                      <span className="text-[11px] sm:text-[12px] font-bold text-slate-800 dark:text-white leading-tight">৳ {dist.amount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-gray-400">({dist.percentage})</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden flex items-center">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: dist.percentage }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ================= BOTTOM ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-4 sm:p-6 transition-colors overflow-hidden">
          <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <PieChart className="text-indigo-500" size={18} /> Top Selling Products
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[340px]">
              <thead className="border-b border-gray-100 dark:border-white/10 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3 text-center">Units</th>
                  <th className="pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-400 text-xs">No product sales yet.</td>
                  </tr>
                ) : (
                  topProducts.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 flex items-center gap-2 sm:gap-3">
                        {product.image ? (
                          <img 
                            src={product.image.startsWith('http') ? product.image : `${apiUrl}${product.image}`} 
                            alt={product.name} 
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-white/10" 
                          />
                        ) : (
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${product.color} shrink-0`}></div>
                        )}
                        <span className="text-[12px] sm:text-[13px] font-bold text-slate-700 dark:text-gray-200 truncate max-w-[140px] sm:max-w-[200px]" title={product.name}>{product.name}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-[11px] sm:text-[12px] font-bold text-slate-800 dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">{product.sales}</span>
                      </td>
                      <td className="py-3 text-right text-[12px] sm:text-[13px] font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        ৳ {product.revenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-4 sm:p-6 transition-colors">
          <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-800 dark:text-white mb-5">Order Status Breakdown</h2>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3 sm:p-4 flex flex-col justify-center items-center text-center transition-colors">
              <p className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Delivered</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300">{calculatePercent(deliveredCount)}%</h3>
              <p className="text-[10px] text-gray-500 mt-1">{deliveredCount} Orders</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3 sm:p-4 flex flex-col justify-center items-center text-center transition-colors">
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">In Transit</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-300">{calculatePercent(inTransitCount)}%</h3>
              <p className="text-[10px] text-gray-500 mt-1">{inTransitCount} Orders</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3 sm:p-4 flex flex-col justify-center items-center text-center transition-colors">
              <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Returned</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-rose-700 dark:text-rose-300">{calculatePercent(returnedCount)}%</h3>
              <p className="text-[10px] text-gray-500 mt-1">{returnedCount} Orders</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 sm:p-4 flex flex-col justify-center items-center text-center transition-colors">
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Cancelled</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-white">{calculatePercent(cancelledCount)}%</h3>
              <p className="text-[10px] text-gray-500 mt-1">{cancelledCount} Orders</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}