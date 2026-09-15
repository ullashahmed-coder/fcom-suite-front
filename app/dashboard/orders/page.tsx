"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Search, LayoutGrid, List as ListIcon, 
  Edit3, Trash2, Truck, Printer, Eye, X, User, Loader2, RotateCcw, Box, CheckCircle, CheckCircle2, Calendar
} from "lucide-react";

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null);

  const [isBulkBooking, setIsBulkBooking] = useState(false);

  const [activeTab, setActiveTab] = useState("All orders");
  const [timeFilter, setTimeFilter] = useState("ALL"); // ALL, 30D, 7D, YESTERDAY, TODAY
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchOrders();
  }, []);

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই অর্ডারটি ট্র্যাশে পাঠাতে চান? স্টক ইনভেন্টরিতে ফিরিয়ে দেওয়া হবে।")) return;

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        alert("✅ অর্ডারটি ট্র্যাশে পাঠানো হয়েছে।");
        setSelectedOrder(null);
        fetchOrders(); 
      } else {
        alert("❌ অর্ডার ট্র্যাশে পাঠানো সম্ভব হয়নি।");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("সার্ভার এরর।");
    }
  };

  const handleRestoreOrder = async (id: string) => {
    if (!window.confirm("অর্ডারটি কি রিস্টোর করতে চান?")) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders/${id}/restore`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("✅ অর্ডারটি রিস্টোর করা হয়েছে!");
        setSelectedOrder(null);
        fetchOrders(); 
      } else {
        alert("❌ রিস্টোর করা সম্ভব হয়নি।");
      }
    } catch (error) {
      console.error("Restore error:", error);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("অর্ডারটি কি স্থায়ীভাবে (Permanent) ডিলিট করতে চান? এটি আর ফেরত আনা যাবে না।")) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders/${id}/permanent`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("✅ অর্ডারটি স্থায়ীভাবে ডিলিট করা হয়েছে!");
        setSelectedOrder(null);
        fetchOrders(); 
      } else {
        alert("❌ ডিলিট করা সম্ভব হয়নি।");
      }
    } catch (error) {
      console.error("Permanent delete error:", error);
    }
  };

  const handleBookCourier = async (orderId: string) => {
    if (!window.confirm("আপনি কি এই পার্সেলটি Steadfast-এ বুক করতে চান?")) return;
    
    setBookingOrderId(orderId);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders/${orderId}/book-steadfast`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(`✅ সফলভাবে বুকিং হয়েছে! Consignment ID: ${data.consignment?.consignment_id || data.consignment?.tracking_code}`);
        fetchOrders(); 
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null); 
        }
      } else {
        alert(`❌ বুকিং ব্যর্থ হয়েছে: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("সার্ভার এরর! বুকিং করা যায়নি।");
    } finally {
      setBookingOrderId(null);
    }
  };

  const handleBulkBookCourier = async () => {
    if (selectedOrderIds.length === 0) return;

    const eligibleOrderIds = selectedOrderIds.filter(id => {
      const order = orders.find(o => o.id === id);
      return order && !order.consignmentId && order.status !== 'IN_REVIEW';
    });

    if (eligibleOrderIds.length === 0) {
      alert("❌ নির্বাচিত পার্সেলগুলো আগে থেকেই Steadfast-এ বুক করা আছে!");
      return;
    }

    if (!window.confirm(`নির্বাচিত ${selectedOrderIds.length} টি অর্ডারের মধ্যে নতুন ${eligibleOrderIds.length} টি পার্সেল Steadfast-এ বুক করতে চান?\n(আগে থেকে বুক করাগুলো স্বয়ংক্রিয়ভাবে বাদ দেওয়া হবে)`)) return;

    setIsBulkBooking(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const token = localStorage.getItem("access_token");

      await Promise.all(
        eligibleOrderIds.map(async (orderId) => {
          try {
            const res = await fetch(`${apiUrl}/orders/${orderId}/book-steadfast`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        })
      );

      alert(`✅ বুল্ক বুকিং সম্পন্ন!\nসফল হয়েছে: ${successCount} টি\nব্যর্থ হয়েছে: ${failCount} টি`);
      setSelectedOrderIds([]); 
      fetchOrders(); 
    } catch (error) {
      console.error("Bulk booking error:", error);
      alert("সার্ভার এরর! বুল্ক বুকিং সম্পন্ন করা যায়নি।");
    } finally {
      setIsBulkBooking(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই অর্ডারটি 'Delivered' হিসেবে মার্ক করতে চান?")) return;
    try {
      const token = localStorage.getItem("access_token");
      
      const res = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "DELIVERED" })
      });
      
      if (res.ok) {
        alert("✅ অর্ডারটি সফলভাবে Delivered মার্ক করা হয়েছে!");
        setSelectedOrder(null);
        fetchOrders(); 
      } else {
        const errorData = await res.json();
        console.error("Backend Error:", errorData);
        alert(`❌ ব্যাকএন্ড এরর: ${errorData.message || "স্ট্যাটাস আপডেট করা সম্ভব হয়নি"}`);
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("সার্ভার এরর! আপডেট করা যায়নি।");
    }
  };

  const returnStatuses = ['CANCELLED', 'RETURNED', 'PARTIAL DELIVERED', 'PARTIAL_DELIVERED', 'PARTIAL'];
  const visibleOrders = orders.filter(o => !o.isDeleted);

  const tabConfigs = [
    { label: "All orders", status: "All orders", count: visibleOrders.length, colorClass: "text-slate-700 dark:text-gray-200", borderClass: "border-slate-300 dark:border-gray-500", bgClass: "bg-white dark:bg-[#1a2421]", ringClass: "ring-slate-400" },
    { label: "New orders", status: "PENDING", count: visibleOrders.filter(o => o.status === 'PENDING').length, colorClass: "text-teal-500 dark:text-teal-400", borderClass: "border-teal-500 dark:border-teal-400/50", bgClass: "bg-teal-50 dark:bg-teal-500/10", ringClass: "ring-teal-500" },
    { label: "Review", status: "IN_REVIEW", count: visibleOrders.filter(o => o.status === 'IN_REVIEW').length, colorClass: "text-blue-500 dark:text-blue-400", borderClass: "border-blue-200 dark:border-blue-400/30", bgClass: "bg-blue-50 dark:bg-blue-500/10", ringClass: "ring-blue-500" },
    { label: "Packed", status: "PACKED", count: visibleOrders.filter(o => o.status === 'PACKED').length, colorClass: "text-purple-500 dark:text-purple-400", borderClass: "border-purple-200 dark:border-purple-400/30", bgClass: "bg-purple-50 dark:bg-purple-500/10", ringClass: "ring-purple-500" },
    { label: "Pending", status: "COURIER_PENDING", count: visibleOrders.filter(o => o.status === 'COURIER_PENDING' || o.status === 'SHIPPED' || o.status === 'IN_TRANSIT' || o.status === 'DELIVERED_APPROVAL_PENDING' || (returnStatuses.includes(o.status?.toUpperCase()) && !o.isRestocked)).length, colorClass: "text-orange-500 dark:text-orange-400", borderClass: "border-orange-200 dark:border-orange-400/30", bgClass: "bg-orange-50 dark:bg-orange-500/10", ringClass: "ring-orange-500" },
    { label: "Delivered", status: "DELIVERED", count: visibleOrders.filter(o => o.status === 'DELIVERED').length, colorClass: "text-emerald-500 dark:text-emerald-400", borderClass: "border-emerald-200 dark:border-emerald-400/30", bgClass: "bg-emerald-50 dark:bg-emerald-500/10", ringClass: "ring-emerald-500" },
    { label: "Cancel", status: "RETURNED_CANCELLED", count: visibleOrders.filter(o => returnStatuses.includes(o.status?.toUpperCase()) && o.isRestocked).length, colorClass: "text-red-500 dark:text-red-400", borderClass: "border-red-200 dark:border-red-400/30", bgClass: "bg-red-50 dark:bg-red-500/10", ringClass: "ring-red-500" },
    { label: "Trash", status: "TRASH", count: orders.filter(o => o.isDeleted).length, colorClass: "text-gray-500 dark:text-gray-400", borderClass: "border-gray-200 dark:border-gray-500/30", bgClass: "bg-gray-50 dark:bg-gray-500/10", ringClass: "ring-gray-400" },
  ];

  const filteredOrders = orders.filter(order => {
    if (activeTab === "Trash") {
      if (!order.isDeleted) return false;
    } else {
      if (order.isDeleted) return false;
    }

    let matchesTab = false;
    if (activeTab === "All orders" || activeTab === "Trash") {
      matchesTab = true;
    } else if (activeTab === "Cancel") {
      matchesTab = returnStatuses.includes(order.status?.toUpperCase()) && order.isRestocked;
    } else if (activeTab === "Pending") {
      matchesTab = order.status === "COURIER_PENDING" || order.status === "SHIPPED" || order.status === "IN_TRANSIT" || order.status === "DELIVERED_APPROVAL_PENDING" || (returnStatuses.includes(order.status?.toUpperCase()) && !order.isRestocked);
    } else {
      matchesTab = order.status === tabConfigs.find(t => t.label === activeTab)?.status;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order.orderNo.toLowerCase().includes(searchLower) ||
      order.customer?.name.toLowerCase().includes(searchLower) ||
      order.customer?.phone.toLowerCase().includes(searchLower) ||
      (order.consignmentId && String(order.consignmentId).toLowerCase().includes(searchLower)) ||
      (order.trackingCode && String(order.trackingCode).toLowerCase().includes(searchLower));

    const orderDate = new Date(order.createdAt);
    let matchesDate = true;
    const now = new Date();
    
    // Yesterday Date Setup
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const diffTime = now.getTime() - orderDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (timeFilter === "TODAY") {
      matchesDate = orderDate.toDateString() === now.toDateString();
    } else if (timeFilter === "YESTERDAY") {
      matchesDate = orderDate.toDateString() === yesterday.toDateString();
    } else if (timeFilter === "7D") {
      matchesDate = diffDays <= 7;
    } else if (timeFilter === "30D") {
      matchesDate = diffDays <= 30;
    }

    return matchesTab && matchesSearch && matchesDate;
  });

  const eligibleOrdersForBulk = filteredOrders.filter(o => !o.consignmentId && o.status !== 'IN_REVIEW' && !o.isDeleted);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(eligibleOrdersForBulk.map(order => order.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(orderId => orderId !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options).toUpperCase();
  };

  const getProductImageClassOrUrl = (item: any, isThumbnail = false) => {
    if (item?.product?.imageUrl) {
      return item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `${apiUrl}${item.product.imageUrl}`;
    }
    const defaultColors = ["bg-blue-900", "bg-cyan-600", "bg-yellow-600", "bg-emerald-800", "bg-slate-700"];
    const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
    return isThumbnail ? randomColor : `url(${randomColor})`; 
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen relative overflow-hidden transition-colors">
      
      {/* ================= HEADER (Light/Dark Mode Fixed) ================= */}
      <div className="flex flex-row justify-between items-center bg-white dark:bg-[#1a2421] p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm gap-2 transition-colors">
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Orders Management</h1>
          <p className="text-[10px] sm:text-sm text-slate-500 dark:text-gray-400 mt-0.5 truncate">Manage Facebook commerce workflow efficiently</p>
        </div>
        
        <Link 
          href="/dashboard/orders/create"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl flex items-center gap-1 text-xs sm:text-sm font-bold transition-colors shadow-md shrink-0 cursor-pointer"
        >
          <span className="text-sm sm:text-base font-black leading-none">+</span> New Order
        </Link>
      </div>

      <div className="space-y-6">
        {/* ================= TABS ================= */}
        <div className="flex space-x-4 overflow-x-auto pb-2 custom-scrollbar">
          {tabConfigs.map((tab) => {
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`min-w-[140px] p-4 flex flex-col justify-between rounded-xl border transition-all text-left ${
                  isActive 
                    ? `${tab.bgClass} ${tab.borderClass} shadow-sm ring-1 ring-inset ${tab.ringClass}` 
                    : "bg-white dark:bg-[#1a2421] border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? tab.colorClass : "text-gray-500 dark:text-gray-400"}`}>
                  {tab.label}
                </span>
                <span className={`text-2xl font-bold mt-2 ${isActive ? tab.colorClass : "text-slate-800 dark:text-gray-200"}`}>
                  {isLoading ? "-" : tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================= TOOLBAR WITH QUICK TIME FILTERS ================= */}
        <div className="bg-white dark:bg-[#1a2421] p-3 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Name, Phone, CN, Product..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/5 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-row items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full xl:w-auto">
            {[
              { id: "ALL", label: "All" },
              { id: "30D", label: "Last 30d" },
              { id: "7D", label: "Last 7d" },
              { id: "YESTERDAY", label: "Yesterday" },
              { id: "TODAY", label: "Today" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeFilter(filter.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  timeFilter === filter.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-50 dark:bg-[#141d1a] text-slate-600 dark:text-gray-400 border border-gray-200 dark:border-white/5 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= BULK ACTIONS & SELECT ALL ================= */}
        <div className="flex items-center justify-between bg-white dark:bg-[#1a2421] p-3 rounded-xl border border-gray-200 dark:border-white/5 transition-colors">
          <div className="flex items-center gap-3 ml-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-600 dark:bg-[#141d1a] cursor-pointer"
              checked={eligibleOrdersForBulk.length > 0 && selectedOrderIds.length === eligibleOrdersForBulk.length}
              onChange={handleSelectAll}
            />
            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">
              Select All {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ""}
            </span>
          </div>

          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <button 
                onClick={handleBulkBookCourier}
                disabled={isBulkBooking}
                className="text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkBooking ? (
                  <><Loader2 size={14} className="animate-spin" /> Booking...</>
                ) : (
                  <><Truck size={14} /> Book Selected ({selectedOrderIds.length})</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ================= ORDER CARDS GRID ================= */}
        {isLoading ? (
           <div className="flex justify-center items-center py-20">
             <Loader2 className="animate-spin text-emerald-600" size={40} />
           </div>
        ) : filteredOrders.length === 0 ? (
           <div className="text-center py-16 text-slate-500 dark:text-gray-400">
             No orders found for the selected filter.
           </div>
        ) : (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 lg:grid-cols-2"}`}>
            {filteredOrders.map((order) => {
              const orderItemsCount = order.items?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0;
              const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
              
              let imageRender;
              const imageSource = getProductImageClassOrUrl(firstItem, true);
              
              if (imageSource && imageSource.startsWith('http')) {
                 imageRender = <img src={imageSource} alt="Thumbnail" className="w-full h-full object-cover" />;
              } else {
                 imageRender = <div className={`w-full h-full ${imageSource || 'bg-gray-200 dark:bg-gray-700'}`}></div>;
              }

              const dueAmount = Math.max(0, order.totalAmount - (order.advance || 0));
              const isAlreadyBooked = !!order.consignmentId || order.status === 'IN_REVIEW';
              const isModifiable = ['PENDING', 'IN_REVIEW'].includes(order.status?.toUpperCase());

              return (
                <div key={order.id} className={`bg-white dark:bg-[#1a2421] rounded-xl border flex flex-col hover:shadow-md dark:hover:shadow-none dark:hover:border-white/10 transition-all ${order.isDeleted ? 'opacity-75 grayscale-[20%]' : ''} ${selectedOrderIds.includes(order.id) ? 'border-emerald-400 dark:border-emerald-500/50 ring-1 ring-emerald-400/50' : 'border-gray-200 dark:border-white/5'}`}>
                  
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-50 dark:border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-600 dark:bg-[#141d1a] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          disabled={isAlreadyBooked} 
                          title={isAlreadyBooked ? "Already Booked" : "Select Order"}
                        />
                        <div>
                          <h3 className="text-[15px] font-bold text-slate-800 dark:text-white">{order.orderNo}</h3>
                          
                          {order.consignmentId && (
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                              <Box size={10} /> CN: {order.consignmentId}
                            </p>
                          )}

                          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mt-0.5">{formatDate(order.createdAt)}</p>
                          
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                            <User size={10}/> Entry by: <span className="font-bold text-slate-600 dark:text-gray-300">{order.user?.name || "Admin"}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[9px] font-bold px-2 py-1 border border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 rounded uppercase tracking-wider bg-teal-50/50 dark:bg-teal-500/10">
                          {order.status === 'PENDING' ? 'NEW ORDERS' : order.status === 'IN_REVIEW' ? 'IN REVIEW' : order.status === 'SHIPPED' || order.status === 'IN_TRANSIT' ? 'PENDING' : order.status}
                        </span>
                        {order.isRestocked && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10" title="This order has been restocked to inventory">
                            <CheckCircle2 size={10} /> RESTOCKED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex justify-between items-start">
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-800 dark:text-gray-100">{order.customer?.name}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{order.customer?.phone}</p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="text-[12px] font-bold text-slate-400 dark:text-gray-500">
                        Total: ৳ {order.totalAmount}
                      </span>
                      <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                        COD: ৳ {dueAmount}
                      </span>
                    </div>
                  </div>

                  {/* Product Thumbnail Row */}
                  <div className="mx-4 mb-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg p-2 flex justify-between items-center transition-colors">
                    <div className="w-8 h-8 rounded shadow-sm border border-black/10 dark:border-white/10 overflow-hidden">
                       {imageRender}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">{orderItemsCount} Items</span>
                  </div>

                  {/* Card Footer (Actions) */}
                  <div className="p-4 pt-2 mt-auto border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                      {!order.isDeleted ? (
                        <>
                          {isModifiable && (
                            <>
                              <Link href={`/dashboard/orders/${order.id}/edit`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit Order">
                                <Edit3 size={15} />
                              </Link>
                              <button onClick={() => handleDeleteOrder(order.id)} className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer" title="Move to Trash">
                                <Trash2 size={15} />
                              </button>
                              <button 
                                onClick={() => handleBookCourier(order.id)} 
                                disabled={bookingOrderId === order.id || isAlreadyBooked} 
                                className={`transition-colors ${bookingOrderId === order.id || isAlreadyBooked ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'hover:text-emerald-600 dark:hover:text-emerald-400'}`} 
                                title={isAlreadyBooked ? "Already Booked" : "Book to Steadfast"}
                              >
                                {bookingOrderId === order.id ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
                              </button>
                            </>
                          )}
                          <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank" className="hover:text-slate-700 dark:hover:text-gray-300 transition-colors" title="Print Invoice">
                            <Printer size={15} />
                          </Link>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleRestoreOrder(order.id)} className="text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer" title="Restore Order">
                            <RotateCcw size={16} />
                          </button>
                          <button onClick={() => handlePermanentDelete(order.id)} className="text-red-600 hover:text-red-700 transition-colors cursor-pointer" title="Permanent Delete">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= RIGHT DRAWER (Order Details) ================= */}
      {selectedOrder && mounted && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[99998] transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />
          
          <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white dark:bg-[#1a2421] shadow-2xl z-[99999] flex flex-col transform transition-transform duration-300">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-start bg-slate-50 dark:bg-[#141d1a]">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Order {selectedOrder.orderNo}</h2>
                
                {selectedOrder.consignmentId && (
                  <p className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
                    <Box size={14} /> CN: {selectedOrder.consignmentId}
                  </p>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1"><User size={12}/> Entry by: <span className="font-bold text-slate-700 dark:text-gray-300">{selectedOrder.user?.name || "Admin"}</span></p>
              </div>
              <div className="flex flex-col items-end gap-2.5">
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={20} /></button>
                
                <div className="flex flex-col items-end gap-1.5 mt-1">
                  <span className="text-[10px] font-bold px-3 py-1 border border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 rounded-full uppercase bg-white dark:bg-teal-500/10 shadow-sm">
                    {selectedOrder.status === 'PENDING' ? 'NEW ORDERS' : selectedOrder.status === 'IN_REVIEW' ? 'IN REVIEW' : selectedOrder.status}
                  </span>
                  {selectedOrder.isRestocked && (
                    <span className="text-[9px] font-bold px-2 py-1 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full uppercase bg-emerald-50 dark:bg-emerald-500/10 shadow-sm flex items-center gap-1">
                      <CheckCircle2 size={10} /> RESTOCKED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Customer Info */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">CUSTOMER INFORMATION</h3>
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 space-y-3">
                  <h4 className="text-[14px] font-bold text-slate-800 dark:text-gray-100">{selectedOrder.customer?.name}</h4>
                  <div className="flex justify-between text-[13px] border-b border-gray-200 dark:border-white/5 pb-2"><span className="text-gray-500 dark:text-gray-400">Phone:</span><span className="font-medium text-slate-800 dark:text-gray-200">{selectedOrder.customer?.phone}</span></div>
                  <div className="flex justify-between text-[13px] border-b border-gray-200 dark:border-white/5 pb-2"><span className="text-gray-500 dark:text-gray-400">District:</span><span className="font-medium text-slate-800 dark:text-gray-200">{selectedOrder.customer?.district || 'N/A'}</span></div>
                  <div className="text-[13px]"><span className="text-gray-500 dark:text-gray-400 block mb-1">Full Address:</span><span className="font-medium text-slate-800 dark:text-gray-200 leading-relaxed">{selectedOrder.customer?.address || 'N/A'}</span></div>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">PRODUCTS ({selectedOrder.items?.length || 0})</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, idx: number) => {
                    const imageSource = getProductImageClassOrUrl(item, true);
                    let itemImageRender;
                    if (imageSource && imageSource.startsWith('http')) {
                       itemImageRender = <img src={imageSource} alt="img" className="w-full h-full object-cover" />;
                    } else {
                       itemImageRender = <div className={`w-full h-full ${imageSource || 'bg-gray-200 dark:bg-gray-700'}`}></div>;
                    }

                    return (
                      <div key={idx} className="flex justify-between items-center border border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] p-3 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden shadow-sm border border-black/10 dark:border-white/10`}>
                             {itemImageRender}
                          </div>
                          <div>
                            <h4 className="text-[13px] font-bold text-slate-800 dark:text-gray-100">{item.product?.name || 'Unknown Product'}</h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="text-[14px] font-bold text-emerald-700 dark:text-emerald-400">৳ {item.price * item.quantity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">PAYMENT SUMMARY</h3>
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 space-y-3 text-[13px]">
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Subtotal:</span><span className="font-medium text-slate-800 dark:text-gray-200">৳ {selectedOrder.totalAmount - selectedOrder.deliveryCharge + selectedOrder.discount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Delivery Charge:</span><span className="font-medium text-slate-800 dark:text-gray-200">+ ৳ {selectedOrder.deliveryCharge}</span></div>
                  <div className="flex justify-between"><span className="text-blue-500 dark:text-blue-400">Discount:</span><span className="font-medium text-blue-500 dark:text-blue-400">- ৳ {selectedOrder.discount}</span></div>
                  {selectedOrder.advance > 0 && (
                    <div className="flex justify-between"><span className="text-emerald-600 dark:text-emerald-400">Advance Paid:</span><span className="font-medium text-emerald-600 dark:text-emerald-400">- ৳ {selectedOrder.advance}</span></div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-white/10 mt-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-500 text-[14px]">Cash on Delivery (Due):</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-[15px]">৳ {Math.max(0, selectedOrder.totalAmount - selectedOrder.advance)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Buttons */}
            {(() => {
              const isSelectedModifiable = ['PENDING', 'IN_REVIEW'].includes(selectedOrder.status?.toUpperCase());
              
              return (
                <div className={`p-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a2421] grid ${!selectedOrder.isDeleted && !isSelectedModifiable ? 'grid-cols-1' : 'grid-cols-2'} gap-3 transition-colors`}>
                  {!selectedOrder.isDeleted ? (
                    <>
                      {isSelectedModifiable && (
                        <>
                          <button onClick={() => handleDeleteOrder(selectedOrder.id)} className="py-2.5 rounded-lg border border-red-500/50 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            <Trash2 size={14}/> Move to Trash
                          </button>
                          
                          <button 
                            onClick={() => handleMarkDelivered(selectedOrder.id)}
                            className="py-2.5 rounded-lg border border-emerald-500/50 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                          >
                            Mark Delivered
                          </button>
                        </>
                      )}

                      <Link 
                        href={`/dashboard/orders/${selectedOrder.id}/invoice`} 
                        target="_blank"
                        className="py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Printer size={14}/> Print Slip
                      </Link>
                      
                      {isSelectedModifiable && (
                        <button 
                          onClick={() => handleBookCourier(selectedOrder.id)}
                          disabled={bookingOrderId === selectedOrder.id || !!selectedOrder.consignmentId} 
                          className="py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {bookingOrderId === selectedOrder.id ? (
                            <><Loader2 size={14} className="animate-spin" /> Booking...</>
                          ) : !!selectedOrder.consignmentId ? (
                            "Already Booked"
                          ) : (
                            <><Truck size={14}/> Book Courier</>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button onClick={() => handlePermanentDelete(selectedOrder.id)} className="py-2.5 rounded-lg border border-red-500/50 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 size={16}/> Delete Forever
                      </button>
                      <button onClick={() => handleRestoreOrder(selectedOrder.id)} className="py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm">
                        <RotateCcw size={16}/> Restore Order
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </>,
        document.body
      )}

    </div>
  );
}