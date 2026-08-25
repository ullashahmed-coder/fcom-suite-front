"use client";

import React, { useState, useEffect } from "react";
import PlatformAnnouncement from "../components/PlatformAnnouncement";
// (পাথটি আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী ঠিক করে নেবেন, যেমন: "../components/PlatformAnnouncement" হতে পারে)

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

// Tailwind color map
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
    <div className={`${CARD_CLASS} p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[15px] font-bold text-slate-700 dark:text-gray-100">{title}</h3>
        {actionHref && (
          <Link
            href={actionHref}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
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

  // States
  const [userName, setUserName] = useState("Loading...");
  const [userInitial, setUserInitial] = useState("U");
  const [userRole, setUserRole] = useState("ADMIN");
  
  const [products, setProducts] = useState<any[]>([]);
  const [kpiStats, setKpiStats] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityEntry[]>([]);
  const [teamStats, setTeamStats] = useState<TeamMember[]>([]);

  useEffect(() => {
    // 1. LocalStorage Data
    const storedUser = localStorage.getItem("user");
    let dynamicUserName = "User";
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      dynamicUserName = parsedUser.name || "User";
      setUserName(dynamicUserName);
      setUserInitial(parsedUser.name ? parsedUser.name.charAt(0).toUpperCase() : "U");
      setUserRole(parsedUser.role ? parsedUser.role.replace('_', ' ').toUpperCase() : "ADMIN");
    }

    // 2. Fetch All Dashboard Data
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const headers = { "Authorization": `Bearer ${token}` };

        // 👉 Fetch Products
        const resProducts = await fetch(`${apiUrl}/products`, { headers });
        if (resProducts.ok) setProducts(await resProducts.json());

        // 👉 Fetch Team
        try {
           const resTeam = await fetch(`${apiUrl}/users`, { headers });
           if (resTeam.ok) {
             const usersData = await resTeam.json();
             const formattedTeam = usersData.map((u: any) => ({
                id: u.id,
                initial: u.name ? u.name.charAt(0).toUpperCase() : "U",
                name: u.name,
                role: u.role ? u.role.replace('_', ' ').toUpperCase() : "USER",
                tasks: 0 
             }));
             setTeamStats(formattedTeam);
           }
        } catch (e) {}

        // 🚀 Fetch Orders & Calculate KPIs Dynamically
        try {
           const resOrders = await fetch(`${apiUrl}/orders`, { headers });
           if (resOrders.ok) {
             const ordersData = await resOrders.json();
             
             // আজকের ডেট বের করা
             const todayString = new Date().toDateString();
             
             // আজকের অর্ডার ফিল্টার করা
             const todaysOrders = ordersData.filter((o: any) => {
               if(!o.createdAt) return false;
               return new Date(o.createdAt).toDateString() === todayString;
             });

             // সেলস এবং কাউন্ট বের করা
             const salesToday = todaysOrders.reduce((sum: number, o: any) => {
               // total, grandTotal বা codAmount যেটা পাওয়া যায় সেটাই যোগ করবে
               const amount = Number(o.total) || Number(o.grandTotal) || Number(o.codAmount) || 0;
               return sum + amount;
             }, 0);
             
             const ordersCount = todaysOrders.length;
             const pendingPacking = ordersData.filter((o: any) => o.status === 'NEW_ORDER' || o.status === 'PENDING').length;
             const pendingCourier = ordersData.filter((o: any) => o.status === 'PACKED' || o.status === 'READY_TO_SHIP').length;

             setKpiStats({
               salesToday,
               ordersToday: ordersCount,
               pendingPacking,
               pendingCourier,
               returnsToday: 0
             });
           }
        } catch (e) { console.log("Orders KPI calculation failed."); }

        // 👉 Fetch Activity Logs
        try {
           const resLogs = await fetch(`${apiUrl}/activity-logs?limit=5`, { headers });
           if (resLogs.ok) {
             const logs = await resLogs.json();
             if (logs && logs.length > 0) {
               const formattedLogs = logs.map((log: any, index: number) => ({
                 id: log.id || index,
                 side: (index % 2 === 0) ? "system" : "user", // সুন্দর দেখানোর জন্য এপাশ-ওপাশ করা
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
  }, []);

  // Stock calculations
  const lowStockItemsCount = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length;
  const immediateAttentionItems = products.filter((p) => p.stock === 0);

  // 🚀 ডাইনামিক KPI Data Setup
  const KPI_DATA: KpiCard[] = [
    { id: "sales", label: "Sells Today", value: kpiStats ? formatBDT(kpiStats.salesToday) : "৳ 0", icon: DollarSign, colorClass: "emerald" },
    { id: "orders", label: "Orders Today", value: kpiStats ? kpiStats.ordersToday.toString() : "0", icon: ShoppingBag, colorClass: "blue" },
    { id: "low-stock", label: "Low Stock Items", value: lowStockItemsCount.toString(), icon: AlertTriangle, colorClass: "amber" },
    { id: "courier", label: "Pending Courier", value: kpiStats ? kpiStats.pendingCourier.toString() : "0", icon: Truck, colorClass: "purple" },
    { id: "packing", label: "Pending Packing", value: kpiStats ? kpiStats.pendingPacking.toString() : "0", icon: Package, colorClass: "orange" },
    { id: "returns", label: "Return Today", value: "0", icon: RotateCcw, colorClass: "red" },
  ];

  // Fallbacks
  const TEAM_TO_SHOW = teamStats.length > 0 ? teamStats : [
    { id: "1", initial: userInitial, name: userName, role: userRole, tasks: 0 },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 min-h-screen p-6">
      
      {/* 🚀 নোটিশ ব্যানারটি সবার উপরে থাকবে */}
      <PlatformAnnouncement />
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.id} className={`${CARD_CLASS} p-5`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${ICON_COLOR_STYLES[kpi.colorClass]}`}>
                <Icon size={16} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">{kpi.label}</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{kpi.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* BEST SELLING PRODUCTS */}
        <Panel title="Best Selling Products" actionHref="/dashboard/products" className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {products.slice(0, 5).map((item, index) => (
                <div key={item.id} className="border border-gray-100 dark:border-white/5 rounded-xl p-2 relative bg-white dark:bg-[#141d1a] transition-colors">
                  <span className="absolute -top-2 -left-2 w-5 h-5 bg-white dark:bg-[#1a2421] border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-10">
                    {index + 1}
                  </span>
                  {item.imageUrl ? (
                    <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${item.imageUrl}`} alt={item.name} className="w-full h-28 object-cover rounded-lg mb-3" />
                  ) : (
                    <ThumbPlaceholder size="w-full h-28" rounded="rounded-lg mb-3" />
                  )}
                  <h4 className="text-[13px] font-semibold text-slate-800 dark:text-gray-200 mb-2 truncate">{item.name}</h4>
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <p className="text-gray-400 dark:text-gray-500 font-medium">STOCK</p>
                      <p className="font-bold text-slate-700 dark:text-gray-300">{item.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 dark:text-gray-500 font-medium">PRICE</p>
                      <p className="font-bold text-emerald-500 dark:text-emerald-400">{formatBDT(item.price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">No products found. Add products to see best sellers.</div>
          )}
        </Panel>

        {/* LIVE ACTIVITY FEED */}
        <Panel title="Live Activity Feed" actionHref="/dashboard/logs">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-4 px-2">
            <span>USER</span>
            <span>SYSTEM</span>
          </div>
          
          {/* 🚀 যদি লগস না থাকে তবে সুন্দর মেসেজ দেখাবে */}
          {activityFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
               <Info size={24} className="mb-2 opacity-50" />
               <p className="text-[11px] font-medium">No recent activities found.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:mx-auto before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-white/10 before:to-transparent">
              {/* 🚀 এখানে .slice(0, 5) যুক্ত করা হয়েছে, যাতে সর্বোচ্চ ৫টি লগ দেখায় */}
              {activityFeed.slice(0, 5).map((entry) => {
                const textBlock = (
                  <div className="flex flex-col text-[11px]">
                    <span className="text-gray-400 dark:text-gray-500">{entry.time}</span>
                    <span className={`font-bold ${entry.statusColorClass}`}>{entry.status}</span>
                    {entry.detail && <span className="text-slate-600 dark:text-gray-300 truncate">{entry.detail}</span>}
                  </div>
                );

                return (
                  <div key={entry.id} className="relative flex items-center justify-center">
                    <div className="w-[calc(50%-1rem)] pr-4 text-right">{entry.side === "user" && textBlock}</div>
                    <div className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1a2421] shadow z-10 ${entry.dotColorClass}`} aria-hidden="true" />
                    <div className="w-[calc(50%-1rem)] pl-4 text-left">{entry.side === "system" && textBlock}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* INVENTORY STATUS */}
        <Panel title="Inventory Status" actionHref="/dashboard/products" className="lg:col-span-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th scope="col" className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th scope="col" className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SKU</th>
                  <th scope="col" className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Stock</th>
                  <th scope="col" className="py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {products.length > 0 ? (
                  products.map((item) => {
                    const status = getStockStatus(item.stock);
                    return (
                      <tr key={item.id}>
                        <td className="py-3 flex items-center gap-3">
                          <ThumbPlaceholder />
                          <span className="text-[12px] font-bold text-slate-700 dark:text-gray-300">{item.name}</span>
                        </td>
                        <td className="py-3 text-[12px] text-gray-500 dark:text-gray-400">{item.sku}</td>
                        <td className="py-3 text-[12px] font-bold text-slate-700 dark:text-gray-300 text-center">{item.stock}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${status.className}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500 text-sm">No inventory data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* IMMEDIATE ATTENTION */}
        <div className={`${CARD_CLASS} p-6`}>
          <h3 className="text-[15px] font-bold text-slate-700 dark:text-gray-100 mb-4">Immediate Attention</h3>
          <div className="space-y-4">
            {immediateAttentionItems.length > 0 ? (
              immediateAttentionItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ThumbPlaceholder size="w-8 h-8" />
                    <div>
                      <h4 className="text-[12px] font-bold text-slate-800 dark:text-gray-200">{item.name}</h4>
                      <p className="text-[10px] font-bold text-red-500 dark:text-red-400">Stock: {item.stock}</p>
                    </div>
                  </div>
                  <AlertTriangle size={16} className="text-red-400 dark:text-red-500/80" />
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">All items are well-stocked!</p>
            )}
          </div>
        </div>

        {/* TEAM PERFORMANCE */}
        <div className={`${CARD_CLASS} p-6 lg:col-span-2`}>
          <h3 className="text-[15px] font-bold text-slate-700 dark:text-gray-100 mb-6">Team Performance</h3>
          <div className="space-y-4">
            {TEAM_TO_SHOW.map((member) => (
              <div key={member.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border ${
                     member.role.includes("OWNER") || member.role.includes("ADMIN") 
                     ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20"
                     : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                  }`}>
                    {member.initial}
                  </div>
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-800 dark:text-gray-200 leading-tight">{member.name}</h4>
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">{member.role}</span>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-gray-200 leading-tight">{member.tasks}</h4>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">TASKS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP DISTRICT SALES (Placeholder) */}
        <div className={`${CARD_CLASS} p-6 lg:col-span-2`}>
          <h3 className="text-[15px] font-bold text-slate-700 dark:text-gray-100 mb-6">Top District Sales</h3>
          <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[12px] font-bold text-slate-700 dark:text-gray-300">1. No Sales Data</span>
                  <span className="text-[12px] font-bold text-slate-800 dark:text-gray-200">৳ 0</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-gray-300 dark:bg-gray-700 rounded-full" style={{ width: `0%` }} />
                </div>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}