"use client";

import React, { useState, useEffect } from "react";
import PlatformAnnouncement from "../components/PlatformAnnouncement";

import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Truck,
  Package,
  RotateCcw,
  LucideIcon,
  Loader2,
  Info
} from "lucide-react";
import Link from "next/link";

/* ===================== TYPES ===================== */

type KpiCard = {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  colorClass: string;
};

type ActivitySide = "user" | "system";

type ActivityEntry = {
  id: number;
  side: ActivitySide;
  time: string;
  status: string;
  statusColorClass: string;
  dotColorClass: string;
  detail?: string;
};

type TeamMember = {
  id: string;
  initial: string;
  name: string;
  role: string;
  tasks: number;
};

type DistrictSales = {
  id: number;
  name: string;
  amount: number;
  percent: number;
  colorClass: string;
};

const ICON_COLOR_STYLES: Record<string, string> = {
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400",
  purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400",
  orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400",
  red: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400",
};

const LOW_STOCK_THRESHOLD = 10;

/* ===================== HELPERS ===================== */

function formatBDT(amount: number) {
  return `৳ ${amount.toLocaleString("en-US")}`;
}

function getStockStatus(stock: number): { label: string; className: string } {
  if (stock <= 0) {
    return { label: "Out of Stock", className: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10" };
  }
  if (stock < LOW_STOCK_THRESHOLD) {
    return { label: "Low Stock", className: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" };
  }
  return { label: "In Stock", className: "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" };
}

/* ===================== SHARED UI ===================== */

const CARD_CLASS =
  "bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors";

function Panel({
  title,
  actionHref,
  actionLabel = "View All",
  className = "",
  children,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${CARD_CLASS} p-4 sm:p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-700 dark:text-gray-100">{title}</h3>
        {actionHref && (
          <Link
            href={actionHref}
            className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 sm:px-0 sm:py-0 sm:bg-transparent rounded-md sm:rounded-none"
          >
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

/* ===================== MAIN COMPONENT ===================== */

export default function TenantDashboardHome() {
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState("Loading...");
  const [userInitial, setUserInitial] = useState("U");
  const [userRole, setUserRole] = useState("ADMIN");
  
  const [products, setProducts] = useState<any[]>([]);
  const [kpiStats, setKpiStats] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityEntry[]>([]);
  const [teamStats, setTeamStats] = useState<TeamMember[]>([]);
  const [districtSales, setDistrictSales] = useState<DistrictSales[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let dynamicUserName = "User";
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      dynamicUserName = parsedUser.name || "User";
      setUserName(dynamicUserName);
      setUserInitial(parsedUser.name ? parsedUser.name.charAt(0).toUpperCase() : "U");
      setUserRole(parsedUser.role ? parsedUser.role.replace('_', ' ').toUpperCase() : "ADMIN");
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { "Authorization": `Bearer ${token}` };

        // 👉 Fetch Products & Orders simultaneously to calculate actual Best Sellers
        const [prodRes, orderRes] = await Promise.all([
          fetch(`${apiUrl}/products`, { headers }),
          fetch(`${apiUrl}/orders`, { headers })
        ]);

        let allOrdersData: any[] = [];

        if (orderRes.ok) {
          allOrdersData = await orderRes.json();
          
          const todayString = new Date().toDateString();
          const todaysOrders = allOrdersData.filter((o: any) => {
            if(!o.createdAt || o.isDeleted) return false;
            return new Date(o.createdAt).toDateString() === todayString;
          });

          const salesToday = todaysOrders.reduce((sum: number, o: any) => {
            const amount = Number(o.totalAmount) || Number(o.total) || Number(o.grandTotal) || Number(o.codAmount) || 0;
            return sum + amount;
          }, 0);
          
          const ordersCount = todaysOrders.length;
          const pendingPacking = allOrdersData.filter((o: any) => !o.isDeleted && (o.status === 'NEW_ORDER' || o.status === 'PENDING')).length;
          const pendingCourier = allOrdersData.filter((o: any) => !o.isDeleted && (o.status === 'PACKED' || o.status === 'READY_TO_SHIP' || o.status === 'COURIER_PENDING')).length;

          setKpiStats({
            salesToday,
            ordersToday: ordersCount,
            pendingPacking,
            pendingCourier,
            returnsToday: 0
          });

          // Team Task Counting
          try {
             const resTeam = await fetch(`${apiUrl}/users`, { headers });
             if (resTeam.ok) {
               const usersData = await resTeam.json();
               const taskCounts: Record<string, number> = {};
               allOrdersData.forEach((o: any) => {
                 if (!o.isDeleted && o.user?.name) {
                   taskCounts[o.user.name] = (taskCounts[o.user.name] || 0) + 1;
                 }
               });

               const formattedTeam = usersData.map((u: any) => ({
                 id: u.id,
                 initial: u.name ? u.name.charAt(0).toUpperCase() : "U",
                 name: u.name,
                 role: u.role ? u.role.replace('_', ' ').toUpperCase() : "USER",
                 tasks: taskCounts[u.name] || 0
               }));
               setTeamStats(formattedTeam);
             }
          } catch (e) {}

          // District Sales Calculation
          const districtMap: Record<string, number> = {};
          let totalSalesAllDistricts = 0;

          allOrdersData.forEach((o: any) => {
            if (!o.isDeleted && o.customer?.district) {
              const amount = Number(o.totalAmount) || Number(o.total) || 0;
              if (amount > 0) {
                const distName = o.customer.district.trim();
                districtMap[distName] = (districtMap[distName] || 0) + amount;
                totalSalesAllDistricts += amount;
              }
            }
          });

          const districtColors = ["bg-emerald-500 dark:bg-emerald-400", "bg-blue-500 dark:bg-blue-400", "bg-purple-500 dark:bg-purple-400", "bg-amber-500 dark:bg-amber-400", "bg-rose-500 dark:bg-rose-400"];
          
          const districtArr = Object.entries(districtMap)
            .map(([name, amount], idx) => ({
              id: idx,
              name,
              amount: amount as number,
              percent: totalSalesAllDistricts > 0 ? ((amount as number) / totalSalesAllDistricts) * 100 : 0,
              colorClass: districtColors[idx % districtColors.length]
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

          setDistrictSales(districtArr);
        }

        // 👉 Process Products with Order Sales to get True Best Sellers
        if (prodRes.ok) {
          const prods = await prodRes.json();
          
          const salesById: Record<string, number> = {};
          const salesByName: Record<string, number> = {};

          allOrdersData.forEach((order: any) => {
            if (!order.isDeleted && order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                const qty = Number(item.quantity) || 1;
                const pId = item.productId || item.product?.id || item.id;
                if (pId) {
                  salesById[String(pId)] = (salesById[String(pId)] || 0) + qty;
                }
                const pName = (item.product?.name || item.name || "").trim().toLowerCase();
                if (pName) {
                  salesByName[pName] = (salesByName[pName] || 0) + qty;
                }
              });
            }
          });

          const sortedBestSellers = prods
            .filter((p: any) => !p.isDeleted)
            .map((p: any) => {
              const sold = salesById[String(p.id)] || salesByName[(p.name || "").trim().toLowerCase()] || p.soldCount || 0;
              return { ...p, soldCount: sold };
            })
            .sort((a: any, b: any) => b.soldCount - a.soldCount); // Top sold items first

          setProducts(sortedBestSellers);
        }

        // 👉 Fetch Activity Logs
        try {
           const resLogs = await fetch(`${apiUrl}/activity-logs?limit=5`, { headers });
           if (resLogs.ok) {
             const logs = await resLogs.json();
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
        } catch (e) {}

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [apiUrl]);

  const lowStockItemsCount = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length;
  const immediateAttentionItems = products.filter((p) => p.stock === 0);

  const KPI_DATA: KpiCard[] = [
    { id: "sales", label: "Sells Today", value: kpiStats ? formatBDT(kpiStats.salesToday) : "৳ 0", icon: DollarSign, colorClass: "emerald" },
    { id: "orders", label: "Orders Today", value: kpiStats ? kpiStats.ordersToday.toString() : "0", icon: ShoppingBag, colorClass: "blue" },
    { id: "low-stock", label: "Low Stock", value: lowStockItemsCount.toString(), icon: AlertTriangle, colorClass: "amber" },
    { id: "courier", label: "Courier Pnd.", value: kpiStats ? kpiStats.pendingCourier.toString() : "0", icon: Truck, colorClass: "purple" },
    { id: "packing", label: "Packing Pnd.", value: kpiStats ? kpiStats.pendingPacking.toString() : "0", icon: Package, colorClass: "orange" },
    { id: "returns", label: "Return Today", value: "0", icon: RotateCcw, colorClass: "red" },
  ];

  const TEAM_TO_SHOW = teamStats.length > 0 ? teamStats : [
    { id: "1", initial: userInitial, name: userName, role: userRole, tasks: 0 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1500px] mx-auto pb-10 min-h-screen p-4 sm:p-6 bg-[#f8f9fc] dark:bg-[#0f1714] transition-colors duration-300">
      
      <PlatformAnnouncement />
      
      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.id} className={`${CARD_CLASS} p-3.5 sm:p-5 flex flex-col justify-center`}>
              <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mb-2 sm:mb-3 ${ICON_COLOR_STYLES[kpi.colorClass]}`}>
                <Icon size={14} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{kpi.label}</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 dark:text-white truncate">{kpi.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* ================= BEST SELLING PRODUCTS ================= */}
        <Panel title="Best Selling Products" actionHref="/dashboard/products/best-selling" className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {products.slice(0, 5).map((item, index) => {
                const totalSaleValue = (item.soldCount || 0) * (Number(item.price) || 0);

                return (
                  <div key={item.id} className="border border-gray-100 dark:border-white/5 rounded-xl p-2.5 relative bg-slate-50 dark:bg-[#141d1a] transition-colors hover:shadow-sm flex flex-col justify-between">
                    <span className="absolute -top-2 -left-2 w-5 h-5 bg-white dark:bg-[#1a2421] border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-10">
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
                        <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">SOLD</p>
                        <p className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-gray-300">{item.soldCount || 0} Pcs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-0.5">TOTAL SALE</p>
                        <p className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400">{formatBDT(totalSaleValue)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs sm:text-sm">No products found. Add products to see best sellers.</div>
          )}
        </Panel>

        {/* ================= LIVE ACTIVITY FEED ================= */}
        <Panel title="Live Activity Feed" actionHref="/dashboard/logs">
          <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-4 px-2 uppercase tracking-wider">
            <span>USER</span>
            <span>SYSTEM</span>
          </div>
          
          {activityFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
               <Info size={20} className="mb-2 opacity-50 sm:w-[24px] sm:h-[24px]" />
               <p className="text-[10px] sm:text-[11px] font-medium">No recent activities found.</p>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6 relative before:absolute before:inset-0 before:mx-auto before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-white/10 before:to-transparent">
              {activityFeed.slice(0, 5).map((entry) => {
                const textBlock = (
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">{entry.time}</span>
                    <span className={`text-[10px] sm:text-[11px] font-bold mt-0.5 ${entry.statusColorClass}`}>{entry.status}</span>
                    {entry.detail && <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-gray-300 truncate mt-0.5">{entry.detail}</span>}
                  </div>
                );

                return (
                  <div key={entry.id} className="relative flex items-center justify-center">
                    <div className="w-[calc(50%-0.75rem)] sm:w-[calc(50%-1rem)] pr-3 sm:pr-4 text-right">{entry.side === "user" && textBlock}</div>
                    <div className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white dark:border-[#1a2421] shadow z-10 ${entry.dotColorClass}`} aria-hidden="true" />
                    <div className="w-[calc(50%-0.75rem)] sm:w-[calc(50%-1rem)] pl-3 sm:pl-4 text-left">{entry.side === "system" && textBlock}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* ================= INVENTORY STATUS ================= */}
        <Panel title="Inventory Status" actionHref="/dashboard/products" className="lg:col-span-3 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th scope="col" className="py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th scope="col" className="py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SKU</th>
                  <th scope="col" className="py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Stock</th>
                  <th scope="col" className="py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {products.length > 0 ? (
                  products.slice(0, 5).map((item) => {
                    const status = getStockStatus(item.stock);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-3">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl.startsWith('http') ? item.imageUrl : `${apiUrl}${item.imageUrl}`} 
                              alt={item.name} 
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded object-cover border border-gray-100 dark:border-white/10 shrink-0" 
                            />
                          ) : (
                            <ThumbPlaceholder size="w-7 h-7 sm:w-8 sm:h-8" />
                          )}
                          <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 dark:text-gray-300 truncate max-w-[140px] sm:max-w-[200px]">{item.name}</span>
                        </td>
                        <td className="py-2.5 sm:py-3 text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400">{item.sku || 'N/A'}</td>
                        <td className="py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-bold text-slate-700 dark:text-gray-300 text-center">{item.stock}</td>
                        <td className="py-2.5 sm:py-3 text-right">
                          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded uppercase ${status.className}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500 text-xs sm:text-sm">No inventory data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ================= IMMEDIATE ATTENTION ================= */}
        <div className={`${CARD_CLASS} p-4 sm:p-6`}>
          <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-700 dark:text-gray-100 mb-4">Immediate Attention</h3>
          <div className="space-y-3 sm:space-y-4">
            {immediateAttentionItems.length > 0 ? (
              immediateAttentionItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {item.imageUrl ? (
                       <img 
                         src={item.imageUrl.startsWith('http') ? item.imageUrl : `${apiUrl}${item.imageUrl}`} 
                         alt={item.name} 
                         className="w-7 h-7 sm:w-8 sm:h-8 rounded object-cover border border-gray-100 dark:border-white/10 shrink-0" 
                       />
                     ) : (
                       <ThumbPlaceholder size="w-7 h-7 sm:w-8 sm:h-8" />
                     )}
                    <div className="min-w-0">
                      <h4 className="text-[11px] sm:text-[12px] font-bold text-slate-800 dark:text-gray-200 truncate w-32 sm:w-40">{item.name}</h4>
                      <p className="text-[9px] sm:text-[10px] font-bold text-red-500 dark:text-red-400 mt-0.5">Stock: {item.stock}</p>
                    </div>
                  </div>
                  <AlertTriangle size={14} className="text-red-400 dark:text-red-500/80 shrink-0 sm:w-[16px] sm:h-[16px]" />
                </div>
              ))
            ) : (
              <p className="text-[11px] sm:text-xs text-gray-400 py-4 text-center">All items are well-stocked!</p>
            )}
          </div>
        </div>

        {/* ================= TEAM PERFORMANCE ================= */}
        <div className={`${CARD_CLASS} p-4 sm:p-6 lg:col-span-2`}>
          <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-700 dark:text-gray-100 mb-4 sm:mb-6">Team Performance</h3>
          <div className="space-y-3 sm:space-y-4">
            {TEAM_TO_SHOW.map((member) => (
              <div key={member.id} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2.5 sm:p-3 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-[12px] font-bold border shrink-0 ${
                     member.role.includes("OWNER") || member.role.includes("ADMIN") 
                     ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20"
                     : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                  }`}>
                    {member.initial}
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-[12px] font-bold text-slate-800 dark:text-gray-200 leading-tight">{member.name}</h4>
                    <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{member.role}</span>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-[12px] sm:text-[13px] font-black text-slate-800 dark:text-gray-200 leading-tight">{member.tasks}</h4>
                  <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">ORDERS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= TOP DISTRICT SALES ================= */}
        <div className={`${CARD_CLASS} p-4 sm:p-6 lg:col-span-2`}>
          <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-700 dark:text-gray-100 mb-4 sm:mb-6">Top District Sales</h3>
          <div className="space-y-4 sm:space-y-5">
            {districtSales.length > 0 ? (
              districtSales.map((dist, index) => (
                <div key={dist.id}>
                  <div className="flex justify-between items-end mb-1.5 sm:mb-1">
                    <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 dark:text-gray-300 truncate pr-2">
                      {index + 1}. {dist.name}
                    </span>
                    <span className="text-[11px] sm:text-[12px] font-black text-slate-800 dark:text-gray-200 shrink-0">
                      {formatBDT(dist.amount)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={dist.percent} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`h-full rounded-full ${dist.colorClass}`} style={{ width: `${dist.percent}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div>
                <div className="flex justify-between items-end mb-1.5 sm:mb-1">
                  <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 dark:text-gray-300">1. No Sales Data</span>
                  <span className="text-[11px] sm:text-[12px] font-black text-slate-800 dark:text-gray-200">৳ 0</span>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-gray-300 dark:bg-gray-700 rounded-full" style={{ width: `0%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}