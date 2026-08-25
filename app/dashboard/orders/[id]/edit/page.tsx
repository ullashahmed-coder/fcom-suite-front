"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Trash2, ShoppingBag, User, MapPin, Phone, 
  Loader2, Package, ArrowLeft, Receipt, Truck, Zap, Tag, CheckCircle2, AlertCircle, Save, 
  Edit3
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState({ insideDhaka: 60, outsideDhaka: 120, tangail: 80 });
  const [cart, setCart] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [customDeliveryCharge, setCustomDeliveryCharge] = useState<number | string>("");
  const [discount, setDiscount] = useState<number | string>("");
  const [steadfastNote, setSteadfastNote] = useState("");
  const [isResellerOrder, setIsResellerOrder] = useState(false);
  const [orderNo, setOrderNo] = useState("");

  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    district: "",
    address: "",
    note: "",
    advance: 0,
    isFullPaid: false,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchSettings();
    fetchProducts();
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.insideDhaka) {
          setSettings({
            insideDhaka: Number(data.insideDhaka),
            outsideDhaka: Number(data.outsideDhaka),
            tangail: data.tangail ? Number(data.tangail) : 80
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/products`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const activeProducts = data.filter((product: any) => !product.isDeleted);
        setAvailableProducts(activeProducts);
      }
    } catch (err) {
      console.error("Error fetching products", err);
    }
  };

  const fetchOrderDetails = async (id: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/orders/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const orderData = await res.json();
        setOrderNo(orderData.orderNo);
        
        const savedDistrict = orderData.customer?.district || "";
        const displayDistrict = savedDistrict === "Custom Area" ? "Custom" : savedDistrict;
        
        setCustomer({
          phone: orderData.customer?.phone || "",
          name: orderData.customer?.name || "",
          district: displayDistrict,
          address: orderData.customer?.address || "",
          note: orderData.note || "",
          advance: orderData.advance || 0,
          isFullPaid: orderData.advance >= orderData.totalAmount,
        });

        setIsResellerOrder(orderData.customer?.isReseller || false);
        setDiscount(orderData.discount || "");
        setSteadfastNote(orderData.courierNote || "");
        
        if (displayDistrict === "Custom") {
          setCustomDeliveryCharge(orderData.deliveryCharge);
        }

        if (orderData.items && orderData.items.length > 0) {
          const mappedCart = orderData.items.map((item: any) => ({
            id: item.productId,
            name: item.product?.name || "Unknown Product",
            price: item.price,
            qty: item.quantity,
            imageUrl: item.product?.imageUrl || null,
            stock: item.product?.stock || 0
          }));
          setCart(mappedCart);
        }
      }
    } catch (err) {
      console.error("Failed to fetch order", err);
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (item: any) => {
    if (item.imageUrl) return item.imageUrl.startsWith('http') ? item.imageUrl : `${apiUrl}${item.imageUrl}`;
    return null;
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    const currentQtyInCart = existing ? existing.qty : 0;

    if (product.stock - currentQtyInCart <= 0) {
      alert("দুঃখিত, এই শাড়ির আর কোনো স্টক এভেইলেবল নেই!");
      return;
    }

    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    const product = availableProducts.find(p => p.id === id) || cart.find(c => c.id === id); 
    
    if (product && newQty > (product.stock + (cart.find(c => c.id === id)?.qty || 0))) {
       alert(`দুঃখিত, স্টকে পর্যাপ্ত পরিমাণ নেই।`);
       return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    input = input.replace(/[০-৯]/g, (match) => banglaDigits.indexOf(match).toString());
    input = input.replace(/[^0-9+]/g, '');

    if (input.startsWith('+88')) input = input.substring(3);
    else if (input.startsWith('88')) input = input.substring(2);

    input = input.replace(/[^0-9]/g, '');
    if (input.length > 11) input = input.substring(0, 11);

    setCustomer({ ...customer, phone: input });
  };

  const isPhoneValid = customer.phone.length === 11 && customer.phone.startsWith("01");

  let deliveryCharge = 0;
  if (customer.district === "Inside Dhaka") deliveryCharge = settings.insideDhaka;
  else if (customer.district === "Outside Dhaka") deliveryCharge = settings.outsideDhaka;
  else if (customer.district === "Tangail City") deliveryCharge = settings.tangail;
  else if (customer.district === "Custom") deliveryCharge = Number(customDeliveryCharge) || 0;
  
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
  const discountAmount = Number(discount) || 0;
  const totalAmount = (subtotal + deliveryCharge) - discountAmount;
  const advanceAmount = Math.min(Number(customer.advance) || 0, totalAmount);
  const dueAmount = totalAmount - advanceAmount;

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) return; // 🚀 ডাবল ক্লিক প্রিভেন্ট করার জন্য

    if (!isPhoneValid) { alert("দয়া করে ১১ ডিজিটের সঠিক মোবাইল নম্বর দিন।"); return; }
    if (!customer.name || !customer.district) { alert("দয়া করে কাস্টমারের নাম এবং জেলা সিলেক্ট করুন।"); return; }
    if (customer.district === "Custom" && customDeliveryCharge === "") { alert("দয়া করে কাস্টম ডেলিভারি চার্জটি লিখুন।"); return; }
    if (cart.length === 0) { alert("অর্ডার আপডেট করার জন্য অন্তত একটি শাড়ি কার্টে রাখুন।"); return; }

    setIsSaving(true);

    const updatePayload = {
      customerName: customer.name,
      customerPhone: customer.phone,
      district: customer.district === "Custom" ? "Custom Area" : customer.district,
      address: customer.address,
      note: customer.note,
      courierNote: steadfastNote,
      advancePayment: advanceAmount,
      deliveryCharge: deliveryCharge,
      discount: discountAmount,
      isResellerOrder: isResellerOrder,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.qty,
        price: Number(item.price)
      }))
    };

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        alert("✅ অর্ডারটি সফলভাবে আপডেট হয়েছে।");
        router.push("/dashboard/orders");
      } else {
        const errData = await response.json();
        alert(`❌ অর্ডার আপডেট হয়নি! ${errData.message || ''}`);
      }
    } catch (error) {
      console.error(error);
      alert("সার্ভার এরর।");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = availableProducts.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(searchLower)) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] dark:bg-[#0f1714]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto transition-colors">

      {/* ================= Page Header ================= */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-white dark:bg-[#1a2421] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
          <Edit3 size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">Edit Order {orderNo}</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">Update customer details or order items</p>
        </div>
      </div>

      <form onSubmit={handleUpdateOrder} className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ================= LEFT COLUMN ================= */}
        <div className="xl:col-span-8 space-y-6">

          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">Select Products to Add/Edit</h2>

            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-slate-400 dark:text-gray-500" /></div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#141d1a] border border-slate-200 dark:border-white/5 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                placeholder="Search by product name, SKU..."
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 gap-3 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl">
                <Package size={48} className="text-slate-300 dark:text-gray-600" />
                <p className="text-sm font-medium">কোনো শাড়ি পাওয়া যায়নি!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 h-[300px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                {filteredProducts.map((product) => {
                  const qtyInCart = cart.find(c => c.id === product.id)?.qty || 0;
                  const availableNow = product.stock - qtyInCart; 

                  return (
                    <div key={product.id} className="border border-slate-100 dark:border-white/5 rounded-xl p-2 sm:p-3 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all group bg-slate-50 dark:bg-[#141d1a] flex flex-col">
                      <div className="w-full h-28 sm:h-36 bg-[#F1F5F9] dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center mb-2 sm:mb-3">
                        {getProductImage(product) ? (
                          <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <Package className="text-slate-300 dark:text-gray-600" size={32} />
                        )}
                      </div>

                      <div className="space-y-1 mb-2">
                        <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-500 font-medium uppercase">SKU: {product.sku || 'N/A'}</p>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-gray-100 line-clamp-2">{product.name}</h3>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-white/5">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-gray-100">৳ {product.price}</span>
                        
                        {/* 🚀 স্টক কাউন্ট দেখানোর কোড */}
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className={`text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded ${availableNow > 0 ? 'text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-500/10' : 'text-red-600 dark:text-rose-400 bg-red-50 dark:bg-rose-500/10'}`}>
                            {availableNow > 0 ? `${availableNow} In Stock` : 'Out'}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center transition-colors shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus size={14} className="sm:w-[16px] sm:h-[16px]" />
                          </button>
                        </div>

                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-blue-600 dark:text-blue-400" /> Order Items ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-gray-500 text-sm border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl">কার্টে কোনো আইটেম নেই</div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 border border-slate-100 dark:border-white/5 rounded-lg bg-slate-50 dark:bg-[#141d1a] gap-4 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-white dark:bg-[#1a2421] rounded border border-slate-200 dark:border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                        {getProductImage(item) ? (
                          <img src={getProductImage(item)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="text-slate-300 dark:text-gray-600" size={20} />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate w-40 md:w-full">{item.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-gray-400">৳ {item.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6 shrink-0">
                      <div className="flex items-center border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1a2421] rounded-lg overflow-hidden">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateCartQty(item.id, Number(e.target.value))}
                          className="w-14 text-center py-1 text-sm outline-none font-bold text-slate-800 dark:text-white bg-transparent"
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 w-16 text-right">৳ {Number(item.price) * item.qty}</span>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1.5 bg-white dark:bg-white/5 rounded border border-slate-200 dark:border-transparent transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="xl:col-span-4 space-y-6">

          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <User size={18} className="text-blue-600 dark:text-blue-400" /> Customer Details
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Phone Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={14} className="text-slate-400 dark:text-gray-500" /></div>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={handlePhoneChange}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none transition-colors bg-white dark:bg-[#141d1a] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 ${customer.phone.length > 0 && !isPhoneValid
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-rose-700'
                      : 'border-slate-200 dark:border-white/5 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                      }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Customer Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={14} className="text-slate-400 dark:text-gray-500" /></div>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141d1a] text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-white/5 rounded-lg text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">District *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin size={14} className="text-slate-400 dark:text-gray-500" /></div>
                  <select
                    required
                    value={customer.district}
                    onChange={(e) => setCustomer({ ...customer, district: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141d1a] text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 rounded-lg text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none appearance-none"
                  >
                    <option value="">Select Delivery Area</option>
                    <option value="Inside Dhaka">Inside Dhaka (৳ {settings.insideDhaka})</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳ {settings.outsideDhaka})</option>
                    <option value="Tangail City">Tangail City (৳ {settings.tangail})</option>
                    <option value="Custom">Custom Charge</option>
                  </select>
                </div>
              </div>

              {customer.district === "Custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400">Custom Delivery Charge *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-bold">৳</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={customDeliveryCharge}
                      onChange={(e) => setCustomDeliveryCharge(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-slate-800 dark:text-white border border-rose-200 dark:border-rose-500/30 rounded-lg text-sm focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-[#141d1a] text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 rounded-lg text-sm focus:border-blue-600 outline-none resize-none"
                ></textarea>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
                <label className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  <Tag size={14} /> Extra Discount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-blue-600 dark:text-blue-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-blue-50/50 dark:bg-blue-500/10 text-slate-800 dark:text-white border border-blue-200 dark:border-blue-500/30 rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Advance Payment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-emerald-600 dark:text-emerald-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={customer.advance || ""}
                      onChange={(e) => setCustomer({ ...customer, advance: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-800 dark:text-white border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-6 sticky top-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Receipt size={18} className="text-blue-600 dark:text-blue-400" /> Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>Subtotal ({cart.length} Items)</span>
                <span className="font-bold text-slate-800 dark:text-white">৳ {subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-gray-400 items-center">
                <span>Delivery Charge</span>
                <span className="font-bold text-slate-800 dark:text-white">+ ৳ {deliveryCharge}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400 items-center">
                  <span>Discount</span>
                  <span className="font-bold">- ৳ {discountAmount}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between text-slate-600 dark:text-gray-400">
                <span>Advance Payment</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">- ৳ {advanceAmount}</span>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/30">
                <span className="text-sm font-bold text-blue-900 dark:text-blue-400">Due Amount (COD)</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">৳ {dueAmount > 0 ? dueAmount : 0}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={cart.length === 0 || isSaving || !isPhoneValid}
              className={`w-full mt-6 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${cart.length > 0 && !isSaving && isPhoneValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 dark:shadow-none'
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                }`}
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18}/> Update Order</>}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}