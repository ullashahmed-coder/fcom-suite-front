"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Send, Loader2, Info, AlertTriangle, CheckCircle2, History } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS";
  isActive: boolean;
  date: string;
};

export default function SuperAdminBroadcastPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ফর্ম স্টেটস
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"INFO" | "WARNING" | "SUCCESS">("INFO");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // নোটিশ ফেচ করার ফাংশন
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/announcements/admin/all`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // নতুন নোটিশ তৈরি করার ফাংশন
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/announcements/admin/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, message, type }),
      });

      if (res.ok) {
        setTitle("");
        setMessage("");
        setType("INFO");
        fetchAnnouncements(); // লিস্ট আপডেট
      }
    } catch (error) {
      console.error("Broadcast failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Megaphone className="text-indigo-600 dark:text-indigo-400" size={24} /> Platform Broadcasts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Send important announcements and alerts to all shop owners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ================= BROADCAST FORM ================= */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Send size={18} className="text-indigo-500" /> New Broadcast
            </h2>
            
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Announcement Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled Maintenance Notice" 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Broadcast Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setType("INFO")} className={`flex justify-center items-center gap-1.5 py-2 border rounded-xl text-xs font-bold transition-all ${type === "INFO" ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400" : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-[#0b0f19] dark:border-white/10 dark:text-slate-400"}`}>
                    <Info size={14} /> Info
                  </button>
                  <button type="button" onClick={() => setType("WARNING")} className={`flex justify-center items-center gap-1.5 py-2 border rounded-xl text-xs font-bold transition-all ${type === "WARNING" ? "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400" : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-[#0b0f19] dark:border-white/10 dark:text-slate-400"}`}>
                    <AlertTriangle size={14} /> Alert
                  </button>
                  <button type="button" onClick={() => setType("SUCCESS")} className={`flex justify-center items-center gap-1.5 py-2 border rounded-xl text-xs font-bold transition-all ${type === "SUCCESS" ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-[#0b0f19] dark:border-white/10 dark:text-slate-400"}`}>
                    <CheckCircle2 size={14} /> Success
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Message Details</label>
                <textarea 
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type the full announcement message here..." 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Megaphone size={18} />}
                Publish Broadcast
              </button>
            </form>
          </div>
        </div>

        {/* ================= BROADCAST HISTORY ================= */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#0b0f19]">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <History size={16} className="text-slate-400" /> Broadcast History
              </h2>
            </div>

            <div className="p-2">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No broadcasts yet</p>
                  <p className="text-xs mt-1">Publish your first announcement from the left panel.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {announcements.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-start gap-4">
                      
                      {/* আইকন */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        item.type === 'INFO' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' :
                        item.type === 'WARNING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      }`}>
                        {item.type === 'INFO' ? <Info size={18} /> : item.type === 'WARNING' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                      </div>

                      {/* টেক্সট কন্টেন্ট */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{item.title}</h3>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">{item.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.message}</p>
                      </div>

                      {/* স্ট্যাটাস ব্যাজ */}
                      <div className="shrink-0 self-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                          item.isActive 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}