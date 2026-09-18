"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, Crown, CheckCircle2, Zap, Rocket, 
  Download, Clock, Package, Users, HardDrive, Loader2, X, Copy, ArrowRight, ShieldAlert
} from "lucide-react";

export default function BillingSubscriptionPage() {
  const [dynamicPlans, setDynamicPlans] = useState<any>({
    Basic: { price: 800, orders: 300, staff: 2, features: "Basic Analytics, Standard Support" },
    Pro: { price: 1500, orders: 1000, staff: 5, features: "Advanced Analytics, API, Priority Support" },
    Elite: { price: 3500, orders: -1, staff: -1, features: "Custom Domain, Custom SMS Gateway, Dedicated Account Manager" }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  const [paymentConfig, setPaymentConfig] = useState({
    bkashNumber: "Loading...",
    bkashAccountType: "personal",
    bkashEnabled: false
  });

  const [usageOrders, setUsageOrders] = useState(0); 
  const [totalOrderLimit, setTotalOrderLimit] = useState(0); // 🚀 নতুন: রোলওভার লিমিট সেভ করার জন্য
  const [usageStaff, setUsageStaff] = useState(0);
  const [usageProducts, setUsageProducts] = useState(0);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/billing/usage`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsageOrders(data.usageOrders);
          setTotalOrderLimit(data.totalOrderLimit); // 🚀 ব্যাকএন্ড থেকে আসা ডাইনামিক লিমিট
          setUsageStaff(data.usageStaff);
          setUsageProducts(data.usageProducts);
        }
      }
    } catch (error) {
      console.error("Failed to fetch usage stats:", error);
    }
  };

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<{name: string, cycle: string} | null>(null);
  const [isProcessingChange, setIsProcessingChange] = useState(false);

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

      const configRes = await fetch(`${apiUrl}/billing/payment-config`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (configRes.ok) {
        const cData = await configRes.json();
        setPaymentConfig(cData);
      }

      const plansRes = await fetch(`${apiUrl}/billing/plans`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (plansRes.ok) {
        const pData = await plansRes.json();
        if (pData.length > 0) {
          const formattedPlans: any = {};
          pData.forEach((p: any) => {
            const formattedName = p.planType.charAt(0).toUpperCase() + p.planType.slice(1).toLowerCase();
            formattedPlans[formattedName] = {
              price: p.price,
              orders: p.orderLimit,
              staff: p.staffLimit,
              features: p.features || ""
            };
          });
          setDynamicPlans(formattedPlans);
        }
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

  const getCalculatedBillingDate = () => {
    if (planInfo?.nextBillingDate) {
      return formatDate(planInfo.nextBillingDate);
    }
    if (planInfo?.joinedAt) {
      const joined = new Date(planInfo.joinedAt);
      const nextMonth = new Date(joined.setMonth(joined.getMonth() + 1));
      if (nextMonth < new Date()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        return formatDate(futureDate.toISOString());
      }
      return formatDate(nextMonth.toISOString());
    }
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return formatDate(defaultDate.toISOString());
  };

  const handlePlanChangeClick = (planName: string, cycle: string) => {
    setTargetPlan({ name: planName, cycle });
    setIsConfirmModalOpen(true);
  };

  const executePlanChange = async () => {
    if (!targetPlan) return;
    
    setIsProcessingChange(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/billing/upgrade`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ plan: targetPlan.name.toUpperCase(), cycle: targetPlan.cycle })
      });
      
      if (res.ok) {
        alert("✅ Invoice generated successfully! Please pay to activate the plan.");
        setIsConfirmModalOpen(false);
        fetchBillingData();
      } else {
        const err = await res.json();
        alert(`❌ Failed to update plan: ${err.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Plan update error:", error);
      alert("Server error!");
    } finally {
      setIsProcessingChange(false);
    }
  };

  const handlePaymentClick = (invoice: any) => {
    setPaymentInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

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
        alert("✅ Payment verified! Your new plan and order limits have been activated.");
        setIsPaymentModalOpen(false);
        setTransactionId("");
        fetchBillingData();
        fetchUsageStats(); // 🚀 পেমেন্টের পর ইউজ স্ট্যাটস আবার ফেচ করা হবে
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

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(paymentConfig.bkashNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawPlan = planInfo?.plan || "TRIAL";
  const currentPlanName = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1).toLowerCase();
  
  const planWeights: Record<string, number> = { Trial: 0, Basic: 1, Pro: 2, Elite: 3 };
  const currentWeight = planWeights[currentPlanName] ?? 0; 
  const hasPendingInvoice = invoices.some(inv => inv.status?.toUpperCase() === 'PENDING');

  const currentPrice = currentPlanName === 'Trial' ? 0 : (dynamicPlans[currentPlanName]?.price || 0);
  const billingDateStr = getCalculatedBillingDate();
  
  const isActive = planInfo?.status === "ACTIVE";
  const isPastDue = planInfo?.status === "PAST_DUE" || planInfo?.status === "SUSPENDED";
  
  // 🚀 ডাইনামিক লিমিট ব্যবহার করা হচ্ছে
  const activeOrderLimit = totalOrderLimit > 0 ? totalOrderLimit : (currentPlanName === 'Trial' ? 50 : (dynamicPlans[currentPlanName]?.orders || 300));
  const percentOrders = activeOrderLimit !== -1 ? Math.min((usageOrders / activeOrderLimit) * 100, 100).toFixed(1) : "0";
  
  const limitStaff = currentPlanName === 'Trial' ? 2 : (dynamicPlans[currentPlanName]?.staff === -1 ? -1 : dynamicPlans[currentPlanName]?.staff || 2);
  const percentStaff = limitStaff !== -1 && limitStaff > 0 ? Math.min((usageStaff / limitStaff) * 100, 100).toFixed(1) : "0";
  
  const percentProducts = "0";

  const getButtonText = (targetPlanName: string, targetWeight: number) => {
    if (currentWeight === targetWeight) return "Current Active Plan";
    if (hasPendingInvoice) return "Pending Invoice Exists";
    if (currentWeight > targetWeight) {
      if (isActive && !isPastDue) return "Available next cycle"; 
      return `Downgrade to ${targetPlanName}`;
    }
    return `Upgrade to ${targetPlanName}`;
  };

  const isButtonDisabled = (targetWeight: number) => {
    if (hasPendingInvoice) return true;
    if (currentWeight === targetWeight) return true;
    if (isActive && !isPastDue && currentWeight > targetWeight) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-[#8b5cf6]" size={40} />
        <p className="text-slate-500 font-medium">Loading billing data...</p>
      </div>
    );
  }

  const isMerchant = paymentConfig.bkashAccountType.toLowerCase().includes('merchant');

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
        <div className={`lg:col-span-1 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden ${currentWeight === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-violet-600 to-indigo-700'}`}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                {currentWeight === 0 ? "Currently on" : "Current Plan"}
              </p>
              <h2 className="text-2xl font-extrabold flex items-center gap-2">
                <Crown size={24} className="text-yellow-400" /> {currentWeight === 0 ? "Free Trial" : `${currentPlanName} Plan`}
              </h2>
            </div>
            <span className="bg-white/20 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
              {planInfo?.status || "ACTIVE"}
            </span>
          </div>
          
          <div className="space-y-1 mb-6 relative z-10">
            <p className="text-3xl font-extrabold">
              {currentWeight === 0 ? "Free" : `৳ ${currentPrice.toLocaleString()}`} 
              {currentWeight !== 0 && <span className="text-sm font-normal text-white/80"> / month</span>}
            </p>
            <p className="text-xs text-white/80">
              {currentWeight === 0 ? "Trial expires on " : (isPastDue ? "Payment due since " : "Next billing date is ")} 
              <span className="font-bold text-white">{billingDateStr}</span>
            </p>
          </div>
          
          <div className="flex gap-3 relative z-10">
            <button 
              onClick={() => {
                const pricingSection = document.getElementById("pricing-plans-section");
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex-1 bg-white text-indigo-700 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {currentPlanName === "Elite" ? "Manage Plans" : "Upgrade Plan"}
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
                  <span className="text-[13px] font-bold text-slate-700 dark:text-gray-200">Monthly Orders {activeOrderLimit > (dynamicPlans[currentPlanName]?.orders || 300) && <span className="text-xs text-indigo-500 ml-1">(Rolled Over)</span>}</span>
                </div>
                <span className="text-[12px] font-bold text-slate-800 dark:text-white">
                  {usageOrders} / {activeOrderLimit === -1 ? 'Unlimited' : activeOrderLimit}
                </span>
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
                  <span className="text-[12px] font-bold text-slate-800 dark:text-white">{usageProducts} / Unlimited</span>
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
      <div id="pricing-plans-section" className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 lg:p-10 mb-8 transition-colors">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Choose the plan that fits your business needs. Upgrade any time and carry forward your unused limits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* BASIC PLAN CARD */}
          <div className={`border rounded-2xl p-6 transition-all flex flex-col ${currentWeight === 1 ? "border-2 border-violet-500 bg-violet-50/30 dark:bg-violet-500/5 shadow-xl md:-translate-y-2 relative" : "border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30"}`}>
            {currentWeight === 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Current Plan</div>
            )}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Zap size={18} className="text-blue-500" /> Basic
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4 h-10">Perfect for small businesses just getting started.</p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">৳ {dynamicPlans["Basic"]?.price}</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {dynamicPlans["Basic"]?.orders === -1 ? 'Unlimited' : `Up to ${dynamicPlans["Basic"]?.orders}`} Orders/mo
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {dynamicPlans["Basic"]?.staff === -1 ? 'Unlimited' : dynamicPlans["Basic"]?.staff} Staff Accounts
              </li>
              {dynamicPlans["Basic"]?.features?.split(',').map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {feature.trim()}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handlePlanChangeClick("Basic", "monthly")}
              disabled={isButtonDisabled(1)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                isButtonDisabled(1)
                  ? "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/10"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              }`}
            >
              {getButtonText("Basic", 1)}
            </button>
          </div>

          {/* PRO PLAN CARD */}
          <div className={`border rounded-2xl p-6 transition-all flex flex-col ${currentWeight === 2 ? "border-2 border-violet-500 bg-violet-50/30 dark:bg-violet-500/5 shadow-xl md:-translate-y-2 relative" : "border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30"}`}>
            {currentWeight === 2 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Current Plan</div>
            )}
            <h3 className="text-lg font-bold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-2">
              <Rocket size={18} className="text-violet-500" /> Pro
            </h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4 h-10">Everything you need to scale your growing store.</p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">৳ {dynamicPlans["Pro"]?.price}</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-200 font-medium">
                <CheckCircle2 size={16} className="text-violet-500 shrink-0" /> {dynamicPlans["Pro"]?.orders === -1 ? 'Unlimited' : `Up to ${dynamicPlans["Pro"]?.orders}`} Orders/mo
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-200 font-medium">
                <CheckCircle2 size={16} className="text-violet-500 shrink-0" /> {dynamicPlans["Pro"]?.staff === -1 ? 'Unlimited' : dynamicPlans["Pro"]?.staff} Staff Accounts
              </li>
              {dynamicPlans["Pro"]?.features?.split(',').map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-200 font-medium">
                  <CheckCircle2 size={16} className="text-violet-500 shrink-0" /> {feature.trim()}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handlePlanChangeClick("Pro", "monthly")}
              disabled={isButtonDisabled(2)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                isButtonDisabled(2)
                  ? "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/10"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              }`}
            >
              {getButtonText("Pro", 2)}
            </button>
          </div>

          {/* ELITE PLAN CARD */}
          <div className={`border rounded-2xl p-6 transition-all flex flex-col ${currentWeight === 3 ? "border-2 border-violet-500 bg-violet-50/30 dark:bg-violet-500/5 shadow-xl md:-translate-y-2 relative" : "border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30"}`}>
            {currentWeight === 3 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Current Plan</div>
            )}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Crown size={18} className="text-amber-500" /> Elite
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4 h-10">For high-volume merchants needing maximum power.</p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">৳ {dynamicPlans["Elite"]?.price}</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {dynamicPlans["Elite"]?.orders === -1 ? 'Unlimited Orders' : `Up to ${dynamicPlans["Elite"]?.orders} Orders/mo`}
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {dynamicPlans["Elite"]?.staff === -1 ? 'Unlimited Staff' : `${dynamicPlans["Elite"]?.staff} Staff Accounts`}
              </li>
              {dynamicPlans["Elite"]?.features?.split(',').map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {feature.trim()}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handlePlanChangeClick("Elite", "monthly")}
              disabled={isButtonDisabled(3)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                isButtonDisabled(3)
                  ? "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/10"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              }`}
            >
              {getButtonText("Elite", 3)}
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
                    <td className="py-4 px-6 font-bold text-slate-700 dark:text-gray-200">{invoice.invoiceNo}</td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{formatDate(invoice.createdAt)}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-gray-300">{invoice.plan}</td>
                    <td className="py-4 px-6 font-extrabold text-slate-800 dark:text-white">৳ {invoice.amount}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border flex w-max items-center gap-1 ${
                        invoice.status?.toUpperCase() === 'PAID' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                          : invoice.trxId 
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
                      }`}>
                        {invoice.status?.toUpperCase() === 'PENDING' && invoice.trxId && <Loader2 size={10} className="animate-spin" />}
                        {invoice.status?.toUpperCase() === 'PENDING' && invoice.trxId ? 'VERIFYING' : invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right flex justify-end gap-3 items-center">
                      {invoice.status?.toUpperCase() === 'PENDING' && !invoice.trxId && (
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

      {/* ================= PLAN CONFIRMATION MODAL ================= */}
      {isConfirmModalOpen && targetPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden transform scale-100 transition-all">
            
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldAlert className="text-indigo-500" size={20} /> Confirm Plan Change
              </h3>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                You are about to {currentWeight > (planWeights[targetPlan.name] || 1) ? 'downgrade' : 'upgrade'} your subscription. 
                <span className="block mt-1 font-semibold text-indigo-500">Any unused order limits from your current cycle will be rolled over!</span>
              </p>

              {/* Comparison Box */}
              <div className="bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-white/5 p-5 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-center w-2/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current</p>
                    <p className="font-extrabold text-slate-800 dark:text-white text-lg">{currentPlanName === 'Trial' ? 'Free Trial' : currentPlanName}</p>
                    <p className="text-xs font-bold text-indigo-500">{currentPlanName === 'Trial' ? 'Free' : `৳ ${dynamicPlans[currentPlanName]?.price}/mo`}</p>
                  </div>
                  
                  <div className="w-1/5 flex justify-center text-gray-300 dark:text-gray-600">
                    <ArrowRight size={24} />
                  </div>
                  
                  <div className="text-center w-2/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Plan</p>
                    <p className="font-extrabold text-slate-800 dark:text-white text-lg">{targetPlan.name}</p>
                    <p className="text-xs font-bold text-emerald-500">৳ {dynamicPlans[targetPlan.name]?.price}/mo</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Base Orders:</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">
                      <span className={currentWeight > (planWeights[targetPlan.name] || 1) ? 'text-rose-500' : ''}>
                        {currentPlanName === 'Trial' ? 50 : (dynamicPlans[currentPlanName]?.orders === -1 ? 'Unlimited' : dynamicPlans[currentPlanName]?.orders)}
                      </span> 
                      <span className="mx-2 text-gray-300">→</span> 
                      <span className={currentWeight < (planWeights[targetPlan.name] || 1) ? 'text-emerald-500' : ''}>
                        {dynamicPlans[targetPlan.name]?.orders === -1 ? 'Unlimited' : dynamicPlans[targetPlan.name]?.orders}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Staff Accounts:</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">
                      <span className={currentWeight > (planWeights[targetPlan.name] || 1) ? 'text-rose-500' : ''}>
                        {currentPlanName === 'Trial' ? 2 : (dynamicPlans[currentPlanName]?.staff === -1 ? 'Unlimited' : dynamicPlans[currentPlanName]?.staff)}
                      </span> 
                      <span className="mx-2 text-gray-300">→</span> 
                      <span className={currentWeight < (planWeights[targetPlan.name] || 1) ? 'text-emerald-500' : ''}>
                        {dynamicPlans[targetPlan.name]?.staff === -1 ? 'Unlimited' : dynamicPlans[targetPlan.name]?.staff}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executePlanChange}
                  disabled={isProcessingChange}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isProcessingChange ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

              <div className="bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 p-5 rounded-2xl text-center flex flex-col items-center">
                <p className="text-xs font-bold text-pink-800 dark:text-pink-300 uppercase tracking-wider mb-4">Scan QR or Make Payment to</p>
                
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-xl p-2 mb-5 shadow-md border border-pink-100 dark:border-pink-500/30 flex justify-center items-center">
                   <img src="/bkash-qr.jpg" alt="bKash Merchant QR" className="w-full h-full object-contain" />
                </div>

                <div className="flex items-center gap-2 mb-2 bg-white dark:bg-[#1a2421] px-4 py-2.5 rounded-lg border border-pink-100 dark:border-pink-500/30 shadow-sm">
                   <p className="text-xl font-bold text-pink-600 dark:text-pink-400 font-mono tracking-widest">
                     {paymentConfig.bkashNumber}
                   </p>
                   <button 
                     onClick={handleCopyNumber} 
                     className="p-2 bg-pink-50 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-md hover:bg-pink-100 transition-colors" 
                     title="Copy Number"
                   >
                     {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                   </button>
                </div>
                
                <p className="text-xs text-pink-600 dark:text-pink-400/80 font-medium mt-1">
                  Please use bKash <span className="font-bold uppercase bg-pink-200 dark:bg-pink-500/30 px-1.5 py-0.5 rounded">
                    {isMerchant ? 'PAYMENT' : 'SEND MONEY'}
                  </span> option.
                </p>
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