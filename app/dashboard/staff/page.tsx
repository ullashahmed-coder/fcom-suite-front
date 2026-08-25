"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Users, Briefcase, DollarSign, 
  Wallet, Calendar, CheckCircle2, 
  CreditCard, FileText, Phone, Loader2, Info
} from "lucide-react";

export default function StaffPayrollPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "history">("directory");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // ডামি পেমেন্ট হিস্ট্রি (যেহেতু এর ব্যাকএন্ড এখনো তৈরি হয়নি)
  const payrollHistory = [
    { id: "PAY-1045", date: "01 Aug 2026", empName: "Mitu", amount: 15000, bonus: 2000, total: 17000, method: "bKash", status: "Paid" },
    { id: "PAY-1044", date: "01 Aug 2026", empName: "Mim", amount: 15000, bonus: 1500, total: 16500, method: "Bank Transfer", status: "Paid" },
    { id: "PAY-1043", date: "01 Jul 2026", empName: "Eti", amount: 12000, bonus: 0, total: 12000, method: "Cash", status: "Paid" },
  ];

  // 🚀 ডাটাবেস থেকে স্টাফ/ইউজার ফেচ করা
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // UI এর জন্য ডেটা ফরম্যাট করা (Salary ডাইনামিক করা হচ্ছে Role এর ওপর ভিত্তি করে)
        const formattedStaff = data.map((user: any) => ({
          ...user,
          salary: user.role.includes("ADMIN") ? 50000 : user.role === "OPERATOR" ? 15000 : 12000,
          pendingPay: user.status === "Active" ? (user.role === "OPERATOR" ? 15000 : 12000) : 0,
          joinDate: new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          avatarBg: user.role.includes("ADMIN") ? "bg-purple-600" : user.role === "OPERATOR" ? "bg-cyan-600" : "bg-emerald-600"
        }));

        setStaffList(formattedStaff);
        if (formattedStaff.length > 0 && !selectedStaff) {
          setSelectedStaff(formattedStaff[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // 🚀 ডাইনামিক সার্চ ফিল্টার
  const filteredStaff = staffList.filter(staff => 
    staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    staff.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.phone?.includes(searchQuery)
  );

  // 🚀 ডাইনামিক KPI ক্যালকুলেশন
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.status !== "Inactive").length;
  const totalPayroll = staffList.reduce((acc, curr) => acc + curr.salary, 0);
  const totalPending = staffList.reduce((acc, curr) => acc + curr.pendingPay, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-500 font-medium">লোডিং পেরোল ডেটা...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-6 font-sans transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wallet className="text-indigo-500" size={24} /> Staff Payroll
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage salaries, process payments, and view payroll history.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors">
            <Wallet size={16} /> Process Bulk Pay
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        {[
          { label: "Total Staff", value: totalStaff, icon: <Briefcase size={20} />, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Active This Month", value: activeStaff, icon: <CheckCircle2 size={20} />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Monthly Payroll", value: `৳ ${totalPayroll.toLocaleString()}`, icon: <DollarSign size={20} />, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Pending Payments", value: `৳ ${totalPending.toLocaleString()}`, icon: <CreditCard size={20} />, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1a2421] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{kpi.label}</p>
              <h3 className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[70vh]">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden transition-colors">
          
          <div className="p-5 shrink-0 space-y-4">
            
            {/* Tab Toggle */}
            <div className="flex justify-between items-center">
              <div className="inline-flex bg-gray-50 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm">
                <button 
                  onClick={() => setActiveTab("directory")}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
                    activeTab === "directory" ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#1a2421] shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Users size={16} /> Salary Roster
                </button>
                <button 
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
                    activeTab === "history" ? "text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#1a2421] shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <FileText size={16} /> Payment History
                </button>
              </div>
              
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10">
                <Info size={14} /> To add new staff, visit Users page.
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "directory" ? "Search staff by name or role..." : "Search payroll by ID or Employee..."}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* List Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-5 pt-0 space-y-3 custom-scrollbar">
            {activeTab === "directory" 
              ? filteredStaff.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No staff found.</div>
                ) : filteredStaff.map((staff) => {
                  const isSelected = selectedStaff?.id === staff.id;
                  return (
                    <div 
                      key={staff.id} 
                      onClick={() => setSelectedStaff(staff)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? "border-indigo-500 dark:border-indigo-500/60 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm" : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-200 dark:hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${staff.avatarBg} text-white flex items-center justify-center text-lg font-bold shadow-sm`}>
                          {staff.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className={`text-[15px] font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>{staff.name}</h3>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{staff.role}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[13px] font-bold text-slate-700 dark:text-gray-200">৳ {staff.salary.toLocaleString()}</span>
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          staff.status !== 'Inactive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {staff.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  );
                })
              : payrollHistory.map((history, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-200 dark:hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 mt-1">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-bold text-slate-800 dark:text-white">{history.id}</h3>
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 px-2 py-0.5 rounded uppercase">{history.method}</span>
                        </div>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">Paid to <span className="font-bold text-slate-700 dark:text-gray-300">{history.empName}</span> on {history.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h4 className="text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400">৳ {history.total.toLocaleString()}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Including Bonus: ৳{history.bonus}</p>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Staff Details & Payment ================= */}
        {activeTab === "directory" && selectedStaff && (
          <div className="lg:col-span-5 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden relative transition-colors">
            
            <div className="absolute top-4 right-4">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                selectedStaff.status !== 'Inactive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
              }`}>
                {selectedStaff.status || 'Active'}
              </span>
            </div>

            <div className="p-6 pt-10 text-center border-b border-gray-100 dark:border-white/10 shrink-0 bg-slate-50/50 dark:bg-white/5">
              <div className={`w-20 h-20 mx-auto rounded-full ${selectedStaff.avatarBg} text-white flex items-center justify-center text-3xl font-bold shadow-md border-4 border-white dark:border-[#1a2421] mb-3`}>
                 {selectedStaff.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{selectedStaff.name}</h2>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-wider">{selectedStaff.role}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f8fafc] dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Phone size={12}/> Phone</p>
                  <p className="text-[13px] font-bold text-slate-700 dark:text-gray-200">{selectedStaff.phone || "Not provided"}</p>
                </div>
                <div className="bg-[#f8fafc] dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar size={12}/> Joined Date</p>
                  <p className="text-[13px] font-bold text-slate-700 dark:text-gray-200">{selectedStaff.joinDate}</p>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div>
                <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Salary Information</h3>
                <div className="border border-gray-200 dark:border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
                    <span className="text-[13px] text-gray-500 dark:text-gray-400">Basic Salary (Monthly)</span>
                    <span className="font-bold text-slate-800 dark:text-white">৳ {selectedStaff.salary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
                    <span className="text-[13px] text-gray-500 dark:text-gray-400">Sales Bonus / Incentives</span>
                    <span className="font-bold text-indigo-500 dark:text-indigo-400">+ ৳ 0</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-white">Net Payable Amount</span>
                    <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">৳ {selectedStaff.salary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Action Button */}
            <div className="p-5 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a2421] transition-colors">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-md transition-colors flex justify-center items-center gap-2">
                <Wallet size={18} /> Process Payment
              </button>
            </div>

          </div>
        )}

        {/* ================= RIGHT COLUMN: Blank state for Payroll History Tab ================= */}
        {activeTab === "history" && (
           <div className="lg:col-span-5 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col items-center justify-center p-10 text-center transition-colors">
              <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                 <FileText size={40} className="text-gray-300 dark:text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Payroll History Selected</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Select an employee from the Salary Roster tab to view their detailed information and process new payments.
              </p>
           </div>
        )}

      </div>

    </div>
  );
}