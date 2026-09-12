"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, Loader2, Crown } from "lucide-react";

export default function PlanControlPage() {
  const [plans, setPlans] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // ৪টি প্ল্যানের ডিফল্ট স্ট্রাকচার (যাতে ডাটাবেস থেকে না আসলেও UI লোড হয়)
  const defaultPlans = ["TRIAL", "BASIC", "PRO", "ELITE"];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/billing/plans`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const formattedPlans: any = {};
        
        // ডাটাবেস থেকে আসা ডেটাগুলোকে প্ল্যানের নাম অনুযায়ী সাজানো
        data.forEach((p: any) => {
          formattedPlans[p.planType.toUpperCase()] = {
            price: p.price,
            orderLimit: p.orderLimit,
            staffLimit: p.staffLimit,
            features: p.features || ""
          };
        });

        // যদি ডাটাবেসে কোনো প্ল্যান মিসিং থাকে, তার জন্য খালি স্ট্রাকচার দেওয়া
        defaultPlans.forEach(planName => {
          if (!formattedPlans[planName]) {
            formattedPlans[planName] = { price: 0, orderLimit: 0, staffLimit: 0, features: "" };
          }
        });

        setPlans(formattedPlans);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (planName: string, field: string, value: string | number) => {
    setPlans({
      ...plans,
      [planName]: {
        ...plans[planName],
        [field]: value
      }
    });
  };

  const handleSave = async (planName: string) => {
    setIsSaving(planName);
    try {
      const token = localStorage.getItem("access_token");
      const planData = plans[planName];

      const res = await fetch(`${apiUrl}/billing/plans/${planName}`, {
        method: "PUT", // অথবা PATCH (আপনার ব্যাকএন্ড অনুযায়ী)
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          price: Number(planData.price),
          orderLimit: Number(planData.orderLimit),
          staffLimit: Number(planData.staffLimit),
          features: planData.features
        })
      });

      if (res.ok) {
        alert(`✅ ${planName} Plan settings saved successfully!`);
      } else {
        const err = await res.json();
        alert(`❌ Failed to save: ${err.message}`);
      }
    } catch (error) {
      alert("Server error occurred while saving!");
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] justify-center items-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-200">
      
      {/* Header */}
      <div className="mb-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex justify-center items-center">
          <Sliders size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Plan & Pricing Control</h1>
          <p className="text-sm text-gray-400 mt-1">Manage SaaS subscription limits, features, and pricing dynamically.</p>
        </div>
      </div>

      {/* Plans Grid - 4 Columns for Large Screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {defaultPlans.map((planName) => {
          const planData = plans[planName];
          
          return (
            <div key={planName} className="bg-[#1e2329] border border-gray-700/50 rounded-2xl p-6 flex flex-col h-full shadow-lg">
              
              <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-4">
                <Crown className={planName === 'ELITE' ? 'text-amber-500' : planName === 'PRO' ? 'text-violet-400' : planName === 'TRIAL' ? 'text-emerald-400' : 'text-blue-400'} size={20} />
                <h2 className="text-lg font-bold text-white tracking-wide">{planName} Plan</h2>
              </div>

              <div className="flex-1 space-y-5">
                {/* Price */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Monthly Price (৳)</label>
                  <input 
                    type="number" 
                    value={planData.price}
                    onChange={(e) => handleInputChange(planName, "price", e.target.value)}
                    className="w-full bg-[#14181c] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {planName === 'TRIAL' && <p className="text-[10px] text-emerald-500 mt-1">Usually 0 for Trial</p>}
                </div>

                {/* Limits Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Order Limit</label>
                    <input 
                      type="number" 
                      value={planData.orderLimit}
                      onChange={(e) => handleInputChange(planName, "orderLimit", e.target.value)}
                      className="w-full bg-[#14181c] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <p className="text-[9px] text-gray-500 mt-1">Use -1 for Unlimited</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Staff Limit</label>
                    <input 
                      type="number" 
                      value={planData.staffLimit}
                      onChange={(e) => handleInputChange(planName, "staffLimit", e.target.value)}
                      className="w-full bg-[#14181c] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <p className="text-[9px] text-gray-500 mt-1">Use -1 for Unlimited</p>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Features (Comma Separated)</label>
                  <textarea 
                    value={planData.features}
                    onChange={(e) => handleInputChange(planName, "features", e.target.value)}
                    rows={4}
                    className="w-full bg-[#14181c] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    placeholder="e.g. Analytics, Priority Support"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button 
                onClick={() => handleSave(planName)}
                disabled={isSaving === planName}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isSaving === planName ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save {planName} Settings
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}