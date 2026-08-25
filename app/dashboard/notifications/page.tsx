"use client";

import React, { useState } from "react";
import { 
  Bell, Package, AlertTriangle, CheckCircle2, 
  Trash2, Check, ArrowLeft, Filter
} from "lucide-react";
import { useRouter } from "next/navigation";

// নোটিফিকেশনের ডেটা
const initialNotifications = [
  { id: 1, type: "order", title: "New Order Received", text: "New order #885 received from Anika Tonamee.", time: "5 mins ago", read: false, icon: <Package size={18} className="text-blue-500"/>, bg: "bg-blue-50 dark:bg-blue-500/10" },
  { id: 2, type: "alert", title: "Low Stock Warning", text: "Low stock warning: Premium Jamdani Saree (Only 3 left).", time: "1 hour ago", read: false, icon: <AlertTriangle size={18} className="text-amber-500"/>, bg: "bg-amber-50 dark:bg-amber-500/10" },
  { id: 3, type: "success", title: "Order Delivered", text: "Order #882 successfully delivered via Steadfast Courier.", time: "3 hours ago", read: true, icon: <CheckCircle2 size={18} className="text-emerald-500"/>, bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { id: 4, type: "order", title: "Reseller Order Placed", text: "New reseller order #R-102 placed by Mitu Akter.", time: "5 hours ago", read: true, icon: <Package size={18} className="text-indigo-500"/>, bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  { id: 5, type: "alert", title: "Parcel Return Request", text: "Order #879 marked as returned by courier partner.", time: "1 day ago", read: true, icon: <AlertTriangle size={18} className="text-rose-500"/>, bg: "bg-rose-50 dark:bg-rose-500/10" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("all"); // all, unread

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto pb-10 transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-white dark:bg-[#1a2421] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2">
              Notifications Center
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-rose-500 text-white px-2.5 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Stay updated with your latest store activities and system alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Check size={14} className="text-emerald-500" /> Mark all as read
          </button>
        </div>
      </div>

      {/* ================= FILTER TABS ================= */}
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-[#1a2421] text-slate-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}
        >
          All Notifications ({notifications.length})
        </button>
        <button 
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'unread' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-[#1a2421] text-slate-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* ================= NOTIFICATIONS LIST ================= */}
      <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3 opacity-50" />
            <p className="font-bold text-base">No notifications found!</p>
            <p className="text-xs text-gray-500 mt-1">You're all caught up with your updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-5 flex items-start justify-between gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${!notif.read ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.bg}`}>
                    {notif.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm ${!notif.read ? 'font-black text-slate-800 dark:text-white' : 'font-bold text-slate-700 dark:text-gray-300'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notif.text}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-2 font-medium">{notif.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!notif.read && (
                    <button 
                      onClick={() => setNotifications(notifications.map(n => n.id === notif.id ? {...n, read: true} : n))}
                      className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}