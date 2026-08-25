"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, User, Phone, MapPin, 
  ArchiveRestore, CheckSquare, RefreshCw, XCircle, CheckCircle2, Loader2, Package
} from "lucide-react";

export default function ReturnsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);

  const [activeTab, setActiveTab] = useState<"pending" | "restocked">("pending");
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<any>(null);
  const [selectedRestockedOrder, setSelectedRestockedOrder] = useState<any>(null);
  
  const [dateFilter, setDateFilter] = useState("All Time");
  const dateFilters = ["Today", "Yesterday", "Last 7", "Last 30", "All Time"];
  const [searchQuery, setSearchQuery] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // 🚀 ব্যাকএন্ড থেকে ডেটা ফেচ করা
  const fetchOrders = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // ডিলিট না হওয়া অ্যাক্টিভ অর্ডারগুলো ফিল্টার করা
        setOrders(data.filter((o: any) => !o.isDeleted));
      }
    } catch (error) {
      console.error("Failed to fetch returns data:", error);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🚀 রিয়েল ডেটা ফিল্টারিং (Pending Returns & Restocked History)
  const pendingList = orders.filter(o => 
    ['CANCELLED', 'RETURNED'].includes(o.status?.toUpperCase())
  ).filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.orderNo?.toLowerCase().includes(q) || o.consignmentId?.toLowerCase().includes(q) || o.customer?.phone?.includes(q) || o.customer?.name?.toLowerCase().includes(q);
  });

  const restockedList = orders.filter(o => 
    ['RESTOCKED', 'RETURN ACCEPTED'].includes(o.status?.toUpperCase())
  ).filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.orderNo?.toLowerCase().includes(q) || o.consignmentId?.toLowerCase().includes(q) || o.customer?.phone?.includes(q) || o.customer?.name?.toLowerCase().includes(q);
  });

  // 🚀 অটো-সিলেক্ট লজিক
  useEffect(() => {
    if (activeTab === "pending" && pendingList.length > 0 && !selectedPendingOrder) {
      setSelectedPendingOrder(pendingList[0]);
    } else if (activeTab === "restocked" && restockedList.length > 0 && !selectedRestockedOrder) {
      setSelectedRestockedOrder(restockedList[0]);
    }
  }, [activeTab, orders, searchQuery]);

  // 🚀 ডেট এবং ইমেজ ফরম্যাটিং
  const formatDateTime = (dateString: string) => {
    const dateObj = new Date(dateString);
    const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${date} • ${time}`;
  };

  const getImageUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith('http') ? path : `${apiUrl}${path}`;
  };

  // 🚀 রিস্টক হ্যান্ডলার (ব্যাকএন্ডে স্ট্যাটাস আপডেট)
  const handleRestock = async () => {
    if (!selectedPendingOrder) return;
    if (!window.confirm("আপনি কি নিশ্চিত যে এই রিটার্ন অর্ডারটি গ্রহণ করে এর প্রোডাক্টগুলো স্টকে ফেরত দিতে চান?")) return;

    setIsRestocking(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders/${selectedPendingOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: "RESTOCKED" }) // স্ট্যাটাস রিস্টকড করে দেওয়া হচ্ছে
      });

      if (res.ok) {
        alert("✅ সফলভাবে রিস্টক করা হয়েছে!");
        fetchOrders(); // ডেটা রিফ্রেশ করা হবে
        setSelectedPendingOrder(null);
      } else {
        alert("❌ রিস্টক করতে সমস্যা হয়েছে।");
      }
    } catch (error) {
      console.error(error);
      alert("সার্ভার এরর!");
    } finally {
      setIsRestocking(false);
    }
  };

  // ডাইনামিক কাউন্টার
  const totalPendingItems = pendingList.reduce((total, order) => total + (order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0), 0);
  const totalRestockedItems = restockedList.reduce((total, order) => total + (order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-[#e11d48]" size={40} />
        <p className="text-slate-500 font-medium">রিটার্ন ডাটাবেস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-6 font-sans transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ArchiveRestore className="text-[#e11d48]" size={24} /> Returns & Restock
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Sync with Steadfast and manage returned/partial parcels efficiently.</p>
        </div>
        
        <button onClick={fetchOrders} disabled={isSyncing} className="flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-70">
          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> Sync Steadfast Returns
        </button>
      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden transition-colors">
          
          <div className="p-5 shrink-0 space-y-4">
            {/* Inner Tab Toggle */}
            <div className="inline-flex bg-gray-50 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm mb-1">
              <button 
                onClick={() => { setActiveTab("pending"); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === "pending" ? "text-[#e11d48] bg-rose-50 dark:bg-rose-500/10 shadow-sm border border-rose-100 dark:border-rose-500/20" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                }`}
              >
                <ArchiveRestore size={16} /> Pending Returns
              </button>
              <button 
                onClick={() => { setActiveTab("restocked"); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === "restocked" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm border border-emerald-100 dark:border-emerald-500/20" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                }`}
              >
                <CheckSquare size={16} /> Restocked History
              </button>
            </div>

            {/* Dynamic Header & Badges */}
            <div>
              <h2 className="text-[17px] font-bold text-slate-800 dark:text-white mb-3">
                {activeTab === "pending" ? "Pending Returns List" : "Restocked History List"}
              </h2>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-white/10 pb-4">
                {activeTab === "pending" ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 px-3 py-1.5 rounded uppercase tracking-wider">
                      TOTAL PARCELS: <span className="text-black dark:text-white">{pendingList.length}</span>
                    </span>
                    <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-[#e11d48] dark:text-rose-400 px-3 py-1.5 rounded flex items-center gap-1.5 uppercase tracking-wider border border-rose-100 dark:border-rose-500/20">
                      <ArchiveRestore size={14}/> RETURN ITEMS: {totalPendingItems}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 px-3 py-1.5 rounded uppercase tracking-wider">
                      TOTAL RESTOCKED: <span className="text-black dark:text-white">{restockedList.length}</span>
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded flex items-center gap-1.5 uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">
                      <CheckCircle2 size={14}/> ITEMS RESTOCKED: {totalRestockedItems}
                    </span>
                  </div>
                )}
                
                {/* Date Filters */}
                <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-transparent shadow-sm overflow-x-auto">
                  {dateFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setDateFilter(filter)}
                      className={`px-3.5 py-1 text-[12px] rounded-full transition-colors whitespace-nowrap ${
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
            </div>

            {/* Search */}
            <div className="relative w-full pt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 mt-0.5" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Steadfast ID, CN Number, Phone..." 
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* List Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-5 pt-0 space-y-3 custom-scrollbar">
            {activeTab === "pending" ? (
               pendingList.length === 0 ? (
                 <div className="text-center py-16 text-slate-400 flex flex-col items-center">
                   <Package size={40} className="mb-2 opacity-50" />
                   <p>No pending returns found.</p>
                 </div>
               ) : (
                pendingList.map((order) => {
                  const isSelected = selectedPendingOrder?.id === order.id;
                  const firstItemImage = order.items?.[0]?.product?.imageUrl || order.items?.[0]?.product?.thumbnail;
                  return (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedPendingOrder(order)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? "border-[#e11d48] dark:border-rose-500/60 bg-[#fffafb] dark:bg-rose-500/10 shadow-sm" : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-200 dark:hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg shadow-sm border border-black/10 dark:border-white/10 overflow-hidden bg-gray-100 dark:bg-white/5">
                          {firstItemImage && <img src={getImageUrl(firstItemImage)} alt="product" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <h3 className={`text-[15px] font-bold ${isSelected ? 'text-[#e11d48] dark:text-rose-400' : 'text-slate-800 dark:text-gray-200'}`}>
                            {order.consignmentId || order.orderNo || `ORD-${order.id}`}
                          </h3>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{order.customer?.name} • {order.customer?.district}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          {formatDateTime(order.updatedAt || order.createdAt)}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-[#e11d48] dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded flex items-center gap-1 uppercase">
                          <XCircle size={10} /> {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })
               )
              ) : (
                restockedList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 flex flex-col items-center">
                    <CheckSquare size={40} className="mb-2 opacity-50" />
                    <p>No restocked history found.</p>
                  </div>
                ) : (
                restockedList.map((order) => {
                  const isSelected = selectedRestockedOrder?.id === order.id;
                  const firstItemImage = order.items?.[0]?.product?.imageUrl || order.items?.[0]?.product?.thumbnail;
                  return (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedRestockedOrder(order)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? "border-emerald-500 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm" : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-200 dark:hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg shadow-sm border border-black/10 dark:border-white/10 overflow-hidden bg-gray-100 dark:bg-white/5">
                          {firstItemImage && <img src={getImageUrl(firstItemImage)} alt="product" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <h3 className={`text-[15px] font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-gray-200'}`}>
                            {order.consignmentId || order.orderNo || `ORD-${order.id}`}
                          </h3>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{order.customer?.name} • {order.customer?.district}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                           {formatDateTime(order.updatedAt || order.createdAt)}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded flex items-center gap-1 uppercase">
                          <CheckCircle2 size={10} /> {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Dynamic Order Details ================= */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden relative transition-colors">
          
          {((activeTab === "pending" && !selectedPendingOrder) || (activeTab === "restocked" && !selectedRestockedOrder)) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 p-8 border-2 border-dashed border-gray-100 dark:border-white/5 m-6 rounded-2xl">
              <Search size={40} className="opacity-50 mb-3" />
              <p className="font-bold">Select an order from the list</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-slate-50 dark:bg-[#141d1a] p-5 border-b border-gray-200 dark:border-white/10 text-center relative shrink-0">
                <div className="absolute top-4 right-4">
                  {activeTab === "pending" ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-[#e11d48] dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-full flex items-center gap-1 uppercase shadow-sm">
                      <XCircle size={12} /> {selectedPendingOrder?.status}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-full flex items-center gap-1 uppercase shadow-sm">
                      <CheckCircle2 size={12} /> {selectedRestockedOrder?.status}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1 mt-2">Steadfast Parcel ID</p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-400 tracking-wider font-mono">
                  {activeTab === "pending" 
                    ? (selectedPendingOrder?.consignmentId || selectedPendingOrder?.orderNo || `ORD-${selectedPendingOrder?.id}`) 
                    : (selectedRestockedOrder?.consignmentId || selectedRestockedOrder?.orderNo || `ORD-${selectedRestockedOrder?.id}`)}
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar z-10">
                {/* Customer Details */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">Customer Details</h3>
                  <div className="bg-[#f8fafc] dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5 space-y-3">
                    <div className="flex items-start gap-3">
                      <User size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
                      <span className="text-[13px] text-slate-700 dark:text-gray-200 font-medium">
                        {activeTab === "pending" ? selectedPendingOrder?.customer?.name : selectedRestockedOrder?.customer?.name}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={16} className="text-gray-400 dark:text-gray-500 mt-0.5" />
                      <span className="text-[13px] text-slate-700 dark:text-gray-200 font-medium">
                        {activeTab === "pending" ? selectedPendingOrder?.customer?.phone : selectedRestockedOrder?.customer?.phone}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                      <span className="text-[13px] text-slate-700 dark:text-gray-200 font-medium leading-relaxed">
                        {activeTab === "pending" ? `${selectedPendingOrder?.customer?.address || ''}, ${selectedPendingOrder?.customer?.district || ''}` : `${selectedRestockedOrder?.customer?.address || ''}, ${selectedRestockedOrder?.customer?.district || ''}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-2">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    {activeTab === "pending" ? "Items to Restock" : `Restocked Items (${selectedRestockedOrder?.items?.length || 0})`}
                  </h3>
                  <div className="space-y-3">
                    {(activeTab === "pending" ? selectedPendingOrder?.items : selectedRestockedOrder?.items)?.map((item: any, idx: number) => {
                      const imgSource = getImageUrl(item.product?.imageUrl || item.product?.thumbnail);
                      return (
                        <div key={idx} className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] shadow-sm transition-colors">
                          <div className="w-14 h-14 rounded-lg shadow-sm border border-black/10 dark:border-white/10 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5">
                             {imgSource && <img src={imgSource} alt="item" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[14px] font-bold text-slate-800 dark:text-gray-100 mb-2">{item.product?.name || "Unknown Product"}</h4>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center text-[11px] font-bold text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-white/10 rounded px-2 py-1">
                                Ordered: {item.quantity}
                              </span>
                              
                              {activeTab === "pending" ? (
                                <span className="inline-flex items-center text-[11px] font-bold text-[#e11d48] dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded px-2 py-1 gap-1">
                                  <ArchiveRestore size={12} /> Full Restock: {item.quantity}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded px-2 py-1 gap-1">
                                  <CheckCircle2 size={12} /> Successfully Restocked: {item.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                          {activeTab === "restocked" && (
                            <div className="text-emerald-500 dark:text-emerald-400 pr-2">
                              <CheckCircle2 size={24} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-[#141d1a] shrink-0 z-10 transition-colors">
                {activeTab === "pending" ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-2 py-1 border-b border-gray-200 dark:border-white/5 pb-3 mb-1">
                      <span className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Original COD</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white">৳ {Math.max(0, (selectedPendingOrder?.totalAmount || 0) - (selectedPendingOrder?.advance || 0))}</span>
                    </div>
                    <button onClick={handleRestock} disabled={isRestocking} className="w-full bg-[#e11d48] hover:bg-[#be123c] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-70">
                      {isRestocking ? <Loader2 size={18} className="animate-spin" /> : <ArchiveRestore size={18} />}
                      Accept Return & Restock Items
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-2 py-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Restocked By:</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <User size={14} className="text-emerald-600 dark:text-emerald-400" /> 
                        {selectedRestockedOrder?.user?.name || "Admin"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Restock Time:</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{formatDateTime(selectedRestockedOrder?.updatedAt || selectedRestockedOrder?.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}