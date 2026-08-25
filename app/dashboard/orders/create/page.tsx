"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Trash2, ShoppingBag, User, MapPin, Phone, Loader2, Package, ArrowLeft, Receipt, ClipboardEdit, Truck, Zap, Tag, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CreateNewOrderPage() {
  const router = useRouter()

  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [settings, setSettings] = useState({ insideDhaka: 60, outsideDhaka: 120, tangail: 80 })
  const [cart, setCart] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [customDeliveryCharge, setCustomDeliveryCharge] = useState<number | string>("")
  const [discount, setDiscount] = useState<number | string>("")

  const [isResellerOrder, setIsResellerOrder] = useState(false)

  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    district: "",
    address: "",
    note: "",
    advance: 0,
    isFullPaid: false,
  })

  const [steadfastNote, setSteadfastNote] = useState("")
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetchSettings()
    fetchProducts()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/settings`)
      if (res.ok) {
        const data = await res.json()
        if (data.insideDhaka) {
          setSettings({
            insideDhaka: Number(data.insideDhaka),
            outsideDhaka: Number(data.outsideDhaka),
            tangail: data.tangail ? Number(data.tangail) : 80
          })
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err)
    }
  }

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/products`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        
        // 🚀 isArchived চেকটা বাদ দিয়ে শুধু isDeleted চেক করা হলো
        const activeProducts = data.filter((product: any) => !product.isDeleted)
        setAvailableProducts(activeProducts)
      }
    } catch (err) {
      console.error("সার্ভারের সাথে কানেক্ট করা যাচ্ছে না।", err)
    } finally {
      setLoadingProducts(false)
    }
  }

  // 🚀 কাস্টমার অটো-ফিল লজিক উন্নত করা হলো
  useEffect(() => {
    const checkExistingCustomer = async () => {
      if (customer.phone.length === 11) {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`${apiUrl}/customers/check/${customer.phone}`, {
            headers: { "Authorization": `Bearer ${token}` }
          })

          if (response.ok) {
            const existingCustomer = await response.json();
            if (existingCustomer) {
              setCustomer(prev => ({
                ...prev,
                name: existingCustomer.name || "",
                district: existingCustomer.district || "",
                address: existingCustomer.address || "",
              }))
            }
          }
        } catch (err) {
          console.error("Error fetching customer details:", err)
        }
      }
    }
    checkExistingCustomer()
  }, [customer.phone])

  const getProductImage = (item: any) => {
    if (item.imageUrl) return item.imageUrl.startsWith('http') ? item.imageUrl : `${apiUrl}${item.imageUrl}`;
    return null;
  }

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    const currentQtyInCart = existing ? existing.qty : 0

    if (product.stock - currentQtyInCart <= 0) {
      alert("দুঃখিত, এই শাড়ির আর কোনো স্টক এভেইলেবল নেই!")
      return
    }

    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item))
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    const product = availableProducts.find(p => p.id === id);
    if (product && newQty > product.stock) {
      alert(`দুঃখিত, স্টকে সর্বোচ্চ ${product.stock} টি শাড়ি আছে। এর চেয়ে বেশি দেওয়া সম্ভব নয়।`);
      return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item))
  }

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

  let deliveryCharge = 0
  if (customer.district === "Inside Dhaka") {
    deliveryCharge = settings.insideDhaka
  } else if (customer.district === "Outside Dhaka") {
    deliveryCharge = settings.outsideDhaka
  } else if (customer.district === "Tangail City") {
    deliveryCharge = settings.tangail
  } else if (customer.district === "Custom") {
    deliveryCharge = Number(customDeliveryCharge) || 0
  }
  
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0)
  const discountAmount = Number(discount) || 0
  
  const totalAmount = (subtotal + deliveryCharge) - discountAmount
  
  const advanceAmount = Math.min(Number(customer.advance) || 0, totalAmount)
  const dueAmount = totalAmount - advanceAmount

  const handleFullPaid = () => {
    if (totalAmount > 0) {
      setCustomer({ ...customer, advance: totalAmount });
    }
  }

  useEffect(() => {
    let charge = deliveryCharge > 0 ? deliveryCharge : 100;
    let noteText = "";

    if (dueAmount <= 0 && cart.length > 0) {
      noteText = "Full Paid Parcel. Do Not Collect Any Cash!";
    } else {
      noteText = `শাড়ির কালার ও কোয়ালিটি যাচাই করে গ্রহণ করুন। রিটার্নের জন্য মূল ভাঁজ ও প্যাকেজিং অক্ষত রাখা আবশ্যক। অর্ডার গ্রহণ না করলে ${charge} টাকা কুরিয়ার চার্জ প্রযোজ্য।`;
    }

    if (customer.isFullPaid) {
      noteText += " [URGENT]";
    }

    setSteadfastNote(noteText);
  }, [deliveryCharge, customer.isFullPaid, dueAmount, cart.length])

  // 🚀 ডাটাবেস লজিক সরিয়ে API কল বসানো হয়েছে
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPhoneValid) {
      alert("দয়া করে ১১ ডিজিটের সঠিক মোবাইল নম্বর (যেমন: 01XXXXXXXXX) দিন।")
      return
    }
    if (!customer.name || !customer.district) {
      alert("দয়া করে কাস্টমারের নাম এবং জেলা সিলেক্ট করুন।")
      return
    }
    if (customer.district === "Custom" && customDeliveryCharge === "") {
      alert("দয়া করে কাস্টম ডেলিভারি চার্জটি লিখুন।")
      return
    }
    if (cart.length === 0) {
      alert("অর্ডার প্লেস করার জন্য অন্তত একটি শাড়ি কার্টে যুক্ত করুন।")
      return
    }
    if (discountAmount > (subtotal + deliveryCharge)) {
      alert("ডিসকাউন্ট অ্যামাউন্ট মোট বিলের চেয়ে বেশি হতে পারবে না!")
      return
    }

    setIsLoading(true)

    // 🚀 ব্যাকএন্ডে পাঠানোর জন্য JSON অবজেক্ট তৈরি
    const orderData = {
      customerName: customer.name,
      customerPhone: customer.phone,
      district: customer.district,
      address: customer.address,
      deliveryCharge: deliveryCharge,
      discount: discountAmount,
      advancePayment: advanceAmount,
      note: customer.note,
      courierNote: steadfastNote,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.qty,
        price: Number(item.price)
      }))
    };

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        alert("✅ আলহামদুলিল্লাহ! অর্ডারটি সফলভাবে সেভ হয়েছে।");
        router.push("/dashboard/orders");
      } else {
        const errorData = await response.json();
        alert(`❌ অর্ডার সেভ হয়নি! কারণ: ${errorData.message || "সার্ভার এরর"}`);
      }
    } catch (error) {
      console.error("Error saving order:", error);
      alert("সার্ভারের সাথে কানেক্ট করা যাচ্ছে না।");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredProducts = availableProducts.filter(product => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (product.name && product.name.toLowerCase().includes(searchLower)) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto transition-colors">

      {/* ================= Page Header ================= */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
        <Link
          href="/dashboard/orders"
          className="p-2.5 bg-white dark:bg-[#1a2421] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-[#7A1B38] dark:hover:text-[#7A1B38] rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
          <ShoppingBag size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">Create New Order</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">Search customer, add products and place order</p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ================= LEFT COLUMN ================= */}
        <div className="xl:col-span-8 space-y-6">

          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">Select Products</h2>

            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-slate-400 dark:text-gray-500" /></div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#141d1a] border border-slate-200 dark:border-white/5 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] transition-colors"
                placeholder="Search by product name, SKU..."
              />
            </div>

            {loadingProducts ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 gap-3">
                <Loader2 className="animate-spin text-[#7A1B38]" size={32} />
                <p className="text-sm font-medium">ডাটাবেস থেকে শাড়ি লোড হচ্ছে...</p>
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 gap-3 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl">
                <Package size={48} className="text-slate-300 dark:text-gray-600" />
                <p className="text-sm font-medium">স্টকে কোনো শাড়ি নেই!</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 gap-3 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl">
                <Search size={48} className="text-slate-300 dark:text-gray-600" />
                <p className="text-sm font-medium">আপনার সার্চ করা শাড়িটি পাওয়া যায়নি!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 h-[400px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                {filteredProducts.map((product) => {

                  const qtyInCart = cart.find(c => c.id === product.id)?.qty || 0;
                  const availableNow = product.stock - qtyInCart;

                  return (
                    <div key={product.id} className="border border-slate-100 dark:border-white/5 rounded-xl p-2 sm:p-3 hover:border-rose-200 dark:hover:border-rose-500/30 hover:shadow-md dark:hover:shadow-none transition-all group bg-slate-50 dark:bg-[#141d1a] flex flex-col">
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
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className={`text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded ${availableNow > 0 ? 'text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-500/10' : 'text-red-600 dark:text-rose-400 bg-red-50 dark:bg-rose-500/10'}`}>
                            {availableNow > 0 ? `${availableNow} In Stock` : 'Out'}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            disabled={availableNow <= 0}
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center transition-colors shrink-0 ${availableNow > 0 ? 'bg-[#7A1B38] hover:bg-rose-900 text-white' : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed'}`}
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
              <ShoppingBag size={18} className="text-[#7A1B38]" /> Selected Products ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-gray-500 text-sm border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl">কোনো শাড়ি সিলেক্ট করা হয়নি</div>
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
                      <span className="text-sm font-bold text-[#7A1B38] dark:text-rose-400 w-16 text-right">৳ {Number(item.price) * item.qty}</span>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1.5 bg-white dark:bg-white/5 rounded border border-slate-200 dark:border-transparent shadow-sm dark:shadow-none transition-colors"><Trash2 size={16} /></button>
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
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none transition-colors bg-white dark:bg-[#141d1a] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 ${customer.phone.length > 0 && !isPhoneValid
                      ? 'border-rose-400 bg-rose-50 dark:bg-rose-500/10 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-rose-700 dark:text-rose-400'
                      : 'border-slate-200 dark:border-white/5 focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38]'
                      }`}
                    placeholder="e.g., 01XXXXXXXXX"
                  />
                </div>
                {customer.phone.length > 0 && !isPhoneValid && (
                  <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle size={10} /> ফোন নম্বর অবশ্যই ১১ ডিজিটের হতে হবে এবং 01 দিয়ে শুরু হতে হবে।
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
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141d1a] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 border border-slate-200 dark:border-white/5 rounded-lg text-sm focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] outline-none transition-colors"
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
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141d1a] text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 rounded-lg text-sm focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] outline-none appearance-none transition-colors"
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
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400">Enter Custom Delivery Charge *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 dark:text-gray-400 font-bold">৳</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={customDeliveryCharge}
                      onChange={(e) => setCustomDeliveryCharge(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 border border-rose-200 dark:border-rose-500/30 rounded-lg text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors"
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
                  className="w-full p-3 bg-white dark:bg-[#141d1a] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 border border-slate-200 dark:border-white/5 rounded-lg text-sm focus:border-[#7A1B38] focus:ring-1 focus:ring-[#7A1B38] outline-none resize-none transition-colors"
                  placeholder="Full address for delivery..."
                ></textarea>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 transition-colors">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Tag size={14} className="fill-blue-100 dark:fill-blue-900" /> Extra Discount
                  </label>
                  <button type="button" onClick={() => setDiscount("")} className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300">Clear</button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-blue-600 dark:text-blue-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-blue-50/50 dark:bg-blue-500/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-blue-200 dark:border-blue-500/30 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Advance Payment</label>
                    <button type="button" onClick={() => setCustomer({ ...customer, advance: 0 })} className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300">Clear</button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-emerald-600 dark:text-emerald-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={customer.advance || ""}
                      onChange={(e) => setCustomer({ ...customer, advance: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-sm focus:border-emerald-500 outline-none transition-colors"
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer p-2 border border-rose-100 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={customer.isFullPaid}
                      onChange={(e) => setCustomer({ ...customer, isFullPaid: e.target.checked })}
                      className="accent-rose-600 dark:accent-rose-500 w-4 h-4 rounded"
                    />
                    <div className="flex items-center gap-1">
                      <Zap size={14} className="fill-rose-600 dark:fill-rose-500" /> Make Urgent
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 transition-colors">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300 flex items-center gap-1">
                    <ClipboardEdit size={14} className="text-amber-600 dark:text-amber-500" />
                    Special Note (Only for Packing Team)
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

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 transition-colors">
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

          {/* Order Summary */}
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none p-6 sticky top-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Receipt size={18} className="text-[#7A1B38]" /> Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>Subtotal ({cart.length} Items)</span>
                <span className="font-bold text-slate-800 dark:text-white">৳ {subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-gray-400 items-center">
                <span>Delivery Charge <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded ml-1 text-slate-500 dark:text-gray-300">{customer.district}</span></span>
                <span className="font-bold text-slate-800 dark:text-white">
                  + ৳ {deliveryCharge}
                </span>
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

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFullPaid}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={14} /> Mark as Full Paid
                </button>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border-x border-b border-rose-100 dark:border-rose-500/30 transition-colors">
                <span className="text-sm font-bold text-rose-900 dark:text-rose-400">Cash on Delivery (COD)</span>
                <span className="text-xl font-black text-[#7A1B38] dark:text-rose-400">৳ {dueAmount > 0 ? dueAmount : 0}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={cart.length === 0 || isLoading || !isPhoneValid}
              className={`w-full mt-6 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${cart.length > 0 && !isLoading && isPhoneValid
                ? 'bg-[#7A1B38] hover:bg-rose-900 text-white shadow-lg shadow-rose-900/20 dark:shadow-none'
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed'
                }`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Place Order & Generate Invoice"}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}