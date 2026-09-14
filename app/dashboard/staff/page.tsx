"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Users, Briefcase, DollarSign, 
  Wallet, Calendar, CheckCircle2, 
  CreditCard, FileText, Phone, Loader2, Info,
  Package, Truck, RotateCcw, X, Landmark, Receipt, CalendarDays, Clock, Layers
} from "lucide-react";

export default function StaffPayrollPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "history">("directory");
  
  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const getLocalMonthStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [dateFilter, setDateFilter] = useState<string>(getLocalMonthStr()); 
  const quickFilters = ["Today", "Yesterday", "Last 7 Days"];

  // Individual Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    bonus: "",
    deduction: "",
    method: "Cash Handover"
  });

  // Bulk Payment Modal States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState("Cash Handover");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchStaffAndOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { "Authorization": `Bearer ${token}` };

      const [usersRes, ordersRes, payrollRes] = await Promise.all([
        fetch(`${apiUrl}/users`, { headers }),
        fetch(`${apiUrl}/orders`, { headers }),
        fetch(`${apiUrl}/users/payroll/history`, { headers }) 
      ]);
      
      if (usersRes.ok && ordersRes.ok && payrollRes.ok) {
        setRawUsers(await usersRes.json());
        setRawOrders(await ordersRes.json());
        setPayrollHistory(await payrollRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndOrders();
  }, []);

  useEffect(() => {
    if (rawUsers.length === 0) return;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOf7DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    const isMonthFilter = /^\d{4}-\d{2}$/.test(dateFilter);

    const formattedStaff = rawUsers.map((user: any) => {
      let filterStartDate: Date;
      let filterEndDate: Date;

      if (dateFilter === "Today") {
        filterStartDate = startOfToday;
        filterEndDate = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
      } else if (dateFilter === "Yesterday") {
        filterStartDate = startOfYesterday;
        filterEndDate = new Date(startOfToday.getTime() - 1);
      } else if (dateFilter === "Last 7 Days") {
        filterStartDate = startOf7DaysAgo;
        filterEndDate = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
      } else if (isMonthFilter) {
        const [year, month] = dateFilter.split("-").map(Number);
        filterStartDate = new Date(year, month - 1, 1);
        filterEndDate = new Date(year, month, 0, 23, 59, 59, 999);
      } else {
        filterStartDate = new Date(0); 
        filterEndDate = new Date();
      }

      const userOrders = rawOrders.filter((o: any) => {
        if (o.isDeleted) return false;
        if (o.userId !== user.id && o.user?.id !== user.id) return false;
        const orderDate = new Date(o.createdAt || o.updatedAt);
        return orderDate >= filterStartDate && orderDate <= filterEndDate;
      });
      
      const createdCount = userOrders.length;
      
      const deliveredOrders = userOrders.filter((o: any) => ['DELIVERED', 'PARTIAL DELIVERED', 'PARTIAL_DELIVERED', 'PARTIAL'].includes(o.status?.toUpperCase()));
      const deliveredParcels = deliveredOrders.length;
      
      const deliveredItemsCount = deliveredOrders.reduce((sum: number, o: any) => {
        return sum + (o.items?.reduce((s: number, item: any) => {
          const returned = item.returnedQty || 0; 
          const kept = item.quantity - returned;  
          return s + (kept > 0 ? kept : 0);
        }, 0) || 0);
      }, 0);
      
      const returnedCount = userOrders.filter((o: any) => ['RETURNED', 'CANCELLED'].includes(o.status?.toUpperCase())).length;

      let calculatedBasicSalary = 0;
      let salaryNote = "";
      const fullBasicSalary = user.basicSalary || 0;
      const joinDate = new Date(user.createdAt);

      if (isMonthFilter) {
        const joinYearMonth = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (joinYearMonth === dateFilter) {
          const daysInMonth = filterEndDate.getDate();
          const daysWorked = daysInMonth - joinDate.getDate() + 1;
          calculatedBasicSalary = Math.round((fullBasicSalary / daysInMonth) * daysWorked);
          salaryNote = `(Pro-rated for ${daysWorked} days)`;
        } else if (joinDate < filterStartDate) {
          calculatedBasicSalary = fullBasicSalary;
        } else {
          calculatedBasicSalary = 0;
          salaryNote = "(Joined after this month)";
        }
      } else {
        calculatedBasicSalary = 0;
        salaryNote = "(Basic salary applies to full months only)";
      }

      const commissionRate = user.commission || 0;
      const commissionAmount = commissionRate * deliveredItemsCount; 
      
      const netPayable = calculatedBasicSalary + commissionAmount;

      return {
        ...user,
        calculatedBasicSalary,
        fullBasicSalary,
        salaryNote,
        commissionRate,
        createdCount,
        deliveredParcels,
        deliveredItemsCount,
        returnedCount,
        commissionAmount,
        netPayable,
        pendingPay: user.status === "Active" ? netPayable : 0,
        joinDate: joinDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        avatarBg: user.role?.includes("ADMIN") || user.role === "SHOP_OWNER" ? "bg-purple-600" : user.role === "OPERATOR" ? "bg-cyan-600" : "bg-emerald-600"
      };
    });

    setStaffList(formattedStaff);
    
    if (selectedStaff) {
      const updatedSelected = formattedStaff.find((s: any) => s.id === selectedStaff.id);
      if (updatedSelected) setSelectedStaff(updatedSelected);
    } else if (formattedStaff.length > 0) {
      setSelectedStaff(formattedStaff[0]);
    }

  }, [rawUsers, rawOrders, dateFilter]); 

  const filteredStaff = staffList.filter(staff => 
    staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    staff.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.phone?.includes(searchQuery)
  );

  const filteredHistory = payrollHistory.filter(h => 
    h.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.status !== "Inactive").length;
  const totalPayroll = staffList.reduce((acc, curr) => acc + curr.netPayable, 0);
  const totalPending = staffList.reduce((acc, curr) => acc + curr.pendingPay, 0);

  const finalPaymentAmount = selectedStaff 
    ? selectedStaff.netPayable + (Number(paymentForm.bonus) || 0) - (Number(paymentForm.deduction) || 0) 
    : 0;

  const handleItemClick = (staff: any) => {
    setSelectedStaff(staff);
    if (window.innerWidth < 1024) {
      setIsMobileDrawerOpen(true);
    } else {
      setTimeout(() => {
        document.getElementById('details-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("access_token");
      const payload = {
        userId: selectedStaff.id,
        monthYear: dateFilter,
        basicSalary: selectedStaff.calculatedBasicSalary,
        commission: selectedStaff.commissionAmount,
        bonus: Number(paymentForm.bonus) || 0,
        deduction: Number(paymentForm.deduction) || 0,
        totalAmount: finalPaymentAmount,
        paymentMethod: paymentForm.method
      };
      const res = await fetch(`${apiUrl}/users/payroll`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${selectedStaff.name}-এর পেমেন্ট সফলভাবে সেভ হয়েছে!`);
        setIsPaymentModalOpen(false);
        setPaymentForm({ bonus: "", deduction: "", method: "Cash Handover" });
        setIsMobileDrawerOpen(false);
        fetchStaffAndOrders(); 
        setActiveTab("history"); 
        
        if (window.innerWidth < 1024) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        alert(`❌ পেমেন্ট ব্যর্থ হয়েছে: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("সার্ভার এরর!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBulkProcessing(true);
    try {
      const token = localStorage.getItem("access_token");
      let successCount = 0;
      let failCount = 0;

      await Promise.all(
        eligibleBulkStaff.map(async (staff) => {
          try {
            const payload = {
              userId: staff.id,
              monthYear: dateFilter,
              basicSalary: staff.calculatedBasicSalary,
              commission: staff.commissionAmount,
              bonus: 0, 
              deduction: 0,
              totalAmount: staff.netPayable,
              paymentMethod: bulkPaymentMethod
            };
            const res = await fetch(`${apiUrl}/users/payroll`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            if (res.ok) successCount++;
            else failCount++;
          } catch (err) {
            failCount++;
          }
        })
      );

      alert(`✅ বুল্ক পেমেন্ট সম্পন্ন!\nসফল: ${successCount} জন\nব্যর্থ: ${failCount} জন`);
      setIsBulkModalOpen(false);
      fetchStaffAndOrders();
      setActiveTab("history");
    } catch (error) {
      alert("সার্ভার এরর! বুল্ক পেমেন্ট সম্পন্ন করা যায়নি।");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const getDisplayFilterName = (val: string) => {
    if (/^\d{4}-\d{2}$/.test(val)) {
      const [year, month] = val.split('-');
      const date = new Date(Number(year), Number(month) - 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    return val;
  };

  const isMonthFormat = /^\d{4}-\d{2}$/.test(dateFilter);
  const currentMonthStr = getLocalMonthStr();
  const isCurrentOrFutureMonth = isMonthFormat && dateFilter >= currentMonthStr;
  
  const isAlreadyPaid = isMonthFormat && payrollHistory.some(p => p.userId === selectedStaff?.id && p.monthYear === dateFilter);

  const eligibleBulkStaff = staffList.filter(s => 
    s.netPayable > 0 && 
    !payrollHistory.some(p => p.userId === s.id && p.monthYear === dateFilter)
  );
  const bulkTotalAmount = eligibleBulkStaff.reduce((sum, s) => sum + s.netPayable, 0);

  // 🚀 রিইউজেবল স্টাফ ডিটেইলস (ডেস্কটপ এবং মোবাইল উভয়ের জন্য)
  const renderStaffDetails = () => {
    if (!selectedStaff) return null;
    return (
      <div className="flex flex-col h-full">
        <div className="p-5 sm:p-6 pt-6 sm:pt-8 text-center border-b border-gray-100 dark:border-white/10 shrink-0 bg-slate-50/50 dark:bg-white/5 relative">
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <span className={`text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              selectedStaff.status !== 'Inactive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
            }`}>
              {selectedStaff.status || 'Active'}
            </span>
          </div>
          <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full ${selectedStaff.avatarBg} text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-md border-4 border-white dark:border-[#1a2421] mb-2 sm:mb-3`}>
             {selectedStaff.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">{selectedStaff.name}</h2>
          <p className="text-[11px] sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5 sm:mt-1 uppercase tracking-wider">{selectedStaff.role}</p>
        </div>
        
        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2.5 sm:mb-3">
              <h3 className="text-[11px] sm:text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Order Performance</h3>
              <span className="text-[9px] sm:text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">
                {getDisplayFilterName(dateFilter)}
              </span>
            </div>
            {/* Mobile Optimized Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-[#f8fafc] dark:bg-white/5 rounded-xl p-2.5 sm:p-3 border border-gray-100 dark:border-white/5 text-center flex flex-col items-center justify-center">
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 flex items-center gap-1"><Package size={10}/> Created</p>
                <p className="text-lg sm:text-xl font-black text-slate-700 dark:text-gray-200">{selectedStaff.createdCount}</p>
                <p className="text-[8px] sm:text-[9px] text-gray-500">Parcels</p>
              </div>
              
              <div className="bg-emerald-50/50 dark:bg-emerald-500/10 rounded-xl p-2.5 sm:p-3 border border-emerald-100 dark:border-emerald-500/20 text-center flex flex-col items-center justify-center">
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-1 flex items-center gap-1"><Truck size={10}/> Delivered</p>
                <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">{selectedStaff.deliveredParcels}</p>
                <p className="text-[8px] sm:text-[9px] text-emerald-600 dark:text-emerald-500 font-medium">({selectedStaff.deliveredItemsCount} Sarees)</p>
              </div>

              <div className="bg-rose-50/50 dark:bg-rose-500/10 rounded-xl p-2.5 sm:p-3 border border-rose-100 dark:border-rose-500/20 text-center flex flex-col items-center justify-center">
                <p className="text-[9px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase mb-1 flex items-center gap-1"><RotateCcw size={10}/> Returned</p>
                <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-400">{selectedStaff.returnedCount}</p>
                <p className="text-[8px] sm:text-[9px] text-rose-600 dark:text-rose-500 font-medium">Parcels</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] sm:text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 sm:mb-3">Salary & Commissions</h3>
            <div className="border border-gray-200 dark:border-white/10 rounded-xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 bg-white dark:bg-transparent">
              <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex flex-col">
                  <span className="text-[11px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">Basic Salary</span>
                  {selectedStaff.salaryNote && <span className="text-[8px] sm:text-[10px] text-amber-500 dark:text-amber-400 font-medium mt-0.5">{selectedStaff.salaryNote}</span>}
                </div>
                <span className="text-[13px] sm:text-base font-bold text-slate-800 dark:text-white">৳ {selectedStaff.calculatedBasicSalary.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex flex-col">
                  <span className="text-[11px] sm:text-[13px] font-medium text-gray-500 dark:text-gray-400">Commission Earned</span>
                  <span className="text-[8px] sm:text-[10px] text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">
                    (৳{selectedStaff.commissionRate}/pc × {selectedStaff.deliveredItemsCount} dlvd)
                  </span>
                </div>
                <span className="text-[13px] sm:text-base font-bold text-indigo-600 dark:text-indigo-400">+ ৳ {selectedStaff.commissionAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center pt-1.5 sm:pt-2">
                <span className="text-[13px] sm:text-[14px] font-black text-slate-800 dark:text-white">Net Payable</span>
                <span className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">৳ {selectedStaff.netPayable.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a2421] transition-colors shrink-0 rounded-b-2xl mt-auto">
          {!isMonthFormat ? (
            <button disabled className="w-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 py-3 sm:py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 cursor-not-allowed text-xs sm:text-sm">
              <CalendarDays size={16} className="sm:w-[18px] sm:h-[18px]" /> Select a specific month to pay
            </button>
          ) : isCurrentOrFutureMonth ? (
            <button disabled className="w-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500 py-3 sm:py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 cursor-not-allowed shadow-sm text-xs sm:text-sm">
              <Clock size={16} className="sm:w-[18px] sm:h-[18px]" /> Month Not Completed Yet
            </button>
          ) : isAlreadyPaid ? (
            <button disabled className="w-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500 py-3 sm:py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 cursor-not-allowed shadow-sm text-xs sm:text-sm">
              <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /> Already Paid for {getDisplayFilterName(dateFilter)}
            </button>
          ) : (
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 sm:py-3.5 rounded-xl font-bold shadow-md transition-colors flex justify-center items-center gap-2 text-xs sm:text-sm"
            >
              <Wallet size={16} className="sm:w-[18px] sm:h-[18px]" /> Process Payment for {getDisplayFilterName(dateFilter)}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-500 font-medium text-sm">লোডিং পেরোল ও সেলস ডেটা...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-4 sm:p-6 font-sans transition-colors duration-300 relative">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wallet className="text-indigo-500" size={22} /> Staff Payroll
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage salaries, commissions, and process payments.</p>
        </div>
        
        <div className="w-full sm:w-auto">
          {/* Dynamic Bulk Payment Button */}
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            disabled={!isMonthFormat || isCurrentOrFutureMonth || eligibleBulkStaff.length === 0}
            className={`flex w-full justify-center items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-colors ${
              !isMonthFormat || isCurrentOrFutureMonth || eligibleBulkStaff.length === 0
              ? "bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            <Layers size={16} className="sm:w-[18px] sm:h-[18px]" /> 
            {!isMonthFormat 
              ? "Process Bulk Pay" 
              : isCurrentOrFutureMonth 
                ? "Month Not Ended" 
                : eligibleBulkStaff.length === 0 
                  ? "All Paid" 
                  : `Pay ${eligibleBulkStaff.length} Staff`
            }
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-5 sm:mb-6">
        {[
          { label: "Total Staff", value: totalStaff, icon: <Briefcase size={16} className="sm:w-[20px] sm:h-[20px]"/>, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Active Staff", value: activeStaff, icon: <CheckCircle2 size={16} className="sm:w-[20px] sm:h-[20px]"/>, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Calculated Payroll", value: `৳ ${totalPayroll.toLocaleString()}`, icon: <DollarSign size={16} className="sm:w-[20px] sm:h-[20px]"/>, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Pending Payments", value: `৳ ${totalPending.toLocaleString()}`, icon: <CreditCard size={16} className="sm:w-[20px] sm:h-[20px]"/>, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1a2421] p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-0">
            <div className="order-2 sm:order-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">{kpi.label}</p>
              <h3 className={`text-lg sm:text-xl font-bold ${kpi.color} truncate`}>{kpi.value}</h3>
            </div>
            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center order-1 sm:order-2 shrink-0 ${kpi.bg} ${kpi.color}`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MAIN CONTENT GRID (🚀 h-auto for Auto-expanding height) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col transition-colors h-auto overflow-visible">
          
          <div className="p-4 sm:p-5 shrink-0 space-y-3 sm:space-y-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex flex-col gap-3">
              
              {/* 🚀 Tabs */}
              <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm w-full">
                <button 
                  onClick={() => setActiveTab("directory")}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-md text-[13px] sm:text-sm font-bold transition-all ${
                    activeTab === "directory" ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#1a2421] shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Users size={16} className="sm:w-[18px] sm:h-[18px]"/> Salary Roster
                </button>
                <button 
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-md text-[13px] sm:text-sm font-bold transition-all ${
                    activeTab === "history" ? "text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#1a2421] shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <FileText size={16} className="sm:w-[18px] sm:h-[18px]"/> Payment History
                </button>
              </div>

              {/* 🚀 Search Box (Now on Top) */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === "directory" ? "Search staff by name or role..." : "Search payroll by ID or Employee..."}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              
              {/* 🚀 Date Filter (Now at the Bottom) */}
              {activeTab === "directory" && (
                <div className="flex bg-slate-50 dark:bg-[#141d1a] p-1.5 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm items-center overflow-x-auto custom-scrollbar w-full">
                  <div className="pl-2 pr-1 text-gray-400 hidden sm:block">
                    <CalendarDays size={16} />
                  </div>
                  
                  {quickFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setDateFilter(filter)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[13px] rounded-md transition-all duration-200 whitespace-nowrap font-bold ${
                        dateFilter === filter 
                          ? "bg-white dark:bg-[#1a2421] text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-white/10" 
                          : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}

                  <div className="w-px h-5 bg-gray-300 dark:bg-white/20 mx-1.5 sm:mx-2 shrink-0"></div>

                  <input 
                    type="month" 
                    value={isMonthFormat ? dateFilter : ""}
                    onChange={(e) => {
                      if(e.target.value) setDateFilter(e.target.value);
                    }}
                    title="Select any Month"
                    className={`flex-1 min-w-[120px] px-2 py-1.5 sm:py-2 mx-0.5 sm:mx-1 text-[11px] sm:text-[13px] font-bold rounded-md outline-none transition-colors cursor-pointer border shrink-0 ${
                      isMonthFormat 
                        ? "bg-white dark:bg-[#1a2421] text-indigo-600 dark:text-indigo-400 shadow-sm border-gray-200 dark:border-white/10" 
                        : "bg-transparent text-slate-500 dark:text-gray-400 border-transparent hover:text-slate-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3 bg-slate-50/50 dark:bg-transparent rounded-b-2xl h-auto">
            {activeTab === "directory" 
              ? filteredStaff.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs sm:text-sm">No staff found for this period.</div>
                ) : filteredStaff.map((staff) => {
                  const isSelected = selectedStaff?.id === staff.id;
                  return (
                    <div 
                      key={staff.id} 
                      onClick={() => handleItemClick(staff)}
                      className={`flex flex-col p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? "border-indigo-500 dark:border-indigo-500/60 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm" : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-200 dark:hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${staff.avatarBg} text-white flex items-center justify-center text-base sm:text-lg font-bold shadow-sm shrink-0`}>
                            {staff.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className={`text-[13px] sm:text-[15px] font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>{staff.name}</h3>
                            <p className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{staff.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[14px] sm:text-[15px] font-black text-indigo-600 dark:text-indigo-400">৳ {staff.netPayable.toLocaleString()}</span>
                          <span className={`text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            staff.status !== 'Inactive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}>
                            {staff.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Optimized Stats Grid */}
                      <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center border-t border-gray-100 dark:border-white/10 pt-2.5 sm:pt-3 text-[9px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        <div className="bg-slate-50 dark:bg-white/5 py-1.5 rounded">
                          Created <br/><b className="text-slate-700 dark:text-gray-200 text-[11px] sm:text-[13px]">{staff.createdCount}</b>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 py-1.5 rounded">
                          Delivered <br/><b className="text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-[13px]">{staff.deliveredParcels}</b>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-500/10 py-1.5 rounded">
                          Returned <br/><b className="text-rose-600 dark:text-rose-400 text-[11px] sm:text-[13px]">{staff.returnedCount}</b>
                        </div>
                      </div>
                    </div>
                  );
                })
              : filteredHistory.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs sm:text-sm">No payment history found.</div>
                ) : filteredHistory.map((history, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-200 dark:hover:border-white/10 transition-all gap-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                          <CheckCircle2 size={14} className="sm:w-[16px] sm:h-[16px]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <h3 className="text-[12px] sm:text-[14px] font-bold text-slate-800 dark:text-white">
                              {history.id.length > 10 ? `PAY-${history.id.substring(0,6).toUpperCase()}` : history.id}
                            </h3>
                            <span className="text-[8px] sm:text-[9px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 px-1.5 py-0.5 rounded uppercase">{history.paymentMethod || history.method}</span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Paid to <span className="font-bold text-slate-700 dark:text-gray-300">{history.user?.name || history.empName}</span></p>
                        </div>
                      </div>
                      <h4 className="text-[13px] sm:text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">৳ {(history.totalAmount || history.total).toLocaleString()}</h4>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-2 text-[9px] sm:text-[10px]">
                       <span className="text-gray-400">{new Date(history.createdAt || history.date).toLocaleDateString()}</span>
                       <span className="font-bold px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 rounded">
                         For: {getDisplayFilterName(history.monthYear)}
                       </span>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* ================= RIGHT COLUMN (DESKTOP) ================= */}
        {/* 🚀 lg:sticky added so it follows screen scroll on desktop */}
        <div id="details-section" className="hidden lg:flex lg:col-span-5 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex-col relative transition-colors h-max lg:sticky lg:top-6">
          {activeTab === "directory" ? (
            selectedStaff ? renderStaffDetails() : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-400 dark:text-gray-500 min-h-[300px]">
                <Users size={40} className="opacity-50 mb-3" />
                <p>Select a staff member to view details</p>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center min-h-[300px]">
               <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-5">
                  <FileText size={32} className="text-gray-300 dark:text-gray-600" />
               </div>
               <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Payroll History Selected</h2>
               <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                 Select an employee from the Salary Roster tab to view their detailed information and process new payments.
               </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= 🚀 MOBILE DRAWER FOR STAFF DETAILS ================= */}
      {isMobileDrawerOpen && selectedStaff && activeTab === "directory" && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
          <div className="bg-white dark:bg-[#1a2421] w-full h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 relative">
            <button 
              onClick={() => setIsMobileDrawerOpen(false)} 
              className="absolute top-4 right-4 z-20 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 p-1.5 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={18} className="text-slate-700 dark:text-white" />
            </button>
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {renderStaffDetails()}
            </div>
          </div>
        </div>
      )}

      {/* ================= INDIVIDUAL PAYMENT MODAL ================= */}
      {isPaymentModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-lg rounded-2xl shadow-2xl border border-transparent dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#141d1a]">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Landmark size={18} className="text-indigo-500 sm:w-[20px] sm:h-[20px]"/> Process Payment <span className="hidden sm:inline">for {getDisplayFilterName(dateFilter)}</span>
              </h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors p-1">
                <X size={18} className="sm:w-[20px] sm:h-[20px]"/>
              </button>
            </div>
            
            <form onSubmit={handleProcessPayment} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              <div className="flex items-center gap-3 sm:gap-4 bg-indigo-50 dark:bg-indigo-500/10 p-3 sm:p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${selectedStaff.avatarBg} text-white flex items-center justify-center text-base sm:text-lg font-bold shadow-sm shrink-0`}>
                  {selectedStaff.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-[14px] sm:text-[16px] font-bold text-slate-800 dark:text-white">{selectedStaff.name}</h3>
                  <p className="text-[10px] sm:text-[12px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 uppercase tracking-wider">{selectedStaff.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">Add Bonus (৳)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="e.g. 1000" 
                    value={paymentForm.bonus}
                    onChange={(e) => setPaymentForm({...paymentForm, bonus: e.target.value})}
                    className="w-full mt-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-bold placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">Deduction (৳)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="e.g. 500" 
                    value={paymentForm.deduction}
                    onChange={(e) => setPaymentForm({...paymentForm, deduction: e.target.value})}
                    className="w-full mt-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-bold placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">Payment Method *</label>
                <select 
                  required
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                  className="w-full mt-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 appearance-none transition-colors"
                >
                  <option value="Cash Handover">Cash Handover</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-[#141d1a] p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-white/10 text-center">
                <p className="text-[10px] sm:text-[12px] font-bold text-slate-500 dark:text-gray-400 mb-1 uppercase tracking-widest">Total Amount to Pay</p>
                <h2 className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">৳ {finalPaymentAmount.toLocaleString()}</h2>
                <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1 sm:mt-2">
                  (Base Pay: ৳{selectedStaff.calculatedBasicSalary} {Number(paymentForm.bonus) > 0 ? `+ Bonus: ৳${paymentForm.bonus}` : ""} {Number(paymentForm.deduction) > 0 ? `- Ded: ৳${paymentForm.deduction}` : ""})
                </p>
              </div>

              <div className="flex gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 font-bold py-2.5 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-colors shadow-lg flex justify-center items-center gap-1.5 sm:gap-2 disabled:opacity-70 text-xs sm:text-sm"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin sm:w-[16px] sm:h-[16px]" /> : <Receipt size={14} className="sm:w-[16px] sm:h-[16px]" />} 
                  {isProcessing ? "Processing..." : "Confirm & Pay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BULK PAYMENT MODAL ================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-lg rounded-2xl shadow-2xl border border-transparent dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#141d1a]">
              <h2 className="text-[15px] sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5 sm:gap-2">
                <Layers size={16} className="text-indigo-500 sm:w-[20px] sm:h-[20px]"/> Process Bulk Payment
              </h2>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors p-1">
                <X size={18} className="sm:w-[20px] sm:h-[20px]"/>
              </button>
            </div>
            
            <form onSubmit={handleBulkPayment} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              <div className="text-center space-y-1.5 sm:space-y-2">
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">You are about to process salary for <strong className="text-slate-800 dark:text-white">{eligibleBulkStaff.length} employees</strong> for <strong className="text-indigo-600 dark:text-indigo-400">{getDisplayFilterName(dateFilter)}</strong>.</p>
                <h2 className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 py-1 sm:py-3">৳ {bulkTotalAmount.toLocaleString()}</h2>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider">Default Payment Method *</label>
                <select 
                  required
                  value={bulkPaymentMethod}
                  onChange={(e) => setBulkPaymentMethod(e.target.value)}
                  className="w-full mt-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 appearance-none transition-colors"
                >
                  <option value="Cash Handover">Cash Handover</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1.5">This method will be applied to all {eligibleBulkStaff.length} transactions.</p>
              </div>

              <div className="flex gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 font-bold py-2.5 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isBulkProcessing} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-colors shadow-lg flex justify-center items-center gap-1.5 sm:gap-2 disabled:opacity-70 text-xs sm:text-sm"
                >
                  {isBulkProcessing ? <Loader2 size={14} className="animate-spin sm:w-[16px] sm:h-[16px]" /> : <Receipt size={14} className="sm:w-[16px] sm:h-[16px]" />} 
                  {isBulkProcessing ? "Processing..." : "Confirm Bulk Pay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}