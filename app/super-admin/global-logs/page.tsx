"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, Download, Search, Terminal, 
  Store, User, Globe, Clock, Loader2 
} from "lucide-react";

type GlobalLog = {
  id: string | number;
  action: string;
  type: string;
  shopName: string;
  userName: string;
  ip: string;
  createdAt: string;
};

export default function GlobalLogsPage() {
  const [logs, setLogs] = useState<GlobalLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ফিল্টার এবং সার্চ স্টেট
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        
        const res = await fetch(`${apiUrl}/admin-logs/global`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Failed to fetch global logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Time formatting function (e.g. "2 mins ago")
  const timeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  // Badge Color Helper
  const getBadgeStyle = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('ORDER')) return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
    if (t.includes('PRODUCT')) return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    if (t.includes('SECURITY')) return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    if (t.includes('BILLING')) return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
    if (t.includes('USER')) return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
    return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  };

  // 🚀 ফিল্টারিং লজিক
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === "ALL" || log.type.toUpperCase().includes(activeFilter);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="text-indigo-600 dark:text-indigo-400" size={24} /> Global Activity Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cross-tenant audit trail of all actions performed across all active shops.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all">
          <Download size={16} /> Export Audit Trail
        </button>
      </div>

      {/* ================= SEARCH & FILTERS ================= */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col xl:flex-row justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full xl:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search logs by shop, user or action..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'ORDER', 'PRODUCT', 'SECURITY', 'BILLING', 'USER'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-colors border ${
                activeFilter === filter 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* ================= LOGS LIST ================= */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white dark:bg-[#111827] rounded-2xl border border-white/5">
            <Activity size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">No logs found</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-5 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-colors gap-4 shadow-sm group">
              
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1a2333] border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
                  <Terminal size={14} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">{log.action}</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${getBadgeStyle(log.type)}`}>
                      {log.type}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><Store size={12} /> {log.shopName}</span>
                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span className="flex items-center gap-1.5"><User size={12} /> {log.userName}</span>
                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span className="flex items-center gap-1.5"><Globe size={12} /> IP: {log.ip}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 shrink-0 sm:mt-0 mt-2 ml-12 sm:ml-0">
                <Clock size={12} /> {timeAgo(log.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}