"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, ShoppingBag, Loader2, BarChart3 } from "lucide-react"

export default function BestSellersPage() {
  const router = useRouter()
  const [sarees, setSarees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAllBestSellers = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/best-selling-sarees`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setSarees(data)
        }
      } catch (error) {
        console.error("Failed to fetch best sellers", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAllBestSellers()
  }, [])

  const getImageUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith('http') ? path : `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  }

  // মোট বিক্রি এবং রেভিনিউ হিসাব করা
  const totalItemsSold = sarees.reduce((sum, item) => sum + item.sold, 0)
  const totalRevenueGenerated = sarees.reduce((sum, item) => sum + item.revenue, 0)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="animate-spin text-[#7A1B38] dark:text-rose-500" size={40} />
        <p className="text-slate-500 dark:text-gray-400 font-medium">র‍্যাঙ্কিং লোড হচ্ছে...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6 transition-colors duration-300">
      
      {/* ================= Header ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1a2421] p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 rounded-xl transition-colors border border-gray-200 dark:border-transparent"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="text-rose-600 dark:text-rose-500" /> Best Selling Sarees
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Complete ranking of all sarees based on sales performance.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-100 dark:border-rose-500/20 text-right">
            <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase tracking-wider">Total Units Sold</p>
            <p className="text-lg font-black text-rose-700 dark:text-rose-300 flex items-center justify-end gap-1"><ShoppingBag size={16}/> {totalItemsSold}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-right">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Total Revenue</p>
            <p className="text-lg font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-end gap-1"><BarChart3 size={16}/> ৳ {totalRevenueGenerated.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* ================= Saree Grid ================= */}
      {sarees.length === 0 ? (
        <div className="bg-white dark:bg-[#1a2421] p-10 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 gap-3 transition-colors">
          <ShoppingBag size={48} className="opacity-30" />
          <p>এখনো কোনো শাড়ি বিক্রি হয়নি।</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sarees.map((saree, index) => (
            <div key={saree.id} className="bg-white dark:bg-[#1a2421] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-lg dark:hover:border-white/20 transition-all p-4 relative flex flex-col group">
              
              {/* Rank Badge (Top 3 gets special colors) */}
              <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md z-10 border-2 dark:border-[#1a2421] border-white
                ${index === 0 ? 'bg-amber-400 text-amber-900' : 
                  index === 1 ? 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-white' : 
                  index === 2 ? 'bg-amber-700 text-white dark:bg-amber-600' : 
                  'bg-white dark:bg-[#141d1a] text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'}`}
              >
                #{index + 1}
              </div>

              {/* Image */}
              <div className="bg-slate-50 dark:bg-[#141d1a] rounded-xl h-48 mb-4 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-white/5">
                {saree.thumbnail ? (
                  <img 
                    src={getImageUrl(saree.thumbnail)} 
                    alt={saree.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                ) : (
                  <span className="text-slate-400 dark:text-gray-600 font-bold text-xs">No Image</span>
                )}
              </div>

              {/* Details */}
              <h4 className="font-bold text-sm text-slate-800 dark:text-gray-100 mb-4 line-clamp-2 leading-tight" title={saree.name}>
                {saree.name}
              </h4>

              <div className="flex justify-between items-end mt-auto pt-3 border-t border-slate-100 dark:border-white/10">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Sold</p>
                  <p className="text-lg font-black text-slate-700 dark:text-gray-200">{saree.sold}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Revenue</p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400">৳ {saree.revenue.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}