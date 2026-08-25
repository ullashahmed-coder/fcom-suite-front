"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";

type SupportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shopId, setShopId] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.shopId) setShopId(user.shopId);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // 🚀 এখানে আর shopId পাঠানোর দরকার নেই, ব্যাকএন্ড নিজেই টোকেন থেকে ধরে নেবে
        body: JSON.stringify({ subject, priority, message }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSubject("");
          setMessage("");
          setPriority("MEDIUM");
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to submit ticket", error);
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-bold text-slate-800 dark:text-white">Contact Support</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center text-center">
            <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Ticket Submitted!</h4>
            <p className="text-sm text-slate-500">Our support team will get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Subject</label>
              <input required type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Domain setup issue" className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Message</label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe your issue in detail..." className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none"></textarea>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Ticket
            </button>
          </form>
        )}
      </div>
    </div>
  );
}