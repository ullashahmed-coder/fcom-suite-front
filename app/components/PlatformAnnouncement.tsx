"use client";

import React, { useState, useEffect } from "react";
import { Info, AlertTriangle, CheckCircle2, X } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS";
};

export default function PlatformAnnouncement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [closedIds, setClosedIds] = useState<string[]>([]); // ইউজার কেটে দিলে আর দেখাবে না

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
      }
    };

    fetchAnnouncements();
  }, []);

  const visibleAnnouncements = announcements.filter(a => !closedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visibleAnnouncements.map((announcement) => {
        const isInfo = announcement.type === 'INFO';
        const isWarning = announcement.type === 'WARNING';
        
        return (
          <div key={announcement.id} className={`relative p-4 rounded-xl border flex gap-4 items-start shadow-sm animate-in fade-in slide-in-from-top-2 ${
            isInfo ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20' :
            isWarning ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' :
            'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
          }`}>
            
            {/* আইকন */}
            <div className={`mt-0.5 ${
              isInfo ? 'text-indigo-600 dark:text-indigo-400' :
              isWarning ? 'text-amber-600 dark:text-amber-400' :
              'text-emerald-600 dark:text-emerald-400'
            }`}>
              {isInfo ? <Info size={20} /> : isWarning ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>

            {/* টেক্সট */}
            <div className="flex-1 pr-6">
              <h4 className={`text-sm font-bold ${
                isInfo ? 'text-indigo-900 dark:text-indigo-300' :
                isWarning ? 'text-amber-900 dark:text-amber-300' :
                'text-emerald-900 dark:text-emerald-300'
              }`}>
                {announcement.title}
              </h4>
              <p className={`text-xs mt-1 ${
                isInfo ? 'text-indigo-700 dark:text-indigo-400/80' :
                isWarning ? 'text-amber-700 dark:text-amber-400/80' :
                'text-emerald-700 dark:text-emerald-400/80'
              }`}>
                {announcement.message}
              </p>
            </div>

            {/* ক্লোজ বাটন */}
            <button 
              onClick={() => setClosedIds([...closedIds, announcement.id])}
              className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${
                isInfo ? 'hover:bg-indigo-100 text-indigo-500 dark:hover:bg-indigo-500/20' :
                isWarning ? 'hover:bg-amber-100 text-amber-500 dark:hover:bg-amber-500/20' :
                'hover:bg-emerald-100 text-emerald-500 dark:hover:bg-emerald-500/20'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}