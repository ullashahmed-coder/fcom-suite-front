"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Printer, ArrowLeft, Loader2 } from "lucide-react"

export default function InvoicePrintPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderData(orderId)
    }
  }, [orderId])

  const fetchOrderData = async (id: any) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setOrder(await res.json())
      }
    } catch (err) {
      console.error("Failed to fetch order", err)
    }
  }

  // ডেটা লোড হলে অটোমেটিক Print ডায়লগ ওপেন হবে
  useEffect(() => {
    if (order) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [order])

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-gray-500" size={40} /></div>
  }

  const dueAmount = (order.totalAmount + order.deliveryCharge) - (order.discount || 0) - (order.advancePayment || 0)

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8 font-sans text-black">
      
      {/* 🖨️ Action Bar (Hide in Print Mode) */}
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-black transition">
          <Printer size={16} /> Print Invoice
        </button>
      </div>

      {/* 📄 Printable Invoice Card (A4/POS Style) */}
      <div className="max-w-2xl mx-auto bg-white p-8 sm:p-10 shadow-lg print:shadow-none print:p-0 print:max-w-full">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-[#7A1B38]">CHORKA / DESHIO TATI</h1>
            <p className="text-sm text-gray-500 mt-1">Tangail, Bangladesh</p>
            <p className="text-sm text-gray-500">Phone: +880 1XXXXXXXXX</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">INVOICE</h2>
            <p className="text-sm text-gray-600 mt-1 font-bold">Order ID: #{order.id}</p>
            <p className="text-xs text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
          <p className="text-base font-bold text-gray-800">{order.customerName}</p>
          <p className="text-sm text-gray-600 mt-1">{order.address}</p>
          <p className="text-sm text-gray-600">{order.district}</p>
          <p className="text-sm font-bold text-gray-800 mt-2">Phone: {order.customerPhone}</p>
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-gray-800 text-sm">
              <th className="py-3 font-bold text-gray-800">Description</th>
              <th className="py-3 font-bold text-gray-800 text-center">Qty</th>
              <th className="py-3 font-bold text-gray-800 text-right">Price</th>
              <th className="py-3 font-bold text-gray-800 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {order.items?.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3">{item.product?.name || "Product Item"}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">৳ {item.price}</td>
                <td className="py-3 text-right font-medium">৳ {item.quantity * item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal:</span> <span className="font-medium text-gray-800">৳ {order.totalAmount}</span></div>
            <div className="flex justify-between"><span>Delivery Charge:</span> <span className="font-medium text-gray-800">+ ৳ {order.deliveryCharge}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-blue-600"><span>Discount:</span> <span>- ৳ {order.discount}</span></div>}
            {order.advancePayment > 0 && <div className="flex justify-between text-green-600"><span>Advance Paid:</span> <span>- ৳ {order.advancePayment}</span></div>}
            
            <div className="flex justify-between border-t-2 border-gray-800 pt-2 mt-2">
              <span className="font-bold text-gray-800 text-base">Total Due (COD):</span> 
              <span className="font-black text-[#7A1B38] text-lg">৳ {dueAmount > 0 ? dueAmount : 0}</span>
            </div>
          </div>
        </div>

        {/* Footer/Notes */}
        <div className="border-t border-gray-200 pt-6 mt-10">
          <p className="text-xs text-gray-500 font-medium">Note: {order.courierNote}</p>
          <p className="text-xs text-gray-400 mt-2 italic text-center">Thank you for shopping with us!</p>
        </div>

      </div>

      {/* 🚀 CSS for Print (This hides the action bar and background when printing) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `}} />
    </div>
  )
}