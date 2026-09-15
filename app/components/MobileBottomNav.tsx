"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Package, RotateCcw, Box, Home } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/dashboard/mobile", icon: <Home size={20} /> },
    { label: "Orders", href: "/dashboard/orders", icon: <ShoppingBag size={20} /> },
    { label: "Packing", href: "/dashboard/packing", icon: <Package size={20} /> },
    { label: "Returns", href: "/dashboard/returns", icon: <RotateCcw size={20} /> },
    { label: "Products", href: "/dashboard/products", icon: <Box size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2421] border-t border-gray-200 dark:border-white/10 px-4 py-2.5 flex justify-around items-center z-50 md:hidden shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
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
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}