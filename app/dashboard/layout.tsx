"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, ShoppingCart, Users, Package, Undo2, Truck, Box, BarChart3,
  Briefcase, UserCog, History, Settings, Bell, Moon, Sun, Menu, X, CreditCard,
  LogOut, Headphones, ChevronLeft, ChevronDown, User, AlertTriangle, CheckCircle2,
  Calendar, LucideIcon, HelpCircle, Megaphone, Lock, Home, RotateCcw
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import Logo from "../components/Logo";
import SupportModal from "../components/SupportModal"; 
import MaintenanceBlocker from "../components/MaintenanceBlocker";

/* ===================== TYPES ===================== */

type NavItem = {
  id: string; 
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

/* ===================== STATIC DATA ===================== */

const MAIN_NAV: NavItem[] = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { id: "orders", href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { id: "customers", href: "/dashboard/customers", label: "Customers", icon: Users },
  { id: "packing", href: "/dashboard/packing", label: "Packing", icon: Package },
  { id: "returns", href: "/dashboard/returns", label: "Returns", icon: Undo2 },
  { id: "courier", href: "/dashboard/courier", label: "Courier", icon: Truck },
  { id: "products", href: "/dashboard/products", label: "Products", icon: Box },
  { id: "reports", href: "/dashboard/reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "announcements", href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
];

const MANAGEMENT_NAV: NavItem[] = [
  { id: "staff", href: "/dashboard/staff", label: "Staff and Payroll", icon: Briefcase },
  { id: "users", href: "/dashboard/users", label: "Users", icon: UserCog },
  { id: "logs", href: "/dashboard/logs", label: "Activity Logs", icon: History },
  { id: "subscription", href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { id: "tickets", href: "/dashboard/tickets", label: "Support Tickets", icon: HelpCircle },
  { id: "settings", href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/* ===================== HELPERS ===================== */

function isLinkActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function getLinkStyle(active: boolean) {
  return active
    ? "flex items-center gap-3 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-500/15 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-emerald-500 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    : "flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100/80 dark:hover:bg-white/5 rounded-xl text-gray-600 dark:text-gray-400 transition-all duration-300 font-medium text-sm hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50";
}

function useDismissable(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    function handleClickOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside); 
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [open, onClose]);

  return ref;
}

function timeAgo(dateString: string) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

const getIconDetails = (type: string) => {
  switch (type) {
    case 'order': return { icon: Package, iconClass: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" };
    case 'warning':
    case 'alert': return { icon: AlertTriangle, iconClass: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" };
    case 'success': return { icon: CheckCircle2, iconClass: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" };
    case 'return': return { icon: AlertTriangle, iconClass: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" };
    default: return { icon: Bell, iconClass: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-500/10" };
  }
};

/* ===================== SIDEBAR NAV LIST ===================== */

function NavList({ items, pathname, onNavigate, userPermissions, userRole }: { items: NavItem[]; pathname: string; onNavigate: () => void; userPermissions: any; userRole: string; }) {
  const isOwnerOrAdmin = userRole === 'shop_owner' || userRole === 'admin';

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const hasPermission = isOwnerOrAdmin 
          || item.id === 'dashboard' 
          || userPermissions?.[item.id] === true;

        if (!hasPermission) return null;

        const active = isLinkActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={getLinkStyle(active)}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={17} /> <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ===================== MOBILE BOTTOM NAV ===================== */

function MobileBottomNav() {
  const pathname = usePathname();

  // 🚀 যদি ইউজার অর্ডার ক্রিয়েট পেজে বা এমন কোনো পেজে থাকে যেখানে কনফার্ম বাটন ঢাকা পড়ে, তবে নেভবার হাইড থাকবে
  const shouldHideNav = pathname.includes("/orders/create") || pathname.includes("/create");

  if (shouldHideNav) {
    return null; // এই পেজগুলোতে নেভবার রেন্ডার হবে না
  }

  const navItems = [
    { label: "Home", href: "/dashboard/mobile", icon: Home },
    { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { label: "Packing", href: "/dashboard/packing", icon: Package },
    { label: "Returns", href: "/dashboard/returns", icon: RotateCcw },
    { label: "Products", href: "/dashboard/products", icon: Box },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2421] border-t border-gray-200 dark:border-white/10 px-4 py-2.5 flex justify-around items-center z-50 md:hidden shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive 
                ? "text-emerald-600 dark:text-emerald-400 font-bold" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/* ===================== NOTIFICATION DROPDOWN ===================== */

function NotificationDropdown({
  open, onClose, notifications, unreadCount, onMarkAsRead
}: {
  open: boolean; onClose: () => void; notifications: any[]; unreadCount: number; onMarkAsRead: (id: string) => void;
}) {
  const ref = useDismissable(open, onClose);
  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#141c19] border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-[#0c1210]">
        <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
        <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
          {unreadCount} New
        </span>
      </div>

      <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const isRead = notif.read || notif.isRead;
            const { icon: Icon, bg, iconClass } = getIconDetails(notif.type);
            
            return (
              <div
                key={notif.id}
                onClick={() => { if (!isRead) onMarkAsRead(notif.id); }}
                className={`p-4 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer flex gap-4 ${!isRead ? "bg-emerald-50/30 dark:bg-emerald-500/5" : ""}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={16} className={iconClass} />
                </div>
                <div>
                  <p className={`text-sm ${!isRead ? "font-bold text-gray-800 dark:text-gray-100" : "text-gray-600 dark:text-gray-300"}`}>
                    {notif.text || notif.message}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {notif.createdAt ? timeAgo(notif.createdAt) : (notif.time || "Just now")}
                  </p>
                </div>
                {!isRead && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">No new notifications found.</div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-white/5 text-center bg-gray-50 dark:bg-[#0c1210]">
        <Link href="/dashboard/notifications" onClick={onClose} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition">
          View All Notifications
        </Link>
      </div>
    </div>
  );
}

/* ===================== PROFILE DROPDOWN ===================== */

function ProfileDropdown({ 
  open, onClose, userName, userEmail, userInitial, userRole
}: { 
  open: boolean; onClose: () => void; userName: string; userEmail: string; userInitial: string; userRole: string;
}) {
  const ref = useDismissable(open, onClose);
  if (!open) return null;

  const isOwnerOrAdmin = userRole === 'shop_owner' || userRole === 'admin';

  return (
    <div ref={ref} role="menu" className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#141c19] border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-gray-50 dark:bg-[#0c1210]">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">{userInitial}</div>
        <div className="min-w-0">
          <h4 className="font-bold text-gray-800 dark:text-white truncate">{userName}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{userEmail}</p>
        </div>
      </div>

      <div className="p-2">
        <Link href="/dashboard/profile" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-none">
          <User size={16} /> My Profile
        </Link>
        <Link href="/dashboard/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-none">
          <Settings size={16} /> Settings
        </Link>
        
        {isOwnerOrAdmin && (
          <Link href="/dashboard/subscription" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-none">
            <CreditCard size={16} /> Billing & Plan
          </Link>
        )}
      </div>

      <div className="p-2 border-t border-gray-100 dark:border-white/5">
        <button
          onClick={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("access_token");
            signOut({ callbackUrl: "http://localhost:3001/login"});
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition focus-visible:outline-none"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}

/* ===================== MAIN LAYOUT ===================== */

export default function TenantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const [shopName, setShopName] = useState("Loading...");
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("...");
  const [userInitial, setUserInitial] = useState("U");
  const [shopStatus, setShopStatus] = useState<string>("ACTIVE");
  
  const [userPermissions, setUserPermissions] = useState<any>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchBillingStatus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/billing/plan`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setShopStatus(data.status || "ACTIVE");
      }
    } catch (error) { console.error(error); }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/notifications`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) { console.error(error); }
  };

  const handleMarkAsRead = async (id: string | number) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${apiUrl}/notifications/${id}/read`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) { console.error(error); }
  };

  const fetchFreshPermissions = async (email: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users`, { 
        headers: { "Authorization": `Bearer ${token}` } 
      });
      if (res.ok) {
        const usersData = await res.json();
        const myData = usersData.find((u: any) => u.email === email);
        
        if (myData && myData.permissions) {
          let freshPerms = myData.permissions;
          if (typeof freshPerms === 'string') {
            try { freshPerms = JSON.parse(freshPerms); } catch (e) { freshPerms = {}; }
          }
          setUserPermissions(freshPerms || {});
          
          const localUser = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...localUser, permissions: myData.permissions }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch fresh permissions", error);
    }
  };

  // 🚀 ইউজারের ডাটা এবং শপের নাম লোড করার ফাংশনটি আলাদা করা হলো
  const loadUserData = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      // ব্যাকএন্ড থেকে আসা বা লোকালস্টোরেজে আপডেট হওয়া লেটেস্ট শপের নাম বসবে
      setShopName(parsedUser?.shop?.name || parsedUser.shopName || "My Shop");
      
      setUserName(parsedUser.name || "User");
      setUserEmail(parsedUser.email || "");
      setUserInitial(parsedUser.name ? parsedUser.name.charAt(0).toUpperCase() : "U");
      
      let perms = parsedUser.permissions;
      if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
      }
      setUserPermissions(perms || {});

      let currentRole = "...";
      if (parsedUser.role) {
        currentRole = parsedUser.role.toLowerCase();
        setUserRole(currentRole);
      }

      if (parsedUser.email && (currentRole !== 'shop_owner' && currentRole !== 'admin')) {
        fetchFreshPermissions(parsedUser.email);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));

    // 🚀 ১. প্রথমবার পেজ লোড হলে ইউজারের ডেটা কল হবে
    loadUserData();

    // 🚀 ২. সেটিংস পেজ থেকে 'shopUpdated' ইভেন্ট এলে সাথে সাথে রিলোড ছাড়াই নাম পাল্টে যাবে
    window.addEventListener("shopUpdated", loadUserData);

    fetchBillingStatus();
    fetchNotifications();

    return () => {
      // কম্পোনেন্ট আনমাউন্ট হলে লিসেনার রিমুভ হবে
      window.removeEventListener("shopUpdated", loadUserData);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  return (
    <div className="flex h-screen bg-[#f4f7f6] dark:bg-[#0c1210] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={closeMobileMenu} aria-hidden="true" />
      )}

      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#141c19] border-r border-gray-200/80 dark:border-white/5 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none
          ${isMobileMenuOpen ? "translate-x-0 w-[260px]" : "-translate-x-full w-[260px]"}
          lg:relative lg:translate-x-0 ${isDesktopSidebarOpen ? "lg:w-[260px]" : "lg:w-0 lg:border-0 lg:overflow-hidden"}
        `}
        aria-label="Primary navigation"
      >
        <div className="px-5 pt-6 pb-5 border-b border-gray-100 dark:border-white/5 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

          <div className="flex items-center justify-between z-10 relative">
            <Logo />
            <button onClick={closeMobileMenu} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 focus-visible:outline-none">
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 px-3 py-2.5 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl border border-emerald-100/80 dark:border-emerald-500/20 shadow-sm relative z-10">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mb-0.5">Current Shop</p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{shopName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <NavList items={MAIN_NAV} pathname={pathname} onNavigate={closeMobileMenu} userPermissions={userPermissions} userRole={userRole} />

          <div className="mt-7 mb-2 px-3 flex items-center gap-3">
            <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Management</h3>
            <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
          </div>

          <NavList items={MANAGEMENT_NAV} pathname={pathname} onNavigate={closeMobileMenu} userPermissions={userPermissions} userRole={userRole} />
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-white/5 shrink-0 bg-white/50 dark:bg-[#141c19]/50 w-full min-w-[260px]">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-3.5 border border-emerald-100/70 dark:border-emerald-500/20 relative overflow-hidden shadow-sm mb-3">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-200/40 dark:bg-emerald-500/10 rounded-full blur-xl" />

            <div className="flex items-start gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1a2421] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                <Headphones size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-gray-800 dark:text-white">Need Help?</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">Contact support team if you need any assistance.</p>
              </div>
            </div>
            <button onClick={() => setIsSupportOpen(true)} className="mt-3 w-full py-2 bg-white dark:bg-[#1a2421] border border-emerald-200/80 dark:border-emerald-500/25 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all relative z-10 focus-visible:outline-none">
              Contact Support
            </button>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("access_token");
              signOut({callbackUrl: "http://localhost:3001/login"});
            }}
            className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:border-rose-200/80 dark:hover:border-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-[13px] font-bold shadow-sm focus-visible:outline-none"
          >
            <LogOut size={15} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      {/* ===================== MAIN ===================== */}
      <main className="flex-1 flex flex-col min-w-0 relative pb-16 md:pb-0">
        {shopStatus === "PAST_DUE" && (
          <div className="bg-rose-500 text-white px-4 py-2.5 text-center text-sm font-bold flex flex-col sm:flex-row justify-center items-center gap-2 z-50 relative shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে। সার্ভিস বন্ধ হওয়া এড়াতে অনুগ্রহ করে বিল পরিশোধ করুন।</span>
            </div>
            <Link href="/dashboard/subscription" className="bg-white text-rose-600 px-3 py-1 rounded-md text-xs hover:bg-rose-50 transition-colors ml-0 sm:ml-2">Pay Now</Link>
          </div>
        )}

       <header className="h-14 md:h-16 bg-white/70 dark:bg-[#141c19]/70 backdrop-blur-md border-b border-gray-200/70 dark:border-white/5 flex items-center justify-between px-4 md:px-6 z-20 flex-shrink-0 sticky top-0 transition-colors duration-300">
         <div className="flex items-center gap-1">
           <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none">
             <Menu size={20} />
           </button>
           <button onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)} className="hidden lg:flex p-2 -ml-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none">
             {isDesktopSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
           </button>
         </div>

         <div className="flex items-center gap-1.5 md:gap-2.5 relative">
           {mounted && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#1a2421]/80 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm transition-colors mr-1 md:mr-2">
               <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
               <span className="text-[11px] md:text-[12px] font-bold text-slate-700 dark:text-gray-200 tracking-wide">{currentDate}</span>
             </div>
           )}

           {mounted && (
             <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none">
               {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
             </button>
           )}

           <div className="relative">
             <button
               onClick={(e) => { e.stopPropagation(); setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
               className={`p-2 rounded-xl transition-colors relative focus-visible:outline-none ${isNotifOpen ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-white/10"}`}
             >
               <Bell size={18} />
               {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#141c19]" />}
             </button>
             <NotificationDropdown open={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} unreadCount={unreadCount} onMarkAsRead={handleMarkAsRead} />
           </div>

           <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

           <div className="relative">
             <button
               onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
               className={`flex items-center gap-2.5 cursor-pointer pl-1 group p-1.5 pr-2 rounded-xl transition-all focus-visible:outline-none ${isProfileOpen ? "bg-gray-100 dark:bg-white/10" : "hover:bg-gray-100 dark:hover:bg-white/5"}`}
             >
               <div className="text-right hidden sm:block transition-opacity">
                 <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-none truncate max-w-[120px]">{userName}</p>
                 <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate max-w-[120px] capitalize">{userRole}</p>
               </div>
               <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-emerald-500/25">{userInitial}</div>
               <ChevronDown size={14} className={`text-gray-400 transition-transform hidden sm:block ${isProfileOpen ? "rotate-180" : "group-hover:text-gray-600 dark:group-hover:text-white"}`} />
             </button>
             
             <ProfileDropdown 
               open={isProfileOpen} 
               onClose={() => setIsProfileOpen(false)} 
               userName={userName} 
               userEmail={userEmail} 
               userInitial={userInitial} 
               userRole={userRole} 
             />
           </div>
         </div>
       </header>

       <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar relative z-10">
         {shopStatus === "SUSPENDED" && pathname !== "/dashboard/subscription" ? (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-5 animate-in fade-in zoom-in duration-500">
             <div className="w-24 h-24 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Lock size={40} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Account Suspended</h2>
               <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                 আপনার সাবস্ক্রিপশনের বিল পরিশোধ না করায় একাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। সিস্টেমটি পুনরায় চালু করতে অনুগ্রহ করে আপনার বকেয়া বিল পরিশোধ করুন।
               </p>
             </div>
             <Link href="/dashboard/subscription" className="mt-4 px-8 py-3.5 bg-[#7A1B38] text-white rounded-xl font-bold shadow-md hover:bg-rose-900 transition-colors inline-flex items-center gap-2">
               <CreditCard size={18} /> Go to Billing & Pay
             </Link>
           </div>
         ) : (
           <MaintenanceBlocker>
             {children}
           </MaintenanceBlocker>
         )}
       </div>
      </main>

      {/* 🚀 মোবাইল স্ক্রিনের জন্য ফিক্সড বটম নেভবার */}
      <MobileBottomNav />

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #2a3a35; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}