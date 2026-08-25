"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, DollarSign, TrendingUp, AlertCircle, 
  Download, FileText, CheckCircle2, Search, Filter, ArrowUpRight, Loader2
} from "lucide-react";

/* ===================== TYPES ===================== */
type Invoice = {
  id: string | number;
  shopName: string;
  plan: string;
  amount: number;
  status: string;
  date: string;
  invoiceNo: string;
};

type BillingStats = {
  mrr: number;
  mrrGrowth: number;
  unpaidAmount: number;
  successfulPayments: number;
  arpu: number;
};

type PlanLimit = {
  id: string | number;
  name: string;
  price: string | number;
  orders: string;
  staff: string;
};

type PlanDistribution = {
  id: string | number;
  name: string;
  price: number;
  shopsCount: number;
  totalRevenue: number;
  percentage: number;
  colorClass: string;
  bgClass: string;
};

/* ===================== HELPERS ===================== */
function formatBDT(amount: number) {
  return `৳ ${amount.toLocaleString("en-IN")}`;
}

export default function SuperAdminBillingPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🚀 ডাইনামিক স্টেটস
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [plans, setPlans] = useState<PlanLimit[]>([]);
  const [distribution, setDistribution] = useState<PlanDistribution[]>([]);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const headers = { "Authorization": `Bearer ${token}` };

        // 1. Fetch Billing Stats (MRR, Unpaid, etc.)
        try {
          const resStats = await fetch(`${apiUrl}/admin/billing-stats`, { headers });
          if (resStats.ok) setStats(await resStats.json());
        } catch (e) { console.log("Billing Stats API not ready."); }

        // 2. Fetch Invoices
        try {
          const resInvoices = await fetch(`${apiUrl}/admin/invoices`, { headers });
          if (resInvoices.ok) setInvoices(await resInvoices.json());
        } catch (e) { console.log("Invoices API not ready."); }

        // 3. Fetch Plan Configuration
        try {
          const resPlans = await fetch(`${apiUrl}/admin/plans`, { headers });
          if (resPlans.ok) setPlans(await resPlans.json());
        } catch (e) { console.log("Plans API not ready."); }

        // 4. Fetch Plan Distribution
        try {
          const resDist = await fetch(`${apiUrl}/admin/plan-distribution`, { headers });
          if (resDist.ok) setDistribution(await resDist.json());
        } catch (e) { console.log("Distribution API not ready."); }

      } catch (error) {
        console.error("Failed to fetch billing data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  // ===================== FALLBACK DATA =====================
  // API থেকে ডাটা না আসলে এই ডামি ডাটাগুলো দেখাবে
  const STATS_TO_SHOW = stats || {
    mrr: 126000,
    mrrGrowth: 8.5,
    unpaidAmount: 12400,
    successfulPayments: 82,
    arpu: 1500
  };

  const INVOICES_TO_SHOW = invoices.length > 0 ? invoices : [
    { id: 1, shopName: "Deshio Tati", plan: "Ultra Plan", amount: 3500, status: "Paid", date: "03 Aug 2026", invoiceNo: "INV-2026-8041" },
    { id: 2, shopName: "Saree Kutir", plan: "Pro Plan", amount: 1500, status: "Pending", date: "14 Aug 2026", invoiceNo: "INV-2026-8042" },
    { id: 3, shopName: "Gadget BD", plan: "Basic Plan", amount: 800, status: "Overdue", date: "01 Aug 2026", invoiceNo: "INV-2026-8035" },
    { id: 4, shopName: "Fashion House", plan: "Pro Plan", amount: 1500, status: "Paid", date: "28 Jul 2026", invoiceNo: "INV-2026-8012" },
    { id: 5, shopName: "Organic Food", plan: "Basic Plan", amount: 800, status: "Paid", date: "25 Jul 2026", invoiceNo: "INV-2026-7998" },
  ];

  const PLANS_TO_SHOW = plans.length > 0 ? plans : [
    { id: 1, name: "Basic Plan", price: "800", orders: "300", staff: "2" },
    { id: 2, name: "Pro Plan", price: "1,500", orders: "1000", staff: "5" },
    { id: 3, name: "Ultra Plan", price: "3,500", orders: "Unlimited", staff: "Unlimited" },
  ];

  const DISTRIBUTION_TO_SHOW = distribution.length > 0 ? distribution : [
    { id: 1, name: "Ultra Plan", price: 3500, shopsCount: 14, totalRevenue: 49000, percentage: 40, colorClass: "bg-purple-500", bgClass: "bg-purple-500" },
    { id: 2, name: "Pro Plan", price: 1500, shopsCount: 38, totalRevenue: 57000, percentage: 45, colorClass: "bg-indigo-500", bgClass: "bg-indigo-500" },
    { id: 3, name: "Basic Plan", price: 800, shopsCount: 25, totalRevenue: 20000, percentage: 15, colorClass: "bg-emerald-500", bgClass: "bg-emerald-500" },
  ];

  // 🚀 ডাইনামিক ফিল্টারিং
  const filteredInvoices = INVOICES_TO_SHOW.filter(inv => 
    inv.shopName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
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
            <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${STATS_TO_SHOW.mrrGrowth >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'}`}>
              <TrendingUp size={12} className={STATS_TO_SHOW.mrrGrowth < 0 ? "rotate-180" : ""} /> 
              {STATS_TO_SHOW.mrrGrowth > 0 ? "+" : ""}{STATS_TO_SHOW.mrrGrowth}%
            </span>
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
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Successful Payments (This Month)</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">{STATS_TO_SHOW.successfulPayments}</h3>
        </div>

        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Average Revenue Per User (ARPU)</p>
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
                  placeholder="Search invoice or shop..." 
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
                  <th className="px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">Invoice ID</th>
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
                    <td colSpan={6} className="text-center py-10 text-slate-500">No invoices found.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const statusStr = (inv.status || "").toLowerCase();
                    const isPaid = statusStr === 'paid' || statusStr === 'successful';
                    const isPending = statusStr === 'pending';
                    
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{inv.invoiceNo}</td>
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{inv.shopName}</p>
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 uppercase">{inv.plan}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 font-medium">{inv.date}</td>
                        <td className="px-5 py-3 text-right font-black text-slate-800 dark:text-white">{formatBDT(inv.amount)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${
                            isPaid ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 
                            isPending ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 
                            'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline flex items-center justify-end gap-1 w-full transition-colors">
                            Details <ArrowUpRight size={14}/>
                          </button>
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
            {DISTRIBUTION_TO_SHOW.map((dist, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${dist.bgClass}`}></span> {dist.name} ({formatBDT(dist.price)})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dist.shopsCount} Shops</p>
                  </div>
                  <p className="font-black text-slate-800 dark:text-white text-sm">{formatBDT(dist.totalRevenue)}</p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className={`${dist.bgClass} h-2 rounded-full transition-all duration-500`} style={{ width: `${dist.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= PLAN BUILDER (NEW SECTION) ================= */}
      <div className="mt-8 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Dynamic Plan Builder</h2>
            <p className="text-xs text-slate-500 mt-1">Manage subscription plans, pricing, and resource limits.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
             Create New Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS_TO_SHOW.map((plan) => (
            <div key={plan.id} className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 p-5 rounded-xl space-y-4 transition-colors">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wide">{plan.name}</h3>
                <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-all">Edit limits</button>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Monthly Price:</span>
                  <span className="font-bold text-slate-800 dark:text-white">৳ {plan.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Monthly Orders:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{plan.orders}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Staff Accounts:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{plan.staff}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}