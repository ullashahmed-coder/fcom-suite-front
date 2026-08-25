"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, Crown, CheckCircle2, Zap, 
  Download, Clock, Package, Users, HardDrive, Loader2, X, Copy
} from "lucide-react";

export default function BillingSubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(true);
  
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  // 🚀 Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      
      const planRes = await fetch(`${apiUrl}/billing/plan`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (planRes.ok) {
        const pData = await planRes.json();
        setPlanInfo(pData);
      }

      const invRes = await fetch(`${apiUrl}/billing/invoices`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (invRes.ok) {
        const iData = await invRes.json();
        setInvoices(iData);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const handleUpgrade = async (planName: string, cycle: string) => {
    if (!window.confirm(`Are you sure you want to upgrade to ${planName} (${cycle})?`)) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/billing/upgrade`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ plan: planName.toUpperCase(), cycle })
      });
      
      if (res.ok) {
        alert("✅ Invoice generated successfully! Please pay to activate the plan.");
        fetchBillingData();
      } else {
        const err = await res.json();
        alert(`❌ Failed to upgrade: ${err.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Server error!");
    }
  };

  // 🚀 Open Payment Modal
  const handlePaymentClick = (invoice: any) => {
    setPaymentInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  // 🚀 Submit Payment
  const submitPayment = async () => {
    if (!transactionId.trim()) {
      alert("Please enter a valid Transaction ID");
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/billing/verify-payment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          invoiceId: paymentInvoice.id, 
          transactionId 
        })
      });

      if (res.ok) {
        alert("✅ Payment verified! Your new plan is now ACTIVE.");
        setIsPaymentModalOpen(false);
        setTransactionId("");
        fetchBillingData();
      } else {
        const err = await res.json();
        alert(`❌ Failed: ${err.message}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Server error!");
    } finally {
      setIsVerifying(false);
    }
  };

  // 🚀 Copy Number Handler
  const handleCopyNumber = () => {
    navigator.clipboard.writeText("01516501643");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawPlan = planInfo?.plan || "BASIC";
  const currentPlanName = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1).toLowerCase();
  
  let currentPrice = 800;
  if (currentPlanName === "Pro") currentPrice = 1500;
  if (currentPlanName === "Elite") currentPrice = 3500;

  const nextBillingDate = planInfo?.joinedAt ? formatDate(planInfo.joinedAt) : "N/A";

  const usageOrders = 120;
  const limitOrders = currentPlanName === "Basic" ? 300 : (currentPlanName === "Pro" ? 1000 : -1);
  const percentOrders = limitOrders !== -1 ? Math.min((usageOrders / limitOrders) * 100, 100).toFixed(1) : "0";

  const usageStaff = 2;
  const limitStaff = currentPlanName === "Basic" ? 2 : (currentPlanName === "Pro" ? 5 : -1);
  const percentStaff = limitStaff !== -1 ? Math.min((usageStaff / limitStaff) * 100, 100).toFixed(1) : "0";

  const usageProducts = 45;
  const limitProducts = -1;
  const percentProducts = "0";

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-[#8b5cf6]" size={40} />
        <p className="text-slate-500 font-medium">বিলিং ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-6 font-sans transition-colors duration-300 relative">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="text-[#8b5cf6]" size={24} /> Billing & Subscription
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your pricing plans, usage limits, and invoices.</p>
        </div>
      </div>

      {/* ================= TOP SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-violet-200 text-xs font-bold uppercase tracking-wider mb-1">Current Plan</p>
              <h2 className="text-2xl font-extrabold flex items-center gap-2">
                <Crown size={24} className="text-yellow-400" /> {currentPlanName} Plan
              </h2>
            </div>
            <span className="bg-white/20 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
              {planInfo?.status || "ACTIVE"}
            </span>
          </div>
          
          <div className="space-y-1 mb-6 relative z-10">
            <p className="text-3xl font-extrabold">৳ {currentPrice.toLocaleString()} <span className="text-sm font-normal text-violet-200">/ month</span></p>
            <p className="text-xs text-violet-200">Next billing date is <span className="font-bold text-white">{nextBillingDate}</span></p>
          </div>
          
          <div className="flex gap-3 relative z-10">
            <button 
              onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}
              className="flex-1 bg-white text-indigo-700 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-gray-50 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 transition-colors">
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
             <Zap className="text-amber-500" size={18} /> Current Billing Cycle Usage
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <span className="text-[13px] font-bold text-slate-700 dark:text-gray-200">Monthly Orders</span>
                </div>
                <span className="text-[12px] font-bold text-slate-800 dark:text-white">{usageOrders} / {limitOrders === -1 ? 'Unlimited' : limitOrders}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${Number(percentOrders) > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${percentOrders}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-[13px] font-bold text-slate-700 dark:text-gray-200">Staff Accounts</span>
                  </div>
                  <span className="text-[12px] font-bold text-slate-800 dark:text-white">{usageStaff} / {limitStaff === -1 ? 'Unlimited' : limitStaff}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentStaff}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-gray-400" />
                    <span className="text-[13px] font-bold text-slate-700 dark:text-gray-200">Product Listing</span>
                  </div>
                  <span className="text-[12px] font-bold text-slate-800 dark:text-white">{usageProducts} / {limitProducts === -1 ? 'Unlimited' : limitProducts}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentProducts}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MIDDLE SECTION ================= */}
      <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 lg:p-10 mb-8 transition-colors">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Choose the plan that fits your business needs. You can upgrade or downgrade at any time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          <div className={`border rounded-2xl p-6 transition-all flex flex-col ${currentPlanName === "Basic" ? "border-2 border-violet-500 bg-violet-50/30 dark:bg-violet-500/5 shadow-xl md:-translate-y-2 relative" : "border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30"}`}>
            {currentPlanName === "Basic" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Current Plan</div>
            )}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Basic</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4 h-10">Perfect for small businesses just getting started.</p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">৳ 800</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["Up to 300 Orders/mo", "2 Staff Accounts", "Basic Analytics", "Standard Support"].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleUpgrade("Basic", "monthly")}
              disabled={currentPlanName === "Basic"}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${currentPlanName === "Basic" ? "bg-violet-600 text-white shadow-md opacity-50 cursor-not-allowed" : "border border-gray-200 dark:border-white/20 text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"}`}
            >
              {currentPlanName === "Basic" ? "Current Active Plan" : "Downgrade"}
            </button>
          </div>

          <div className={`border rounded-2xl p-6 transition-all flex flex-col ${currentPlanName === "Pro" ? "border-2 border-violet-500 bg-violet-50/30 dark:bg-violet-500/5 shadow-xl md:-translate-y-2 relative" : "border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30"}`}>
            {currentPlanName === "Pro" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Current Plan</div>
            )}
            <h3 className="text-lg font-bold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-2"><Crown size={18}/> Pro</h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4 h-10">Everything you need to scale your growing store.</p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">৳ 1,500</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["Up to 1,000 Orders/mo", "5 Staff Accounts", "Advanced Analytics", "Steadfast & Pathao API", "Priority Support"].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-200 font-medium">
                  <CheckCircle2 size={16} className="text-violet-500 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleUpgrade("Pro", "monthly")}
              disabled={currentPlanName === "Pro"}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${currentPlanName === "Pro" ? "bg-violet-600 text-white shadow-md opacity-50 cursor-not-allowed" : "border border-gray-200 dark:border-white/20 text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"}`}
            >
              {currentPlanName === "Pro" ? "Current Active Plan" : "Upgrade to Pro"}
            </button>
          </div>

          <div className={`border rounded-2xl p-6 transition-all flex flex-col ${currentPlanName === "Elite" ? "border-2 border-violet-500 bg-violet-50/30 dark:bg-violet-500/5 shadow-xl md:-translate-y-2 relative" : "border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30"}`}>
            {currentPlanName === "Elite" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Current Plan</div>
            )}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Elite</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4 h-10">For high-volume merchants needing maximum power.</p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">৳ 3,500</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["Unlimited Orders", "Unlimited Staff", "Custom Domain", "Custom SMS Gateway", "Dedicated Account Manager"].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleUpgrade("Elite", "monthly")}
              disabled={currentPlanName === "Elite"}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${currentPlanName === "Elite" ? "bg-violet-600 text-white shadow-md opacity-50 cursor-not-allowed" : "bg-slate-800 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-gray-100 shadow-md"}`}
            >
              {currentPlanName === "Elite" ? "Current Active Plan" : "Upgrade to Elite"}
            </button>
          </div>

        </div>
      </div>

      {/* ================= BOTTOM SECTION: INVOICE HISTORY ================= */}
      <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <h2 className="text-[16px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="text-gray-400" size={18} /> Billing History
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-[#1a2421]">
              <tr>
                <th className="py-4 px-6 font-bold text-gray-400 text-xs uppercase tracking-wider">Invoice ID</th>
                <th className="py-4 px-6 font-bold text-gray-400 text-xs uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 font-bold text-gray-400 text-xs uppercase tracking-wider">Plan</th>
                <th className="py-4 px-6 font-bold text-gray-400 text-xs uppercase tracking-wider">Amount</th>
                <th className="py-4 px-6 font-bold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-bold text-gray-400 text-xs uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No invoice history found.</td>
                </tr>
              ) : (
                invoices.map((invoice, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-700 dark:text-gray-200">{invoice.id || invoice.invoiceNo}</td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{formatDate(invoice.createdAt || invoice.date)}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-gray-300">{invoice.plan}</td>
                    <td className="py-4 px-6 font-extrabold text-slate-800 dark:text-white">৳ {invoice.amount}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                        invoice.status?.toUpperCase() === 'PAID' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right flex justify-end gap-3 items-center">
                      {invoice.status?.toUpperCase() === 'PENDING' && (
                        <button 
                          onClick={() => handlePaymentClick(invoice)} 
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#e11d48] hover:bg-[#be123c] px-4 py-2 rounded-lg transition-colors shadow-sm"
                        >
                          Pay Now
                        </button>
                      )}
                      <button className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PAYMENT MODAL ================= */}
      {isPaymentModalOpen && paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden transform scale-100 transition-all">
            
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Complete Payment</h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount to Pay</p>
                <p className="text-3xl font-extrabold text-[#e11d48]">৳ {paymentInvoice.amount}</p>
              </div>

              {/* 🚀 Updated Merchant Details Section */}
              <div className="bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 p-5 rounded-2xl text-center flex flex-col items-center">
                <p className="text-xs font-bold text-pink-800 dark:text-pink-300 uppercase tracking-wider mb-4">Scan QR or Make Payment to</p>
                
                {/* 🚀 QR Code Image - Size Increased Here */}
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-xl p-2 mb-5 shadow-md border border-pink-100 dark:border-pink-500/30 flex justify-center items-center">
                   <img src="/bkash-qr.jpg" alt="bKash Merchant QR" className="w-full h-full object-contain" />
                </div>

                {/* Copy Number Block */}
                <div className="flex items-center gap-2 mb-2 bg-white dark:bg-[#1a2421] px-4 py-2.5 rounded-lg border border-pink-100 dark:border-pink-500/30 shadow-sm">
                   <p className="text-xl font-bold text-pink-600 dark:text-pink-400 font-mono tracking-widest">01516501643</p>
                   <button 
                     onClick={handleCopyNumber} 
                     className="p-2 bg-pink-50 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-md hover:bg-pink-100 transition-colors" 
                     title="Copy Number"
                   >
                     {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                   </button>
                </div>
                
                <p className="text-xs text-pink-600 dark:text-pink-400/80 font-medium mt-1">Please use bKash <span className="font-bold uppercase bg-pink-200 dark:bg-pink-500/30 px-1.5 py-0.5 rounded">Payment</span> option.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                  Enter Transaction ID / TrxID <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 9GH2X8YK2Z"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e11d48] transition-all uppercase"
                />
              </div>

              <button 
                onClick={submitPayment}
                disabled={isVerifying || !transactionId.trim()}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-[#e11d48] hover:bg-[#be123c] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isVerifying ? "Verifying..." : "Verify & Activate Plan"}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}