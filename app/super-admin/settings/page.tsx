"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Globe, Shield, Bell, Database, 
  Save, CheckCircle2, Lock, Smartphone, Users, Plus, Trash2, Edit, CreditCard, Loader2
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'payment' | 'notifications' | 'team' | 'maintenance'>('general');
  
  // 🚀 API States
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 🚀 ডাটাবেস থেকে বর্তমান Maintenance স্ট্যাটাস নিয়ে আসা
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
          setMaintenanceMode(data.maintenanceMode);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 🚀 ডাটাবেসে Maintenance স্ট্যাটাস সেভ করা
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/admin-settings/maintenance`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ maintenanceMode })
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
            
            {activeTab === 'general' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">General Platform Configurations</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Platform Name</label>
                    <input 
                      type="text" 
                      defaultValue="Fcom-Suite" 
                      className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Support Email</label>
                    <input 
                      type="email" 
                      defaultValue="support@fcomsuite.com" 
                      className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Default Free Trial Duration (Days)</label>
                  <input 
                    type="number" 
                    defaultValue="7" 
                    className="w-full sm:w-1/2 mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">New shops will automatically get this trial period upon registration.</p>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Subscription Payment Gateways</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure APIs to receive monthly subscription fees from merchants.</p>
                </div>
                
                <div className="space-y-6">
                  {/* bKash Merchant */}
                  <div className="p-5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">bKash</div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">bKash PGW (Tokenized)</h4>
                          <p className="text-[10px] text-slate-500">Enable automated recurring or manual bKash payments.</p>
                        </div>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600 cursor-pointer" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">App Key</label>
                        <input type="password" defaultValue="*****************" className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">App Secret</label>
                        <input type="password" defaultValue="*****************" className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                  </div>

                  {/* SSLCommerz / aamarPay */}
                  <div className="p-5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">SSL</div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">SSLCommerz / Cards</h4>
                          <p className="text-[10px] text-slate-500">Accept Credit/Debit cards and other mobile banking.</p>
                        </div>
                      </div>
                      <input type="checkbox" className="w-5 h-5 accent-indigo-600 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Internal Admin Team</h3>
                  <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                    <Plus size={14} /> Add Member
                  </button>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: "Mr. Ullash Ahmed", email: "ceo@deshiotati.com", role: "Platform Owner", access: "Full Access" },
                    { name: "Tanvir Rahman", email: "support@fcomsuite.com", role: "Support Executive", access: "Tickets Only" },
                  ].map((user, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-white/5">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{user.name}</h4>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="block text-xs font-bold text-indigo-600 dark:text-indigo-400">{user.role}</span>
                          <span className="block text-[10px] text-slate-400">{user.access}</span>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={16} /></button>
                          {user.role !== "Platform Owner" && (
                            <button type="button" className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Security & Access Policies</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0b0f19] rounded-xl border border-slate-200 dark:border-white/5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">Enforce Two-Factor Authentication (2FA)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Require all shop owners to use 2FA for login.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600 cursor-pointer" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Global Notification Gateways</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Global SMS API Provider</label>
                    <select className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500">
                      <option>Greenweb SMS (Bangladesh)</option>
                      <option>BulksmsBD</option>
                      <option>Twilio</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Master Sender ID / Masking</label>
                    <input 
                      type="text" 
                      defaultValue="FcomSuite" 
                      className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">System Maintenance Mode</h3>
                
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">Enable Maintenance Mode</h4>
                        <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-0.5">This will pause access for all tenant shops while performing database migrations or server upgrades.</p>
                      </div>
                      {/* 🚀 Checkbox for Maintenance Mode */}
                      <input 
                        type="checkbox" 
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="w-5 h-5 accent-rose-600 cursor-pointer" 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

          </form>

        </div>
      </div>
    </div>
  );
}