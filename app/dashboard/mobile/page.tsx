"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, Package, RotateCcw, Box, DollarSign, 
  Truck, AlertTriangle, ArrowRight, Plus, CheckCircle2, XCircle, Clock, 
  BarChart3, Users, Settings as SettingsIcon, Flame, Zap
} from "lucide-react";
import Link from "next/link";

export default function TenantDashboardHome() {
  const [userName, setUserName] = useState("Saiful");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Today & Last 30 days stats
  const [stats, setStats] = useState({
    salesToday: 0,
    ordersToday: 0,
    total: 0,
    delivered: 0,
    deliveredAmount: 0,
    pending: 0,
    pendingAmount: 0,
    cancelled: 0,
    cancelledAmount: 0
  });

  // 🚀 Order Limit Logic (For Free Tier)
  const MAX_MONTHLY_ORDERS = 50; 
  const currentOrdersCount = orders.length;
  const remainingOrders = Math.max(0, MAX_MONTHLY_ORDERS - currentOrdersCount);
  const showUpgradeBanner = remainingOrders <= 10; // যখন ১০টি বা তার কম বাকি থাকবে তখন শো করবে

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.name) setUserName(parsed.name);
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { "Authorization": `Bearer ${token}` };

      const [prodRes, orderRes] = await Promise.all([
        fetch(`${apiUrl}/products`, { headers }),
        fetch(`${apiUrl}/orders`, { headers })
      ]);

      let allOrdersData: any[] = [];

      if (orderRes.ok) {
        allOrdersData = await orderRes.json();
        const activeOrders = allOrdersData.filter((o: any) => !o.isDeleted);
        setOrders(activeOrders);

        const todayString = new Date().toDateString();
        let salesToday = 0;
        let ordersToday = 0;

        let tot = 0, del = 0, delAmt = 0, pend = 0, pendAmt = 0, canc = 0, cancAmt = 0;

        activeOrders.forEach((o: any) => {
          tot++;
          const amount = Number(o.totalAmount) || 0;
          const status = o.status?.toUpperCase();

          if (o.createdAt && new Date(o.createdAt).toDateString() === todayString) {
            ordersToday++;
            salesToday += amount;
          }

          if (status === 'DELIVERED') {
            del++;
            delAmt += amount;
          } else if (status === 'CANCELLED' || status === 'RETURNED') {
            canc++;
            cancAmt += amount;
          } else {
            pend++;
            pendAmt += amount;
          }
        });

        setStats({
          salesToday,
          ordersToday,
          total: tot,
          delivered: del,
          deliveredAmount: delAmt,
          pending: pend,
          pendingAmount: pendAmt,
          cancelled: canc,
          cancelledAmount: cancAmt
        });
      }

      // Process Best Selling Products
      if (prodRes.ok) {
        const prods = await prodRes.json();
        
        const salesById: Record<string, number> = {};
        const salesByName: Record<string, number> = {};

        allOrdersData.forEach((order: any) => {
          if (!order.isDeleted && order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const qty = Number(item.quantity) || 1;
              const pId = item.productId || item.product?.id || item.id;
              if (pId) {
                salesById[String(pId)] = (salesById[String(pId)] || 0) + qty;
              }
              const pName = (item.product?.name || item.name || "").trim().toLowerCase();
              if (pName) {
                salesByName[pName] = (salesByName[pName] || 0) + qty;
              }
            });
          }
        });

        const sortedBestSellers = prods
          .filter((p: any) => !p.isDeleted)
          .map((p: any) => {
            const sold = salesById[String(p.id)] || salesByName[(p.name || "").trim().toLowerCase()] || p.soldCount || 0;
            return { ...p, soldCount: sold };
          })
          .sort((a: any, b: any) => b.soldCount - a.soldCount);

        setProducts(sortedBestSellers);
      }

    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1714] text-white pb-28 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 🟢 Top Header */}
      <div className="bg-[#132e25] pt-6 pb-10 px-5 rounded-b-[35px] shadow-lg relative border-b border-white/5 z-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-slate-900 font-extrabold rounded-full flex items-center justify-center shadow-md text-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-emerald-300 font-medium">Good morning</p>
              <h1 className="text-xl font-extrabold tracking-wide">{userName}</h1>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold tracking-wider uppercase">
            ACTIVE
          </span>
        </div>

        {/* 📊 Today's Summary Box */}
        <div className="bg-[#1a2421] border border-white/10 rounded-2xl p-4 shadow-md relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Today's Summary</h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#141d1a] p-3.5 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Sells Today</p>
              <h3 className="text-lg sm:text-xl font-black text-emerald-400">৳ {stats.salesToday.toLocaleString()}</h3>
            </div>
            <div className="bg-[#141d1a] p-3.5 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Orders Today</p>
              <h3 className="text-lg sm:text-xl font-black text-white">{stats.ordersToday}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-5 relative z-10">

        {/* 🛑 UPGRADE BANNER (Shows only when order limit is nearing end) */}
        {!loading && showUpgradeBanner && (
          <div className="bg-gradient-to-r from-orange-600 to-rose-600 rounded-2xl p-4 shadow-xl flex items-center justify-between border border-orange-500/30 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-[13px] font-extrabold text-white leading-tight">Order Limit Alert!</h3>
                <p className="text-[10px] text-orange-100 font-medium mt-0.5 leading-snug">
                  Only <strong>{remainingOrders} orders</strong> left. Upgrade now to avoid interruption.
                </p>
              </div>
            </div>
            <Link 
              href="/dashboard/settings/billing" 
              className="bg-white hover:bg-orange-50 text-orange-600 px-3.5 py-2 rounded-xl text-[11px] font-bold shadow-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <Zap size={14} className="fill-orange-600"/> Upgrade
            </Link>
          </div>
        )}
        
        {/* ⚡ Quick Actions (8 Grid Icons) */}
        <div className="bg-[#1a2421] rounded-2xl p-4 shadow-md border border-white/10">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3.5">Quick Actions</h3>
          
          <div className="grid grid-cols-4 gap-3 text-center">
            
            <Link href="/dashboard/orders/create" className="flex flex-col items-center gap-1.5 p-2.5 bg-[#141d1a] hover:bg-emerald-500/10 border border-white/5 rounded-xl text-emerald-400 transition-colors">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Plus size={20} />
              </div>
              <span className="text-[10px] font-bold text-gray-200">New Order</span>
            </Link>

            <Link href="/dashboard/orders" className="flex flex-col items-center gap-1.5 p-2.5 bg-[#141d1a] hover:bg-white/5 border border-white/5 rounded-xl text-gray-300 transition-colors">
              <div className="w-10 h-10 bg-[#1a2421] border border-white/10 rounded-xl flex items-center justify-center shadow-sm text-blue-400">
                <ShoppingBag size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-200">Orders</span>
            </Link>

            <Link href="/dashboard/packing" className="flex flex-col items-center gap-1.5 p-2.5 bg-[#141d1a] hover:bg-white/5 border border-white/5 rounded-xl text-gray-300 transition-colors">
              <div className="w-10 h-10 bg-[#1a2421] border border-white/10 rounded-xl flex items-center justify-center shadow-sm text-purple-400">
                <Package size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-200">Packing</span>
            </Link>

            <Link href="/dashboard/products" className="flex flex-col items-center gap-1.5 p-2.5 bg-[#141d1a] hover:bg-white/5 border border-white/5 rounded-xl text-gray-300 transition-colors">
              <div className="w-10 h-10 bg-[#1a2421] border border-white/10 rounded-xl flex items-center justify-center shadow-sm text-amber-400">
                <Box size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-200">Products</span>
            </Link>

            <Link href="/dashboard/courier" className="flex flex-col items-center gap-1.5 p-2.5 bg-[#141d1a] hover:bg-white/5 border border-white/5 rounded-xl text-gray-300 transition-colors">
              <div className="w-10 h-10 bg-[#1a2421] border border-white/10 rounded-xl flex items-center justify-center shadow-sm text-emerald-400">
                <Truck size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-200">Courier</span>
            </Link>

            <Link href="/dashboard/reports" className="flex flex-col items-center gap-1.5 p-2.5 bg-[#141d1a] hover:bg-white/5 border border-white/5 rounded-xl text-gray-300 transition-colors">
              <div className="w-10 h-10 bg-[#1a2421] border border-white/10 rounded-xl flex items-center justify-center shadow-sm text-indigo-400">
                <BarChart3 size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-200">Reports</span>
            </Link>

            <Link href="/dashboard/customers" className="flex flex-col items-center gap-1.5 p-2.5 bg-[#141d1a] hover:bg-white/5 border border-white/5 rounded-xl text-gray-300 transition-colors">
              <div className="w-10 h-10 bg-[#1a2421] border border-white/10 rounded-xl flex items-center justify-center shadow-sm text-rose-400">
                <Users size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-200">Customers</span>
            </Link>

            <Link href="/dashboard/settings" className="flex flex-col items-center gap-1.5 p-2.5 bg-[#141d1a] hover:bg-white/5 border border-white/5 rounded-xl text-gray-300 transition-colors">
              <div className="w-10 h-10 bg-[#1a2421] border border-white/10 rounded-xl flex items-center justify-center shadow-sm text-gray-300">
                <SettingsIcon size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-200">Settings</span>
            </Link>

          </div>
        </div>

        {/* 📊 Last 30 Days Stats (2x2 Box Grid) */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last 30 Days</h3>
            <span className="text-xs text-emerald-400 font-bold">At a glance</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            
            {/* Total */}
            <div className="bg-[#1a2421] p-4 rounded-2xl border border-white/10 shadow-md space-y-2">
              <div className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                <Box size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL</p>
                <h3 className="text-xl font-black text-white mt-0.5">{stats.total}</h3>
                <p className="text-[11px] text-gray-400 mt-1">Last 30 days</p>
              </div>
            </div>

            {/* Delivered */}
            <div className="bg-[#1a2421] p-4 rounded-2xl border border-white/10 shadow-md space-y-2">
              <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DELIVERED</p>
                <h3 className="text-xl font-black text-white mt-0.5">{stats.delivered}</h3>
                <p className="text-[11px] font-bold text-emerald-400 mt-1">৳ {stats.deliveredAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-[#1a2421] p-4 rounded-2xl border border-white/10 shadow-md space-y-2">
              <div className="w-8 h-8 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PENDING</p>
                <h3 className="text-xl font-black text-white mt-0.5">{stats.pending}</h3>
                <p className="text-[11px] font-bold text-amber-400 mt-1">৳ {stats.pendingAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Cancelled */}
            <div className="bg-[#1a2421] p-4 rounded-2xl border border-white/10 shadow-md space-y-2">
              <div className="w-8 h-8 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center">
                <XCircle size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CANCELLED</p>
                <h3 className="text-xl font-black text-white mt-0.5">{stats.cancelled}</h3>
                <p className="text-[11px] font-bold text-rose-400 mt-1">৳ {stats.cancelledAmount.toLocaleString()}</p>
              </div>
            </div>

          </div>
        </div>

        {/* 🌟 Top 5 Best Selling Products (Horizontal Slider) */}
        <div className="space-y-2.5 pt-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Best Selling Products
            </h3>
            <Link href="/dashboard/products/best-selling" className="text-xs text-emerald-400 font-bold hover:underline">
              View All &gt;
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
            {products && products.length > 0 ? (
              products.slice(0, 5).map((item, index) => {
                const soldCount = item.soldCount || 0;
                const totalRev = (item.soldCount || 0) * (Number(item.price) || 0);

                return (
                  <div 
                    key={item.id || index}
                    className="min-w-[150px] sm:min-w-[170px] bg-[#1a2421] rounded-2xl border border-white/10 p-3 shadow-md shrink-0 snap-start flex flex-col justify-between relative group"
                  >
                    <span className="absolute top-2 left-2 z-10 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow">
                      #{index + 1}
                    </span>

                    <div>
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl.startsWith('http') ? item.imageUrl : `${apiUrl}${item.imageUrl}`} 
                          alt={item.name} 
                          className="w-full h-28 object-cover rounded-xl mb-2.5 border border-white/5" 
                        />
                      ) : (
                        <div className="w-full h-28 bg-[#141d1a] rounded-xl mb-2.5 flex items-center justify-center text-gray-500 text-xs">
                          No Image
                        </div>
                      )}

                      <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{item.name}</h4>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px]">
                      <div className="flex justify-between text-gray-400">
                        <span>Sold:</span>
                        <span className="font-bold text-emerald-400">{soldCount} pcs</span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-400">
                        <span>Total:</span>
                        <span>৳ {totalRev.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center py-6 bg-[#1a2421] rounded-2xl border border-white/10 text-gray-400 text-xs">
                No best selling products found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}