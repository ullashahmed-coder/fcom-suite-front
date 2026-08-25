"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, MessageSquare, Loader2, Plus } from "lucide-react";
import SupportModal from "../../components/SupportModal";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
};

export default function TenantTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMyTickets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/tickets`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <HelpCircle className="text-emerald-600 dark:text-emerald-400" size={24} /> Support Tickets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your inquiries and get assistance from the platform support.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <Plus size={16} /> Open New Ticket
        </button>
      </div>

      {/* TICKETS LIST */}
      <div className="bg-white dark:bg-[#141c19] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <HelpCircle size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-bold text-base">No support tickets found.</p>
            <p className="text-xs mt-1">Click &quot;Open New Ticket&quot; if you need any help.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {tickets.map((ticket) => {
              const status = (ticket.status || "").toUpperCase();
              const priority = (ticket.priority || "").toUpperCase();

              return (
                <div key={ticket.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-emerald-500 shrink-0" />
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{ticket.subject}</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 ml-6">{ticket.message}</p>
                    <p className="text-[10px] text-slate-400 ml-6">Submitted on: {new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                      priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400' : 
                      'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                      {ticket.priority}
                    </span>

                    <span className={`text-[11px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${
                      status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                      'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* নতুন টিকিট ওপেন করার জন্য মডাল */}
      <SupportModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchMyTickets(); }} />
    </div>
  );
}