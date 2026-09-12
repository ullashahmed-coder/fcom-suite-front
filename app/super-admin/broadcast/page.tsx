"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Info, AlertTriangle, CheckCircle2, Loader2, Trash2, Edit, History as BroadcastHistory } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS";
  createdAt: string;
};

export default function SuperAdminBroadcastPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"INFO" | "WARNING" | "SUCCESS">("INFO");
  
  // Edit State (যদি null থাকে মানে নতুন বানাচ্ছে, আর ID থাকলে এডিট হচ্ছে)
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/announcements/active`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
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

  // 🚀 PUBLISH OR UPDATE FUNCTION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const url = editingId 
        ? `${apiUrl}/announcements/${editingId}` // এডিট ইউআরএল
        : `${apiUrl}/announcements`; // নতুন ক্রিয়েট ইউআরএল
        
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ title, message, type })
      });
      
      if (res.ok) {
        // ফর্ম ক্লিয়ার করা হচ্ছে
        setTitle("");
        setMessage("");
        setType("INFO");
        setEditingId(null);
        fetchAnnouncements(); // লিস্ট রিফ্রেশ
      }
    } catch (error) {
      console.error("Failed to publish:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 DELETE FUNCTION
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast?")) return;

    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/announcements/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // 🚀 EDIT BUTTON CLICK HANDLER
  const handleEditClick = (announcement: Announcement) => {
    setTitle(announcement.title);
    setMessage(announcement.message);
    setType(announcement.type);
    setEditingId(announcement.id); // এডিট মোড অন হলো
    
    // স্ক্রল করে উপরে নিয়ে যাওয়া (ঐচ্ছিক)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🚀 CANCEL EDIT FUNCTION
  const handleCancelEdit = () => {
    setTitle("");
    setMessage("");
    setType("INFO");
    setEditingId(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Megaphone className="text-indigo-600 dark:text-indigo-400" size={24} /> Platform Broadcasts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Send important announcements and alerts to all shop owners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ================= LEFT: FORM ================= */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6 relative">
          {/* Edit Mode Badge */}
          {editingId && (
            <div className="absolute top-6 right-6 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              Editing Mode Active
            </div>
          )}

          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
            <Megaphone size={18} className="text-indigo-500" /> {editingId ? "Update Broadcast" : "New Broadcast"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Announcement Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance Notice" 
                className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">Broadcast Type</label>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setType("INFO")}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${type === "INFO" ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-400' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <Info size={14} /> Info
                </button>
                <button 
                  type="button" 
                  onClick={() => setType("WARNING")}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${type === "WARNING" ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <AlertTriangle size={14} /> Alert
                </button>
                <button 
                  type="button" 
                  onClick={() => setType("SUCCESS")}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${type === "SUCCESS" ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <CheckCircle2 size={14} /> Success
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Message Details</label>
              <textarea 
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type the full announcement message here..." 
                className="w-full mt-1.5 px-4 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none custom-scrollbar"
                required
              />
            </div>

            <div className="flex gap-3">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Megaphone size={18} />} 
                {editingId ? "Update Broadcast" : "Publish Broadcast"}
              </button>

              {editingId && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ================= RIGHT: HISTORY LIST ================= */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6 min-h-[400px]">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
            <BroadcastHistory size={18} className="text-slate-400" /> Broadcast History
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No broadcasts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((item) => {
                const isInfo = item.type === 'INFO';
                const isWarning = item.type === 'WARNING';
                
                return (
                  <div key={item.id} className={`group relative p-4 rounded-xl border flex gap-4 items-start shadow-sm transition-colors ${
                    editingId === item.id 
                    ? 'border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-500/5' 
                    : 'bg-white dark:bg-[#141c19] border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                  }`}>
                    
                    <div className={`mt-0.5 p-2 rounded-full shrink-0 ${
                      isInfo ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' :
                      isWarning ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    }`}>
                      {isInfo ? <Info size={18} /> : isWarning ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    </div>

                    <div className="flex-1 min-w-0 pr-12"> {/* pr-12 added for button space */}
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">
                        {item.message}
                      </p>
                      <div className="mt-2 inline-flex">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-200 text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 uppercase tracking-wider">
                          ACTIVE
                        </span>
                      </div>
                    </div>

                    {/* 🚀 ACTION BUTTONS (Edit & Delete) */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(item)}
                        title="Edit Broadcast"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors focus:outline-none"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        title="Delete Broadcast"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors focus:outline-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}