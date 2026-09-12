"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, DollarSign, TrendingUp, AlertCircle, 
  Download, FileText, CheckCircle2, Search, Filter, ArrowUpRight, Loader2
} from "lucide-react";

/* ===================== HELPERS ===================== */
function formatBDT(amount: number) {
  return `৳ ${amount.toLocaleString("en-IN")}`;
}

export default function SuperAdminBillingPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🚀 API Data State
  const [dashboardData, setDashboardData] = useState<any>(null);

  // 🚀 ব্যাকএন্ড থেকে ডেটা ফেচ করা
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/admin-billing/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // 🚀 পেমেন্ট স্ট্যাটাস আপডেট করা (Approve)
  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    setUpdating(invoiceId);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/admin-billing/invoice/${invoiceId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchDashboardStats(); 
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(null);
    }
  };

  // ===================== DATA MAPPING & FALLBACK =====================
  const STATS_TO_SHOW = {
    mrr: dashboardData?.mrr || 0,
    mrrGrowth: 8.5, 
    unpaidAmount: dashboardData?.unpaid || 0,
    successfulPayments: dashboardData?.successfulPayments || 0,
    arpu: dashboardData?.arpu || 0
  };

  const INVOICES_TO_SHOW = dashboardData?.recentTransactions || [];

  const colors = ["bg-purple-500", "bg-indigo-500", "bg-emerald-500"];
  const DISTRIBUTION_TO_SHOW = dashboardData?.planDistribution?.length > 0 
    ? dashboardData.planDistribution.map((planGroup: any, idx: number) => ({
        id: idx,
        name: `${planGroup.plan} Plan`,
        price: planGroup.plan === 'ELITE' ? 3500 : planGroup.plan === 'PRO' ? 1500 : 800,
        shopsCount: planGroup._count.id,
        totalRevenue: (planGroup.plan === 'ELITE' ? 3500 : planGroup.plan === 'PRO' ? 1500 : 800) * planGroup._count.id,
        percentage: 100 / dashboardData.planDistribution.length,
        bgClass: colors[idx % colors.length]
      }))
    : [];

  const PLANS_TO_SHOW = [
    { id: 1, name: "Basic Plan", price: "800", orders: "300", staff: "2" },
    { id: 2, name: "Pro Plan", price: "1,500", orders: "1000", staff: "5" },
    { id: 3, name: "Ultra Plan", price: "3,500", orders: "Unlimited", staff: "Unlimited" },
  ];

  const filteredInvoices = INVOICES_TO_SHOW.filter((inv: any) => 
    inv.shop?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="text-indigo-600 dark:text-indigo-400" size={24} /> Billing & Revenue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track platform revenue, unpaid invoices, and subscription plans.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {loading && <Loader2 className="animate-spin text-indigo-500" size={20} />}
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white rounded-xl text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50">
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Monthly Recurring Revenue (MRR)</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">{formatBDT(STATS_TO_SHOW.mrr)}</h3>
        </div>

        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unpaid / Overdue</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">{formatBDT(STATS_TO_SHOW.unpaidAmount)}</h3>
        </div>

        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Successful Payments</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">{STATS_TO_SHOW.successfulPayments}</h3>
        </div>

        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">ARPU</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">{formatBDT(STATS_TO_SHOW.arpu)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ================= LEFT: INVOICE TABLE ================= */}
        <div className="xl:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[600px] transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Recent Transactions</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search invoice..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button className="px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0">
                <Filter size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-200 dark:border-white/5 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">Invoice Details</th>
                  <th className="px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">Shop & Plan</th>
                  <th className="px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">Date</th>
                  <th className="px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider text-right">Amount</th>
                  <th className="px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider text-center">Status</th>
                  <th className="px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">No recent transactions found.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv: any) => {
                    const statusStr = (inv.status || "").toUpperCase();
                    const isPaid = statusStr === 'PAID';
                    const isPending = statusStr === 'PENDING';
                    
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                        
                        {/* 🚀 Invoice & TrxID Column */}
                        <td className="px-5 py-3">
                          <div className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                            {inv.invoiceNo}
                          </div>
                          {inv.trxId && (
                            <div className="mt-1.5 inline-block px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              TrxID: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{inv.trxId}</span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{inv.shop?.name}</p>
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 uppercase">{inv.plan}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-right font-black text-slate-800 dark:text-white">{formatBDT(inv.amount)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${
                            isPaid ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 
                            isPending ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 
                            'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                          }`}>
                            {isPending && inv.trxId ? "VERIFYING" : inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {isPending && inv.trxId ? (
                            <button 
                              onClick={() => handleStatusUpdate(inv.id, 'PAID')}
                              disabled={updating === inv.id}
                              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            >
                              {updating === inv.id ? 'Approving...' : 'Approve'}
                            </button>
                          ) : (
                            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center justify-end gap-1 w-full transition-colors">
                              Details <ArrowUpRight size={14}/>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= RIGHT: PLAN DISTRIBUTION ================= */}
        <div className="xl:col-span-1 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6 flex flex-col h-[600px] transition-colors overflow-y-auto custom-scrollbar">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-6">Subscription Distribution</h2>
          
          <div className="space-y-6 flex-1">
            {DISTRIBUTION_TO_SHOW.length > 0 ? DISTRIBUTION_TO_SHOW.map((dist: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${dist.bgClass}`}></span> {dist.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dist.shopsCount} Shops</p>
                  </div>
                  <p className="font-black text-slate-800 dark:text-white text-sm">{formatBDT(dist.totalRevenue)}</p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className={`${dist.bgClass} h-2 rounded-full transition-all duration-500`} style={{ width: `${dist.percentage}%` }}></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 text-center py-4">No active subscriptions found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}