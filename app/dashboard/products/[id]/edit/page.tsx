"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, Image as ImageIcon, UploadCloud, 
  Tag, Box, DollarSign, Layers, Loader2, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function AddEditProductPage() {
  const router = useRouter();
  const params = useParams();
  
  // যদি URL এ ID থাকে, তারমানে এটি Edit Mode
  const productId = params?.id; 
  const isEditMode = !!productId;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  });

  // ক্যাটাগরির লিস্ট
  const categories = ["Cotton", "Jamdani", "Half Silk", "Antic", "Mixed Silk"];

  // এডিট মোড হলে ডেটাবেস থেকে রিয়েল ডেটা ফেচ করা
  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const token = localStorage.getItem("access_token");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
          const res = await fetch(`${apiUrl}/products/${productId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            setFormData({
              name: data.name,
              sku: data.sku,
              category: data.category || "",
              price: data.price.toString(),
              stock: data.stock.toString(),
              description: data.description || "",
            });
            
            // 🚀 ইমেজ URL ঠিক করার লজিক (Cloudinary এবং Local উভয়ের জন্য)
            if (data.imageUrl) {
              const fullImageUrl = data.imageUrl.startsWith("http") 
                ? data.imageUrl 
                : `${apiUrl}${data.imageUrl}`;
                
              setImagePreview(fullImageUrl);
              setUploadedImageUrl(data.imageUrl); // ব্যাকএন্ডে পাঠানোর জন্য অরিজিনাল পাথ
            }
          }
        } catch (error) {
          console.error("Failed to fetch product", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [isEditMode, productId]);

  // ইনপুট হ্যান্ডলার
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🚀 Cloudinary-তে ইমেজ আপলোড হ্যান্ডলার
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsUploadingImage(true);

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${apiUrl}/uploads/image`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formDataToSend,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedImageUrl(data.imageUrl); // Cloudinary URL সেভ করে রাখা
      } else {
        alert("Failed to upload image.");
        setImagePreview(null);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Something went wrong while uploading the image.");
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // স্টক অনুযায়ী অটোমেটিক স্ট্যাটাস জেনারেট করা
  const getCalculatedStatus = (stockValue: string) => {
    const stock = Number(stockValue);
    if (!stockValue || stock === 0) return { label: "Out of Stock", color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20" };
    if (stock < 10) return { label: "Low Stock", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" };
    return { label: "In Stock", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" };
  };

  const currentStatus = getCalculatedStatus(formData.stock);

  // 🚀 ফর্ম সাবমিট হ্যান্ডলার (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const payload = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        imageUrl: uploadedImageUrl,
      };

      const endpoint = isEditMode ? `${apiUrl}/products/${productId}` : `${apiUrl}/products`;
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isEditMode ? "✅ Product updated successfully!" : "✅ New product added successfully!");
        router.push("/dashboard/products");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] dark:bg-[#0f1714]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-10 bg-[#f8f9fc] dark:bg-[#0f1714] min-h-screen p-6 font-sans transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
        <button 
          type="button"
          onClick={() => router.back()}
          className="p-2.5 bg-white dark:bg-[#1a2421] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isEditMode ? `Update details for product #${productId}` : "Fill in the details to add a new product to your catalog."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* ================= LEFT COLUMN: GENERAL INFO ================= */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Box size={18} className="text-indigo-600 dark:text-indigo-400" /> Basic Information
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Product Name *</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Premium Jamdani Saree" 
                  className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300">SKU (Stock Keeping Unit) *</label>
                  <input 
                    type="text" 
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. TJ-PRM-01" 
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white transition-colors uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Category *</label>
                  <select 
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white transition-colors appearance-none"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Description</label>
                <textarea 
                  name="description"
                  rows={4} 
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of the product..." 
                  className="w-full mt-1.5 p-4 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white resize-none transition-colors leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: MEDIA & PRICING ================= */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Media/Image Upload */}
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-indigo-600 dark:text-indigo-400" /> Product Image
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group h-48 relative overflow-hidden">
              
              {/* 🚀 হিডেন ফাইল ইনপুট যুক্ত করা হয়েছে */}
              <input 
                type="file" 
                id="imageUpload" 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <label htmlFor="imageUpload" className="absolute inset-0 cursor-pointer z-20"></label>

              {isUploadingImage ? (
                 <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                    <p className="text-sm font-medium text-slate-600 dark:text-gray-300">Uploading...</p>
                 </div>
              ) : imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-bold flex items-center gap-2"><UploadCloud size={18}/> Change Image</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-3">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-gray-300">Click to upload image</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
                </>
              )}
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white dark:bg-[#1a2421] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-6 transition-colors">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <DollarSign size={18} className="text-indigo-600 dark:text-indigo-400" /> Pricing & Stock
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Selling Price (৳) *</label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold">৳</span>
                  </div>
                  <input 
                    type="number" 
                    name="price"
                    required
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00" 
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-gray-300">Available Stock *</label>
                  {formData.stock && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${currentStatus.color}`}>
                      {currentStatus.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Layers size={14} className="text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    name="stock"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="Enter quantity" 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#141d1a] border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white transition-colors"
                  />
                </div>
              </div>

              {Number(formData.stock) < 10 && formData.stock !== "" && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                    Stock is running low. Make sure to restock soon to avoid running out of inventory.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ================= BOTTOM ACTION BUTTONS ================= */}
        <div className="xl:col-span-12 flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEditMode ? "Save Changes" : "Create Product"}
          </button>
        </div>

      </form>
    </div>
  );
}