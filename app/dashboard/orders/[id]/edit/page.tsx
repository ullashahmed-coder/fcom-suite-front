"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Minus, Trash2, ShoppingBag, User, MapPin, Phone, 
  Loader2, Package, ArrowLeft, Receipt, Truck, Zap, Tag, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight, Save, Edit3, ClipboardEdit
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customDeliveryCharge, setCustomDeliveryCharge] = useState<number | string>("");
  const [discount, setDiscount] = useState<number | string>("");
  const [orderNo, setOrderNo] = useState("");

  const [orderStatus, setOrderStatus] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [showSteadfastWarning, setShowSteadfastWarning] = useState(false);

  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    district: "",
    address: "",
    note: "",
    advance: 0,
    isFullPaid: false,
  });

  const [shippingRates, setShippingRates] = useState({
    inside: 60,
    outside: 120,
    sub: 80,
    subName: "Tangail City"
  });

  const [steadfastNote, setSteadfastNote] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${apiUrl}/settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setShippingRates({
            inside: data.insideDhakaCharge || 60,
            outside: data.outsideDhakaCharge || 120,
            sub: data.subCityCharge || 80,
            subName: data.subCityName || "Tangail City"
          });
        }
      } catch (error) {
        console.error("Settings fetch error:", error);
      }
    };
    
    fetchSettings();
    fetchProducts();
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

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
      console.error("সার্ভারের সাথে কানেক্ট করা যাচ্ছে না।", err);
    } finally {
      setLoadingProducts(false);
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
        
        // 🚀 ফিক্সড: নোট চেক করে ইউরজেন্ট স্ট্যাটাস রিকভার করা হচ্ছে
        const hasUrgentNote = orderData.courierNote?.includes("[URGENT]") || false;

        setCustomer({
          phone: orderData.customer?.phone || "",
          name: orderData.customer?.name || "",
          district: displayDistrict,
          address: orderData.customer?.address || "",
          note: orderData.note || "",
          advance: orderData.advance || 0,
          isFullPaid: hasUrgentNote,
        });

        setDiscount(orderData.discount || "");
        setSteadfastNote(orderData.courierNote || "");
        setOrderStatus(orderData.status || "");
        setTrackingCode(orderData.trackingCode || "");
        
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
    if (product && newQty > product.stock) {
       alert(`দুঃখিত, স্টকে সর্বোচ্চ ${product.stock} টি শাড়ি আছে।`);
       return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    input = input.replace(/[০-৯]/g, (match) => banglaDigits.indexOf(match).toString());
    input = input.replace(/[^0-9+]/g, '');

    if (input.startsWith('+88')) {
      input = input.substring(3);
    } else if (input.startsWith('88')) {
      input = input.substring(2);
    }

    input = input.replace(/[^0-9]/g, '');
    if (input.length > 11) {
      input = input.substring(0, 11);
    }

    setCustomer({ ...customer, phone: input });
  };

  const isPhoneValid = customer.phone.length === 11 && customer.phone.startsWith("01");

  let deliveryCharge = 0;
  if (customer.district === "Inside Dhaka") {
    deliveryCharge = shippingRates.inside;
  } else if (customer.district === "Outside Dhaka") {
    deliveryCharge = shippingRates.outside;
  } else if (customer.district === shippingRates.subName) {
    deliveryCharge = shippingRates.sub;
  } else if (customer.district === "Custom") {
    deliveryCharge = Number(customDeliveryCharge) || 0;
  }
  
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
  const discountAmount = Number(discount) || 0;
  
  const totalAmount = (subtotal + deliveryCharge) - discountAmount;
  const advanceAmount = Math.min(Number(customer.advance) || 0, totalAmount);
  const dueAmount = totalAmount - advanceAmount;

  // 🚀 ইউরজেন্ট নোট হ্যান্ডলিং
  useEffect(() => {
    let charge = deliveryCharge > 0 ? deliveryCharge : 100;
    let noteText = steadfastNote.replace(" [URGENT]", "");

    if (customer.isFullPaid) {
      if (!noteText.includes("[URGENT]")) {
        noteText += " [URGENT]";
      }
    }

    setSteadfastNote(noteText);
  }, [customer.isFullPaid]);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!isPhoneValid) { 
      alert("দয়া করে ১১ ডিজিটের সঠিক মোবাইল নম্বর (যেমন: 01XXXXXXXXX) দিন।"); 
      return; 
    }
    if (!customer.name || !customer.district) { 
      alert("দয়া করে কাস্টমারের নাম এবং জেলা সিলেক্ট করুন।"); 
      return; 
    }
    if (customer.district === "Custom" && customDeliveryCharge === "") { 
      alert("দয়া করে কাস্টম ডেলিভারি চার্জটি লিখুন।"); 
      return; 
    }
    if (cart.length === 0) { 
      alert("অর্ডার আপডেট করার জন্য অন্তত একটি শাড়ি কার্টে রাখুন।"); 
      return; 
    }
    if (discountAmount > (subtotal + deliveryCharge)) {
      alert("ডিসকাউন্ট অ্যামাউন্ট মোট বিলের চেয়ে বেশি হতে পারবে না!");
      return;
    }

    setIsLoading(true);

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
        if (orderStatus === 'IN_REVIEW' || trackingCode) {
          setShowSteadfastWarning(true);
        } else {
          alert("✅ অর্ডারটি সফলভাবে আপডেট হয়েছে।");
          router.push("/dashboard/orders");
        }
      } else {
        const errData = await response.json();
        alert(`❌ অর্ডার আপডেট হয়নি! ${errData.message || ''}`);
      }
    } catch (error) {
      console.error(error);
      alert("সার্ভার এরর।");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(searchLower)) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-4 pb-28 xl:pb-10 max-w-[1400px] mx-auto transition-colors relative">

      {/* ================= Page Header ================= */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
        <Link
          href="/dashboard/orders"
          className="p-2.5 bg-white dark:bg-[#1a2421] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-[#7A1B38] dark:hover:text-[#7A1B38] rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
          <Edit3 size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">Edit Order {orderNo}</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">Update customer details or order items</p>
        </div>
      </div>

      <form onSubmit={handleUpdateOrder} className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ================= LEFT COLUMN: PRODUCTS ================= */}
        <div className="xl:col-span-8 order-1 space-y-4">
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-4 md:p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">Select Products to Add/Edit</h2>

            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-slate-400 dark:text-gray-500" /></div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#202b27] border border-slate-300 dark:border-white/10 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] transition-colors"
                placeholder="Search by product name, SKU..."
              />
            </div>

            {loadingProducts ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 gap-3">
                <Loader2 className="animate-spin text-[#7A1B38]" size={32} />
                <p className="text-sm font-medium">লোড হচ্ছে...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 gap-3 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                <Package size={48} className="text-slate-300 dark:text-gray-600" />
                <p className="text-sm font-medium">কোনো শাড়ি পাওয়া যায়নি!</p>
              </div>
            ) : (
              <div className="max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-start">
                  {filteredProducts.map((product) => {
                    const qtyInCart = cart.find(c => c.id === product.id)?.qty || 0;
                    const availableNow = product.stock - qtyInCart;

                    return (
                      <div key={product.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-2.5 hover:border-[#7A1B38]/50 hover:shadow-sm transition-all group bg-slate-50 dark:bg-[#202b27] flex flex-col">
                        
                        <div className="w-full h-38 bg-white dark:bg-[#1a2421] rounded-lg overflow-hidden flex items-center justify-center mb-2.5 relative shrink-0">
                          {getProductImage(product) ? (
                            <img 
                              src={getProductImage(product)} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                          ) : (
                            <Package className="text-slate-300 dark:text-gray-600" size={28} />
                          )}
                          <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm ${availableNow > 0 ? 'text-green-700 bg-green-100/90' : 'text-red-700 bg-red-100/90'}`}>
                            {availableNow > 0 ? `${availableNow} In` : 'Out'}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium uppercase leading-none mb-1.5">SKU: {product.sku || 'N/A'}</p>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-gray-100 line-clamp-2 leading-tight mb-2">{product.name}</h3>
                          
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-white/5">
                            <span className="text-sm font-extrabold text-[#7A1B38] dark:text-rose-400">৳{product.price}</span>
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              disabled={availableNow <= 0}
                              className={`w-7 h-7 rounded flex items-center justify-center transition-colors shrink-0 ${availableNow > 0 ? 'bg-[#7A1B38] hover:bg-rose-900 text-white shadow-sm' : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed'}`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Cart Section with +/- Buttons */}
          {cart.length > 0 && (
            <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-4 md:p-6 transition-colors">
              <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#7A1B38]" /> Selected Products ({cart.length})
              </h2>

              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#202b27] gap-3 transition-colors">
                    
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-white dark:bg-[#1a2421] rounded flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-white/5">
                        {getProductImage(item) ? (
                          <img src={getProductImage(item)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="text-slate-300 dark:text-gray-600" size={20} />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.name}</h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-0.5">৳{item.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-200 dark:border-transparent sm:border-t-0">
                      <div className="flex items-center gap-1 bg-white dark:bg-[#141d1a] border border-slate-300 dark:border-white/10 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-slate-800 dark:text-white">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, item.qty + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#7A1B38] dark:text-rose-400 w-16 text-right">৳{Number(item.price) * item.qty}</span>
                        <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1.5 bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: CUSTOMER DETAILS ================= */}
        <div className="xl:col-span-4 order-2 space-y-4">
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-4 md:p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-[#7A1B38]" /> Customer Details
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
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm outline-none transition-colors dark:bg-[#202b27] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 ${customer.phone.length > 0 && !isPhoneValid
                      ? 'border-rose-400 bg-rose-50 dark:bg-rose-500/10 focus:border-rose-500 focus:ring-1 text-rose-700 dark:text-rose-400'
                      : 'border-slate-300 dark:border-white/10 focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] bg-slate-50'
                      }`}
                    placeholder="e.g., 01XXXXXXXXX"
                  />
                </div>
                {customer.phone.length > 0 && !isPhoneValid && (
                  <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle size={10} /> ফোন নম্বর ১১ ডিজিটের এবং 01 দিয়ে শুরু হতে হবে।
                  </p>
                )}
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#202b27] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] outline-none transition-colors"
                    placeholder="e.g., Farida Akter"
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#202b27] text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] outline-none appearance-none transition-colors"
                  >
                    <option value="">Select Delivery Area</option>
                    <option value="Inside Dhaka">Inside Dhaka (৳ {shippingRates.inside})</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳ {shippingRates.outside})</option>
                    <option value={shippingRates.subName}>{shippingRates.subName} (৳ {shippingRates.sub})</option>
                    <option value="Custom">Custom Charge</option>
                  </select>
                </div>
              </div>

              {customer.district === "Custom" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400">Custom Delivery Charge *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 dark:text-gray-400 font-bold">৳</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={customDeliveryCharge}
                      onChange={(e) => setCustomDeliveryCharge(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-rose-200 dark:border-rose-500/30 rounded-lg text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors"
                      placeholder="e.g. 150"
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
                  className="w-full p-3 bg-slate-50 dark:bg-[#202b27] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] outline-none resize-none transition-colors"
                  placeholder="Full address for delivery..."
                ></textarea>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-white/5 transition-colors">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Tag size={14} className="fill-blue-100 dark:fill-blue-900" /> Extra Discount
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-blue-600 dark:text-blue-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-blue-50/50 dark:bg-blue-500/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-blue-200 dark:border-blue-500/30 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-white/5 transition-colors">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Advance Payment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-emerald-600 dark:text-emerald-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={customer.advance || ""}
                      onChange={(e) => setCustomer({ ...customer, advance: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2.5 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-sm focus:border-emerald-500 outline-none transition-colors"
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center pt-5">
                  <label className="flex items-center justify-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer p-2.5 border border-rose-100 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={customer.isFullPaid}
                      onChange={(e) => setCustomer({ ...customer, isFullPaid: e.target.checked })}
                      className="accent-rose-600 dark:accent-rose-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <Zap size={14} className="fill-rose-600 dark:fill-rose-500" /> Urgent
                    </div>
                  </label>
                </div>
              </div>

              {/* NOTES SECTION */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-white/5 transition-colors">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300 flex items-center gap-1">
                    <ClipboardEdit size={14} className="text-amber-600 dark:text-amber-500" />
                    Special Note (Packing Team)
                  </label>
                  <button type="button" onClick={() => setCustomer({ ...customer, note: "" })} className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300">Clear</button>
                </div>
                <textarea
                  rows={2}
                  value={customer.note}
                  onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 dark:bg-amber-500/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-amber-200 dark:border-amber-500/30 rounded-lg text-sm focus:border-amber-500 outline-none resize-none transition-colors"
                  placeholder="e.g. গিফট নোট যাবে..."
                ></textarea>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-white/5 transition-colors">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    <Truck size={14} />
                    Steadfast Courier Note
                  </label>
                  <button type="button" onClick={() => setSteadfastNote("")} className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300">Clear</button>
                </div>
                <textarea
                  rows={3}
                  value={steadfastNote}
                  onChange={(e) => setSteadfastNote(e.target.value)}
                  className="w-full p-3 bg-indigo-50/50 dark:bg-indigo-500/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-sm focus:border-indigo-500 outline-none leading-relaxed resize-none transition-colors"
                  placeholder="কুরিয়ারের জন্য স্পেশাল ইনস্ট্রাকশন..."
                ></textarea>
              </div>

            </div>
          </div>

          {/* ================= Order Summary ================= */}
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-4 md:p-6 transition-colors xl:sticky xl:top-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Receipt size={18} className="text-[#7A1B38]" /> Order Summary
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

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between text-slate-600 dark:text-gray-400 transition-colors">
                <span>Advance Payment</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">- ৳ {advanceAmount}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-100 dark:border-rose-500/30 transition-colors">
                <span className="text-sm font-bold text-rose-900 dark:text-rose-400">Due (COD)</span>
                <span className="text-xl font-black text-[#7A1B38] dark:text-rose-400">৳ {dueAmount > 0 ? dueAmount : 0}</span>
              </div>
            </div>

            <div className="hidden xl:block mt-6">
              <button
                type="submit"
                disabled={cart.length === 0 || isLoading || !isPhoneValid}
                className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${cart.length > 0 && !isLoading && isPhoneValid
                  ? 'bg-[#7A1B38] hover:bg-rose-900 text-white shadow-lg shadow-rose-900/20'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18}/> Update Order</>}
              </button>
            </div>
          </div>
        </div>

      </form>

      {/* ================= 🚀 FLOATING ACTION BUTTON (FAB) FOR MOBILE ================= */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#1a2421]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 z-40 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
        <button
          type="submit"
          onClick={handleUpdateOrder}
          disabled={cart.length === 0 || isLoading || !isPhoneValid}
          className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${cart.length > 0 && !isLoading && isPhoneValid
            ? 'bg-[#7A1B38] hover:bg-rose-900 text-white shadow-lg shadow-rose-900/20 dark:shadow-none'
            : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-gray-600 cursor-not-allowed'
            }`}
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
            <>
              Update Order <span className="mx-1">•</span> ৳ {dueAmount > 0 ? dueAmount : 0}
            </>
          )}
        </button>
      </div>

      {/* ================= STEADFAST MANUAL UPDATE WARNING MODAL ================= */}
      {showSteadfastWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2421] w-full max-w-md rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-500/20 overflow-hidden p-6 text-center">
            
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ShieldAlert size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">
              অর্ডার আপডেট হয়েছে!
            </h3>
            
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-xl mb-6">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                "এই অর্ডারটি অলরেডি কুরিয়ারে বুক করা আছে। দয়া করে Steadfast প্যানেলেও ম্যানুয়ালি আপডেট করে দিন।"
              </p>
            </div>

            <button 
              onClick={() => {
                setShowSteadfastWarning(false);
                router.push("/dashboard/orders"); 
              }}
              className="w-full py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg flex justify-center items-center gap-2 cursor-pointer"
            >
              ঠিক আছে, বুঝতে পেরেছি <CheckCircle2 size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}