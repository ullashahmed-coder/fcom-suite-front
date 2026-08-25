"use client";

import React, { useState, useEffect } from "react";
import { 
  Server, Cpu, HardDrive, Activity, CheckCircle2, 
  RefreshCw, Database, ShieldAlert, Globe, Loader2
} from "lucide-react";

type HealthData = {
  server: {
    status: string;
    uptime: number;
    coreCount: number;
    cpuLoadPercent: number; // 🚀 Live CPU Load
    memory: { total: string; used: string; usagePercent: number };
    disk: { total: string; used: string; usagePercent: number }; // 🚀 Live Disk Storage
  };
  database: {
    status: string;
    latency: number;
  };
  timestamp: string;
};

export default function SuperAdminSystemHealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🚀 রিয়েল API থেকে ডেটা আনার ফাংশন
  const fetchHealth = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) setIsRefreshing(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/system-health/admin/status`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setHealthData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch health status:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // ১৫ সেকেন্ড পরপর অটো রিফ্রেশ
    const interval = setInterval(() => fetchHealth(), 15000);
    return () => clearInterval(interval);
  }, []);

  // Uptime কে সুন্দর ফরম্যাটে দেখানোর ফাংশন
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  if (loading && !healthData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Server className="text-indigo-600 dark:text-indigo-400" size={24} /> System Health & Servers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor server resources, uptime, database performance, and node statuses.</p>
        </div>
        
        <button 
          onClick={() => fetchHealth(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-70"
        >
          <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} /> 
          {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* ================= STATUS BANNER ================= */}
      <div className={`border p-5 rounded-2xl flex items-center justify-between shadow-sm ${
        healthData?.database.status === 'OPERATIONAL' 
        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
        : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shadow-sm ${
            healthData?.database.status === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-red-500'
          }`}>
            {healthData?.database.status === 'OPERATIONAL' ? <CheckCircle2 size={22} /> : <ShieldAlert size={22} />}
          </div>
          <div>
            <h3 className={`font-bold text-base ${healthData?.database.status === 'OPERATIONAL' ? 'text-emerald-900 dark:text-emerald-400' : 'text-red-900 dark:text-red-400'}`}>
              {healthData?.database.status === 'OPERATIONAL' ? 'All Systems Operational' : 'System Outage Detected'}
            </h3>
            <p className={`text-xs mt-0.5 ${healthData?.database.status === 'OPERATIONAL' ? 'text-emerald-700 dark:text-emerald-300/80' : 'text-red-700 dark:text-red-300/80'}`}>
              Server Runtime: {healthData ? formatUptime(healthData.server.uptime) : '0d 0h 0m'}. No critical incidents reported.
            </p>
          </div>
        </div>
        <span className={`hidden sm:inline-block px-3 py-1 border rounded-lg text-xs font-bold ${
          healthData?.database.status === 'OPERATIONAL' 
          ? 'bg-white dark:bg-[#111827] border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
          : 'bg-white dark:bg-[#111827] border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          DB Latency: {healthData?.database.latency}ms
        </span>
      </div>

      {/* ================= SERVER METRICS (CPU / RAM / DISK) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CPU Usage (LIVE DATA 🔥) */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Cpu size={18} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">CPU Load</h4>
            </div>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
              {healthData?.server.cpuLoadPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${healthData?.server.cpuLoadPercent || 0}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {healthData?.server.coreCount} Logical Cores Active
          </p>
        </div>

        {/* Memory / RAM (LIVE DATA 🔥) */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Activity size={18} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Memory Usage</h4>
            </div>
            <span className={`text-xs font-black px-2.5 py-1 rounded-md ${
              (healthData?.server.memory.usagePercent || 0) > 85 
              ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10' 
              : 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10'
            }`}>
              {healthData?.server.memory.usagePercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
            <div className={`h-2.5 rounded-full transition-all duration-500 ${
              (healthData?.server.memory.usagePercent || 0) > 85 ? 'bg-red-600' : 'bg-purple-600'
            }`} style={{ width: `${healthData?.server.memory.usagePercent || 0}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {healthData?.server.memory.used} GB of {healthData?.server.memory.total} GB used
          </p>
        </div>

        {/* Disk Space (LIVE DATA 🔥) */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <HardDrive size={18} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Storage (Main Disk)</h4>
            </div>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md">
              {healthData?.server.disk.usagePercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
            <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${healthData?.server.disk.usagePercent || 0}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {healthData?.server.disk.used} GB of {healthData?.server.disk.total} GB used
          </p>
        </div>

      </div>

      {/* ================= DATABASE & NODES STATUS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Database Performance (LIVE DATA 🔥) */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Database size={18} className="text-indigo-600 dark:text-indigo-400"/> Database Clusters (PostgreSQL)
            </h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
              healthData?.database.status === 'OPERATIONAL' 
              ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
              : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
            }`}>
              {healthData?.database.status === 'OPERATIONAL' ? 'Healthy' : 'Down'}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-[#0b0f19] p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-xs">Query Execution Time (Avg)</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Prisma Client Latency</p>
              </div>
              <span className={`font-black ${healthData?.database.latency && healthData.database.latency < 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {healthData?.database.latency} ms
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-[#0b0f19] p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-xs">Database Connection</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Pool limit & status</p>
              </div>
              <span className="font-black text-slate-800 dark:text-white">Active</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-[#0b0f19] p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-xs">Last Sync Time</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time health ping</p>
              </div>
              <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Node Services (Static Placeholders) */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Globe size={18} className="text-indigo-600 dark:text-indigo-400"/> Microservices & APIs
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">All Running</span>
          </div>

          <div className="space-y-3">
            {[
              { name: "Next.js Tenant Web Server", status: "Running", uptime: healthData ? formatUptime(healthData.server.uptime) : "0d", region: "ap-southeast-1" },
              { name: "Steadfast & Pathao Courier Webhook", status: "Running", uptime: "Live", region: "ap-southeast-1" },
              { name: "SMS & WhatsApp Notification Worker", status: "Running", uptime: "Live", region: "ap-southeast-1" },
              { name: "Automated Daily Billing Cron Job", status: "Idle (Scheduled)", uptime: "Live", region: "ap-southeast-1" },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${service.status.includes('Running') ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">{service.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Region: {service.region} • Uptime: {service.uptime}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-white/5 px-2 py-0.5 rounded">
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= THIRD-PARTY API MONITOR (Static Placeholders) ================= */}
      <div className="mt-6 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <Globe size={18} className="text-indigo-600 dark:text-indigo-400"/> Third-Party API & Webhook Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Steadfast Courier API", status: "Operational", ping: "45ms", up: true },
            { name: "Pathao Merchant API", status: "Degraded", ping: "420ms", up: false },
            { name: "bKash PGW Webhook", status: "Operational", ping: "85ms", up: true },
            { name: "Greenweb SMS Gateway", status: "Operational", ping: "120ms", up: true },
          ].map((api, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">{api.name}</h4>
                <div className={`w-2 h-2 rounded-full ${api.up ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${api.up ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                  {api.status}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{api.ping}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}