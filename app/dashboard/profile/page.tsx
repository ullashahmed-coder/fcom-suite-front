"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Mail, Phone, Lock, Save, Camera, 
  Shield, CheckCircle2, Loader2, ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // ইউজারের স্টেট
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 🚀 LocalStorage থেকে ইউজারের ডেটা রিড করা
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user.id);
      
      // রোলটিকে সুন্দর ফরম্যাটে সেট করা
      const formattedRole = user.role
        ? user.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
        : "User";

      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: formattedRole,
      });
    }
  }, []);

  // 🚀 প্রোফাইল আপডেট (API Call)
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // ইমেইল এবং রোল এখান থেকে চেঞ্জ করা যাবে না, শুধু নাম ও ফোন নাম্বার
        body: JSON.stringify({ name: profileData.name, phone: profileData.phone })
      });

      if (res.ok) {
        // আপডেট সফল হলে লোকাল স্টোরেজ আপডেট করে দেওয়া
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        storedUser.name = profileData.name;
        storedUser.phone = profileData.phone;
        localStorage.setItem("user", JSON.stringify(storedUser));
        
        // হেডার বা সাইডবার আপডেট করার জন্য একটি স্টোরেজ ইভেন্ট ট্রিগার করতে পারেন
        window.dispatchEvent(new Event("storage")); 
        
        alert("✅ Profile updated successfully!");
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.message}`);
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 পাসওয়ার্ড আপডেট (API Call)
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("❌ New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("❌ Password must be at least 6 characters long!");
      return;
    }

    setIsPasswordLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      
      // নোট: ব্যাকএন্ডে একটি `/users/:id/change-password` রাউট থাকতে হবে যা currentPassword ভেরিফাই করে।
      const res = await fetch(`${apiUrl}/users/${userId}/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          currentPassword: passwordData.currentPassword, 
          newPassword: passwordData.newPassword 
        })
      });

      if (res.ok) {
        alert("✅ Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const err = await res.json();
        alert(`❌ Error: ${err.message}`);
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const userInitial = profileData.name ? profileData.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="max-w-[1200px] mx-auto pb-10 transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
        <button 
          onClick={() => router.back()}
          className="p-2.5 bg-white dark:bg-[#1a2421] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
            My Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your personal information and security settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* ================= LEFT COLUMN: PROFILE CARD ================= */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
            
            {/* Cover Photo */}
            <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative"></div>
            
            <div className="px-6 pb-6 relative">
              {/* Profile Avatar */}
              <div className="relative w-24 h-24 rounded-full border-4 border-white dark:border-[#1a2421] -mt-12 bg-white dark:bg-[#141d1a] shadow-md flex items-center justify-center text-3xl font-black text-emerald-600 dark:text-emerald-400 mx-auto z-10 group">
                {userInitial}
                
                {/* Image Upload Overlay */}
                <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer">
                  <Camera size={20} />
                </button>
              </div>

              <div className="text-center mt-4 space-y-1">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{profileData.name || "Loading..."}</h2>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <Shield size={14} /> {profileData.role}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Active Member</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: SETTINGS ================= */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Personal Information Form */}
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <User size={18} className="text-emerald-500" /> Personal Information
              </h3>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Phone Number</label>
                  <div className="relative mt-1.5">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Email Address</label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    value={profileData.email}
                    disabled
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-500 cursor-not-allowed transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Email address cannot be changed. Contact super admin for modification.</p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-sm disabled:opacity-70"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Form */}
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Lock size={18} className="text-rose-500" /> Security Settings
              </h3>
            </div>
            
            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Current Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-gray-100 dark:border-white/5 pt-5">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300">New Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[10px] text-gray-500 hidden sm:block">Make sure to use a strong, unique password.</p>
                <button 
                  type="submit" 
                  disabled={isPasswordLoading || !passwordData.currentPassword || !passwordData.newPassword}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isPasswordLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}