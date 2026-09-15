"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Printer, ArrowLeft, Loader2, Download } from "lucide-react"
import * as htmlToImage from "html-to-image"

export default function InvoicePrintPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id
  
  const [order, setOrder] = useState<any>(null)
  const [storeSettings, setStoreSettings] = useState<any>(null) 
  const [isError, setIsError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  
  const invoiceRef = useRef<HTMLDivElement>(null)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (orderId) {
      fetchOrderData(orderId)
      fetchSettingsData() 
    }
  }, [orderId])

  const fetchOrderData = async (id: any) => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token")
      const res = await fetch(`${apiUrl}/orders/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      } else {
        setIsError(true)
      }
    } catch (err) {
      console.error("Failed to fetch order", err)
      setIsError(true)
    }
  }

  const fetchSettingsData = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token")
      const res = await fetch(`${apiUrl}/settings`, {
        headers: { "Authorization": `Bearer ${token}` } 
      })
      
      if (res.ok) {
        const data = await res.json()
        const settingsObj = Array.isArray(data) ? data[0] : data
        setStoreSettings(settingsObj)
      }
    } catch (err) {
      console.error("Failed to fetch settings", err)
    }
  }

  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsDownloading(true);
      
      const dataUrl = await htmlToImage.toPng(invoiceRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: 680,
        style: {
          margin: "0",
          left: "0",
          position: "relative"
        }
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Invoice_${order.orderNo || order.id}.png`;
      link.click();
    } catch (error) {
      console.error("Image download failed:", error);
      alert("ইমেজ ডাউনলোড করতে সমস্যা হচ্ছে!");
    } finally {
      setIsDownloading(false);
    }
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc] dark:bg-[#0f1714] gap-4 transition-colors">
        <p className="text-red-500 font-bold">অর্ডারটি খুঁজে পাওয়া যায়নি অথবা সার্ভার এরর!</p>
        <button onClick={() => router.push('/dashboard/orders')} className="px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold">Go Back to Orders</button>
      </div>
    )
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] dark:bg-[#0f1714] transition-colors"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
  }

  const advancePaid = Number(order.advance) || 0;
  const discountAmount = Number(order.discount) || 0;
  const deliveryCharge = Number(order.deliveryCharge) || 0;
  const subTotal = Number(order.totalAmount) - deliveryCharge + discountAmount;
  const dueAmount = Number(order.totalAmount) - advancePaid;

  const watermarkLogo = storeSettings?.logoUrl || storeSettings?.storeLogo || storeSettings?.logo;

  return (
    // 🚀 মোবাইলে প্যাডিং কমানো হয়েছে (p-2) যাতে বেশি জায়গা পাওয়া যায়
    <div className="bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-2 sm:p-8 font-sans transition-colors">
      
      {/* 🖨️ Action Bar */}
      <div className="max-w-2xl mx-auto mb-4 sm:mb-6 flex justify-between items-center print:hidden bg-white dark:bg-[#1a2421] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 transition-colors">
        
        <button onClick={() => router.push('/dashboard/orders')} className="flex items-center gap-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-colors cursor-pointer">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handleDownloadImage} 
            disabled={isDownloading}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition shadow-sm cursor-pointer disabled:opacity-70"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">Save Image</span>
            <span className="sm:hidden">Save</span>
          </button>

          <button onClick={() => window.print()} className="flex items-center gap-2 bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition shadow-sm cursor-pointer">
            <Printer size={16} /> <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* 🚀 Mobile Swipe Hint */}
      <p className="text-center text-xs text-gray-500 mb-2 md:hidden animate-pulse">
        ⟷ Swipe left/right to view full invoice
      </p>

      {/* 🚀 Wrapper for Horizontal Scroll on Mobile */}
      <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
        
        {/* 📄 Printable Invoice Card (Fixed Width Logic Applied) */}
        <div 
          ref={invoiceRef} 
          style={{ minWidth: '680px' }} // 🚀 মূল ম্যাজিক: ইনভয়েস কখনোই 680px এর ছোট হবে না
          className="mx-auto bg-white text-slate-900 pt-10 px-8 sm:px-10 pb-12 shadow-xl rounded-xl print:shadow-none print:p-0 print:min-w-full print:rounded-none relative overflow-hidden border-t-[12px] border-[#7A1B38] print:border-t-[12px] print:border-[#7A1B38]"
        >
          
          {/* 💧 Watermark Logo */}
          {watermarkLogo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none opacity-[0.08]">
              <img 
                src={watermarkLogo.startsWith('http') ? watermarkLogo : `${apiUrl}${watermarkLogo}`} 
                alt="Watermark" 
                className="w-64 h-64 object-contain" 
              />
            </div>
          )}

          <div className="relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start pb-8 mb-8 border-b border-slate-100">
              <div>
                <h1 className="text-4xl font-black text-[#7A1B38] uppercase tracking-tight">
                  {storeSettings?.storeName || storeSettings?.name || storeSettings?.shopName || "DESHIO TATI"}
                </h1>
                <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">
                  {storeSettings?.businessAddress || storeSettings?.address || "Tangail, Bangladesh"}
                </p>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Phone: <span className="text-slate-800">{storeSettings?.supportPhone || storeSettings?.phone || "+880 1XXXXXXXXX"}</span>
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest opacity-20 mb-2">Invoice</h2>
                <p className="text-sm text-slate-800 mt-1 font-bold">
                  {order.trackingCode ? `CN: ${order.trackingCode}` : (order.orderNo || `ORD-${order.id}`)}
                </p>
                <p className="text-xs text-slate-500 font-medium">Issue Date: {new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-10">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</h3>
              <div className="border-l-4 border-[#7A1B38] pl-4 py-1">
                <p className="text-lg font-bold text-slate-800">{order.customer?.name}</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{order.customer?.address}</p>
                <p className="text-sm text-slate-600">{order.customer?.district}</p>
                <p className="text-sm font-bold text-slate-800 mt-2">Phone: {order.customer?.phone}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse mb-8">
              <thead>
                <tr className="border-y-2 border-slate-800 text-sm">
                  <th className="py-3.5 font-bold text-slate-800 uppercase text-xs tracking-wider">Description</th>
                  <th className="py-3.5 font-bold text-slate-800 text-center uppercase text-xs tracking-wider">Qty</th>
                  <th className="py-3.5 font-bold text-slate-800 text-right uppercase text-xs tracking-wider">Price</th>
                  <th className="py-3.5 font-bold text-slate-800 text-right uppercase text-xs tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {order.items?.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-4 font-medium">{item.product?.name || "Unknown Product"}</td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">৳ {item.price}</td>
                    <td className="py-4 text-right font-bold text-slate-800">৳ {item.quantity * item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculation */}
            <div className="flex justify-end mb-10">
              <div className="w-72">
                <div className="space-y-2.5 text-sm text-slate-600 mb-4 px-2">
                  <div className="flex justify-between"><span>Subtotal:</span> <span className="font-medium text-slate-800">৳ {subTotal}</span></div>
                  <div className="flex justify-between"><span>Delivery Charge:</span> <span className="font-medium text-slate-800">+ ৳ {deliveryCharge}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-blue-600"><span>Discount:</span> <span>- ৳ {discountAmount}</span></div>}
                  {advancePaid > 0 && <div className="flex justify-between text-emerald-600"><span>Advance Paid:</span> <span>- ৳ {advancePaid}</span></div>}
                </div>
                
                <div className="bg-[#7A1B38]/5 border border-[#7A1B38]/20 rounded-xl p-4 flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">Total Due (COD)</span> 
                  <span className="font-black text-[#7A1B38] text-xl">৳ {dueAmount > 0 ? dueAmount : 0}</span>
                </div>
              </div>
            </div>

            {/* Footer/Notes */}
            <div className="border-t border-slate-100 pt-6 flex flex-col items-center justify-center text-center">
              {order.note && <p className="text-xs text-slate-600 font-bold mb-1">📝 Customer Note: {order.note}</p>}
              
              {dueAmount > 0 ? (
                <p className="text-xs text-black-600 font-black text-base uppercase tracking-wide">
                  🚚 Courier Note: Collect Cash ৳ {dueAmount} 
                  {order.courierNote && !order.courierNote.includes("Full Paid") ? ` | ${order.courierNote}` : ""}
                </p>
              ) : (
                <p className="text-xs text-emerald-600 font-bold">
                  🚚 Courier Note: {order.courierNote || "Full Paid Parcel. Do Not Collect Any Cash!"}
                </p>
              )}
              
              <p className="text-xs text-slate-400 mt-6 font-medium">Thank you for shopping with us!</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 CSS for Print & Custom Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #2a3a35; }
        
        @media print {
          body { background-color: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:border-t-\\[12px\\] { border-top-width: 12px !important; }
          .print\\:border-\\[\\#7A1B38\\] { border-color: #7A1B38 !important; }
        }
      `}} />
    </div>
  )
}