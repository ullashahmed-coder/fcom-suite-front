"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Package, CheckCircle2, Truck, Printer, Loader2, MapPin, Phone, User, Search, ScanBarcode, RotateCcw, Box, Clock, XCircle, CheckSquare, X, Edit
} from "lucide-react"

export default function MixedPackingDashboard() {
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedPackedOrder, setSelectedPackedOrder] = useState<any>(null)
  const router = useRouter() 
  
  const [orders, setOrders] = useState<any[]>([])

  // Image Zoom State
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [toPackOrders, setToPackOrders] = useState<any[]>([])
  const [allPackedOrders, setAllPackedOrders] = useState<any[]>([])
  const [returnedOrders, setReturnedOrders] = useState<any[]>([])

  // মোবাইলে ড্রয়ার ওপেন করার জন্য স্টেট
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)

  const [userRole, setUserRole] = useState<string>("")
  
  // 🚀 ডিফল্টভাবে 'all' করা হয়েছে যাতে আগের সব হিস্ট্রি বা প্যাক করা ডাটা দেখা যায়
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'all' | 'custom'>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const [searchQuery, setSearchQuery] = useState("")
  const [packedSearchQuery, setPackedSearchQuery] = useState("")

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue')

  useEffect(() => {
    fetchPackingOrders()
    const role = localStorage.getItem("userRole") || ""
    setUserRole(role.toUpperCase())
  }, [])

  const fetchPackingOrders = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const validOrders = data.filter((o: any) => !o.isDeleted);
        setOrders(validOrders)

        // 🚀 ১. Packing Queue: শুধুমাত্র যেগুলো প্যাকিংয়ের অপেক্ষায় আছে (IN_REVIEW, BOOKED, PENDING)
        // 🚀 ১. Packing Queue: কেবল সেই অর্ডারগুলোই আসবে যেগুলো কুরিয়ারে বুকিং করা হয়েছে (CN / Consignment ID আছে) এবং এখনো প্যাক করা হয়নি
        const inReview = validOrders.filter((o: any) => {
          const s = o.status?.toUpperCase() || "";
          const hasConsignment = Boolean(o.consignmentId || o.trackingCode);
          
          // বুকিং করা হয়েছে (CN আছে) কিন্তু এখনো প্যাক বা ডিসপাচ হয়নি
          return hasConsignment && ['IN_REVIEW', 'BOOKED', 'PENDING', 'COURIER_PENDING'].includes(s);
        });
        setToPackOrders(inReview);
        if (inReview.length > 0 && !selectedOrder) setSelectedOrder(inReview[0]);

        // 🚀 ২. Packed History: যেগুলো ইতিমধ্যে প্যাক করা হয়েছে অথবা কুরিয়ার বা অন্য কোনো স্ট্যাটাসে চলে গেছে, সেগুলোর হিস্ট্রি সবসময় সে থাকবে
        const packedHistory = validOrders.filter((o: any) => {
          const s = o.status?.toUpperCase() || "";
          // প্যাক করা বা এর পরের যেকোনো স্ট্যাটাসের অর্ডার হিস্ট্রিতে দেখাবে
          return s !== 'IN_REVIEW' && s !== 'BOOKED' && s !== 'PENDING' && !['CANCEL', 'CANCELLED', 'RETURNED', 'RETURN ACCEPTED'].includes(s);
        });
        setAllPackedOrders(packedHistory.reverse());

        // 🚀 ৩. Returns / Cancelled
        const returns = validOrders.filter((o: any) => {
          const s = o.status?.toUpperCase() || "";
          return ['CANCEL', 'CANCELLED', 'RETURNED', 'RETURN ACCEPTED'].includes(s);
        });
        setReturnedOrders(returns.reverse());
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getQueuedTime = (order: any) => {
    if (order.queuedForPackAt) return new Date(order.queuedForPackAt);
    const queueLog = order.logs?.find((log: any) => log.status?.toUpperCase() === 'IN_REVIEW');
    return queueLog ? new Date(queueLog.createdAt) : new Date(order.createdAt);
  }

  const getPackedTime = (order: any) => {
    if (order.packedAt) return new Date(order.packedAt);
    const packLog = order.logs?.find((log: any) => log.status?.toUpperCase() === 'PACKED');
    return packLog ? new Date(packLog.createdAt) : new Date(order.createdAt);
  }

  const formatDateTime = (dateObj: Date) => {
    const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  }

  const getImageUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith('http') ? path : `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  }

  const filteredToPackOrders = toPackOrders.filter(order => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.id?.toString().toLowerCase().includes(q) ||
      order.orderNo?.toLowerCase().includes(q) ||
      order.consignmentId?.toString().toLowerCase().includes(q) ||
      order.trackingCode?.toLowerCase().includes(q) ||
      order.customer?.name?.toLowerCase().includes(q) ||
      order.customer?.phone?.toLowerCase().includes(q)
    );
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredToPackOrders.length > 0) {
      setSelectedOrder(filteredToPackOrders[0]);
      setIsQueueDrawerOpen(true);
    }
  }

  useEffect(() => {
    if (activeTab === 'queue' && filteredToPackOrders.length > 0 && !filteredToPackOrders.find(o => o.id === selectedOrder?.id)) {
      setSelectedOrder(filteredToPackOrders[0]);
    }
  }, [activeTab, toPackOrders]);

  const displayedPackedOrders = allPackedOrders.filter(o => {
    let passesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = getPackedTime(o);
      const today = new Date();
      const orderTime = orderDate.getTime();

      if (dateFilter === 'today') {
        passesDate = orderDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        passesDate = orderDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === 'last7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        passesDate = orderTime >= sevenDaysAgo.getTime();
      } else if (dateFilter === 'last30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        passesDate = orderTime >= thirtyDaysAgo.getTime();
      } else if (dateFilter === 'custom') {
        if (startDate || endDate) {
          let start = startDate ? new Date(startDate) : new Date(0);
          start.setHours(0, 0, 0, 0);
          let end = endDate ? new Date(endDate) : new Date(8640000000000000);
          end.setHours(23, 59, 59, 999);
          passesDate = orderTime >= start.getTime() && orderTime <= end.getTime();
        }
      }
    }

    if (!passesDate) return false;
    if (!packedSearchQuery) return true;
    
    const q = packedSearchQuery.toLowerCase();
    return (
      o.id?.toString().toLowerCase().includes(q) ||
      o.orderNo?.toLowerCase().includes(q) ||
      o.consignmentId?.toString().toLowerCase().includes(q) ||
      o.trackingCode?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.phone?.toLowerCase().includes(q)
    );
  });

  const totalSareesPacked = displayedPackedOrders.reduce((total, order) => {
    const orderItemsCount = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    return total + orderItemsCount;
  }, 0);

  useEffect(() => {
    if (activeTab === 'history' && displayedPackedOrders.length > 0 && !selectedPackedOrder) {
      setSelectedPackedOrder(displayedPackedOrders[0]);
    }
  }, [activeTab, displayedPackedOrders, selectedPackedOrder]);

  const handlePackComplete = async () => {
    if (!selectedOrder) return;
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'PACKED' })
      });

      if (response.ok) {
        const newToPack = toPackOrders.filter(o => o.id !== selectedOrder.id);
        setToPackOrders(newToPack);

        const newLog = { status: 'PACKED', createdAt: new Date().toISOString() };
        const updatedOrder = { 
          ...selectedOrder, 
          status: 'PACKED', 
          packedAt: new Date().toISOString(), 
          logs: [...(selectedOrder.logs || []), newLog] 
        };
        
        setAllPackedOrders(prev => [updatedOrder, ...prev]);
        setSelectedOrder(null);
        setSearchQuery("");
        setIsQueueDrawerOpen(false);
      } else {
        alert("স্ট্যাটাস আপডেট করা যায়নি।");
      }
    } catch (err) {
      console.error(err);
      alert("সার্ভার এরর!");
    }
  }

  const handleUnpack = async () => {
    if (!selectedPackedOrder) return;
    if (!window.confirm("আপনি কি নিশ্চিত যে এই পার্সেলটি আনপ্যাক করে আবার 'To Pack' লিস্টে পাঠাতে চান?")) return;

    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${selectedPackedOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'IN_REVIEW' }) 
      });

      if (response.ok) {
        const newPackedOrders = allPackedOrders.filter(o => o.id !== selectedPackedOrder.id);
        setAllPackedOrders(newPackedOrders);

        const updatedOrder = { ...selectedPackedOrder, status: 'IN_REVIEW', packedAt: null };
        setToPackOrders(prev => [updatedOrder, ...prev]);
        setSelectedPackedOrder(null);
        setIsHistoryDrawerOpen(false);
      } else {
        const errorData = await response.json().catch(() => null);
        alert(`স্ট্যাটাস রিভার্ট করা যায়নি! ${errorData?.message || ''}`);
      }
    } catch (err) {
      console.error(err);
      alert("সার্ভার এরর!");
    }
  }

  const getDynamicStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "";
    if (s === 'PACKED' || s === 'PROCESSING' || s === 'BOOKED') return <span className="text-[9px] sm:text-[10px] bg-green-100 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><CheckCircle2 size={12} /> {s}</span>;
    if (s === 'COURIER_PENDING') return <span className="text-[9px] sm:text-[10px] bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Truck size={12} /> Courier Pending</span>;
    if (s === 'PENDING') return <span className="text-[9px] sm:text-[10px] bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Clock size={12} /> New Order</span>;
    if (s === 'DELIVERED') return <span className="text-[9px] sm:text-[10px] bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Delivered</span>;
    if (s === 'PARTIAL_DELIVERED' || s === 'PARTIAL DELIVERED') return <span className="text-[9px] sm:text-[10px] bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Package size={12} /> Partial</span>;
    if (s.includes('CANCEL') || s.includes('RETURN')) {
      if(s === 'RETURN ACCEPTED') return <span className="text-[9px] sm:text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><CheckSquare size={12}/> Restocked</span>;
      return <span className="text-[9px] sm:text-[10px] bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><XCircle size={12} /> Returned</span>;
    }
    return <span className="text-[9px] sm:text-[10px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Clock size={12} /> {status}</span>;
  }

  const renderQueueDetails = () => (
    <>
      <div className="bg-slate-50 dark:bg-[#141d1a] p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 text-center relative shrink-0">
        <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1 mt-1 sm:mt-0">Steadfast Parcel ID</p>
        <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 tracking-wider font-mono">
          {selectedOrder.consignmentId || selectedOrder.trackingCode || selectedOrder.orderNo || `ORD-${selectedOrder.id}`}
        </p>
      </div>

      <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#1a2421]">
        <div className="mb-5 sm:mb-6">
          <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 sm:mb-3">Customer Details</h3>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-[#141d1a] p-3.5 sm:p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <p className="flex items-center gap-2"><User size={14} className="text-slate-400 dark:text-gray-500 shrink-0" /> {selectedOrder.customer?.name}</p>
            <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400 dark:text-gray-500 shrink-0" /> {selectedOrder.customer?.phone}</p>
            <p className="flex items-start gap-2"><MapPin size={14} className="text-slate-400 dark:text-gray-500 mt-0.5 shrink-0" /> <span className="leading-snug">{selectedOrder.customer?.address}, {selectedOrder.customer?.district}</span></p>
          </div>

          {selectedOrder.customer?.note && (
            <div className="mt-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-xl shadow-sm">
              <p className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                ⚠️ Special Note
              </p>
              <p className="text-[13px] sm:text-sm font-bold text-amber-900 dark:text-amber-300 leading-relaxed">
                {selectedOrder.customer.note}
              </p>
            </div>
          )}
        </div>

        <div className="mb-2">
          <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 sm:mb-3">Items to Pack ({selectedOrder.items?.length})</h3>
          <div className="space-y-2.5 sm:space-y-3">
            {selectedOrder.items?.map((item:any, i:number) => (
              <div key={i} className="flex gap-3 sm:gap-4 items-center p-2.5 sm:p-3 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm bg-white dark:bg-[#141d1a]">
                <img 
                  src={getImageUrl(item.product?.imageUrl || item.product?.thumbnail)} 
                  className="w-14 h-14 sm:w-18 sm:h-18 object-cover rounded-lg border border-gray-200 dark:border-white/10 shadow-sm cursor-zoom-in hover:opacity-80 transition-opacity shrink-0"
                  onClick={() => setExpandedImage(getImageUrl(item.product?.imageUrl || item.product?.thumbnail))}
                  alt="product"
                />
                <div className="flex-1">
                  <p className="text-[13px] sm:text-sm font-bold text-slate-800 dark:text-gray-200 leading-snug">{item.product?.name}</p>
                  
                  <div className="mt-1.5 sm:mt-2 inline-flex items-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-sm">
                    Qty: 
                    <span className="mx-1 sm:mx-1.5 px-1.5 sm:px-2.5 py-0.5 bg-emerald-600 dark:bg-emerald-500 text-white text-[11px] sm:text-sm font-black rounded shadow-sm">
                      {item.quantity}
                    </span>
                    Piece
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3.5 sm:p-4 border-t border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-[#141d1a] flex gap-2.5 sm:gap-3 shrink-0">
        <button 
          onClick={() => router.push(`/dashboard/orders/${selectedOrder.id}/edit`)}
          className="flex-1 py-2.5 sm:py-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl font-bold text-[12px] sm:text-sm hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
        >
          <Edit size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Edit</span> Order
        </button>

        <button 
          onClick={handlePackComplete} 
          className="flex-1 py-2.5 sm:py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-[12px] sm:text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
        >
          <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /> Pack Complete
        </button>
      </div>
    </>
  );

  const renderHistoryDetails = () => (
    <>
      <div className="bg-slate-50 dark:bg-[#141d1a] p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 text-center relative shrink-0">
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          {getDynamicStatusBadge(selectedPackedOrder.status)}
        </div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1 mt-3 sm:mt-2">Steadfast Parcel ID</p>
        <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 tracking-wider font-mono">
          {selectedPackedOrder.consignmentId || selectedPackedOrder.trackingCode || selectedPackedOrder.orderNo || `ORD-${selectedPackedOrder.id}`}
        </p>
      </div>

      <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar z-10 bg-white dark:bg-[#1a2421]">
        <div className="mb-5 sm:mb-6">
          <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 sm:mb-3">Customer Details</h3>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-[#141d1a] p-3.5 sm:p-4 rounded-xl border border-slate-100 dark:border-white/5 transition-colors">
            <p className="flex items-center gap-2"><User size={14} className="text-slate-400 dark:text-gray-500 shrink-0" /> {selectedPackedOrder.customer?.name}</p>
            <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400 dark:text-gray-500 shrink-0" /> {selectedPackedOrder.customer?.phone}</p>
            <p className="flex items-start gap-2"><MapPin size={14} className="text-slate-400 dark:text-gray-500 mt-0.5 shrink-0" /> <span className="leading-snug">{selectedPackedOrder.customer?.address}, {selectedPackedOrder.customer?.district}</span></p>
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 sm:mb-3">Packed Items ({selectedPackedOrder.items?.length})</h3>
          <div className="space-y-2.5 sm:space-y-3">
            {selectedPackedOrder.items?.map((item: any, idx: number) => (
              <div key={idx} className="border border-slate-200 dark:border-white/10 rounded-xl p-2.5 sm:p-3 flex gap-3 sm:gap-4 bg-slate-50 dark:bg-[#141d1a] shadow-sm items-center transition-colors">
                <img 
                  src={getImageUrl(item.product?.imageUrl || item.product?.thumbnail)} 
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 dark:border-white/10 shadow-sm cursor-zoom-in hover:opacity-80 transition-opacity shrink-0" 
                  onClick={() => setExpandedImage(getImageUrl(item.product?.imageUrl || item.product?.thumbnail))}
                  alt="product"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-gray-200 text-[13px] sm:text-sm leading-snug">{item.product?.name}</p>
                  <div className="mt-1.5 sm:mt-2 inline-flex items-center bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-bold text-slate-500 dark:text-gray-400 shadow-sm">
                    Packed: 
                    <span className="mx-1 sm:mx-1.5 px-1.5 sm:px-2 py-0.5 bg-white dark:bg-[#1a2421] border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white text-[11px] sm:text-sm font-black rounded shadow-sm">
                      {item.quantity}
                    </span>
                    Piece
                  </div>
                </div>
                <div className="text-emerald-500 dark:text-emerald-400 pr-1 sm:pr-2">
                  <CheckCircle2 size={20} className="sm:w-[24px] sm:h-[24px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3.5 sm:p-4 border-t border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-[#141d1a] flex flex-col gap-2.5 sm:gap-3 shrink-0 z-10 transition-colors">
        {selectedPackedOrder.status?.toUpperCase() === 'PACKED' ? (
          <div className="flex gap-3">
            <button onClick={handleUnpack} className="flex-1 py-2.5 sm:py-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[12px] sm:text-sm hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm">
              <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" /> Unpack (রিভার্ট)
            </button>
          </div>
        ) : (
          <div className="bg-slate-200/70 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-2.5 sm:p-3 text-center">
            <p className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-gray-400 flex items-center justify-center gap-1 sm:gap-1.5">
              <Truck size={14} />
              পার্সেলটি '{selectedPackedOrder.status}' স্ট্যাটাসে থাকায় আনপ্যাক করা সম্ভব নয়।
            </p>
          </div>
        )}
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-500" size={40} />
        <p className="text-slate-500 dark:text-gray-400 font-medium">প্যাকিং ড্যাশবোর্ড লোড হচ্ছে...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1500px] mx-auto pb-10 p-4 sm:p-6 animate-in fade-in duration-300 transition-colors bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen">

      {/* Image Zoom Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex justify-center items-center">
            <button 
              className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 transition-colors bg-slate-800/50 hover:bg-rose-600 rounded-full p-2"
              onClick={() => setExpandedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded Product" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
            Main Packing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 font-medium mt-0.5 sm:mt-1">Packaging and dispatch</p>
        </div>
      </div>

      {/* Top Action Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div onClick={() => setActiveTab('queue')} className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border flex flex-row sm:flex-col items-center sm:text-center justify-start sm:justify-center gap-3 sm:gap-2 cursor-pointer transition-all ${activeTab === 'queue' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-600 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-600 dark:ring-emerald-500' : 'bg-white dark:bg-[#1a2421] hover:bg-slate-50 dark:hover:bg-white/5 border-gray-200 dark:border-white/10'}`}>
          <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${activeTab === 'queue' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
            <Package size={20} className="sm:w-[24px] sm:h-[24px]" />
          </div>
          <div>
            <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${activeTab === 'queue' ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400'}`}>Packing Queue</p>
            <p className={`text-lg sm:text-2xl font-black mt-0 sm:mt-1 ${activeTab === 'queue' ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-gray-200'}`}>{toPackOrders.length}</p>
          </div>
        </div>

        <div onClick={() => setActiveTab('history')} className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border flex flex-row sm:flex-col items-center sm:text-center justify-start sm:justify-center gap-3 sm:gap-2 cursor-pointer transition-all ${activeTab === 'history' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-600 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-600 dark:ring-emerald-500' : 'bg-white dark:bg-[#1a2421] hover:bg-slate-50 dark:hover:bg-white/5 border-gray-200 dark:border-white/10'}`}>
          <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${activeTab === 'history' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
            <CheckCircle2 size={20} className="sm:w-[24px] sm:h-[24px]" />
          </div>
          <div>
            <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${activeTab === 'history' ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400'}`}>Packed History</p>
            <p className={`text-lg sm:text-2xl font-black mt-0 sm:mt-1 ${activeTab === 'history' ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-gray-200'}`}>{displayedPackedOrders.length}</p>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: PACKING QUEUE ================= */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 animate-in fade-in duration-300">
          
          <div className="lg:col-span-7 bg-white dark:bg-[#1a2421] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col h-[600px] lg:h-[700px] transition-colors">
            <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-[15px] sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Pending Orders
              </h2>

              <form onSubmit={handleSearchSubmit} className="mt-2.5 sm:mt-3 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ScanBarcode size={16} className="text-slate-400 dark:text-gray-500 sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Scan barcode or type ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 bg-slate-50 dark:bg-[#141d1a] border border-slate-200 dark:border-white/10 rounded-lg text-xs sm:text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors shadow-inner"
                />
              </form>
            </div>

            <div className="overflow-y-auto pr-1 sm:pr-2 space-y-2.5 sm:space-y-3 flex-1 custom-scrollbar">
              {filteredToPackOrders.length === 0 ? (
                <div className="text-center py-16 sm:py-20 text-slate-400 dark:text-gray-500 flex flex-col items-center gap-2">
                  <Package size={40} className="opacity-50" />
                  <p className="text-xs sm:text-sm">কোনো পেন্ডিং অর্ডার পাওয়া যায়নি!</p>
                </div>
              ) : (
                filteredToPackOrders.map((order) => {
                  const isActive = selectedOrder?.id === order.id;
                  const firstItem = order.items?.[0];
                  const { date, time } = formatDateTime(getQueuedTime(order));

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsQueueDrawerOpen(true);
                      }}
                      className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all border-2 ${isActive ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-sm' : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-[#141d1a]'}`}
                    >
                      <div className="relative shrink-0">
                        {firstItem?.product?.imageUrl || firstItem?.product?.thumbnail ? (
                          <img
                            src={getImageUrl(firstItem.product.imageUrl || firstItem.product.thumbnail)}
                            className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-slate-200 dark:border-white/10"
                            alt="product"
                          />
                        ) : <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10"></div>}
                      </div>

                      <div className="flex-1 flex justify-between items-center gap-2 sm:gap-3 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-[13px] sm:text-sm tracking-wide truncate ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-gray-200'}`}>
                            {order.consignmentId || order.trackingCode || order.orderNo || `ORD-${order.id}`}
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">{order.customer?.name} • {order.customer?.district}</p>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-400'}`}>
                            {date}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-gray-500 font-medium mt-1">
                            {time}
                          </span>
                        </div>

                        <span className="hidden sm:flex text-[10px] bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase items-center gap-1 shrink-0">
                          Pending
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN (DESKTOP) ================= */}
          <div className="hidden lg:flex lg:col-span-5">
            {!selectedOrder ? (
              <div className="w-full bg-slate-50 dark:bg-[#1a2421] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl h-[700px] flex flex-col items-center justify-center text-center p-8 transition-colors">
                <div className="w-16 h-16 bg-white dark:bg-[#141d1a] rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300 dark:text-gray-600"><ScanBarcode size={32} /></div>
                <h3 className="text-lg font-bold text-slate-600 dark:text-gray-300">Scan or Select an Order</h3>
                <p className="text-sm text-slate-400 dark:text-gray-500 mt-2">Scan the invoice barcode or pick an order from the queue to start packing.</p>
              </div>
            ) : (
              <div className="w-full bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col h-[700px] overflow-hidden transition-colors">
                {renderQueueDetails()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: PACKED HISTORY ================= */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 animate-in fade-in duration-300">

          <div className="lg:col-span-7 bg-white dark:bg-[#1a2421] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col h-[600px] lg:h-[700px] transition-colors">
            
            <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-white/10 flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600 dark:text-emerald-400 sm:w-[20px] sm:h-[20px]" /> Packed History
                </h2>
                <div className="flex gap-2.5 sm:gap-4 mt-2">
                  <p className="text-[9px] sm:text-[11px] bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold uppercase tracking-wider">
                    Total Parcels: <span className="text-slate-900 dark:text-white">{displayedPackedOrders.length}</span>
                  </p>
                  <p className="text-[9px] sm:text-[11px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                    <Box size={10} className="sm:w-[12px] sm:h-[12px]" /> Total Items: <span className="text-indigo-900 dark:text-indigo-300">{totalSareesPacked}</span>
                  </p>
                </div>
              </div>

              <div className="flex w-full md:w-auto overflow-x-auto custom-scrollbar pb-1">
                <div className="flex items-center bg-slate-100 dark:bg-[#141d1a] p-1 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner shrink-0">
                  {(['today', 'yesterday', 'last7days', 'last30days', 'all'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setDateFilter(filter as any);
                        setStartDate('');
                        setEndDate('');
                      }}
                      className={`px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                        dateFilter === filter
                          ? 'bg-white dark:bg-[#1a2421] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-white/10'
                          : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-slate-200/50 dark:hover:bg-white/5'
                      }`}
                    >
                      {filter === 'today' && 'Today'}
                      {filter === 'yesterday' && 'Yesterday'}
                      {filter === 'last7days' && 'Last 7 Days'}
                      {filter === 'last30days' && 'Last 30 Days'}
                      {filter === 'all' && 'All Time'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (displayedPackedOrders.length > 0) {
                 setSelectedPackedOrder(displayedPackedOrders[0]);
                 setIsHistoryDrawerOpen(true);
              }
            }} className="relative mt-1 sm:mt-2 mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 dark:text-gray-500 sm:w-[18px] sm:h-[18px]" />
              </div>
              <input
                type="text"
                placeholder="Search packed orders..."
                value={packedSearchQuery}
                onChange={(e) => setPackedSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 bg-slate-50 dark:bg-[#141d1a] border border-slate-200 dark:border-white/10 rounded-lg text-xs sm:text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors"
              />
            </form>

            <div className="overflow-y-auto pr-1 sm:pr-2 space-y-2.5 sm:space-y-3 flex-1 custom-scrollbar">
              {displayedPackedOrders.length === 0 ? (
                <div className="text-center py-16 sm:py-20 text-slate-400 dark:text-gray-500 flex flex-col items-center gap-2">
                  <Package size={40} className="opacity-50" />
                  <p className="text-xs sm:text-sm">এই ফিল্টারে কোনো প্যাক করা পার্সেল নেই!</p>
                </div>
              ) : (
                displayedPackedOrders.map((order) => {
                  const isActive = selectedPackedOrder?.id === order.id;
                  const firstItem = order.items?.[0];
                  const { date, time } = formatDateTime(getPackedTime(order));

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedPackedOrder(order);
                        setIsHistoryDrawerOpen(true);
                      }}
                      className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all border-2 ${isActive ? 'border-emerald-600 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-sm' : 'border-slate-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-white/20 bg-white dark:bg-[#1a2421]'}`}
                    >
                      <div className="relative shrink-0">
                        {firstItem?.product?.imageUrl || firstItem?.product?.thumbnail ? (
                          <img
                            src={getImageUrl(firstItem.product.imageUrl || firstItem.product.thumbnail)}
                            className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-slate-200 dark:border-white/10"
                            alt="product"
                          />
                        ) : <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10"></div>}
                      </div>

                      <div className="flex-1 flex justify-between items-center gap-2 sm:gap-3 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-[13px] sm:text-sm tracking-wide truncate ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-gray-200'}`}>
                            {order.consignmentId || order.trackingCode || order.orderNo || `ORD-${order.id}`}
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">{order.customer?.name} • {order.customer?.district}</p>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-400'}`}>
                            {date}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-gray-500 font-medium mt-1">
                            {time}
                          </span>
                        </div>

                        <div className="hidden sm:block shrink-0">
                          {getDynamicStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN (DESKTOP) ================= */}
          <div className="hidden lg:flex lg:col-span-5">
            {!selectedPackedOrder ? (
              <div className="w-full bg-slate-50 dark:bg-[#1a2421] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl h-[700px] flex flex-col items-center justify-center text-center p-8 transition-colors">
                <div className="w-16 h-16 bg-white dark:bg-[#141d1a] rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300 dark:text-gray-600"><CheckCircle2 size={32} /></div>
                <h3 className="text-lg font-bold text-slate-600 dark:text-gray-300">Select an Order</h3>
                <p className="text-sm text-slate-400 dark:text-gray-500 mt-2">Pick an order from the list to view historical details or revert packing.</p>
              </div>
            ) : (
              <div className="w-full bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col h-[700px] overflow-hidden relative transition-colors">
                {renderHistoryDetails()}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ================= MOBILE DRAWER FOR QUEUE ================= */}
      {isQueueDrawerOpen && selectedOrder && activeTab === 'queue' && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
          <div className="bg-white dark:bg-[#1a2421] w-full h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 relative">
            <button 
              onClick={() => setIsQueueDrawerOpen(false)} 
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 p-1.5 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={18} className="text-slate-700 dark:text-white" />
            </button>
            {renderQueueDetails()}
          </div>
        </div>
      )}

      {/* ================= MOBILE DRAWER FOR HISTORY ================= */}
      {isHistoryDrawerOpen && selectedPackedOrder && activeTab === 'history' && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
          <div className="bg-white dark:bg-[#1a2421] w-full h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 relative">
            <button 
              onClick={() => setIsHistoryDrawerOpen(false)} 
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 p-1.5 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={18} className="text-slate-700 dark:text-white" />
            </button>
            {renderHistoryDetails()}
          </div>
        </div>
      )}

    </div>
  )
}