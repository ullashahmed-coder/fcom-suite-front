"use client";

import React, { useEffect, useState } from 'react';
import { ServerCrash, Loader2 } from 'lucide-react';

export default function MaintenanceBlocker({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        
        const res = await fetch(`${apiUrl}/admin-settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // ডাটাবেস থেকে স্ট্যাটাস চেক করছে
          setIsMaintenance(data.maintenanceMode);
        }
      } catch (error) {
        console.error("Failed to check maintenance status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();
  }, []);

  // ডাটা আসার আগে লোডিং দেখাবে, যাতে পেজ লিক না করে
  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0b0f19]">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
        <p className="text-slate-400 font-medium text-sm">Checking system status...</p>
      </div>
    );
  }

  // যদি মেইনটেন্যান্স অন থাকে, তবে এই স্ক্রিনটি দেখাবে (ড্যাশবোর্ড ব্লক করে দিবে)
  if (isMaintenance) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-[#0b0f19] text-center p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border-8 border-rose-100 dark:border-rose-500/20">
          <ServerCrash size={40} className="text-rose-500" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-3">System Under Maintenance</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">
          We are currently performing scheduled database migrations and server upgrades to improve your experience. Please check back later.
        </p>
      </div>
    );
  }

  // মেইনটেন্যান্স অফ থাকলে রেগুলার ড্যাশবোর্ড কন্টেন্ট দেখাবে
  return <>{children}</>;
}