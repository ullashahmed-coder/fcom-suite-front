"use client";

import React, { useState, useEffect } from "react";
import { 
  Store, Search, Filter, MoreVertical, ShieldAlert, 
  CheckCircle2, Ban, ExternalLink, Edit, Plus, Loader2
} from "lucide-react";

/* ===================== TYPES ===================== */
type Shop = {
  id: string;
  name: string;
  owner?: string;
  ownerName?: string;
  email?: string;
  plan?: string;
  status: string;
  domain?: string;
  createdAt?: string;
};

export default function SuperAdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 🚀 ব্যাকএন্ড থেকে শপের লিস্ট ফেচ করা
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        
        const res = await fetch(`${apiUrl}/admin/shops`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setShops(data);
        } else {
          console.error("Failed to fetch shops");
        }
      } catch (error) {
        console.error("API error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  // 🚀 ডাইনামিক ফিল্টারিং লজিক
  const filteredShops = shops.filter(shop => {
    const shopName = shop.name || "";
    const shopEmail = shop.email || "";
    const ownerName = shop.owner || shop.ownerName || "";
    
    // সার্চ চেক
    const matchesSearch = 
      shopName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      shopEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // স্ট্যাটাস চেক (ক্যাপিটাল/স্মল লেটার ফিক্স করা হয়েছে)
    const normalizedStatus = (shop.status || "").toUpperCase();
    const filterStatusMap: Record<string, string> = { 
      "Active": "ACTIVE", 
      "Trial": "TRIAL", 
      "Suspended": "SUSPENDED" 
    };
    
    const matchesStatus = statusFilter === "All" || normalizedStatus === filterStatusMap[statusFilter];
    
    return matchesSearch && matchesStatus;
  });

  // ডেট ফরম্যাট করার হেল্পার ফাংশন
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Store className="text-indigo-600 dark:text-indigo-400" size={24} /> All Registered Shops
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage tenants, view access levels, and control shop statuses.</p>
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50">
          <Plus size={18} /> Add New Shop
        </button>
      </div>

      {/* ================= FILTERS & SEARCH ================= */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
        
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by shop name, owner or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {['All', 'Active', 'Trial', 'Suspended'].map(status => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                statusFilter === status 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 shadow-sm' 
                  : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              {status}
            </button>
          ))}
          <button className="px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <Filter size={16} />
          </button>
        </div>

      </div>

      {/* ================= SHOPS TABLE ================= */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider">Shop & Domain</th>
                  <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider">Owner Info</th>
                  <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider">Plan & Date</th>
                  <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <Store size={40} className="mx-auto mb-3 opacity-50" />
                      <p className="font-bold text-base">No shops found!</p>
                      <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop) => {
                    const statusStr = (shop.status || "").toUpperCase();
                    const isStatusActive = statusStr === 'ACTIVE';
                    const isStatusTrial = statusStr === 'TRIAL';
                    const isStatusSuspended = statusStr === 'SUSPENDED';

                    return (
                      <tr key={shop.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm shrink-0 uppercase">
                              {shop.name ? shop.name.charAt(0) : "S"}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm">{shop.name || "Unnamed Shop"}</h4>
                              <a href={`https://${shop.domain || 'example.fcom.com'}`} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-0.5">
                                {shop.domain || "Not Configured"} <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{shop.owner || shop.ownerName || "-"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{shop.email || "No email"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-bold mb-1 border border-slate-200 dark:border-white/5 uppercase">
                            {shop.plan || "BASIC"}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-500 flex items-center gap-1">
                            Joined: {formatDate(shop.createdAt)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {isStatusActive && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                              <CheckCircle2 size={14} /> Active
                            </span>
                          )}
                          {isStatusTrial && (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                              <ShieldAlert size={14} /> Trial
                            </span>
                          )}
                          {isStatusSuspended && (
                            <span className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                              <Ban size={14} /> Suspended
                            </span>
                          )}
                          {!isStatusActive && !isStatusTrial && !isStatusSuspended && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                              {shop.status || "Unknown"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Login as Tenant Button */}
                            <button 
                              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-[11px] font-bold transition-colors shadow-sm"
                              title="Login directly to this shop's dashboard"
                            >
                              Login as Admin
                            </button>

                            <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" title="Edit Shop">
                              <Edit size={16} />
                            </button>
                            
                            <button className={`p-1.5 transition-colors ${isStatusSuspended ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-rose-500'}`} title={isStatusSuspended ? 'Activate Shop' : 'Suspend Shop'}>
                              {isStatusSuspended ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}