"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, MessageSquare, Store, Loader2, Search, Filter, X, Send, CheckCircle2 } from "lucide-react";

type Ticket = {
  id: string;
  shop: string;
  subject: string;
  message: string; // 🚀 মেসেজ টাইপ যুক্ত করা হলো
  status: string;
  priority: string;
  date: string;
};

export default function SuperAdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/tickets/admin/tickets`, {
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
    fetchTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setReplyLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/tickets/admin/tickets/${selectedTicket.id}/reply`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ replyMessage, status: "RESOLVED" }),
      });

      if (res.ok) {
        setSelectedTicket(null);
        setReplyMessage("");
        fetchTickets(); 
      }
    } catch (error) {
      console.error("Failed to reply ticket:", error);
    } finally {
      setReplyLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ticket.shop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <HelpCircle className="text-indigo-600 dark:text-indigo-400" size={24} /> Merchant Support Tickets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Resolve issues and inquiries submitted by store owners.</p>
        </div>
        {loading && <Loader2 className="animate-spin text-indigo-500" size={20} />}
      </div>

      {/* ================= SEARCH ================= */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by subject or shop..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ================= TICKETS TABLE ================= */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider">Ticket Details</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider">Shop Name</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider text-center">Priority</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider text-center">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[11px] tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <HelpCircle size={32} className="mx-auto mb-3 opacity-50" />
                    No tickets found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const priority = ticket.priority.toUpperCase();
                  const status = ticket.status.toUpperCase();

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      
                      {/* 🚀 টিকিটের বিস্তারিত কলাম */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <MessageSquare size={16} className="text-indigo-500 mt-0.5 shrink-0" /> 
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white truncate max-w-[280px]">{ticket.subject}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[280px] mt-0.5">{ticket.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{ticket.date}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                          <Store size={14} className="text-slate-400 shrink-0" /> {ticket.shop}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${
                          priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400' : 
                          priority === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                          'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          status === 'RESOLVED' ? 'text-emerald-500' : 
                          status === 'IN PROGRESS' ? 'text-amber-500' : 'text-indigo-500'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedTicket(ticket)}
                          className="px-4 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          View & Reply
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= REPLY MODAL ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Ticket Details & Reply</h3>
                <p className="text-xs text-slate-500 mt-0.5">Shop: <span className="font-bold text-indigo-500">{selectedTicket.shop}</span></p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-5 space-y-4">
              
              {/* 🚀 মডালের ভেতর সাবজেক্ট এবং বিস্তারিত মেসেজ */}
              <div className="bg-slate-50 dark:bg-[#0b0f19] p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedTicket.subject}</p>
                </div>
                <div className="h-px bg-slate-200 dark:bg-white/5"></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Details / Message</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.message || "No details provided."}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Your Response / Solution</label>
                <textarea 
                  required 
                  rows={4} 
                  value={replyMessage} 
                  onChange={(e) => setReplyMessage(e.target.value)} 
                  placeholder="Type your reply here to resolve this ticket..." 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedTicket(null)} 
                  className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  disabled={replyLoading} 
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  {replyLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}