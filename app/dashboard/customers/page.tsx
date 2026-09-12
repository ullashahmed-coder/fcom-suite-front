"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Users, UserPlus, Search, RefreshCw, TrendingUp, Download, 
  Eye, X, MessageSquare, Phone, ShoppingBag, CheckCircle2, Send, Tag, Loader2,
  Trash2, Edit3, Calendar, Box, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

export default function CustomersPage() {
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeDateFilter, setActiveDateFilter] = useState("All time");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ id: "", name: "", phone: "", district: "", address: "" });
  const [isSaving, setIsSaving] = useState(false);

  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [smsModal, setSmsModal] = useState<{isOpen: boolean, type: 'SMS' | 'OFFER', isBulk: boolean}>({ isOpen: false, type: 'SMS', isBulk: false });
  const [smsText, setSmsText] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/customers`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const isEditing = !!customerForm.id;
      const url = isEditing ? `${apiUrl}/customers/${customerForm.id}` : `${apiUrl}/customers`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: customerForm.name,
          phone: customerForm.phone,
          district: customerForm.district,
          address: customerForm.address
        })
      });

      if (res.ok) {
        alert(`✅ কাস্টমার সফলভাবে ${isEditing ? 'আপডেট' : 'যোগ'} করা হয়েছে।`);
        setIsCustomerModalOpen(false);
        if (isEditing && selectedCustomer) {
            setSelectedCustomer(null);
        }
        setCustomerForm({ id: "", name: "", phone: "", district: "", address: "" });
        fetchCustomers();
      } else {
        alert("❌ কাস্টমার সেভ করা যায়নি।");
      }
    } catch (err) {
      console.error(err);
      alert("সার্ভার এরর।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই কাস্টমারকে ডিলিট করতে চান?")) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/customers/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        alert("✅ কাস্টমার ডিলিট করা হয়েছে।");
        setSelectedCustomer(null);
        fetchCustomers();
      } else {
        const errorData = await res.json();
        alert(`❌ ডিলিট এরর: ${errorData.message || "এই কাস্টমারকে ডিলিট করা যাচ্ছে না!"}`);
      }
    } catch (err) {
      console.error(err);
      alert("সার্ভার এরর।");
    }
  };

  const openAddModal = () => {
    setCustomerForm({ id: "", name: "", phone: "", district: "", address: "" });
    setIsCustomerModalOpen(true);
  };

  const openEditModal = (customer: any) => {
    setCustomerForm({
      id: customer.id,
      name: customer.name || "",
      phone: customer.phone || "",
      district: customer.district || "",
      address: customer.address || ""
    });
    setIsCustomerModalOpen(true);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) || customer.phone?.includes(searchQuery);
      if (!matchesSearch) return false;

      if (activeDateFilter === "All time") return true;

      const orderDate = new Date(customer.createdAt || customer.lastOrder || Date.now());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(new Date().getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (activeDateFilter === "Today") return orderDate >= today;
      if (activeDateFilter === "Yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return orderDate >= yesterday && orderDate < today;
      }
      if (activeDateFilter === "Last 7") return diffDays <= 7;
      if (activeDateFilter === "Last 30") return diffDays <= 30;
      if (activeDateFilter === "Inactive 90+ Days") return diffDays > 90;
      
      return true;
    });
  }, [customers, searchQuery, activeDateFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options).toUpperCase();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options).toUpperCase();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedCustomerIds(filteredCustomers.map(c => c.id));
    else setSelectedCustomerIds([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedCustomerIds.includes(id)) setSelectedCustomerIds(selectedCustomerIds.filter(cId => cId !== id));
    else setSelectedCustomerIds([...selectedCustomerIds, id]);
  };

  const handleSendSMS = () => {
    if (!smsText.trim()) {
      alert("দয়া করে কোনো মেসেজ লিখুন।");
      return;
    }
    
    if (smsModal.isBulk) {
      alert(`✅ Bulk SMS সফলভাবে ${selectedCustomerIds.length} জন কাস্টমারের কাছে পাঠানো হয়েছে!\n\nMessage: ${smsText}`);
      setSelectedCustomerIds([]);
    } else {
      alert(`✅ মেসেজ পাঠানো হয়েছে ${selectedCustomer?.phone} নম্বরে!\n\nMessage: ${smsText}`);
    }
    
    setSmsModal({ isOpen: false, type: 'SMS', isBulk: false });
    setSmsText("");
  };

  const insertVariable = (variable: string) => setSmsText(prev => prev + variable);

  const totalCustomersCount = customers.length;
  const repeatCustomersCount = customers.filter(c => (c.orders?.length || c.totalOrders || 0) > 1).length;
  
  const totalLifetimeSpent = customers.reduce((sum, c) => {
      let spent = c.lifetimeSpent || 0;
      if (!spent && c.orders) {
          spent = c.orders.reduce((orderSum: number, order: any) => orderSum + (order.totalAmount || 0), 0);
      }
      return sum + spent;
  }, 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 transition-colors relative">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white dark:bg-[#1a2421] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none gap-4 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and view your customer base and their lifetime value</p>
        </div>
        <button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-sm">
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-[#1a2421] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Total Customer</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{totalCustomersCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><Users size={20}/></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a2421] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Repeat Customer</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{repeatCustomersCount}</h3>
              <p className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded inline-block mt-2">
                {totalCustomersCount > 0 ? Math.round((repeatCustomersCount / totalCustomersCount) * 100) : 0}% Return Rate
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500"><RefreshCw size={20}/></div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2421] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Active Database</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{customers.length}</h3>
              <p className="text-xs font-bold text-emerald-500 mt-2">Verified records</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500"><UserPlus size={20}/></div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2421] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Lifetime Sells</p>
              <h3 className="text-3xl font-black text-emerald-700 dark:text-rose-400 flex items-center gap-1"><span className="text-xl">৳</span> {totalLifetimeSpent.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-[#7A1B38] dark:text-rose-400"><TrendingUp size={20}/></div>
          </div>
        </div>
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="bg-white dark:bg-[#1a2421] p-3 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
        <div className="relative w-full xl:w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Customers..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1 xl:pb-0">
          <div className="flex items-center bg-slate-50 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-transparent shrink-0">
            {["Today", "Yesterday", "Last 7", "Last 30", "Inactive 90+ Days", "All time"].map(filter => (
              <button 
                key={filter} onClick={() => setActiveDateFilter(filter)}
                className={`px-4 py-1.5 text-xs rounded-md font-bold transition-colors ${activeDateFilter === filter ? (filter === "Inactive 90+ Days" ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm" : "bg-white dark:bg-[#1a2421] text-emerald-600 dark:text-emerald-400 shadow-sm") : "text-slate-500 hover:text-slate-700 dark:text-gray-400 font-medium"}`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-gray-300 hover:bg-slate-50 shrink-0">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* BULK ACTION BAR */}
      <div className="flex items-center justify-between bg-white dark:bg-[#1a2421] p-3 rounded-xl border border-gray-200 dark:border-white/5 transition-colors">
        <div className="flex items-center gap-3 ml-2">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-600 dark:bg-[#141d1a] cursor-pointer"
            checked={filteredCustomers.length > 0 && selectedCustomerIds.length === filteredCustomers.length}
            onChange={handleSelectAll}
          />
          <span className="text-sm font-bold text-slate-700 dark:text-gray-200">
            Select All {selectedCustomerIds.length > 0 ? `(${selectedCustomerIds.length})` : ""}
          </span>
        </div>

        {selectedCustomerIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <button 
              onClick={() => { setSmsText(""); setSmsModal({ isOpen: true, type: 'SMS', isBulk: true }); }}
              className="text-xs font-bold px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-700 dark:text-gray-200 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition flex items-center gap-2"
            >
              <MessageSquare size={14} className="text-[#7A1B38]"/> Bulk SMS
            </button>
            <button 
              onClick={() => { setSmsText("হ্যালো [Name],\nআমরা আপনাকে মিস করছি! আপনার পরবর্তী অর্ডারে ১০০ টাকা ছাড় পেতে কোডটি ব্যবহার করুন: WINBACK100"); setSmsModal({ isOpen: true, type: 'OFFER', isBulk: true }); }}
              className="text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
            >
              <Tag size={14} /> Send Bulk Offer
            </button>
          </div>
        )}
      </div>

      {/* ================= CUSTOMERS GRID ================= */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/5 rounded-2xl">
          <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">কোনো কাস্টমার পাওয়া যায়নি!</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCustomers.map((customer) => {
            const customerOrderCount = customer.orders?.length || customer.totalOrders || 0;
            const isRepeat = customerOrderCount > 1;
            
            const customerLifetimeSpent = customer.lifetimeSpent || (customer.orders ? customer.orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) : 0);

            return (
              <div key={customer.id} className={`bg-white dark:bg-[#1a2421] rounded-2xl border flex flex-col hover:shadow-lg dark:hover:border-white/10 transition-all overflow-hidden relative group ${selectedCustomerIds.includes(customer.id) ? 'border-emerald-400 dark:border-emerald-500/50 ring-1 ring-emerald-400/50' : 'border-gray-200 dark:border-white/5'}`}>
                
                <div className="absolute top-4 left-4 z-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-600 cursor-pointer" 
                    checked={selectedCustomerIds.includes(customer.id)}
                    onChange={() => handleSelectOne(customer.id)}
                  />
                </div>

                <div className="absolute top-4 right-4">
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider ${isRepeat ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'}`}>
                    {isRepeat ? 'REPEAT' : 'NEW'}
                  </span>
                </div>

                <div className="p-6 pt-10 flex flex-col items-center text-center border-b border-gray-50 dark:border-white/5">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xl font-black text-slate-400 mb-3 border border-slate-200 dark:border-white/10">
                    {customer.name ? customer.name.substring(0, 1).toUpperCase() : "C"}
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-800 dark:text-white line-clamp-1">{customer.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1"><Phone size={12}/> {customer.phone}</p>
                </div>

                <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-white/5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mt-1"><ShoppingBag size={14} className="text-slate-400"/> {customerOrderCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lifetime Spent</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">৳ {customerLifetimeSpent.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 mt-auto border-t border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-transparent">
                  <span className="text-[10px] font-medium text-gray-400">Joined: {formatDate(customer.createdAt)}</span>
                  <button onClick={() => setSelectedCustomer(customer)} className="text-xs font-bold text-emerald-700 dark:text-rose-400 hover:text-emerald-800 flex items-center gap-1 transition-colors">
                    <Eye size={14}/> View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CUSTOMER PROFILE DRAWER (PORTAL) ================= */}
      {selectedCustomer && mounted && createPortal(
        <>
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-[99998] transition-opacity" onClick={() => setSelectedCustomer(null)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-[#1a2421] shadow-2xl z-[99999] flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-start bg-slate-50 dark:bg-[#141d1a]">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-[#1a2421] flex items-center justify-center text-xl font-black text-emerald-700 border border-gray-200 dark:border-white/10 shadow-sm">
                  {selectedCustomer.name?.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedCustomer.name}</h2>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${(selectedCustomer.orders?.length || selectedCustomer.totalOrders || 0) > 1 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {(selectedCustomer.orders?.length || selectedCustomer.totalOrders || 0) > 1 ? 'REPEAT' : 'NEW'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent rounded-full text-gray-400 hover:text-rose-500 transition shadow-sm"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setSmsText(""); setSmsModal({ isOpen: true, type: 'SMS', isBulk: false }); }}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition"
                >
                  <MessageSquare size={16} /> Send SMS
                </button>
                <button 
                  onClick={() => {
                    setSmsText(`হ্যালো [Name],\nআপনার জন্য রয়েছে স্পেশাল ডিসকাউন্ট! আজই অর্ডার করুন এবং উপভোগ করুন দারুন ছাড়।`);
                    setSmsModal({ isOpen: true, type: 'OFFER', isBulk: false });
                  }}
                  className="flex items-center justify-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-emerald-400 py-3 rounded-xl text-sm font-bold transition"
                >
                  <CheckCircle2 size={16} className={smsModal.type === 'OFFER' ? 'text-emerald-600' : ''} /> Send Offer
                </button>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Information</h3>
                <div className="bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-xl divide-y divide-gray-100 dark:divide-white/5">
                  <div className="p-3.5 flex justify-between text-sm"><span className="text-gray-500">District:</span> <span className="font-bold text-slate-800 dark:text-white">{selectedCustomer.district || 'N/A'}</span></div>
                  <div className="p-3.5 flex justify-between text-sm"><span className="text-gray-500">Address:</span> <span className="font-bold text-slate-800 dark:text-white">{selectedCustomer.address || 'N/A'}</span></div>
                  <div className="p-3.5 flex justify-between text-sm"><span className="text-gray-500">Joined:</span> <span className="font-bold text-slate-800 dark:text-white">{formatDate(selectedCustomer.createdAt)}</span></div>
                </div>
              </div>

              {/* 🚀 PURCHASE HISTORY SECTION (WITH IMAGES) */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex justify-between items-end">
                  <span>Purchase History</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    Total: ৳ {selectedCustomer.lifetimeSpent || (selectedCustomer.orders ? selectedCustomer.orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) : 0).toLocaleString()}
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    selectedCustomer.orders.map((order: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-4 transition-colors hover:border-gray-200 dark:hover:border-white/10">
                        <div className="flex justify-between items-start border-b border-gray-200 dark:border-white/10 pb-2 mb-3">
                           <div>
                             <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={12}/> {formatDateTime(order.createdAt)}</p>
                             <p className="text-[13px] font-bold text-slate-800 dark:text-gray-200 mt-1">{order.orderNo}</p>
                           </div>
                           <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">৳ {order.totalAmount}</span>
                        </div>
                        
                        {/* 🚀 Order Items List (With Image) */}
                        <div className="space-y-3">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item: any, i: number) => {
                              const imgUrl = item.product?.imageUrl ? (item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `${apiUrl}${item.product.imageUrl}`) : null;
                              
                              return (
                                <div key={i} className="flex justify-between items-center text-[13px]">
                                  <div className="flex items-center gap-3">
                                    {/* Product Image */}
                                    {imgUrl ? (
                                      <img 
                                        src={imgUrl} 
                                        alt={item.product?.name || "Product"} 
                                        className="w-8 h-8 rounded-md shadow-sm object-cover border border-gray-200 dark:border-white/10 bg-white"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-md shadow-sm bg-slate-200 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10">
                                        <ImageIcon size={14} className="text-gray-400" />
                                      </div>
                                    )}
                                    
                                    <div className="flex flex-col">
                                      <span className="text-slate-700 dark:text-gray-300 font-bold leading-tight">
                                        {item.product?.name || "Unknown Item"}
                                      </span>
                                      <span className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">Qty: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <span className="text-slate-700 dark:text-gray-300 font-bold">৳ {item.price * item.quantity}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-gray-400 italic">No item details found.</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-slate-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                      <ShoppingBag size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500 font-medium">কোনো অর্ডার হিস্ট্রি পাওয়া যায়নি।</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* 🚀 Drawer Footer: Edit & Delete Options */}
            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a2421] grid grid-cols-2 gap-3 transition-colors">
               <button 
                 onClick={() => openEditModal(selectedCustomer)} 
                 className="py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition"
               >
                 <Edit3 size={16}/> Edit Details
               </button>
               <button 
                 onClick={() => handleDeleteCustomer(selectedCustomer.id)} 
                 className="py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
               >
                 <Trash2 size={16}/> Delete
               </button>
            </div>

          </div>
        </>,
        document.body
      )}

      {/* ================= SMS & OFFER MODAL (PORTAL) ================= */}
      {smsModal.isOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#141d1a]">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {smsModal.type === 'OFFER' ? <Tag size={18} className="text-emerald-500"/> : <MessageSquare size={18} className="text-emerald-600"/>}
                  {smsModal.type === 'OFFER' ? 'Send Promotional Offer' : 'Send Custom SMS'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {smsModal.isBulk 
                    ? <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Sending to {selectedCustomerIds.length} Customers</span>
                    : <span>To: <span className="font-bold text-slate-700 dark:text-gray-300">{selectedCustomer?.name}</span></span>
                  }
                </p>
              </div>
              <button onClick={() => setSmsModal({isOpen: false, type: 'SMS', isBulk: false})} className="text-gray-400 hover:text-rose-500"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Insert Variables</p>
                <div className="flex gap-2">
                  <button onClick={() => insertVariable('[Name]')} className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-600 dark:text-gray-300 rounded border border-gray-200 dark:border-white/10 transition">+ Customer Name</button>
                  <button onClick={() => insertVariable('[Discount]')} className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-600 dark:text-gray-300 rounded border border-gray-200 dark:border-white/10 transition">+ Discount %</button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300 flex justify-between">
                  Message Content
                  <span className={`${smsText.length > 160 ? 'text-rose-500' : 'text-emerald-500'} font-black`}>
                    {smsText.length} / 160
                  </span>
                </label>
                <textarea 
                  rows={5} 
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="Type your message here..." 
                  className="w-full mt-2 p-3 bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white resize-none leading-relaxed"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setSmsModal({isOpen: false, type: 'SMS', isBulk: false})} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition">Cancel</button>
                <button onClick={handleSendSMS} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-md">
                  <Send size={16} /> Send {smsModal.isBulk ? 'Bulk ' : ''}Message
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= ADD/EDIT CUSTOMER MODAL (PORTAL) ================= */}
      {isCustomerModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#141d1a]">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {customerForm.id ? <Edit3 size={18}/> : <UserPlus size={18}/>} 
                {customerForm.id ? "Edit Customer" : "Add New Customer"}
              </h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-rose-500"><X size={20}/></button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleSaveCustomer}>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Phone Number *</label>
                <input 
                  type="tel" required placeholder="01XXXXXXXXX" 
                  value={customerForm.phone} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Customer Name *</label>
                <input 
                  type="text" required placeholder="Full Name" 
                  value={customerForm.name} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">District *</label>
                <input 
                  type="text" required placeholder="District Name" 
                  value={customerForm.district} onChange={(e) => setCustomerForm({...customerForm, district: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Default Delivery Address</label>
                <textarea 
                  rows={2} placeholder="Full address..." 
                  value={customerForm.address} onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-white dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white resize-none"
                ></textarea>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors flex items-center justify-center gap-2 shadow-sm">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : (customerForm.id ? "Update Customer" : "Save Customer")}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}