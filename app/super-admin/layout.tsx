"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Store, CreditCard, Activity, Settings, 
  Menu, X, Sun, Moon, Bell, ChevronDown, ShieldCheck, Server, LogOut,
  HelpCircle, Megaphone
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  const NAV_ITEMS = [
    { href: "/super-admin", label: "Overview", icon: LayoutDashboard },
    { href: "/super-admin/shops", label: "All Shops", icon: Store },
    { href: "/super-admin/billing", label: "Billing & Revenue", icon: CreditCard },
    { href: "/super-admin/tickets", label: "Support Tickets", icon: HelpCircle },
    { href: "/super-admin/broadcast", label: "Announcements", icon: Megaphone },
    { href: "/super-admin/system-health", label: "System Health", icon: Server },
    { href: "/super-admin/global-logs", label: "Global Logs", icon: Activity },
    { href: "/super-admin/settings", label: "Platform Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-white/5 flex flex-col w-[260px] transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* 🚀 Upgraded Logo Section */}
        <div className="px-6 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1">
                Fcom <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded">Admin</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Super Control</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 mb-2 text-center">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Access Level</p>
            <p className="text-sm font-black text-slate-800 dark:text-white">Platform Owner</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/super-admin" 
              ? pathname === "/super-admin" 
              : pathname === item.href || pathname.startsWith(item.href + "/");

            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 font-medium'}`}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-white/5">
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-sm transition-colors">
            <LogOut size={16} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 lg:px-8 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-300">
            <Menu size={20} />
          </button>

          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5">
            <span>Platform Status:</span>
            <span className="text-emerald-500 flex items-center gap-1">● All Systems Normal</span>
          </div>

          <div className="flex items-center gap-3">
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <button className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5 relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-[#111827]"></span>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">U</div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}