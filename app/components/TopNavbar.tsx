"use client";

import React, { useState } from "react";
import { 
  Bell, ChevronDown, User, Settings, LogOut, 
  CreditCard, Package, AlertTriangle, CheckCircle2,
  Sun, Moon
} from "lucide-react";
import Link from "next/link";

// ডামি নোটিফিকেশন ডেটা
const mockNotifications = [
  { id: 1, type: "order", text: "New order #885 received from Anika.", time: "5 mins ago", read: false, icon: <Package size={16} className="text-blue-500"/>, bg: "bg-blue-50 dark:bg-blue-500/10" },
  { id: 2, type: "alert", text: "Low stock warning: Premium Jamdani.", time: "1 hour ago", read: false, icon: <AlertTriangle size={16} className="text-amber-500"/>, bg: "bg-amber-50 dark:bg-amber-500/10" },
  { id: 3, type: "success", text: "Order #882 successfully delivered.", time: "3 hours ago", read: true, icon: <CheckCircle2 size={16} className="text-emerald-500"/>, bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { id: 4, type: "order", text: "New reseller order #R-102 placed.", time: "5 hours ago", read: true, icon: <Package size={16} className="text-indigo-500"/>, bg: "bg-indigo-50 dark:bg-indigo-500/10" },
];

export default function TopNavbar() {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // থিম টগল করার স্টেট
  
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="h-20 px-6 flex items-center justify-end gap-4 bg-[#f8f9fc] dark:bg-[#0f1714] transition-colors relative z-50">
      
      {/* ================= THEME TOGGLE ================= */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="p-2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* ================= NOTIFICATION BELL ================= */}
      <div className="relative">
        <button 
          onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
          className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-[#f8f9fc] dark:border-[#0f1714] rounded-full"></span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isNotifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#141d1a]">
                <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">{unreadCount} New</span>
              </div>

              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {mockNotifications.map((notif) => (
                  <div key={notif.id} className={`p-4 border-b border-gray-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer flex gap-4 ${!notif.read ? 'bg-slate-50/50 dark:bg-white/5' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.bg}`}>
                      {notif.icon}
                    </div>
                    <div>
                      <p className={`text-sm ${!notif.read ? 'font-bold text-slate-800 dark:text-gray-100' : 'text-slate-600 dark:text-gray-300'}`}>
                        {notif.text}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{notif.time}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>}
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-gray-100 dark:border-white/5 text-center bg-slate-50 dark:bg-[#141d1a]">
                <Link href="/dashboard/notifications" onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition">
                  View All Notifications
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Vertical Divider */}
      <div className="w-px h-8 bg-gray-300 dark:bg-white/10 hidden sm:block"></div>

      {/* ================= USER PROFILE ================= */}
      <div className="relative">
        <button 
          onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
          className={`flex items-center gap-3 p-1.5 pr-3 rounded-xl border transition-all ${isProfileOpen ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10' : 'border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
            U
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Ullash</h4>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">CEO • Ultra Plan</p>
          </div>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-slate-50 dark:bg-[#141d1a]">
                 <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
                  U
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Ullash Ahmed</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ullash@deshiotati.com</p>
                </div>
              </div>

              <div className="p-2">
                <Link href="/dashboard/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  <User size={16} /> My Profile
                </Link>
                <Link href="/dashboard/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  <Settings size={16} /> Settings
                </Link>
                <Link href="/dashboard/subscription" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  <CreditCard size={16} /> Billing & Plan
                </Link>
              </div>

              <div className="p-2 border-t border-gray-100 dark:border-white/5">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                  <LogOut size={16} /> Sign out
                </button>
              </div>

            </div>
          </>
        )}
      </div>

    </div>
  );
}