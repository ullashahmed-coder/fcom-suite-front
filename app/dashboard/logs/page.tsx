"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Activity, Filter, Clock, User, 
  Monitor, Database, ArrowRight, ShieldAlert, 
  ShoppingCart, Box, RefreshCw, Download, 
  Trash2, Edit3, PlusCircle, LogIn, Loader2
} from "lucide-react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModule, setActiveModule] = useState("All");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // এখানে USER ট্যাব লাগবে না, কারণ USER এর ডেটা SYSTEM এ চলে যাবে
  const modules = ["All", "ORDER", "PRODUCT", "COURIER", "AUTH", "SYSTEM", "CUSTOMER"];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // 🚀 রিয়েল ডেটা ফেচ করা
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/activity-logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 🚀 ডেট ফরম্যাটিং
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const dateObj = new Date(dateString);
    const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
  };

  // 🚀 ডাইনামিক মডিউল ও অ্যাকশন পার্সার (USER -> SYSTEM লজিক সহ)
  const parseLogType = (typeString: string) => {
    if (!typeString) return { module: "SYSTEM", verb: "INFO" };
    const parts = typeString.toUpperCase().split('_');
    
    if (parts.length >= 2) {
      let parsedModule = parts[0]; 
      
      // 🚀 USER এর লগগুলোকে SYSTEM ট্যাবে দেখানোর লজিক
      if (parsedModule === "USER") {
        parsedModule = "SYSTEM";
      }

      return { module: parsedModule, verb: parts.slice(1).join('_') };
    }
    return { module: "SYSTEM", verb: typeString.toUpperCase() }; 
  };

  // Action অনুযায়ী আইকন ও কালার নির্ধারণ
  const getActionStyles = (verb: string) => {
    switch(verb) {
      case "ADD":
      case "ADDED":
      case "CREATE": 
      case "CREATED":
        return { color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20", icon: <PlusCircle size={14} /> };
      case "UPDATE": 
      case "UPDATED":
      case "EDIT":
        return { color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20", icon: <Edit3 size={14} /> };
      case "DELETE": 
      case "DELETED":
      case "REMOVE":
        return { color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20", icon: <Trash2 size={14} /> };
      case "SYNC": 
      case "SYNCED":
        return { color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20", icon: <RefreshCw size={14} /> };
      case "LOGIN": 
      case "AUTH":
        return { color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", icon: <LogIn size={14} /> };
      default: 
        return { color: "text-gray-600 bg-gray-50 border-gray-200", icon: <Activity size={14} /> };
    }
  };

  // Module অনুযায়ী আইকন
  const getModuleIcon = (module: string) => {
    switch(module) {
      case "ORDER": return <ShoppingCart size={16} />;
      case "PRODUCT": return <Box size={16} />;
      case "COURIER": return <RefreshCw size={16} />;
      case "AUTH": 
      case "USER": return <ShieldAlert size={16} />;
      default: return <Database size={16} />;
    }
  };

  // 🚀 ফিল্টারিং লজিক
  const filteredLogs = logs.filter(log => {
    const parsed = parseLogType(log.type);
    const matchesModule = activeModule === "All" || parsed.module === activeModule;
    const matchesSearch = !searchQuery || 
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesModule && matchesSearch;
  });

  // 🚀 অটো-সিলেক্ট লজিক
  useEffect(() => {
    if (filteredLogs.length > 0 && (!selectedLog || !filteredLogs.find(l => l.id === selectedLog.id))) {
      setSelectedLog(filteredLogs[0]);
    } else if (filteredLogs.length === 0) {
      setSelectedLog(null);
    }
  }, [filteredLogs, selectedLog]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-[#3b82f6]" size={40} />
        <p className="text-slate-500 font-medium">অ্যাক্টিভিটি লগস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-6 font-sans transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="text-[#3b82f6]" size={24} /> System Activity Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Audit trail of all actions performed across the dashboard.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-700 dark:text-gray-200 rounded-lg text-sm font-bold shadow-sm transition-colors flex">
            <Filter size={16} /> Advanced Filter
          </button>
          <button className="flex-1 md:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 dark:bg-white hover:bg-slate-700 dark:hover:bg-gray-100 text-white dark:text-slate-900 rounded-lg text-sm font-bold shadow-md transition-colors flex">
            <Download size={16} /> Export Logs
          </button>
        </div>
      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh]">
        
        {/* ================= LEFT COLUMN: Log List ================= */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden transition-colors">
          
          <div className="p-5 shrink-0 space-y-4">
            
            {/* Module Filter Tabs */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <h2 className="text-[17px] font-bold text-slate-800 dark:text-white">Recent Activities</h2>
              <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-transparent shadow-sm overflow-x-auto">
                {modules.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => setActiveModule(mod)}
                    className={`px-4 py-1.5 text-[12px] rounded-full transition-colors whitespace-nowrap ${
                      activeModule === mod 
                        ? "bg-white dark:bg-[#1a2421] text-blue-600 dark:text-blue-400 font-bold shadow-sm dark:border dark:border-white/10" 
                        : "text-slate-600 dark:text-gray-400 font-medium hover:text-slate-800 dark:hover:text-gray-200"
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs by keyword or user..." 
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* List Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-5 pt-0 space-y-3 custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center">
                <Activity size={40} className="mb-2 opacity-50" />
                <p>No activity logs found.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const parsedType = parseLogType(log.type);
                const actionStyle = getActionStyles(parsedType.verb);
                const logTime = formatDateTime(log.createdAt);
                const userName = log.user?.name || "System User";

                return (
                  <div 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className={`flex flex-col sm:flex-row justify-between p-4 rounded-xl border-2 cursor-pointer transition-all gap-4 ${
                      isSelected ? "border-[#3b82f6] dark:border-blue-500/60 bg-blue-50/50 dark:bg-blue-500/10 shadow-sm" : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-200 dark:hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Module Icon Badge */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-1 ${actionStyle.color}`}>
                         {actionStyle.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-[14px] font-bold ${isSelected ? 'text-[#3b82f6] dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                            {log.action || `${parsedType.verb} action performed`}
                          </h3>
                        </div>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1.5">
                          <User size={12} /> {userName} <span className="px-1">•</span>
                          <Clock size={12} /> {logTime}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-white/5">
                      <span className={`text-[9px] font-bold px-2 py-1 border rounded uppercase tracking-wider mb-0 sm:mb-2 ${actionStyle.color}`}>
                        {parsedType.verb}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                         {getModuleIcon(parsedType.module)} {parsedType.module}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Log Details ================= */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden relative transition-colors">
          
          {!selectedLog ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 p-8 border-2 border-dashed border-gray-100 dark:border-white/5 m-6 rounded-2xl">
              <Activity size={40} className="opacity-50 mb-3" />
              <p className="font-bold">Select a log entry to view details</p>
            </div>
          ) : (
            <>
              <div className="absolute top-4 right-4">
                 <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 px-2 py-1 rounded border border-gray-200 dark:border-white/10">
                   {selectedLog.id}
                 </span>
              </div>

              {/* 🚀 Dynamic details header */}
              <div className="p-6 pt-10 border-b border-gray-100 dark:border-white/10 shrink-0 bg-[#f8fafc] dark:bg-white/5">
                <div className="flex items-center gap-3 mb-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getActionStyles(parseLogType(selectedLog.type).verb).color}`}>
                     {getActionStyles(parseLogType(selectedLog.type).verb).icon}
                   </div>
                   <span className={`text-[11px] font-bold px-2.5 py-0.5 border rounded uppercase tracking-wider ${getActionStyles(parseLogType(selectedLog.type).verb).color}`}>
                     {parseLogType(selectedLog.type).verb}
                   </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white leading-tight">
                  {selectedLog.action || "System action executed."}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                
                {/* Meta Data */}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">SESSION DETAILS</p>
                  <div className="bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                     <div className="flex items-center justify-between p-3.5 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-gray-300">
                          <User size={16} className="text-gray-400" /> <span className="text-[13px] font-medium">User</span>
                        </div>
                        <div className="text-right">
                           <p className="text-[13px] font-bold text-slate-800 dark:text-white">{selectedLog.user?.name || "System"}</p>
                           <p className="text-[10px] text-gray-400">{selectedLog.user?.role || "System Process"}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-3.5 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-gray-300">
                          <Clock size={16} className="text-gray-400" /> <span className="text-[13px] font-medium">Timestamp</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-800 dark:text-white">{formatDateTime(selectedLog.createdAt)}</span>
                     </div>
                     <div className="flex items-center justify-between p-3.5 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-gray-300">
                          <Database size={16} className="text-gray-400" /> <span className="text-[13px] font-medium">IP Address</span>
                        </div>
                        <span className="text-[12px] font-mono bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-700 dark:text-gray-300">{selectedLog.ipAddress || "System IP"}</span>
                     </div>
                     <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-2.5 text-slate-600 dark:text-gray-300">
                          <Monitor size={16} className="text-gray-400" /> <span className="text-[13px] font-medium">Module / Resource</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-800 dark:text-white">{parseLogType(selectedLog.type).module}</span>
                     </div>
                  </div>
                </div>

                {/* Changes / Diff Viewer */}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    DATA CHANGES
                  </p>
                  
                  <div className="relative bg-[#1e293b] dark:bg-[#0f1714] rounded-xl p-5 border border-slate-700 dark:border-white/10 shadow-inner font-mono text-sm overflow-hidden text-left">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start gap-3 text-emerald-400 bg-emerald-900/20 p-2 rounded border border-emerald-900/30">
                        <span className="select-none font-bold opacity-50">+</span>
                        <div className="break-all whitespace-pre-wrap">
                          <span className="text-slate-400">Action:</span> "{selectedLog.action || "Action recorded successfully."}"
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>

    </div>
  );
}