"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Info, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS";
  createdAt: string;
};

export default function TenantAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchAnnouncements();
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 animate-in fade-in duration-300 p-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Megaphone className="text-emerald-600 dark:text-emerald-400" size={24} /> Announcements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with the latest news, alerts, and platform updates.
          </p>
        </div>
      </div>

      {/* ANNOUNCEMENT LIST */}
      <div className="bg-white dark:bg-[#141c19] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-full py-32">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-32 text-slate-500">
            <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">No announcements yet</p>
            <p className="text-sm mt-1 text-slate-400">You are all caught up! New updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5 p-4 space-y-4">
            {announcements.map((item) => {
              const isInfo = item.type === 'INFO';
              const isWarning = item.type === 'WARNING';

              return (
                <div key={item.id} className={`p-5 rounded-xl border flex flex-col sm:flex-row gap-4 items-start shadow-sm transition-colors ${
                  isInfo ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/10' :
                  isWarning ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10 hover:bg-amber-50 dark:hover:bg-amber-500/10' :
                  'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                }`}>
                  
                  {/* আইকন */}
                  <div className={`p-3 rounded-full shrink-0 ${
                    isInfo ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' :
                    isWarning ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                  }`}>
                    {isInfo ? <Info size={24} /> : isWarning ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                  </div>

                  {/* টেক্সট */}
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className={`text-base font-bold ${
                        isInfo ? 'text-indigo-900 dark:text-indigo-300' :
                        isWarning ? 'text-amber-900 dark:text-amber-300' :
                        'text-emerald-900 dark:text-emerald-300'
                      }`}>
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0 mt-1 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
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