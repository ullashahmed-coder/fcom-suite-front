"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Globe, Shield, Bell, Database, 
  Save, CheckCircle2, CreditCard, Users, Loader2
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'payment' | 'notifications' | 'team' | 'maintenance'>('general');
  
  // 🚀 General API States
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [enforce2FA, setEnforce2FA] = useState(false);
  
  // 🚀 Payment Gateway States
  const [bkashEnabled, setBkashEnabled] = useState(false);
  const [bkashNumber, setBkashNumber] = useState("");
  const [bkashAccountType, setBkashAccountType] = useState("personal");
  
  const [sslEnabled, setSslEnabled] = useState(false);
  const [sslStoreId, setSslStoreId] = useState("");
  const [sslStorePassword, setSslStorePassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 🚀 ডাটাবেস থেকে বর্তমান সেটিংস নিয়ে আসা
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        
        const res = await fetch(`${apiUrl}/admin-settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // General
          setMaintenanceMode(data.maintenanceMode || false);
          setEnforce2FA(data.enforce2FA || false);
          // Payment
          setBkashEnabled(data.bkashEnabled || false);
          setBkashNumber(data.bkashNumber || "");
          setBkashAccountType(data.bkashAccountType || "personal");
          setSslEnabled(data.sslEnabled || false);
          setSslStoreId(data.sslStoreId || "");
          setSslStorePassword(data.sslStorePassword || "");
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 🚀 ডাটাবেসে সেটিংস সেভ করা
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/admin-settings/update`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          maintenanceMode, 
          enforce2FA,
          bkashEnabled,
          bkashNumber,
          bkashAccountType,
          sslEnabled,
          sslStoreId,
          sslStorePassword
        }) 
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="text-indigo-600 dark:text-indigo-400" size={24} /> Platform Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure global SaaS rules, security policies, billing APIs, and admin roles.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-70"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} /> Settings successfully updated across the platform!
        </div>
      )}

      {/* ================= SETTINGS LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1">
          {[
            { id: 'general', label: 'General & Branding', icon: Globe },
            { id: 'payment', label: 'Payment Gateways', icon: CreditCard }, 
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'notifications', label: 'Global Notifications', icon: Bell },
            { id: 'team', label: 'Admin Team Roles', icon: Users },
            { id: 'maintenance', label: 'Maintenance Mode', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5'
                }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm min-h-[400px]">
          
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* ====== General Tab ====== */}
            {activeTab === 'general' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">General Platform Configurations</h3>
                <p className="text-slate-500 text-sm">General settings coming soon.</p>
              </div>
            )}

            {/* ====== 🚀 Payment Tab ====== */}
            {activeTab === 'payment' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Subscription Payment Gateways</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure APIs and manual numbers to receive subscription fees.</p>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                ) : (
                  <div className="space-y-6">
                    {/* ================= bKash Manual ================= */}
                    <div className={`p-5 bg-slate-50 dark:bg-[#0b0f19] border ${bkashEnabled ? 'border-pink-500 shadow-sm' : 'border-slate-200 dark:border-white/5'} rounded-xl space-y-4 transition-all`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">bKash</div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">bKash (Manual Verification)</h4>
                            <p className="text-[10px] text-slate-500">Receive payments manually and verify TrxID from your dashboard.</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={bkashEnabled}
                          onChange={(e) => setBkashEnabled(e.target.checked)}
                          className="w-5 h-5 accent-pink-600 cursor-pointer" 
                        />
                      </div>
                      
                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/5 pt-4 ${bkashEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">bKash Receive Number</label>
                          <input 
                            type="text" 
                            value={bkashNumber}
                            onChange={(e) => setBkashNumber(e.target.value)}
                            placeholder="e.g. 017XXXXXXXX" 
                            className="w-full mt-1.5 px-3 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Account Type</label>
                          <select 
                            value={bkashAccountType}
                            onChange={(e) => setBkashAccountType(e.target.value)}
                            className="w-full mt-1.5 px-3 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                          >
                            <option value="personal">Personal (Send Money)</option>
                            <option value="merchant">Merchant (Make Payment)</option>
                            <option value="agent">Agent (Cash Out)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ================= SSLCommerz ================= */}
                    <div className={`p-5 bg-slate-50 dark:bg-[#0b0f19] border ${sslEnabled ? 'border-blue-500 shadow-sm' : 'border-slate-200 dark:border-white/5'} rounded-xl space-y-4 transition-all`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">SSL</div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">SSLCommerz (Cards & Net Banking)</h4>
                            <p className="text-[10px] text-slate-500">Accept Credit/Debit cards and other mobile banking methods.</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={sslEnabled}
                          onChange={(e) => setSslEnabled(e.target.checked)}
                          className="w-5 h-5 accent-blue-600 cursor-pointer" 
                        />
                      </div>
                      
                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/5 pt-4 ${sslEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Store ID</label>
                          <input 
                            type="text" 
                            value={sslStoreId}
                            onChange={(e) => setSslStoreId(e.target.value)}
                            placeholder="Enter SSL Store ID" 
                            className="w-full mt-1.5 px-3 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Store Password</label>
                          <input 
                            type="password" 
                            value={sslStorePassword}
                            onChange={(e) => setSslStorePassword(e.target.value)}
                            placeholder="Enter SSL Store Password" 
                            className="w-full mt-1.5 px-3 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ====== Security Tab ====== */}
            {activeTab === 'security' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Security & Access Policies</h3>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">Enforce Two-Factor Authentication (2FA)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Require all shop owners to use 2FA for login.</p>
                    </div>
                    <input type="checkbox" checked={enforce2FA} onChange={(e) => setEnforce2FA(e.target.checked)} className="w-5 h-5 accent-indigo-600 cursor-pointer" />
                  </div>
                )}
              </div>
            )}

            {/* ====== Maintenance Tab ====== */}
            {activeTab === 'maintenance' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">System Maintenance Mode</h3>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/20">
                    <div>
                      <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">Enable Maintenance Mode</h4>
                      <p className="text-xs text-rose-700 mt-0.5">Pause access for all tenant shops while performing upgrades.</p>
                    </div>
                    <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="w-5 h-5 accent-rose-600 cursor-pointer" />
                  </div>
                )}
              </div>
            )}
            
            {/* ====== Other Tabs Placeholder ====== */}
            {(activeTab === 'notifications' || activeTab === 'team') && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3 capitalize">{activeTab} Settings</h3>
                <p className="text-slate-500 text-sm">Module coming soon.</p>
              </div>
            )}

          </form>

        </div>
      </div>
    </div>
  );
}