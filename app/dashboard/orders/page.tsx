"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { 
  Search, LayoutGrid, List as ListIcon, 
  Edit3, Trash2, Truck, Printer, Eye, X, User, Loader2, Image as ImageIcon, RotateCcw
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null); // 🚀 বুকিং লোডিং স্টেট

  const [activeTab, setActiveTab] = useState("All orders");
  const [activeDateFilter, setActiveDateFilter] = useState("Today");
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
    fetchOrders();
  }, []);

  // 🚀 ১. Soft Delete (Move to Trash)
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

  // 🚀 ২. Restore Order
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

  // 🚀 ৩. Permanent Delete
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

  // 🚀 ৪. Steadfast Courier Booking
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
        alert(`✅ সফলভাবে বুকিং হয়েছে! ট্র্যাকিং কোড: ${data.consignment.tracking_code}`);
        fetchOrders(); // লিস্ট রিফ্রেশ করা হবে
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null); // ড্রয়ার বন্ধ করে দেওয়া
        }
      } else {
        alert(`❌ বুকিং ব্যর্থ হয়েছে: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("সার্ভার এরর! বুকিং করা যায়নি।");
    } finally {
      setBookingOrderId(null);
    }
  };

  const dateFilters = ["Today", "Yesterday", "Last 7", "Last 30", "All time"];

  const tabConfigs = [
    { label: "All orders", status: "All orders", count: orders.filter(o => !o.isDeleted).length, colorClass: "text-slate-700 dark:text-gray-200", borderClass: "border-slate-300 dark:border-gray-500", bgClass: "bg-white dark:bg-[#1a2421]", ringClass: "ring-slate-400" },
    { label: "New orders", status: "PENDING", count: orders.filter(o => !o.isDeleted && o.status === 'PENDING').length, colorClass: "text-teal-500 dark:text-teal-400", borderClass: "border-teal-500 dark:border-teal-400/50", bgClass: "bg-teal-50 dark:bg-teal-500/10", ringClass: "ring-teal-500" },
    { label: "Review", status: "PROCESSING", count: orders.filter(o => !o.isDeleted && o.status === 'PROCESSING').length, colorClass: "text-blue-500 dark:text-blue-400", borderClass: "border-blue-200 dark:border-blue-400/30", bgClass: "bg-blue-50 dark:bg-blue-500/10", ringClass: "ring-blue-500" },
    { label: "Packed", status: "PACKED", count: orders.filter(o => !o.isDeleted && o.status === 'PACKED').length, colorClass: "text-purple-500 dark:text-purple-400", borderClass: "border-purple-200 dark:border-purple-400/30", bgClass: "bg-purple-50 dark:bg-purple-500/10", ringClass: "ring-purple-500" },
    { label: "Pending", status: "COURIER_PENDING", count: orders.filter(o => !o.isDeleted && o.status === 'COURIER_PENDING').length, colorClass: "text-orange-500 dark:text-orange-400", borderClass: "border-orange-200 dark:border-orange-400/30", bgClass: "bg-orange-50 dark:bg-orange-500/10", ringClass: "ring-orange-500" },
    { label: "Delivered", status: "DELIVERED", count: orders.filter(o => !o.isDeleted && o.status === 'DELIVERED').length, colorClass: "text-emerald-500 dark:text-emerald-400", borderClass: "border-emerald-200 dark:border-emerald-400/30", bgClass: "bg-emerald-50 dark:bg-emerald-500/10", ringClass: "ring-emerald-500" },
    { label: "Cancel", status: "CANCELLED", count: orders.filter(o => !o.isDeleted && o.status === 'CANCELLED').length, colorClass: "text-red-500 dark:text-red-400", borderClass: "border-red-200 dark:border-red-400/30", bgClass: "bg-red-50 dark:bg-red-500/10", ringClass: "ring-red-500" },
    { label: "Trash", status: "TRASH", count: orders.filter(o => o.isDeleted).length, colorClass: "text-gray-500 dark:text-gray-400", borderClass: "border-gray-200 dark:border-gray-500/30", bgClass: "bg-gray-50 dark:bg-gray-500/10", ringClass: "ring-gray-400" },
  ];

  const filteredOrders = orders.filter(order => {
    if (activeTab === "Trash") {
      return order.isDeleted;
    }

    const matchesTab = activeTab === "All orders" || order.status === tabConfigs.find(t => t.label === activeTab)?.status;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order.orderNo.toLowerCase().includes(searchLower) ||
      order.customer?.name.toLowerCase().includes(searchLower) ||
      order.customer?.phone.toLowerCase().includes(searchLower);

    const orderDate = new Date(order.createdAt);
    const today = new Date();
    let matchesDate = true;

    if (activeDateFilter === "Today") {
      matchesDate = orderDate.toDateString() === today.toDateString();
    } else if (activeDateFilter === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      matchesDate = orderDate.toDateString() === yesterday.toDateString();
    } else if (activeDateFilter === "Last 7") {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      matchesDate = orderDate >= last7;
    } else if (activeDateFilter === "Last 30") {
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      matchesDate = orderDate >= last30;
    }

    return !order.isDeleted && matchesTab && matchesSearch && matchesDate;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(order => order.id));
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
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between sm:items-center bg-white dark:bg-[#1a2421] p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Orders Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage Facebook commerce workflow efficiently</p>
        </div>
        <Link 
          href="/dashboard/orders/create"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-sm w-full sm:w-auto">
          + Create New Order
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

        {/* ================= TOOLBAR ================= */}
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

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="flex bg-slate-50/80 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-transparent items-center overflow-x-auto w-full sm:w-auto custom-scrollbar">
              {dateFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveDateFilter(filter)}
                  className={`px-4 py-1.5 text-[12px] rounded-full transition-all duration-200 whitespace-nowrap ${
                    activeDateFilter === filter 
                      ? "bg-white dark:bg-[#1a2421] text-emerald-700 dark:text-emerald-400 font-bold shadow-sm dark:shadow-none dark:border dark:border-white/10" 
                      : "text-slate-500 dark:text-gray-400 font-medium hover:text-slate-700 dark:hover:text-gray-300 hover:bg-slate-100/50 dark:hover:bg-white/5"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-lg p-0.5 bg-gray-50 dark:bg-[#141d1a] shrink-0 self-end sm:self-auto">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-[#1a2421] text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-[#1a2421] text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}><ListIcon size={16} /></button>
            </div>
          </div>
        </div>

        {/* ================= BULK ACTIONS & SELECT ALL ================= */}
        <div className="flex items-center justify-between bg-white dark:bg-[#1a2421] p-3 rounded-xl border border-gray-200 dark:border-white/5 transition-colors">
          <div className="flex items-center gap-3 ml-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-600 dark:bg-[#141d1a] cursor-pointer"
              checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
              onChange={handleSelectAll}
            />
            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">
              Select All {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ""}
            </span>
          </div>

          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <button className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-200 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition">
               Booking 
              </button>
              <button className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-200 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition">
                Print Invoice
              </button>
              <button className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm">
                Update Status
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

              return (
                <div key={order.id} className={`bg-white dark:bg-[#1a2421] rounded-xl border flex flex-col hover:shadow-md dark:hover:shadow-none dark:hover:border-white/10 transition-all ${order.isDeleted ? 'opacity-75 grayscale-[20%]' : ''} ${selectedOrderIds.includes(order.id) ? 'border-emerald-400 dark:border-emerald-500/50 ring-1 ring-emerald-400/50' : 'border-gray-200 dark:border-white/5'}`}>
                  
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-50 dark:border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-600 dark:bg-[#141d1a] cursor-pointer" 
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                        />
                        <div>
                          <h3 className="text-[15px] font-bold text-slate-800 dark:text-white">{order.orderNo}</h3>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-1 border border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 rounded uppercase tracking-wider bg-teal-50/50 dark:bg-teal-500/10">
                        {order.status === 'PENDING' ? 'NEW ORDERS' : order.status}
                      </span>
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
                          <Link href={`/dashboard/orders/${order.id}/edit`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <Edit3 size={15} />
                          </Link>
                          {/* 🚀 মুভ টু ট্র্যাশ */}
                          <button onClick={() => handleDeleteOrder(order.id)} className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer" title="Move to Trash">
                            <Trash2 size={15} />
                          </button>
                          
                          {/* 🚀 Book Courier Icon Button */}
                          <button 
                            onClick={() => handleBookCourier(order.id)} 
                            disabled={bookingOrderId === order.id}
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50" 
                            title="Book to Steadfast"
                          >
                            {bookingOrderId === order.id ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
                          </button>

                          <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank" className="hover:text-slate-700 dark:hover:text-gray-300 transition-colors">
                            <Printer size={15} />
                          </Link>
                        </>
                      ) : (
                        <>
                          {/* 🚀 ট্র্যাশ ট্যাবে থাকলে রিস্টোর এবং পার্মানেন্ট ডিলিট বাটন দেখাবে */}
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
      {selectedOrder && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />
          
          <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white dark:bg-[#1a2421] shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Order {selectedOrder.orderNo}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1"><User size={12}/> Entry by: <span className="font-bold text-slate-700 dark:text-gray-300">{selectedOrder.user?.name || "Admin"}</span></p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={20} /></button>
                <span className="text-[10px] font-bold px-3 py-1 border border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 rounded-full uppercase bg-teal-50 dark:bg-teal-500/10">
                  {selectedOrder.status === 'PENDING' ? 'NEW ORDERS' : selectedOrder.status}
                </span>
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

            {/* Drawer Footer Buttons - 🚀 Conditional for normal vs deleted orders */}
            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a2421] grid grid-cols-2 gap-3 transition-colors">
              {!selectedOrder.isDeleted ? (
                <>
                  <button onClick={() => handleDeleteOrder(selectedOrder.id)} className="py-2.5 rounded-lg border border-red-500/50 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14}/> Move to Trash
                  </button>
                  <button className="py-2.5 rounded-lg border border-emerald-500/50 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                    Mark Delivered
                  </button>
                  <Link 
                    href={`/dashboard/orders/${selectedOrder.id}/invoice`} 
                    target="_blank"
                    className="py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Print Slip
                  </Link>
                  
                  {/* 🚀 Book Courier Button for Drawer */}
                  <button 
                    onClick={() => handleBookCourier(selectedOrder.id)}
                    disabled={bookingOrderId === selectedOrder.id}
                    className="py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {bookingOrderId === selectedOrder.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Booking...
                      </>
                    ) : (
                      <>
                        <Truck size={14}/> Book Courier
                      </>
                    )}
                  </button>
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
          </div>
        </>
      )}

    </div>
  );
}