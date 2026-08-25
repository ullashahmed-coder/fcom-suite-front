"use client";

import React, { useState, useEffect } from "react";
import { Users, Store, TrendingUp, Activity, CheckCircle2, AlertTriangle, ArrowUpRight, Loader2 } from "lucide-react";

/* ===================== TYPES ===================== */
type AdminStats = {
  totalShops: number;
  monthlyRev: number;
  totalUsers: number;
};

type ShopEntry = {
  id: string;
  name: string;
  owner?: string;
  ownerName?: string; // ব্যাকএন্ড থেকে এই নামেও আসতে পারে
  plan: string;
  status: string;
};

/* ===================== HELPERS ===================== */
function formatBDT(amount: number) {
  return `৳ ${amount.toLocaleString("en-IN")}`;
}

export default function SuperAdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentShops, setRecentShops] = useState<ShopEntry[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const headers = { "Authorization": `Bearer ${token}` };

        // 🚀 Fetch Admin Stats (KPIs)
        try {
          const resStats = await fetch(`${apiUrl}/admin/stats`, { headers });
          if (resStats.ok) {
            setStats(await resStats.json());
          }
        } catch (e) {
          console.log("Admin Stats API not ready yet. Using fallback.");
        }

        // 🚀 Fetch Recent Shops
        try {
          const resShops = await fetch(`${apiUrl}/admin/shops?limit=5`, { headers });
          if (resShops.ok) {
            setRecentShops(await resShops.json());
          }
        } catch (e) {
          console.log("Admin Shops API not ready yet. Using fallback.");
        }

      } catch (error) {
        console.error("Failed to fetch super admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // ===================== FALLBACKS =====================
  const displayStats = {
    totalShops: stats?.totalShops || recentShops.length || 0,
    monthlyRev: stats?.monthlyRev || 126000,
    totalUsers: stats?.totalUsers || 4,
  };

  const SHOPS_TO_SHOW = recentShops.length > 0 ? recentShops : [
    { id: "1", name: "Deshio Tati", owner: "Ullash Ahmed", plan: "Ultra Plan", status: "Active" },
    { id: "2", name: "Saree Kutir", owner: "Rahim Islam", plan: "Pro Plan", status: "Active" },
    { id: "3", name: "Gadget BD", owner: "Jamil Hossain", plan: "Basic", status: "Trial" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Platform Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time metrics of your SaaS platform.</p>
        </div>
        {loading && <Loader2 className="animate-spin text-indigo-500" size={20} />}
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Shops */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Store size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1"><TrendingUp size={12}/> +12%</span>
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Active Shops</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white">{displayStats.totalShops}</h3>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1"><TrendingUp size={12}/> +5.2%</span>
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Monthly Recurring Rev</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white">{formatBDT(displayStats.monthlyRev)}</h3>
        </div>

        {/* Platform Users */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Platform Users (Staffs)</p>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white">{displayStats.totalUsers}</h3>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity size={20} />
            </div>
            <span className="flex h-3 w-3 relative mt-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">System Status</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">100% Operational</h3>
        </div>
      </div>

      {/* ================= RECENT SHOPS TABLE ================= */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-[#0b0f19]/50">
          <h3 className="font-bold text-slate-800 dark:text-white">Recently Onboarded Shops</h3>
          <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline transition-all">View All <ArrowUpRight size={14}/></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0b0f19]">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Shop Name</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Owner</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Plan</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {SHOPS_TO_SHOW.map((shop, i) => {
                // 🚀 ক্যাপিটাল লেটার-স্মল লেটার সমস্যা ফিক্স করা হলো (যেমন: 'ACTIVE', 'Active', 'active')
                const statusStr = (shop.status || "").toUpperCase();
                const isStatusActive = statusStr === 'ACTIVE';
                const isStatusTrial = statusStr === 'TRIAL';

                return (
                  <tr key={shop.id || i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{shop.name}</td>
                    
                    {/* 🚀 Owner এর নাম না থাকলে ডিফল্ট লেখা দেখাবে */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {shop.owner || shop.ownerName || "-"}
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-[11px] font-bold tracking-wide">
                        {shop.plan || "BASIC"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${
                        isStatusActive ? 'text-emerald-600 dark:text-emerald-400' : 
                        isStatusTrial ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isStatusActive ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>} {shop.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}