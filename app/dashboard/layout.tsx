"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Undo2,
  Truck,
  Box,
  BarChart3,
  Briefcase,
  UserCog,
  History,
  Settings,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  CreditCard,
  LogOut,
  Headphones,
  ChevronLeft,
  ChevronDown,
  User,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  LucideIcon,
  HelpCircle,
  Megaphone,
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
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NotifType = "order" | "alert" | "success";

type NotificationItem = {
  id: number;
  type: NotifType;
  text: string;
  time: string;
  read: boolean;
};

/* ===================== STATIC DATA ===================== */

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/packing", label: "Packing", icon: Package },
  { href: "/dashboard/returns", label: "Returns", icon: Undo2 },
  { href: "/dashboard/courier", label: "Courier", icon: Truck },
  { href: "/dashboard/products", label: "Products", icon: Box },
  { href: "/dashboard/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
];

const MANAGEMENT_NAV: NavItem[] = [
  { href: "/dashboard/staff", label: "Staff and Payroll", icon: Briefcase },
  { href: "/dashboard/users", label: "Users", icon: UserCog },
  { href: "/dashboard/logs", label: "Activity Logs", icon: History },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/tickets", label: "Support Tickets", icon: HelpCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const mockNotifications: NotificationItem[] = [
  { id: 1, type: "order", text: "New order #885 received from Anika.", time: "5 mins ago", read: false },
  { id: 2, type: "alert", text: "Low stock warning: Premium Jamdani.", time: "1 hour ago", read: false },
  { id: 3, type: "success", text: "Order #882 successfully delivered.", time: "3 hours ago", read: true },
  { id: 4, type: "order", text: "New reseller order #R-102 placed.", time: "5 hours ago", read: true },
];

const NOTIF_STYLES: Record<NotifType, { icon: LucideIcon; iconClass: string; bg: string }> = {
  order: { icon: Package, iconClass: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  alert: { icon: AlertTriangle, iconClass: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  success: { icon: CheckCircle2, iconClass: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
};

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

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return ref;
}

/* ===================== SIDEBAR NAV LIST ===================== */

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
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

/* ===================== NOTIFICATION DROPDOWN ===================== */

function NotificationDropdown({
  open,
  onClose,
  unreadCount,
}: {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
}) {
  const ref = useDismissable(open, onClose);
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        role="menu"
        aria-label="Notifications"
        className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#141c19] border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-[#0c1210]">
          <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
          <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
            {unreadCount} New
          </span>
        </div>

        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
          {mockNotifications.map((notif) => {
            const style = NOTIF_STYLES[notif.type];
            const Icon = style.icon;
            return (
              <div
                key={notif.id}
                className={`p-4 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer flex gap-4 ${
                  !notif.read ? "bg-emerald-50/30 dark:bg-emerald-500/5" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}>
                  <Icon size={16} className={style.iconClass} />
                </div>
                <div>
                  <p
                    className={`text-sm ${
                      !notif.read ? "font-bold text-gray-800 dark:text-gray-100" : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {notif.text}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{notif.time}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-white/5 text-center bg-gray-50 dark:bg-[#0c1210]">
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
          >
            View All Notifications
          </Link>
        </div>
      </div>
    </>
  );
}

/* ===================== PROFILE DROPDOWN ===================== */

function ProfileDropdown({ 
  open, 
  onClose,
  userName,
  userEmail,
  userInitial
}: { 
  open: boolean; 
  onClose: () => void;
  userName: string;
  userEmail: string;
  userInitial: string;
}) {
  const ref = useDismissable(open, onClose);
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        role="menu"
        aria-label="Profile menu"
        className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#141c19] border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-gray-50 dark:bg-[#0c1210]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-gray-800 dark:text-white truncate">{userName}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{userEmail}</p>
          </div>
        </div>

        <div className="p-2">
          <Link
            href="/dashboard/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            <User size={16} /> My Profile
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            <Settings size={16} /> Settings
          </Link>
          <Link
            href="/dashboard/subscription"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            <CreditCard size={16} /> Billing & Plan
          </Link>
        </div>

        <div className="p-2 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("access_token");
              signOut({ callbackUrl: "/login" });
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </>
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

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMounted(true);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setShopName(parsedUser.shopName || "My Shop");
      setUserName(parsedUser.name || "User");
      setUserEmail(parsedUser.email || "");
      setUserInitial(parsedUser.name ? parsedUser.name.charAt(0).toUpperCase() : "U");
      
      if (parsedUser.role) {
        const formattedRole = parsedUser.role
          .replace('_', ' ')
          .toLowerCase()
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        setUserRole(formattedRole);
      }
    }
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-[#f4f7f6] dark:bg-[#0c1210] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
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

            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 px-3 py-2.5 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl border border-emerald-100/80 dark:border-emerald-500/20 shadow-sm relative z-10">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mb-0.5">
              Current Shop
            </p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{shopName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <NavList items={MAIN_NAV} pathname={pathname} onNavigate={closeMobileMenu} />

          <div className="mt-7 mb-2 px-3 flex items-center gap-3">
            <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Management
            </h3>
            <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
          </div>

          <NavList items={MANAGEMENT_NAV} pathname={pathname} onNavigate={closeMobileMenu} />
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
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                  Contact support team if you need any assistance.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsSupportOpen(true)}
              className="mt-3 w-full py-2 bg-white dark:bg-[#1a2421] border border-emerald-200/80 dark:border-emerald-500/25 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              Contact Support
            </button>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("access_token");
              signOut({ callbackUrl: "/login" });
            }}
            className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white dark:bg-[#1a2421] border border-gray-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:border-rose-200/80 dark:hover:border-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-[13px] font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
          >
            <LogOut size={15} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      {/* ===================== MAIN ===================== */}
      <main className="flex-1 flex flex-col min-w-0 relative">
       <header className="h-14 md:h-16 bg-white/70 dark:bg-[#141c19]/70 backdrop-blur-md border-b border-gray-200/70 dark:border-white/5 flex items-center justify-between px-4 md:px-6 z-20 flex-shrink-0 sticky top-0 transition-colors duration-300">
         
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              className="hidden lg:flex p-2 -ml-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label={isDesktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              title="Toggle Sidebar"
            >
              {isDesktopSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2.5 relative">
            {mounted && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#1a2421]/80 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm transition-colors mr-1 md:mr-2">
                <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] md:text-[12px] font-bold text-slate-700 dark:text-gray-200 tracking-wide">
                  {currentDate}
                </span>
              </div>
            )}

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className={`p-2 rounded-xl transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                  isNotifOpen
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                aria-expanded={isNotifOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#141c19]" />
                )}
              </button>

              <NotificationDropdown
                open={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                unreadCount={unreadCount}
              />
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className={`flex items-center gap-2.5 cursor-pointer pl-1 group p-1.5 pr-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                  isProfileOpen ? "bg-gray-100 dark:bg-white/10" : "hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
                aria-label="Open profile menu"
                aria-expanded={isProfileOpen}
              >
                <div className="text-right hidden sm:block transition-opacity">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-none truncate max-w-[120px]">{userName}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate max-w-[120px]">
                    {userRole}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-emerald-500/25">
                  {userInitial}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform hidden sm:block ${
                    isProfileOpen ? "rotate-180" : "group-hover:text-gray-600 dark:group-hover:text-white"
                  }`}
                />
              </button>

              <ProfileDropdown 
                open={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
                userName={userName}
                userEmail={userEmail}
                userInitial={userInitial}
              />
            </div>
          </div>
        </header>

        {/* Page Content with Maintenance Blocker Wrapper 🚀 */}
        <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar relative z-10">
          <MaintenanceBlocker>
            {children}
          </MaintenanceBlocker>
        </div>
      </main>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a3a35;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}