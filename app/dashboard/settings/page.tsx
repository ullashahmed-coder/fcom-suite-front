"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Store, Truck, CreditCard, 
  Bell, Shield, Save, Globe, Phone, Mail, 
  MapPin, CheckCircle2, Key, Link as LinkIcon,
  Database, HardDrive, DownloadCloud, FileDown, 
  MessageSquare, Image as ImageIcon, Loader2
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general"); 
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 🚀 পাসওয়ার্ড চেঞ্জের জন্য নতুন স্টেট
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const [backupOptions, setBackupOptions] = useState({
    orders: true,
    products: true,
    customers: true
  });
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);

  const [settings, setSettings] = useState({
    shopId: "", 
    storeName: "",
    currency: "BDT",
    supportEmail: "",
    supportPhone: "",
    address: "",
    logoUrl: "", 
    steadfastActive: true,
    steadfastApiKey: "",
    steadfastSecretKey: "",
    pathaoActive: false,
    codActive: true,
    bkashActive: false,
    bkashAppKey: "",
    bkashAppSecret: "",
    smsActive: true,
    smsApiKey: "",
    smsSenderId: "",
    autoBackup: true,
    twoFactorAuth: true,
    insideDhakaCharge: 0,
    outsideDhakaCharge: 0,
    subCityName: "",
    subCityCharge: 0,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/settings`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store" 
      });
      
      if (res.ok) {
        const data = await res.json();
        const fetchedLogo = data.logoUrl || data.storeLogo || data.logo || "";

        const sanitizedData = Object.keys(data).reduce((acc: any, key) => {
          acc[key] = data[key] === null ? "" : data[key];
          return acc;
        }, {});

        setSettings(prev => ({ ...prev, ...sanitizedData, logoUrl: fetchedLogo }));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert("⚠️ বর্তমান এবং নতুন পাসওয়ার্ড দুটোই দিন!");
      return;
    }
    if (newPassword.length < 6) {
      alert("⚠️ নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!");
      return;
    }

    setIsUpdatingPass(true);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/users/change-password`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ সফলভাবে পাসওয়ার্ড পরিবর্তন করা হয়েছে!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        alert(`❌ পরিবর্তন ব্যর্থ হয়েছে: ${data.message || "পুরনো পাসওয়ার্ড ভুল"}`);
      }
    } catch (error) {
      console.error("Password change error:", error);
      alert("সার্ভার এরর! পাসওয়ার্ড পরিবর্তন করা যায়নি।");
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      alert("অনুগ্রহ করে শুধুমাত্র .zip ব্যাকআপ ফাইল আপলোড করুন।");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/settings/import-backup`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` },
        body: formData 
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ ডাটা সফলভাবে রিস্টোর করা হয়েছে!");
      } else {
        alert("❌ " + data.message);
      }
    } catch (error) {
      console.error("Import Error:", error);
      alert("সার্ভার এরর! ফাইল আপলোড করা যায়নি।");
    } finally {
      setIsImporting(false);
      e.target.value = ""; 
    }
  };

  const handleSaveAll = async (settingsToSave = settings, showFeedback = true) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      
      const payload = {
        ...settingsToSave,
        storeLogo: settingsToSave.logoUrl,
        logo: settingsToSave.logoUrl
      };

      const res = await fetch(`${apiUrl}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // 🚀 ১. লোকাল স্টোরেজ পারফেক্টলি আপডেট করা
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          
          userObj.shopName = settingsToSave.storeName; 
          // শপের মেইন অবজেক্টেও নাম আপডেট করে দেওয়া (যাতে লেআউট সঠিক নাম পায়)
          if (userObj.shop) {
            userObj.shop.name = settingsToSave.storeName;
          }
          
          localStorage.setItem("user", JSON.stringify(userObj));
        }

        // 🚀 ২. লেআউটকে রিয়েল-টাইম আপডেট করার ইভেন্ট পাঠানো
        window.dispatchEvent(new Event("shopUpdated"));

        if (showFeedback) {
          alert("✅ সব সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!");
          // রিলোড করার আর কোনো দরকার নেই, ম্যাজিকের মতো লাইভ চেঞ্জ হয়ে যাবে!
        }
      } else {
        if (showFeedback) alert("❌ সেটিংস সেভ করা সম্ভব হয়নি।");
      }
    } catch (error) {
      console.error("Save error:", error);
      if (showFeedback) alert("সার্ভার এরর!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/uploads/image`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const newLogoUrl = data.imageUrl || data.url || data.path || "";
        
        const updatedSettings = { ...settings, logoUrl: newLogoUrl };
        setSettings(updatedSettings);

        await handleSaveAll(updatedSettings, false);
        alert("✅ লোগো সফলভাবে আপলোড এবং সেভ হয়েছে!");

      } else {
        alert("❌ লোগো সার্ভারে আপলোড করা যায়নি।");
      }
    } catch (err) {
      console.error(err);
      alert("সার্ভার এরর!");
    } finally {
      setUploadingLogo(false);
      e.target.value = ""; 
    }
  };

  const handleGenerateBackup = async () => {
    if (!backupOptions.orders && !backupOptions.products && !backupOptions.customers) {
      alert("অনুগ্রহ করে অন্তত একটি ডাটা টাইপ সিলেক্ট করুন!");
      return;
    }

    setIsGeneratingBackup(true);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/settings/export-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backupOptions)
      });

      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Shop_Backup_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        alert("❌ Backup generation failed!");
      }
    } catch (error) {
      console.error("Backup Error:", error);
      alert("Server error!");
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  const settingTabs = [
    { id: "general", label: "General & Branding", icon: <Store size={18} />, desc: "Store details, logo & timezone" },
    { id: "shipping", label: "Courier Integration", icon: <Truck size={18} />, desc: "Steadfast, Pathao & RedX API" },
    { id: "payment", label: "Payment Gateways", icon: <CreditCard size={18} />, desc: "bKash, SSLCommerz & COD config" },
    { id: "notifications", label: "Notifications & SMS", icon: <Bell size={18} />, desc: "SMS Gateway & Email SMTP" },
    { id: "backup", label: "Data & Backup", icon: <Database size={18} />, desc: "Auto-backup & data export" },
    { id: "security", label: "Security", icon: <Shield size={18} />, desc: "Password & 2FA settings" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-4 sm:p-6 font-sans transition-colors duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-6 gap-3 sm:gap-4 bg-white dark:bg-[#1a2421] p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="text-emerald-600 dark:text-emerald-500" size={24} /> Settings <span className="hidden sm:inline">& Configurations</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your store preferences, integrations, security, and backups.</p>
        </div>
        
        <button 
          onClick={() => handleSaveAll(settings, true)}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save <span className="hidden sm:inline">All</span> Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        
        {/* ================= TABS NAVIGATION ================= */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-2.5 sm:p-4 transition-colors">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto custom-scrollbar pb-1.5 lg:pb-0">
            {settingTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full shrink-0 lg:shrink flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 lg:p-4 rounded-xl transition-all text-left cursor-pointer ${
                  activeTab === tab.id 
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 shadow-sm" 
                    : "bg-transparent border-2 border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
<div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
  activeTab === tab.id 
    ? "bg-emerald-600 text-white" 
    : "bg-gray-100 dark:bg-white/10 text-slate-500 dark:text-gray-400"
}`}>
  {tab.icon}
</div>
                <div>
                  <h3 className={`text-[12px] sm:text-[14px] font-bold ${activeTab === tab.id ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-gray-200"}`}>
                    {tab.label}
                  </h3>
                  <p className="hidden sm:block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{tab.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors overflow-hidden">
          
{/* ----- 1. GENERAL & BRANDING ----- */}
          {activeTab === "general" && (
            <div className="animate-in fade-in duration-200">
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">General & Branding</h2>
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Update your store's basic information and logo.</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                <div>
                   <label className="block text-[11px] sm:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Store Logo</label>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-[#141d1a] overflow-hidden relative p-2 shrink-0">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl.startsWith('http') ? settings.logoUrl : `${apiUrl}${settings.logoUrl}`} alt="Store Logo" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon size={28} className="text-gray-400 sm:w-[32px] sm:h-[32px]" />
                        )}
                      </div>
                      <div>
                        <label className="inline-flex cursor-pointer px-4 py-2 sm:py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm rounded-lg border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                          {uploadingLogo ? (
                            <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Uploading...</span>
                          ) : (
                            "Upload Logo"
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                        </label>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 mt-2">Recommended: Transparent PNG. Max 2MB.</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-[11px] sm:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 sm:mb-2">Store Name</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="text" value={settings.storeName} onChange={(e) => setSettings({...settings, storeName: e.target.value})} placeholder="e.g. My Shop" className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 sm:mb-2">Default Currency</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <select value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 appearance-none transition-colors">
                        <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                        <option value="USD">USD ($) - US Dollar</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 sm:mb-2">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="email" value={settings.supportEmail} onChange={(e) => setSettings({...settings, supportEmail: e.target.value})} placeholder="e.g. support@myshop.com" className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 sm:mb-2">Support Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="text" value={settings.supportPhone} onChange={(e) => setSettings({...settings, supportPhone: e.target.value})} placeholder="e.g. 01XXXXXXXXX" className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 sm:mb-2">Business Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <textarea rows={3} value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} placeholder="Enter full business address" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"></textarea>
                  </div>
                </div>

                {/* 🚀 Delivery Charges Settings */}
                <div className="mt-6 sm:mt-8 border-t border-gray-100 dark:border-white/5 pt-5 sm:pt-6">
                  <h3 className="text-[12px] sm:text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">Delivery Charges</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    
                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-gray-300">Inside Dhaka (৳)</label>
                      <input 
                        type="number" 
                        value={settings.insideDhakaCharge || ""} 
                        onChange={(e) => setSettings({...settings, insideDhakaCharge: Number(e.target.value)})}
                        className="w-full mt-1.5 px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-gray-300">Outside Dhaka (৳)</label>
                      <input 
                        type="number" 
                        value={settings.outsideDhakaCharge || ""} 
                        onChange={(e) => setSettings({...settings, outsideDhakaCharge: Number(e.target.value)})}
                        className="w-full mt-1.5 px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-gray-300">Sub-city / Local (৳)</label>
                      <div className="flex gap-2 mt-1.5">
                        <input 
                          type="text" 
                          placeholder="Area"
                          value={settings.subCityName || ""} 
                          onChange={(e) => setSettings({...settings, subCityName: e.target.value})}
                          className="w-1/2 px-3 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none"
                        />
                        <input 
                          type="number" 
                          placeholder="Charge"
                          value={settings.subCityCharge || ""} 
                          onChange={(e) => setSettings({...settings, subCityCharge: Number(e.target.value)})}
                          className="w-1/2 px-3 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                  </div>
                </div>
                
              </div>
            </div>
          )}

          {/* ----- 2. SHIPPING & COURIER ----- */}
          {activeTab === "shipping" && (
            <div className="animate-in fade-in duration-200">
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Courier Integration</h2>
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your API keys for automatic parcel syncing.</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                
                {/* Steadfast Box */}
                <div className="border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start sm:items-center justify-between mb-4 gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0">ST</div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white text-[13px] sm:text-base">Steadfast Courier</h3>
                          <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={12}/> {settings.steadfastActive ? "Connected" : "Not Connected"}
                          </p>
                        </div>
                     </div>
                     <div 
                       onClick={() => setSettings({...settings, steadfastActive: !settings.steadfastActive})}
                       className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer shrink-0 transition-colors mt-1 sm:mt-0 ${settings.steadfastActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.steadfastActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                     <div>
                       <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">API Key</label>
                       <input 
                         type="password" 
                         value={settings.steadfastApiKey} 
                         onChange={(e) => setSettings({...settings, steadfastApiKey: e.target.value})}
                         placeholder="Enter API Key"
                         className="w-full px-3.5 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-emerald-100 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none" 
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Secret Key</label>
                       <input 
                         type="password" 
                         value={settings.steadfastSecretKey} 
                         onChange={(e) => setSettings({...settings, steadfastSecretKey: e.target.value})}
                         placeholder="Enter Secret Key"
                         className="w-full px-3.5 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-emerald-100 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none" 
                       />
                     </div>
                  </div>

                  {/* Dynamic Webhook URL Section */}
                  <div className="pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-emerald-100 dark:border-emerald-500/10">
                    <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Your Steadfast Webhook URL
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input 
                        type="text" 
                        readOnly
                        value={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/orders/webhook/steadfast/${settings.shopId || "your-shop-id"}`} 
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 rounded-lg text-[11px] sm:text-sm text-gray-500 focus:outline-none select-all font-mono" 
                      />
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/orders/webhook/steadfast/${settings.shopId || "your-shop-id"}`;
                          navigator.clipboard.writeText(webhookUrl);
                          alert("✅ Webhook URL Copied! Paste it in your Steadfast API settings.");
                        }}
                        className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 font-bold rounded-lg text-xs sm:text-sm transition-colors shrink-0 cursor-pointer"
                      >
                        Copy URL
                      </button>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                      Copy this unique URL and paste it in your Steadfast API settings page by clicking "Update Webhook Info".
                    </p>
                  </div>
                </div>

                {/* Pathao Box */}
                <div className="border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start sm:items-center justify-between mb-4 gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-600 text-white rounded-lg flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0">PT</div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white text-[13px] sm:text-base">Pathao Courier</h3>
                          <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{settings.pathaoActive ? "Connected" : "Not Connected"}</p>
                        </div>
                     </div>
                     <div 
                       onClick={() => setSettings({...settings, pathaoActive: !settings.pathaoActive})}
                       className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer shrink-0 transition-colors mt-1 sm:mt-0 ${settings.pathaoActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.pathaoActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
                  <button className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer">
                     <LinkIcon size={16} className="sm:w-[18px] sm:h-[18px]" /> Configure Pathao API
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ----- 3. PAYMENT GATEWAYS ----- */}
          {activeTab === "payment" && (
            <div className="animate-in fade-in duration-200">
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Payment Gateways</h2>
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Configure methods for accepting customer payments.</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-start sm:items-center justify-between bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-4 sm:p-5 rounded-2xl gap-4">
                   <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                         <CreditCard size={18} className="sm:w-[20px] sm:h-[20px]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-[13px] sm:text-[15px]">Cash on Delivery (COD)</h3>
                        <p className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Allow customers to pay when they receive the parcel.</p>
                      </div>
                   </div>
                   <div 
                     onClick={() => setSettings({...settings, codActive: !settings.codActive})}
                     className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer shrink-0 transition-colors mt-1 sm:mt-0 ${settings.codActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.codActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                   </div>
                </div>

                <div className="border border-pink-200 dark:border-pink-500/20 bg-pink-50/30 dark:bg-pink-500/5 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start sm:items-center justify-between mb-4 gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-pink-600 text-white rounded-lg flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0">bK</div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white text-[13px] sm:text-base">bKash Merchant Integration</h3>
                          <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{settings.bkashActive ? "Active" : "Inactive"}</p>
                        </div>
                     </div>
                     <div 
                       onClick={() => setSettings({...settings, bkashActive: !settings.bkashActive})}
                       className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer shrink-0 transition-colors mt-1 sm:mt-0 ${settings.bkashActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.bkashActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 transition-opacity ${settings.bkashActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                     <div>
                       <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">App Key</label>
                       <input type="text" value={settings.bkashAppKey} onChange={(e) => setSettings({...settings, bkashAppKey: e.target.value})} placeholder="Enter App Key" className="w-full px-3.5 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-pink-100 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none" />
                     </div>
                     <div>
                       <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">App Secret</label>
                       <input type="password" value={settings.bkashAppSecret} onChange={(e) => setSettings({...settings, bkashAppSecret: e.target.value})} placeholder="Enter App Secret" className="w-full px-3.5 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-pink-100 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none" />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----- 4. NOTIFICATIONS & SMS ----- */}
          {activeTab === "notifications" && (
            <div className="animate-in fade-in duration-200">
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Notifications & SMS</h2>
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Configure automated SMS and Email alerts for customers.</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start sm:items-center justify-between mb-4 gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0">
                          <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white text-[13px] sm:text-base">SMS Gateway (BulkSMS BD)</h3>
                          <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={12}/> Connected
                          </p>
                        </div>
                     </div>
                     <div 
                       onClick={() => setSettings({...settings, smsActive: !settings.smsActive})}
                       className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer shrink-0 transition-colors mt-1 sm:mt-0 ${settings.smsActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.smsActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 transition-opacity ${settings.smsActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                     <div>
                       <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">API Key</label>
                       <input type="password" value={settings.smsApiKey} onChange={(e) => setSettings({...settings, smsApiKey: e.target.value})} placeholder="Enter SMS API Key" className="w-full px-3.5 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-emerald-100 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none" />
                     </div>
                     <div>
                       <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Sender ID</label>
                       <input type="text" value={settings.smsSenderId} onChange={(e) => setSettings({...settings, smsSenderId: e.target.value})} className="w-full px-3.5 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-emerald-100 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none font-mono" />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----- 5. DATA & BACKUP ----- */}
          {activeTab === "backup" && (
            <div className="animate-in fade-in duration-200">
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Database size={18} className="text-emerald-500 sm:w-[20px] sm:h-[20px]" /> Data Backup & Export
                </h2>
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Keep your business data safe. Download manual backups or schedule automatic ones.</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                <div className="flex items-start sm:items-center justify-between bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-4 sm:p-5 rounded-2xl gap-4">
                   <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                         <HardDrive size={18} className="sm:w-[20px] sm:h-[20px]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-[13px] sm:text-[15px]">Automated Cloud Backup</h3>
                        <p className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">Automatically backup all store data to secure cloud storage daily.</p>
                      </div>
                   </div>
                   <div 
                     onClick={() => setSettings({...settings, autoBackup: !settings.autoBackup})}
                     className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer shrink-0 transition-colors mt-1 sm:mt-0 ${settings.autoBackup ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.autoBackup ? 'translate-x-5' : 'translate-x-0'}`}></div>
                   </div>
                </div>

                <div>
                  <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2.5 sm:mb-3">Manual Data Export</h3>
                  <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-5 bg-gray-50/50 dark:bg-[#141d1a]">
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-5">
                       <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 p-2.5 sm:p-3 rounded-lg cursor-pointer">
                          <input type="checkbox" checked={backupOptions.orders} onChange={(e) => setBackupOptions({...backupOptions, orders: e.target.checked})} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> Orders
                       </label>
                       <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 p-2.5 sm:p-3 rounded-lg cursor-pointer">
                          <input type="checkbox" checked={backupOptions.products} onChange={(e) => setBackupOptions({...backupOptions, products: e.target.checked})} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> Products
                       </label>
                       <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 p-2.5 sm:p-3 rounded-lg cursor-pointer">
                          <input type="checkbox" checked={backupOptions.customers} onChange={(e) => setBackupOptions({...backupOptions, customers: e.target.checked})} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> Customers
                       </label>
                       <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 p-2.5 sm:p-3 rounded-lg opacity-50 cursor-not-allowed">
                          <input type="checkbox" disabled className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> Settings
                       </label>
                     </div>
                     
                     <button 
                        onClick={handleGenerateBackup}
                        disabled={isGeneratingBackup || (!backupOptions.orders && !backupOptions.products && !backupOptions.customers)}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 w-full md:w-auto px-5 sm:px-6 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs sm:text-sm font-bold shadow-md hover:bg-slate-700 dark:hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                     >
                        {isGeneratingBackup ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <DownloadCloud size={16} className="sm:w-[18px] sm:h-[18px]" />} 
                        {isGeneratingBackup ? "Generating ZIP..." : "Generate New Backup (.ZIP)"}
                     </button>
                     
                     <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200 dark:border-white/10">
                        <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2.5 sm:mb-3">Restore Backup</h3>
                        <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">Upload a previously generated .ZIP file to restore your store data.</p>
                        
                        <label className={`flex items-center justify-center gap-1.5 sm:gap-2 w-full md:w-auto md:max-w-xs px-5 sm:px-6 py-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-xs sm:text-sm font-bold shadow-sm hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isImporting ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <FileDown size={16} className="sm:w-[18px] sm:h-[18px]" />} 
                          {isImporting ? "Restoring Data..." : "Upload .ZIP Backup"}
                          <input 
                            type="file" 
                            accept=".zip" 
                            className="hidden" 
                            onChange={handleImportBackup} 
                            disabled={isImporting}
                          />
                        </label>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----- 6. SECURITY ----- */}
          {activeTab === "security" && (
            <div className="animate-in fade-in duration-200">
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Security Settings</h2>
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Protect your account with advanced security measures.</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                
                {/* 🚀 ফিক্সড: পাসওয়ার্ড চেঞ্জ করার ফর্ম */}
                <div>
                  <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <Key size={14} className="text-emerald-500 sm:w-[16px] sm:h-[16px]"/> Change Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4 max-w-md bg-slate-50 dark:bg-[#141d1a] p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-white/5">
                     <div>
                       <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Current Password</label>
                       <input 
                         type="password" 
                         value={currentPassword}
                         onChange={(e) => setCurrentPassword(e.target.value)}
                         placeholder="Enter current password" 
                         className="w-full px-3.5 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">New Password</label>
                       <input 
                         type="password" 
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         placeholder="Enter new password" 
                         className="w-full px-3.5 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                       />
                     </div>
                     <button 
                       type="submit"
                       disabled={isUpdatingPass}
                       className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs sm:text-sm font-bold shadow-sm hover:bg-slate-700 dark:hover:bg-gray-100 transition-colors cursor-pointer mt-1 sm:mt-2 disabled:opacity-50"
                     >
                       {isUpdatingPass ? "Updating..." : "Update Password"}
                     </button>
                  </form>
                </div>

                <div className="h-px w-full bg-gray-100 dark:bg-white/10"></div>

                <div className="flex items-start sm:items-center justify-between bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 p-4 sm:p-5 rounded-2xl gap-4">
                   <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                         <Shield size={20} className="sm:w-[24px] sm:h-[24px]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-[13px] sm:text-[15px]">Two-Factor Authentication (2FA)</h3>
                        <p className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 max-w-sm">Add an extra layer of security to your account. Require an OTP when logging in.</p>
                      </div>
                   </div>
                   <div 
                     onClick={() => setSettings({...settings, twoFactorAuth: !settings.twoFactorAuth})}
                     className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer shrink-0 transition-colors mt-1 sm:mt-0 ${settings.twoFactorAuth ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${settings.twoFactorAuth ? 'translate-x-5' : 'translate-x-0'}`}></div>
                   </div>
                </div>
                
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}