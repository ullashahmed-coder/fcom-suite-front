"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Truck, MapPin, CheckCircle2, 
  Clock, Package, Printer, RefreshCw, FileText, User, Loader2, X
} from "lucide-react";
import Link from "next/link";

export default function CourierPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [activeTab, setActiveTab] = useState<"All" | "Steadfast" | "Pathao" | "RedX">("All");
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  
  // 🚀 মোবাইলে ডিটেইলস দেখানোর জন্য নতুন স্টেট
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  const [dateFilter, setDateFilter] = useState("All Time");
  const [searchQuery, setSearchQuery] = useState("");

  const dateFilters = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "All Time"];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchCourierOrders = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const courierStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'PARTIAL DELIVERED', 'PARTIAL_DELIVERED', 'RETURNED'];
        const dispatched = data.filter((o: any) => !o.isDeleted && o.consignmentId && courierStatuses.includes(o.status?.toUpperCase()));
        setOrders(dispatched);
      }
    } catch (error) {
      console.error("Failed to fetch courier data:", error);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchCourierOrders();
  }, []);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Pending";
    const dateObj = new Date(dateString);
    const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
  };

  const getOnlyDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const generateTimeline = (order: any) => {
    const logs = order.logs || [];
    const timeline = [];

    timeline.push({ 
      status: "Manifest Created", 
      time: formatDateTime(order.createdAt), 
      done: true 
    });

    const isShipped = ['SHIPPED', 'DELIVERED', 'PARTIAL DELIVERED', 'PARTIAL_DELIVERED', 'RETURNED'].includes(order.status?.toUpperCase());
    const shippedLog = logs.find((l: any) => l.status?.toUpperCase() === 'SHIPPED');
    timeline.push({ 
      status: "In Transit", 
      time: shippedLog ? formatDateTime(shippedLog.createdAt) : (isShipped ? formatDateTime(order.updatedAt) : "Pending"), 
      done: isShipped 
    });

    const isDelivered = ['DELIVERED', 'PARTIAL DELIVERED', 'PARTIAL_DELIVERED'].includes(order.status?.toUpperCase());
    const isReturned = order.status?.toUpperCase() === 'RETURNED';
    
    if (isReturned) {
      timeline.push({ 
        status: "Returned", 
        time: formatDateTime(order.updatedAt), 
        done: true 
      });
    } else {
      timeline.push({ 
        status: "Delivered", 
        time: isDelivered ? formatDateTime(order.updatedAt) : "Pending", 
        done: isDelivered 
      });
    }

    return timeline;
  };

  const getCourierName = (order: any) => {
    if (order.courierName) return order.courierName;
    if (order.consignmentId) return "Steadfast";
    return "Unknown";
  };

  const filteredParcels = orders.filter(order => {
    const courierName = getCourierName(order);
    if (activeTab !== "All" && courierName !== activeTab) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        order.consignmentId?.toLowerCase().includes(q) ||
        order.orderNo?.toLowerCase().includes(q) ||
        order.trackingCode?.toLowerCase().includes(q) ||
        order.customer?.name?.toLowerCase().includes(q) ||
        order.customer?.phone?.includes(q);
      if (!matchesSearch) return false;
    }

    if (dateFilter !== "All Time") {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      orderDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);

      if (dateFilter === "Today" && orderDate.getTime() !== today.getTime()) return false;
      if (dateFilter === "Yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (orderDate.getTime() !== yesterday.getTime()) return false;
      }
      if (dateFilter === "Last 7 Days") {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        if (orderDate.getTime() < last7.getTime()) return false;
      }
      if (dateFilter === "Last 30 Days") {
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        if (orderDate.getTime() < last30.getTime()) return false;
      }
    }

    return true;
  });

  // ডেস্কটপের জন্য অটো সিলেক্ট (মোবাইলে পপআপ যেন অটো ওপেন না হয় তাই এই লজিক)
  useEffect(() => {
    if (filteredParcels.length > 0 && !selectedParcel) {
      setSelectedParcel(filteredParcels[0]);
    } else if (filteredParcels.length === 0) {
      setSelectedParcel(null);
    }
  }, [filteredParcels]);

  // 🚀 মোবাইলে ক্লিক হ্যান্ডলার
  const handleParcelClick = (parcel: any) => {
    setSelectedParcel(parcel);
    setIsMobileDrawerOpen(true);
  };

  const getMappedStatus = (status: string) => {
    const s = status?.toUpperCase() || "";
    if (['DELIVERED', 'PARTIAL DELIVERED', 'PARTIAL_DELIVERED'].includes(s)) return "DELIVERED";
    if (['RETURNED'].includes(s)) return "RETURNED";
    if (['SHIPPED'].includes(s)) return "IN TRANSIT";
    return "PENDING DISPATCH"; 
  };

  const getStatusColor = (rawStatus: string) => {
    const status = getMappedStatus(rawStatus);
    switch(status) {
      case "DELIVERED": return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
      case "IN TRANSIT": return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
      case "PENDING DISPATCH": return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
      case "RETURNED": return "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (rawStatus: string) => {
    const status = getMappedStatus(rawStatus);
    switch(status) {
      case "DELIVERED": return <CheckCircle2 size={12} />;
      case "IN TRANSIT": return <Truck size={12} />;
      case "PENDING DISPATCH": return <Clock size={12} />;
      case "RETURNED": return <RefreshCw size={12} />;
      default: return <Package size={12} />;
    }
  };

  const kpiDispatched = orders.length;
  const kpiInTransit = orders.filter(o => getMappedStatus(o.status) === 'IN TRANSIT').length;
  const kpiDelivered = orders.filter(o => getMappedStatus(o.status) === 'DELIVERED').length;
  const kpiReturned = orders.filter(o => getMappedStatus(o.status) === 'RETURNED').length;

  // 🚀 ট্র্যাকিং ডিটেইলস এর কমন কম্পোনেন্ট (ডেস্কটপ ও মোবাইল উভয়ের জন্য)
  const renderTrackingDetails = () => (
    <>
      <div className="p-5 sm:p-6 pt-8 sm:pt-10 text-center border-b border-gray-100 dark:border-white/10 shrink-0 bg-[#f8fafc] dark:bg-[#141d1a] relative">
        <div className="absolute top-4 left-4">
          <span className="text-[9px] sm:text-[10px] font-bold bg-white dark:bg-white/10 text-slate-600 dark:text-gray-300 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-white/10">
            {getCourierName(selectedParcel)}
          </span>
        </div>
        <p className="text-[9px] sm:text-[10px] font-bold text-[#3b82f6] dark:text-blue-400 uppercase tracking-wider mb-1">TRACKING ID</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1f2937] dark:text-white tracking-wide break-words px-2">
          {selectedParcel.consignmentId || selectedParcel.trackingCode || selectedParcel.id}
        </h2>
        
        <div className="flex justify-center mt-3">
          <span className={`text-[10px] sm:text-[11px] font-bold px-3 py-1 border rounded-full flex items-center gap-1.5 uppercase shadow-sm ${getStatusColor(selectedParcel.status)}`}>
            {getStatusIcon(selectedParcel.status)} {getMappedStatus(selectedParcel.status)}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6 sm:space-y-8 bg-white dark:bg-[#1a2421]">
        {/* Customer Details */}
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 sm:mb-3">SHIPPING DETAILS</p>
          <div className="bg-[#f8fafc] dark:bg-white/5 rounded-xl p-3.5 sm:p-4 border border-gray-100 dark:border-white/5 space-y-2.5 sm:space-y-3 transition-colors">
            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
              <div className="flex-1 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-[12px] sm:text-[13px] text-slate-700 dark:text-gray-200 font-medium">{selectedParcel.customer?.name}</span>
                <span className="text-[11px] sm:text-[12px] font-bold text-slate-800 dark:text-white">{selectedParcel.orderNo || `ORD-${selectedParcel.id}`}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
              <span className="text-[12px] sm:text-[13px] text-slate-700 dark:text-gray-200 font-medium leading-relaxed">
                {selectedParcel.customer?.address}, {selectedParcel.customer?.district}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">TRACKING TIMELINE</p>
          <div className="space-y-0 pl-2">
            {generateTimeline(selectedParcel).map((step, idx, arr) => (
              <div key={idx} className="relative pl-5 sm:pl-6 pb-5 sm:pb-6 last:pb-0">
                {idx !== arr.length - 1 && (
                  <div className={`absolute left-[5px] top-2.5 bottom-0 w-0.5 ${step.done ? 'bg-[#3b82f6]' : 'bg-gray-200 dark:bg-white/10'}`}></div>
                )}
                <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 ${
                  step.done 
                    ? 'bg-[#3b82f6] border-[#3b82f6] shadow-[0_0_0_3px_rgba(59,130,246,0.2)]' 
                    : 'bg-white dark:bg-[#1a2421] border-gray-300 dark:border-gray-600'
                }`}></div>
                
                <div>
                  <h4 className={`text-[13px] sm:text-[14px] font-bold ${step.done ? 'text-slate-800 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{step.status}</h4>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-2">
          <div className="bg-[#f8fafc] dark:bg-white/5 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
            <h3 className="text-[9px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">DELIVERY CHARGE</h3>
            <span className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">৳ {selectedParcel.deliveryCharge || 0}</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 sm:p-4 border border-blue-100 dark:border-blue-500/20 shadow-sm transition-colors">
            <h3 className="text-[9px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">COD AMOUNT</h3>
            <span className="text-lg sm:text-xl font-extrabold text-[#3b82f6] dark:text-blue-400">
              ৳ {Math.max(0, (selectedParcel.totalAmount || 0) - (selectedParcel.advance || 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a2421] transition-colors flex gap-2.5 sm:gap-3 shrink-0">
        <Link 
          href={`/dashboard/orders/${selectedParcel.id}/invoice`}
          target="_blank"
          className="flex-1 bg-white dark:bg-[#1a2421] border border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-700 dark:text-gray-200 py-2.5 sm:py-3 rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-1.5 sm:gap-2 text-[12px] sm:text-sm"
        >
          <Printer size={16} /> Print Label
        </Link>
        <button className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2.5 sm:py-3 rounded-xl font-bold shadow-md transition-colors flex justify-center items-center gap-1.5 sm:gap-2 text-[12px] sm:text-sm">
          <Search size={16} /> Full Tracking
        </button>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-[#3b82f6]" size={40} />
        <p className="text-slate-500 font-medium">Fetching courier data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-4 sm:p-6 font-sans transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Truck className="text-[#3b82f6]" size={22} /> Courier Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage shipments, print manifests, and track parcels live.</p>
        </div>
        
        <div className="flex w-full lg:w-auto gap-2.5 sm:gap-3">
          <button className="flex-1 lg:flex-none justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-700 dark:text-gray-200 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors flex">
            <FileText size={16} /> <span className="hidden sm:inline">Print</span> Manifest
          </button>
          <button onClick={fetchCourierOrders} disabled={isSyncing} className="flex-1 lg:flex-none justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors disabled:opacity-70 flex">
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> Sync <span className="hidden sm:inline">Status</span>
          </button>
        </div>
      </div>

      {/* ================= KPI CARDS (COMPACT FOR MOBILE) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {[
          { label: "Dispatched", value: kpiDispatched, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "In Transit", value: kpiInTransit, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Delivered", value: kpiDelivered, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Returned", value: kpiReturned, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1a2421] p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between transition-colors">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">{kpi.label}</p>
              <h3 className={`text-lg sm:text-2xl font-bold ${kpi.color}`}>{kpi.value}</h3>
            </div>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
              <Truck size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* ================= LEFT COLUMN: Parcel List ================= */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden transition-colors h-[600px] lg:h-[75vh]">
          
          <div className="p-4 sm:p-5 shrink-0 space-y-3 sm:space-y-4 border-b border-gray-100 dark:border-white/5">
            
            {/* Courier Tabs */}
            <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-x-auto custom-scrollbar">
              {["All", "Steadfast", "Pathao", "RedX"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center ${
                    activeTab === tab ? "text-[#3b82f6] bg-white dark:bg-[#1a2421] shadow-sm border border-gray-200 dark:border-white/10" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {tab === "All" ? <Package size={14} /> : <Truck size={14} />} {tab}
                </button>
              ))}
            </div>

            {/* List Header & Date Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3">
              <h2 className="text-[15px] sm:text-[17px] font-bold text-slate-800 dark:text-white shrink-0">Parcel Tracking</h2>
              
              <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-transparent shadow-sm overflow-x-auto w-full sm:w-auto custom-scrollbar">
                {dateFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] rounded-full transition-colors whitespace-nowrap ${
                      dateFilter === filter 
                        ? "bg-white dark:bg-[#1a2421] text-teal-700 dark:text-teal-400 font-bold shadow-sm dark:border dark:border-white/10" 
                        : "text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full pt-0.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID or Customer..." 
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#3b82f6] transition-colors"
              />
            </div>
          </div>

          {/* List Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 sm:space-y-3 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
            {filteredParcels.length === 0 ? (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center">
                <Truck size={40} className="mb-2 opacity-50" />
                <p className="text-sm">No parcels found.</p>
              </div>
            ) : (
              filteredParcels.map((parcel) => {
                const isSelected = selectedParcel?.id === parcel.id;
                const statusClasses = getStatusColor(parcel.status);
                const courierName = getCourierName(parcel);
                const displayId = parcel.consignmentId || parcel.trackingCode || parcel.id;
                
                return (
                  <div 
                    key={parcel.id} 
                    onClick={() => handleParcelClick(parcel)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border-2 cursor-pointer transition-all gap-2 sm:gap-3 ${
                      isSelected ? "border-[#3b82f6] dark:border-blue-500/60 bg-blue-50/50 dark:bg-blue-500/10 shadow-sm" : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-200 dark:hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-gray-300 shrink-0 mt-0.5 border border-gray-200 dark:border-white/5">
                        <Truck size={16} className="sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                          <h3 className={`text-[13px] sm:text-[15px] font-bold truncate max-w-[140px] sm:max-w-xs ${isSelected ? 'text-[#3b82f6] dark:text-blue-400' : 'text-slate-800 dark:text-gray-200'}`}>{displayId}</h3>
                          <span className="text-[9px] sm:text-[10px] font-bold bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded uppercase">{courierName}</span>
                        </div>
                        <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-sm">Order: <span className="font-bold text-slate-700 dark:text-gray-300">{parcel.orderNo || `ORD-${parcel.id}`}</span> • {parcel.customer?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 w-full sm:w-auto mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-white/5">
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        {getOnlyDate(parcel.createdAt)}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 border rounded-full flex items-center gap-1 uppercase ${statusClasses}`}>
                        {getStatusIcon(parcel.status)} {getMappedStatus(parcel.status)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Tracking Details (DESKTOP ONLY) ================= */}
        <div className="hidden lg:flex lg:col-span-5 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex-col overflow-hidden relative transition-colors h-[75vh]">
          {!selectedParcel ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 p-8 border-2 border-dashed border-gray-100 dark:border-white/5 m-6 rounded-2xl">
              <Truck size={40} className="opacity-50 mb-3" />
              <p className="font-bold text-sm">Select a parcel from the list to view tracking</p>
            </div>
          ) : (
            renderTrackingDetails()
          )}
        </div>

      </div>

      {/* ================= MOBILE DRAWER / MODAL FOR TRACKING DETAILS ================= */}
      {isMobileDrawerOpen && selectedParcel && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
          <div className="bg-white dark:bg-[#1a2421] w-full h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsMobileDrawerOpen(false)} 
              className="absolute top-4 right-4 z-20 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 p-1.5 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} className="text-slate-700 dark:text-white" />
            </button>
            
            {renderTrackingDetails()}
          </div>
        </div>
      )}

    </div>
  );
}