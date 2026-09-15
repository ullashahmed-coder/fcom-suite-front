"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("টোকেন পাওয়া যায়নি। দয়া করে আপনার ইমেইলের লিংকটিতে আবার ক্লিক করুন।");
      return;
    }

    if (newPassword.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("দুটি পাসওয়ার্ড মিলছে না! আবার চেক করুন।");
      return;
    }

    setLoading(true);

    try {
      // 🚀 আপনার ব্যাকএন্ডের API URL দিন (যেমন: )
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://fcom-suite.onrender.com";
      
      const res = await fetch(`${apiUrl}/auth/reset-password-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! আপনাকে লগইন পেজে নিয়ে যাওয়া হচ্ছে...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message || "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। লিংকটির মেয়াদ শেষ হতে পারে।");
      }
    } catch (err) {
      setError("সার্ভার এরর। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-emerald-600 mb-2">নতুন পাসওয়ার্ড সেট করুন</h2>
          <p className="text-gray-500 text-sm">আপনার অ্যাকাউন্টের জন্য একটি নতুন এবং সুরক্ষিত পাসওয়ার্ড দিন।</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-4 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">নতুন পাসওয়ার্ড</label>
            <input
              type="password"
              placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">কনফার্ম পাসওয়ার্ড</label>
            <input
              type="password"
              placeholder="পাসওয়ার্ডটি আবার টাইপ করুন"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-70"
          >
            {loading ? "পরিবর্তন হচ্ছে..." : "রিসেট পাসওয়ার্ড"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-emerald-600 hover:underline">
            লগইন পেজে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}

// Suspense বাউন্ডারি ব্যবহার করা হয়েছে কারণ useSearchParams() ক্লায়েন্ট সাইডে রেন্ডার হয়
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-emerald-600">লোড হচ্ছে...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}