"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, Shield, Eye, ShieldAlert, UserPlus, Search, 
  Mail, Phone, Clock, Key, CheckCircle2, X, Lock, Loader2, 
  Trash2, Edit3, Ban, CheckCircle, ArrowRight, DollarSign, Tag
} from "lucide-react";

// 🚀 সিস্টেমের সবগুলো পেজ/মডিউলের লিস্ট
const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard", desc: "View main dashboard analytics" },
  { id: "orders", label: "Orders Management", desc: "View and manage order processing" },
  { id: "customers", label: "Customers", desc: "Access customer database" },
  { id: "packing", label: "Packing Zone", desc: "Access packing and barcode scanning" },
  { id: "returns", label: "Returns", desc: "Process order returns" },
  { id: "courier", label: "Courier Integration", desc: "Manage Steadfast/Pathao bookings" },
  { id: "products", label: "Products", desc: "Manage inventory and products" },
  { id: "reports", label: "Reports & Analytics", desc: "View financial and sales reports" },
  { id: "announcements", label: "Announcements", desc: "View and manage announcements" },
  { id: "staff", label: "Staff & Payroll", desc: "Manage staff salaries and roster" },
  { id: "users", label: "System Users", desc: "Manage dashboard access and roles" },
  { id: "logs", label: "Activity Logs", desc: "View system audit trails" },
  { id: "subscription", label: "Subscription", desc: "Manage billing and plans" },
  { id: "tickets", label: "Support Tickets", desc: "Manage support requests" },
  { id: "settings", label: "Settings", desc: "Manage shop configurations" }
];

export default function SystemUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [limitErrorModal, setLimitErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const [newUser, setNewUser] = useState({
    name: "", email: "", phone: "", role: "OPERATOR", password: "", basicSalary: 0, commission: 0
  });

  const [editUserForm, setEditUserForm] = useState({
    id: "", name: "", phone: "", role: "", basicSalary: 0, commission: 0
  });

  const [newPassword, setNewPassword] = useState("");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        if (data.length > 0 && !selectedUser) {
          handleSelectUser(data[0]);
        } else if (selectedUser) {
          const updatedSelected = data.find((u: any) => u.id === selectedUser.id);
          if (updatedSelected) handleSelectUser(updatedSelected);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    const isOwnerOrAdmin = user.role === "SHOP_OWNER" || user.role === "ADMIN";
    
    if (isOwnerOrAdmin) {
      const perms: Record<string, boolean> = {};
      ALL_MODULES.forEach(mod => { perms[mod.id] = true; });
      setUserPermissions(perms);
    } else {
      // 🚀 ফিক্স: JSON পার্সার অ্যাড করা হলো যাতে ডাটা স্ট্রিং হিসেবে আসলেও ঠিকমতো কাজ করে
      let parsedPerms = user.permissions;
      if (typeof parsedPerms === 'string') {
        try { parsedPerms = JSON.parse(parsedPerms); } 
        catch (e) { parsedPerms = null; }
      }

      if (parsedPerms && Object.keys(parsedPerms).length > 0) {
        setUserPermissions(parsedPerms);
      } else {
        const perms: Record<string, boolean> = {};
        ALL_MODULES.forEach(mod => {
          perms[mod.id] = (mod.id === "dashboard" || mod.id === "orders"); 
        });
        setUserPermissions(perms);
      }
    }
  };

  // 🚀 ফিক্স: ডাটাবেসে রিয়েল-টাইম সেভ করার সাথে এরর চেকার
  const togglePermission = async (moduleId: string) => {
    if (selectedUser?.role === "SHOP_OWNER" || selectedUser?.role === "ADMIN") {
      alert("Shop Owner and Admins have full access by default.");
      return; 
    }

    const newPerms = { ...userPermissions, [moduleId]: !userPermissions[moduleId] };
    setUserPermissions(newPerms); // UI-তে সাথে সাথে আপডেট

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users/${selectedUser.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ permissions: newPerms })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        alert(`❌ ডাটাবেসে সেভ হয়নি! ব্যাকএন্ড এরর: ${errData.message}`);
        // সেভ না হলে আগের অবস্থায় ফিরিয়ে নেওয়া
        setUserPermissions(userPermissions);
        return;
      }
      
      // স্টেট আপডেট করে রাখা যাতে ইউজার সোয়াইপ করলে ডাটা মুছে না যায়
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, permissions: newPerms } : u));
    } catch (error) {
      console.error("Failed to update permissions", error);
      alert("❌ সার্ভারের সাথে কানেক্ট করা যাচ্ছে না!");
      setUserPermissions(userPermissions); // Revert
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ ${newUser.name}-কে সফলভাবে সিস্টেমে যুক্ত করা হয়েছে!`);
        setIsInviteModalOpen(false);
        setNewUser({ name: "", email: "", phone: "", role: "OPERATOR", password: "", basicSalary: 0, commission: 0 });
        fetchUsers();
      } else {
        setErrorMessage(data.message || 'ইউজার যুক্ত করা সম্ভব হয়নি');
        setIsInviteModalOpen(false); 
        setLimitErrorModal(true);  
      }
    } catch (error) {
      alert("সার্ভার এরর! দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = () => {
    setEditUserForm({
      id: selectedUser.id,
      name: selectedUser.name,
      phone: selectedUser.phone || "",
      role: selectedUser.role,
      basicSalary: selectedUser.basicSalary || 0,
      commission: selectedUser.commission || 0
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users/${editUserForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editUserForm) 
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`❌ এরর: ${err.message}`);
      }
    } catch (error) {
      alert("সার্ভার এরর!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে!");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users/${selectedUser.id}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        alert(`✅ ${selectedUser.name}-এর নতুন পাসওয়ার্ড সফলভাবে সেট করা হয়েছে!`);
        setIsPasswordModalOpen(false);
        setNewPassword("");
      } else {
        const err = await res.json();
        alert(`❌ এরর: ${err.message}`);
      }
    } catch (error) {
      alert("সার্ভার এরর!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (selectedUser.role === "SHOP_OWNER") {
      alert("Shop Owner-কে সাসপেন্ড করা যাবে না!");
      return;
    }
    const newStatus = selectedUser.status === "Active" ? "Inactive" : "Active";
    const confirmMsg = newStatus === "Inactive" ? "আপনি কি নিশ্চিত যে এই ইউজারকে সাসপেন্ড করতে চান?" : "এই অ্যাকাউন্টটি আবার অ্যাক্টিভ করতে চান?";
    
    if (!confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users/${selectedUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`❌ এরর: ${err.message}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async () => {
    if (selectedUser.role === "SHOP_OWNER") {
      alert("Shop Owner-কে ডিলিট করা যাবে না!");
      return;
    }
    if (!confirm(`আপনি কি নিশ্চিত যে '${selectedUser.name}'-কে পার্মানেন্টলি ডিলিট করতে চান? এই অ্যাকশনটি আর ফেরানো যাবে না!`)) return;

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`❌ এরর: ${err.message}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "All" || 
                       (activeTab === "Admin" && (u.role === "SHOP_OWNER" || u.role === "ADMIN")) || 
                       u.role === activeTab.toUpperCase();
    return matchesSearch && matchesTab;
  });

  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === "SHOP_OWNER" || u.role === "ADMIN").length;
  const activeUsers = users.filter(u => u.status !== "Inactive").length;
  const inactiveUsers = users.filter(u => u.status === "Inactive").length;

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "U";
  const formatDate = (dateString: string) => {
    if (!dateString) return "Never logged in";
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-500 font-medium">ইউজার ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto pb-10 transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-emerald-500" size={24} /> System Users
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Manage dashboard access, roles, and security permissions.</p>
        </div>
        
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
        >
          <UserPlus size={18} /> Invite New User
        </button>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a2421] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Users</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{totalUsers}</h3>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"><Users size={18} /></div>
        </div>
        <div className="bg-white dark:bg-[#1a2421] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Admins</p>
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{adminUsers}</h3>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"><Shield size={18} /></div>
        </div>
        <div className="bg-white dark:bg-[#1a2421] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Active Now</p>
            <h3 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{activeUsers}</h3>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><Eye size={18} /></div>
        </div>
        <div className="bg-white dark:bg-[#1a2421] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Inactive Users</p>
            <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400">{inactiveUsers}</h3>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"><ShieldAlert size={18} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT: USER DIRECTORY ================= */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col h-[750px]">
          <div className="p-5 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">User Directory</h2>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              {['All', 'Admin', 'Operator', 'Packer'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 border border-transparent'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search users by name, email or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-y-auto px-4 pb-4 space-y-3 flex-1 custom-scrollbar">
            {filteredUsers.length === 0 ? (
               <div className="text-center py-10 text-gray-400 text-sm">No users found.</div>
            ) : (
              filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  onClick={() => handleSelectUser(user)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedUser?.id === user.id ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#141d1a] hover:border-gray-300 dark:hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${user.role === 'SHOP_OWNER' || user.role === 'ADMIN' ? 'bg-purple-600' : user.role === 'OPERATOR' ? 'bg-cyan-600' : 'bg-emerald-600'}`}>
                      {getInitial(user.name)}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${selectedUser?.id === user.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                        {user.name} {user.status === "Inactive" && <span className="ml-2 text-[10px] text-rose-500">(Suspended)</span>}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${user.role === 'SHOP_OWNER' || user.role === 'ADMIN' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'}`}>
                      {user.role}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status !== 'Inactive' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      {user.status || 'Active'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= RIGHT: USER DETAILS & PERMISSIONS ================= */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col h-[750px] overflow-hidden relative">
          {selectedUser ? (
            <>
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center shrink-0">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shadow-lg mb-3 ${selectedUser.role === 'SHOP_OWNER' || selectedUser.role === 'ADMIN' ? 'bg-purple-600' : selectedUser.role === 'OPERATOR' ? 'bg-cyan-600' : 'bg-emerald-600'}`}>
                  {getInitial(selectedUser.name)}
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{selectedUser.name}</h2>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${selectedUser.role === 'SHOP_OWNER' || selectedUser.role === 'ADMIN' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'}`}>
                  {selectedUser.role}
                </span>

                {/* Quick Actions */}
                {selectedUser.role !== 'SHOP_OWNER' && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button onClick={openEditModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-500/20">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={handleToggleStatus} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border ${selectedUser.status === 'Active' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border-amber-200 dark:border-amber-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/20'}`}>
                      {selectedUser.status === 'Active' ? <><Ban size={14} /> Suspend</> : <><CheckCircle size={14} /> Activate</>}
                    </button>
                    <button onClick={handleDeleteUser} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-200 dark:border-rose-500/20">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Salary & Commission Details */}
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Payroll Information</h3>
                  <div className="bg-emerald-50/50 dark:bg-[#141d1a] p-3.5 rounded-xl border border-emerald-100 dark:border-white/5 space-y-2.5 text-xs">
                    <p className="flex justify-between items-center text-slate-700 dark:text-gray-300">
                      <span className="flex items-center gap-2 font-bold"><DollarSign size={14} className="text-emerald-600"/> Basic Salary:</span>
                      <span className="font-bold">৳ {selectedUser.basicSalary || 0} / month</span>
                    </p>
                    <p className="flex justify-between items-center text-slate-700 dark:text-gray-300">
                      <span className="flex items-center gap-2 font-bold"><Tag size={14} className="text-amber-600"/> Commission Rate:</span>
                      <span className="font-bold">৳ {selectedUser.commission || 0}</span>
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Contact Info</h3>
                  <div className="bg-gray-50 dark:bg-[#141d1a] p-3.5 rounded-xl border border-gray-100 dark:border-white/5 space-y-2.5 text-xs">
                    <p className="flex items-center gap-3 text-slate-700 dark:text-gray-300"><Mail size={14} className="text-gray-400"/> {selectedUser.email}</p>
                    <p className="flex items-center gap-3 text-slate-700 dark:text-gray-300"><Phone size={14} className="text-gray-400"/> {selectedUser.phone || "Not Provided"}</p>
                    <p className="flex items-center gap-3 text-slate-700 dark:text-gray-300"><Clock size={14} className="text-gray-400"/> Last Login: {formatDate(selectedUser.lastLogin || selectedUser.createdAt)}</p>
                  </div>
                </div>

                {/* All Pages Permissions */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Page Permissions</h3>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">Auto Saved</span>
                  </div>
                  
                  <div className="space-y-2.5 pb-4">
                    {ALL_MODULES.map((module) => {
                      const isOwnerOrAdmin = selectedUser.role === 'SHOP_OWNER' || selectedUser.role === 'ADMIN';
                      const hasAccess = isOwnerOrAdmin ? true : !!userPermissions[module.id];

                      return (
                        <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#141d1a] rounded-lg border border-gray-100 dark:border-white/5">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white">{module.label}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">{module.desc}</p>
                          </div>
                          
                          <div 
                            onClick={() => togglePermission(module.id)}
                            className={`w-9 h-5 rounded-full flex items-center p-1 cursor-pointer transition-colors ${
                              isOwnerOrAdmin ? 'bg-emerald-500 opacity-50 cursor-not-allowed' : 
                              hasAccess ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${hasAccess ? 'translate-x-3.5' : ''}`}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#141d1a] shrink-0">
                 <button 
                   onClick={() => setIsPasswordModalOpen(true)}
                   className="w-full py-2.5 bg-white dark:bg-[#1a2421] hover:bg-gray-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-200 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-gray-200 dark:border-white/10 shadow-sm"
                 >
                   <Key size={14} /> Set New Password
                 </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Users size={40} className="mb-3 opacity-50" />
               <p>Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD NEW USER MODAL ================= */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-md rounded-2xl shadow-2xl border border-transparent dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#141d1a]">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-500"/> Invite New User
              </h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Full Name *</label>
                <input 
                  type="text" required 
                  placeholder="e.g. Farhan Ahmed" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Email Address *</label>
                  <input 
                    type="email" required 
                    placeholder="user@company.com" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Phone (Optional)</label>
                  <input 
                    type="tel" 
                    placeholder="01XXXXXXXXX" 
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Assign Role *</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 appearance-none transition-colors"
                >
                  <option value="ADMIN">Admin (Manage Shop)</option>
                  <option value="OPERATOR">Operator (Manage Orders)</option>
                  <option value="PACKER">Packer (Packing Zone Only)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Basic Salary (৳)</label>
                  <input 
                    type="number" min="0"
                    placeholder="e.g. 10000" 
                    value={newUser.basicSalary || ""}
                    onChange={(e) => setNewUser({...newUser, basicSalary: Number(e.target.value)})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Commission (৳ or %)</label>
                  <input 
                    type="number" min="0"
                    placeholder="e.g. 50" 
                    value={newUser.commission || ""}
                    onChange={(e) => setNewUser({...newUser, commission: Number(e.target.value)})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Set Initial Password *</label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <input 
                    type="text" required 
                    placeholder="Set a default password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg flex justify-center items-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                  {isSubmitting ? "Saving User..." : "Save & Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT USER MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-md rounded-2xl shadow-2xl border border-transparent dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#141d1a]">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit3 size={18} className="text-blue-500"/> Edit User Profile
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Full Name *</label>
                <input 
                  type="text" required 
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Phone (Optional)</label>
                <input 
                  type="tel" 
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({...editUserForm, phone: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Assign Role *</label>
                <select 
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})}
                  className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 appearance-none transition-colors"
                >
                  <option value="ADMIN">Admin (Manage Shop)</option>
                  <option value="OPERATOR">Operator (Manage Orders)</option>
                  <option value="PACKER">Packer (Packing Zone Only)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Basic Salary (৳)</label>
                  <input 
                    type="number" min="0"
                    placeholder="e.g. 10000" 
                    value={editUserForm.basicSalary || ""}
                    onChange={(e) => setEditUserForm({...editUserForm, basicSalary: Number(e.target.value)})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-400">Commission (৳)</label>
                  <input 
                    type="number" min="0"
                    placeholder="e.g. 50" 
                    value={editUserForm.commission || ""}
                    onChange={(e) => setEditUserForm({...editUserForm, commission: Number(e.target.value)})}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg flex justify-center items-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                  {isSubmitting ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PASSWORD RESET MODAL ================= */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-sm rounded-2xl shadow-2xl border border-transparent dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#141d1a]">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Key size={18} className="text-amber-500"/> Reset Password
              </h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handlePasswordReset} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Set a new password for <strong className="text-slate-800 dark:text-white">{selectedUser.name}</strong>.
                </p>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">New Password *</label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <input 
                    type="text" required 
                    placeholder="Enter new password (min 6 chars)" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 dark:bg-white hover:bg-slate-700 dark:hover:bg-gray-100 text-white dark:text-slate-900 font-bold py-3 rounded-xl transition-colors shadow-lg flex justify-center items-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                  {isSubmitting ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= STAFF LIMIT EXCEEDED MODAL ================= */}
      {limitErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden p-6 text-center">
            
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ShieldAlert size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">
              Staff Limit Reached!
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {errorMessage}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setLimitErrorModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setLimitErrorModal(false);
                  window.location.href = "/dashboard/subscription";
                }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2 cursor-pointer"
              >
                Upgrade Plan <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}