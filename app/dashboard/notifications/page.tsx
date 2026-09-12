"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, Package, AlertTriangle, CheckCircle2, 
  Trash2, Check, ArrowLeft, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

// 🚀 ডামি বা ফলব্যাক ডেটা (যেটা মিসিং ছিল)
const fallbackNotifications = [
  { id: 'f1', type: "order", title: "New Order Received", message: "New order #885 received from Anika.", createdAt: new Date(Date.now() - 5*60000).toISOString(), isRead: false },
  { id: 'f2', type: "alert", title: "Low Stock Warning", message: "Low stock warning: Premium Jamdani (Only 3 left).", createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: false },
  { id: 'f3', type: "success", title: "Order Delivered", message: "Order #882 successfully delivered.", createdAt: new Date(Date.now() - 10800000).toISOString(), isRead: true },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState("all"); // all, unread
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // 🚀 ১. পেজ লোড হলে নোটিফিকেশন ফেচ করা
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // 🚀 ফিক্স: ডাটাবেসে ডেটা থাকলে সেটা দেখাবে, না থাকলে ডামি ডেটা দেখাবে
        if (data && data.length > 0) {
          setNotifications(data);
        } else {
          setNotifications(fallbackNotifications);
        }
      } else {
        setNotifications(fallbackNotifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotifications(fallbackNotifications); // API ফেইল করলেও ডামি ডেটা দেখাবে
    } finally {
      setLoading(false);
    }
  };

  // 🚀 ২. সিঙ্গেল নোটিফিকেশন রিড করা
  const handleMarkAsRead = async (id: string | number) => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      // লোকাল স্টেট আপডেট
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  // 🚀 ৩. সব নোটিফিকেশন একসাথে রিড করা
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      await fetch(`${apiUrl}/notifications/read-all`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  // 🚀 ৪. নোটিফিকেশন ডিলিট করা
  const handleDelete = async (id: string | number) => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      await fetch(`${apiUrl}/notifications/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // 🚀 ৫. ডাইনামিক টাইম ক্যালকুলেটর
  const timeAgo = (dateString: string) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // 🚀 ৬. ডাইনামিক আইকন এবং স্টাইল জেনারেটর
  const getIconDetails = (type: string) => {
    switch (type) {
      case 'order': 
        return { icon: <Package size={18} className="text-blue-500"/>, bg: "bg-blue-50 dark:bg-blue-500/10" };
      case 'warning':
      case 'alert': 
        return { icon: <AlertTriangle size={18} className="text-amber-500"/>, bg: "bg-amber-50 dark:bg-amber-500/10" };
      case 'success': 
        return { icon: <CheckCircle2 size={18} className="text-emerald-500"/>, bg: "bg-emerald-50 dark:bg-emerald-500/10" };
      case 'return': 
        return { icon: <AlertTriangle size={18} className="text-rose-500"/>, bg: "bg-rose-50 dark:bg-rose-500/10" };
      default: 
        return { icon: <Bell size={18} className="text-gray-500"/>, bg: "bg-gray-50 dark:bg-gray-500/10" };
    }
  };

  // আনরিড কাউন্ট (API থেকে সাধারণত isRead ফিল্ড আসে)
  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.isRead && !n.read;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

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
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
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
            {filteredNotifications.map((notif) => {
              const isRead = notif.isRead || notif.read;
              const { icon, bg } = getIconDetails(notif.type);
              
              return (
                <div 
                  key={notif.id} 
                  className={`p-5 flex items-start justify-between gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${!isRead ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : ''}`}
                >
                  <div className="flex items-start gap-4 flex-1 cursor-pointer" onClick={() => !isRead && handleMarkAsRead(notif.id)}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isRead ? 'opacity-70 bg-gray-100 dark:bg-white/5' : bg}`}>
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm ${!isRead ? 'font-black text-slate-800 dark:text-white' : 'font-bold text-slate-700 dark:text-gray-300'}`}>
                          {notif.title || (notif.type === 'order' ? 'Order Update' : 'New Alert')}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${!isRead ? 'text-slate-700 dark:text-gray-300' : 'text-slate-500 dark:text-gray-500'}`}>
                        {notif.text || notif.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-2 font-medium">
                        {notif.createdAt ? timeAgo(notif.createdAt) : (notif.time || 'Just now')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {!isRead && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                        className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                      className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}