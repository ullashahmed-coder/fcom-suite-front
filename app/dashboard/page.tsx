"use client";

import React, { useState, useEffect } from "react";
import PlatformAnnouncement from "../components/PlatformAnnouncement";
import { DollarSign, ShoppingBag, Loader2, Info } from "lucide-react";
import Link from "next/link";

type ActivityEntry = { id: number; side: "user"|"system"; time: string; status: string; statusColorClass: string; dotColorClass: string; detail?: string; };

const LOW_STOCK_THRESHOLD = 10;

function formatBDT(amount: number) { return `৳ ${amount.toLocaleString("en-US")}`; }

function getStockStatus(stock: number): { label: string; className: string } {
  if (stock <= 0) {
    return { label: "Out of Stock", className: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10" };
  }
  if (stock < LOW_STOCK_THRESHOLD) {
    return { label: "Low Stock", className: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" };
  }
  return { label: "In Stock", className: "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" };
}

const CARD_CLASS = "bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors";

function Panel({ title, actionHref, actionLabel = "View All", className = "", children }: any) {
  return (
    <div className={`${CARD_CLASS} p-4 sm:p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-700 dark:text-gray-100">{title}</h3>
        {actionHref && (
          <Link href={actionHref} className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 sm:px-0 sm:py-0 sm:bg-transparent rounded-md sm:rounded-none">
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function ThumbPlaceholder({ size = "w-6 h-6", rounded = "rounded" }: { size?: string; rounded?: string }) {
  return <div className={`${size} bg-gray-200 dark:bg-white/10 ${rounded}`} aria-hidden="true" />;
}

export default function TenantDashboardHome() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [userInitial, setUserInitial] = useState("U");
  const [userRole, setUserRole] = useState("ADMIN");
  
  const [dateFilter, setDateFilter] = useState("Last 30 Days");
  const defaultFilters = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "All Time"];
  
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEntry[]>([]);
  
  const [dashStats, setDashStats] = useState<any>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.name || "User");
      setUserInitial(parsedUser.name ? parsedUser.name.charAt(0).toUpperCase() : "U");
      setUserRole(parsedUser.role ? parsedUser.role.replace('_', ' ').toUpperCase() : "ADMIN");
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [dashRes, bestSellersRes, logsRes, invRes] = await Promise.all([
          fetch(`${apiUrl}/orders/dashboard-stats?filter=${encodeURIComponent(dateFilter)}`, { headers }),
          fetch(`${apiUrl}/products/best-sellers?filter=${encodeURIComponent(dateFilter)}`, { headers }),
          fetch(`${apiUrl}/activity-logs?limit=5`, { headers }),
          fetch(`${apiUrl}/products?limit=100`, { headers })
        ]);

        if (dashRes.ok) {
          const dJson = await dashRes.json();
          setDashStats(dJson.data || null);
        }

        if (bestSellersRes.ok) {
          const bJson = await bestSellersRes.json();
          setBestSellers(bJson.data || []);
        }

        if (invRes.ok) {
          const iJson = await invRes.json();
          const prods = iJson.data || iJson || [];
          setInventory(prods.filter((p: any) => !p.isDeleted));
        }

        if (logsRes.ok) {
          const lJson = await logsRes.json();
          const logs = lJson.data || lJson;
          if (logs && logs.length > 0) {
            const formattedLogs = logs.map((log: any, index: number) => ({
              id: log.id || index,
              side: (index % 2 === 0) ? "system" : "user",
              time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: log.type ? log.type.split('_').pop() : "ACTION",
              statusColorClass: "text-emerald-500 dark:text-emerald-400",
              dotColorClass: "bg-emerald-500 dark:bg-emerald-400",
              detail: log.action
            }));
            setActivityFeed(formattedLogs);
          }
        }

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [apiUrl, dateFilter]); 

  const getDisplayFilterName = (val: string) => {
    if (/^\d{4}-\d{2}$/.test(val)) {
      const [year, month] = val.split('-');
      const date = new Date(Number(year), Number(month) - 1);
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); 
    }
    return val;
  };

  const fStats = dashStats?.filteredStats || { total: 0, delivered: 0, deliveredAmount: 0, pending: 0, pendingAmount: 0, cancelled: 0, cancelledAmount: 0 };
  const kStats = dashStats?.kpiStats || { salesToday: 0, pendingPacking: 0 };
  const immediateAttention = dashStats?.immediateAttentionItems || [];
  const districtSales = dashStats?.districtSales || [];
  const teamStats = dashStats?.teamStats?.length > 0 ? dashStats.teamStats : [{ id: "1", initial: userInitial, name: userName, role: userRole, tasks: 0 }];

  if (loading && !dashStats) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#f8f9fc] dark:bg-[#0f1714]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <p className="text-emerald-600 dark:text-emerald-400 font-bold">ড্যাশবোর্ড লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1500px] mx-auto pb-10 min-h-screen p-4 sm:p-6 bg-[#f8f9fc] dark:bg-[#0f1714] transition-colors duration-300">
      
      <PlatformAnnouncement />
      
      {/* ================= KPI CARDS (Sells Today & New Orders) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`${CARD_CLASS} p-5 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sells Today</p>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{formatBDT(kStats.salesToday)}</h3>
          </div>
        </div>

        <div className={`${CARD_CLASS} p-5 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">New Orders</p>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{kStats.pendingPacking}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* ================= BEST SELLING PRODUCTS ================= */}
        <Panel title="Best Selling Products" actionHref="/dashboard/products/best-selling" className="lg:col-span-3">
          {bestSellers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {bestSellers.slice(0, 5).map((item, index) => (
                <div key={`bestseller-${item.id || index}`} className="border border-gray-100 dark:border-white/5 rounded-xl p-2.5 relative bg-slate-50 dark:bg-[#141d1a] transition-colors hover:shadow-sm flex flex-col justify-between">
                  <span className="absolute -top-2 -left-2 w-5 h-5 bg-white dark:bg-[#1a2421] border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-10">
                    {index + 1}
                  </span>
                  <div>
                    {item.imageUrl ? (
                      <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${apiUrl}${item.imageUrl}`} alt={item.name} className="w-full h-24 sm:h-28 object-cover rounded-lg mb-2 sm:mb-3 border border-gray-100 dark:border-white/5" />
                    ) : (
                      <ThumbPlaceholder size="w-full h-24 sm:h-28" rounded="rounded-lg mb-2 sm:mb-3 border border-gray-100 dark:border-white/5" />
                    )}
                    <h4 className="text-[11px] sm:text-[13px] font-bold text-slate-800 dark:text-gray-200 mb-2 truncate">{item.name}</h4>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-gray-200/50 dark:border-white/5">
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider">SOLD</p>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-gray-300">{item.sold || item.soldCount || 0} Pcs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider">TOTAL</p>
                      <p className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400">{formatBDT(item.revenue || 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs">No products sold in this period.</div>
          )}
        </Panel>

        {/* ================= AT A GLANCE ================= */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white dark:bg-[#1a2421] p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {defaultFilters.map((f) => (
                <button key={`filter-${f}`} onClick={() => setDateFilter(f)} className={`px-2 py-1 text-[10px] rounded-md font-bold whitespace-nowrap transition-colors ${dateFilter === f ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="bg-white dark:bg-[#1a2421] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL ({getDisplayFilterName(dateFilter)})</p>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{fStats.total}</h3>
            </div>
            <div className="bg-white dark:bg-[#1a2421] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
               <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">DELIVERED</p>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{fStats.delivered}</h3>
               <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">৳ {fStats.deliveredAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[#1a2421] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
               <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">PENDING</p>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{fStats.pending}</h3>
               <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">৳ {fStats.pendingAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[#1a2421] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
               <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">CANCELLED</p>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{fStats.cancelled}</h3>
               <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">৳ {fStats.cancelledAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* ================= LIVE ACTIVITY FEED ================= */}
        <Panel title="Live Activity Feed" actionHref="/dashboard/logs" className="lg:col-span-2">
          <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-4 px-2 uppercase tracking-wider">
            <span>USER</span>
            <span>SYSTEM</span>
          </div>
          
          {activityFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
               <Info size={20} className="mb-2 opacity-50" />
               <p className="text-[10px] sm:text-[11px] font-medium">No recent activities found.</p>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6 relative before:absolute before:inset-0 before:mx-auto before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-white/10 before:to-transparent">
              {activityFeed.slice(0, 5).map((entry, index) => {
                const textBlock = (
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-gray-400">{entry.time}</span>
                    <span className={`text-[10px] sm:text-[11px] font-bold mt-0.5 ${entry.statusColorClass}`}>{entry.status}</span>
                    {entry.detail && <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-gray-300 truncate mt-0.5">{entry.detail}</span>}
                  </div>
                );

                return (
                  <div key={`activity-${entry.id || index}`} className="relative flex items-center justify-center">
                    <div className="w-[calc(50%-0.75rem)] sm:w-[calc(50%-1rem)] pr-3 sm:pr-4 text-right">{entry.side === "user" && textBlock}</div>
                    <div className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-3 h-3 rounded-full border-2 border-white dark:border-[#1a2421] shadow z-10 ${entry.dotColorClass}`} aria-hidden="true" />
                    <div className="w-[calc(50%-0.75rem)] sm:w-[calc(50%-1rem)] pl-3 sm:pl-4 text-left">{entry.side === "system" && textBlock}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* ================= INVENTORY STATUS ================= */}
        <Panel title="Inventory Status" actionHref="/dashboard/products" className="lg:col-span-2 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[400px]">
              <thead className="border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th scope="col" className="py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
                  <th scope="col" className="py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">SKU</th>
                  <th scope="col" className="py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">Stock</th>
                  <th scope="col" className="py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {inventory.length > 0 ? (
                  inventory.slice(0, 5).map((item) => {
                    const status = getStockStatus(item.stock);
                    return (
                      <tr key={`inventory-${item.id}`} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 flex items-center gap-2.5">
                          {item.imageUrl ? <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${apiUrl}${item.imageUrl}`} alt={item.name} className="w-7 h-7 rounded object-cover border shrink-0" /> : <ThumbPlaceholder size="w-7 h-7" />}
                          <span className="text-[11px] font-bold text-slate-700 dark:text-gray-300 truncate max-w-[120px]">{item.name}</span>
                        </td>
                        <td className="py-2.5 text-[11px] text-gray-500">{item.sku || 'N/A'}</td>
                        <td className="py-2.5 text-[11px] font-bold text-slate-700 dark:text-gray-300 text-center">{item.stock}</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${status.className}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500 text-xs">No inventory data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ================= TEAM PERFORMANCE ================= */}
        <div className={`${CARD_CLASS} p-4 sm:p-6 lg:col-span-2`}>
          <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-700 dark:text-gray-100 mb-4">Team Performance</h3>
          <div className="space-y-3">
            {teamStats.map((member: any, index: number) => (
              <div key={`team-${member.id || index}`} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border shrink-0 bg-purple-50 text-purple-600 border-purple-100">
                    {member.initial}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-gray-200 leading-tight">{member.name}</h4>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{member.role}</span>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-[12px] font-black text-slate-800 dark:text-gray-200 leading-tight">{member.tasks}</h4>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">ORDERS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= TOP DISTRICT SALES ================= */}
        <div className={`${CARD_CLASS} p-4 sm:p-6 lg:col-span-2`}>
          <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-700 dark:text-gray-100 mb-4">Top District Sales</h3>
          <div className="space-y-4">
            {districtSales.length > 0 ? (
              districtSales.map((dist: any, index: number) => (
                <div key={`district-${dist.id || index}`}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-gray-300 truncate pr-2">
                      {index + 1}. {dist.name}
                    </span>
                    <span className="text-[11px] font-black text-slate-800 dark:text-gray-200 shrink-0">
                      {formatBDT(dist.amount)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${dist.colorClass}`} style={{ width: `${dist.percent}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">No district sales data.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}