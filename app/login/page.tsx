"use client";

import React, { useState, useEffect } from "react";
import Logo from "../components/Logo";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, Sun, Moon, ShieldCheck } from "lucide-react"; 
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState("admin@deshiotati.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🚀 Remember Me State
  const [rememberMe, setRememberMe] = useState(false);

  // 🚀 2FA States
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Hydration error ফিক্স এবং Remember Me ইমেইল চেক করার জন্য
  useEffect(() => {
    setMounted(true);
    // পেজ লোড হলে চেক করবে আগে ইমেইল সেভ করা ছিল কি না
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // ================= LOGIN HANDLER =================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password!");
      }

      // 🚀 চেক করা হচ্ছে 2FA অন আছে কি না
      if (data.requires2FA) {
        setRequires2FA(true);
        setTempUserId(data.userId);
        setLoading(false);
        return; // এখানেই থেমে যাবে, OTP এর জন্য অপেক্ষা করবে
      }

      // 2FA অফ থাকলে সরাসরি লগইন
      completeLoginProcess(data);

    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // 🚀 ================= VERIFY OTP HANDLER =================
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: tempUserId, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid or expired OTP Code");
      }

      // OTP সঠিক হলে লগইন সম্পন্ন করা
      completeLoginProcess(data);

    } catch (err: any) {
      setError(err.message || "Verification failed!");
      setLoading(false);
    }
  };

  // লগইন সাকসেস হলে টোকেন সেভ ও রিডাইরেক্ট করার কমন ফাংশন
  const completeLoginProcess = (data: any) => {
    localStorage.setItem("access_token", data.access_token);
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    document.cookie = `access_token=${data.access_token}; path=/; max-age=2592000; SameSite=Lax`;

    // 🚀 Remember Me লজিক
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    setSuccess(true);
    setLoading(false);
    
    setTimeout(() => {
      if (data.user && data.user.role === "SUPER_ADMIN") {
        window.location.href = "/super-admin";
      } else {
        window.location.href = "/dashboard";
      }
    }, 1400);
  };

  return (
    <div className="min-h-screen flex bg-[#f8faf9] dark:bg-[#0c1210] font-sans selection:bg-emerald-500/30 relative">
      
      {/* ================= THEME TOGGLE BUTTON ================= */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50 p-2.5 rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Toggle theme"
          title="Toggle Light/Dark Mode"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}

      {/* ================= LEFT SIDE (HERO) ================= */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white overflow-hidden shadow-2xl z-10">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[size:24px_24px]" />
        <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] bg-emerald-400/30 rounded-full blur-[120px] animate-blob-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-400/30 rounded-full blur-[100px] animate-blob-float-reverse"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full h-full">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
            <div className="mb-16">
              <Logo className="[&_h1]:!text-white [&_h1_span]:!text-emerald-200 drop-shadow-md" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] mb-5 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
              Smart tools.<br />
              Smarter business.
            </h1>
            <p className="text-emerald-100/80 text-lg max-w-md leading-relaxed font-medium">
              Manage orders, inventory, staff and analytics — all from one powerful dashboard.
            </p>
          </div>

          <div className="space-y-5">
            {[
              "Real-time order & inventory tracking",
              "Staff management & payroll tools",
              "Advanced reports & analytics"
            ].map((text, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-4 text-sm text-emerald-100/90 font-medium animate-slide-up"
                style={{ animationDelay: `${0.3 + (idx * 0.1)}s`, animationFillMode: 'backwards' }}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs font-bold border border-white/10 shadow-sm">
                  {idx + 1}
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE (FORM) ================= */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none"></div>

        <div className="w-full max-w-[420px] relative z-10">
          
          <div className="lg:hidden flex justify-center mb-10">
            <Logo className="scale-110" />
          </div>

          {success ? (
            /* ================= SUCCESS STATE ================= */
            <div className="py-12 flex flex-col items-center text-center bg-white dark:bg-[#141c19] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 p-8 animate-slide-up">
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center mb-5 relative">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-500/20 animate-ping opacity-30"></div>
                <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Login Successful</h3>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 font-medium">
                <Loader2 size={16} className="animate-spin text-emerald-500" /> Redirecting...
              </p>
            </div>
          ) : requires2FA ? (
            /* 🚀 ================= 2FA OTP STATE ================= */
            <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100 dark:border-emerald-500/20">
                  <ShieldCheck size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-[26px] font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Two-Factor Auth
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-[15px] font-medium px-4">
                  Enter the 6-digit code sent to your email to verify it's you.
                </p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[14px] rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-sm animate-pulse">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="group/input">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    className="w-full text-center tracking-[0.75em] font-mono text-3xl py-4 bg-white dark:bg-[#141c19] border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-300 focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300 disabled:opacity-60 shadow-sm"
                    placeholder="••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="group relative w-full flex items-center justify-center gap-2 py-4 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[15px] font-bold shadow-[0_6px_20px_0_rgba(5,150,105,0.3)] hover:shadow-[0_8px_25px_rgba(5,150,105,0.4)] transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 disabled:hover:shadow-none overflow-hidden"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Login"}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => { setRequires2FA(false); setOtpCode(""); setError(""); }} 
                  className="w-full text-center text-[14px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 mt-4 transition-colors focus:outline-none"
                >
                  Back to login
                </button>
              </form>
            </div>
          ) : (
            /* ================= REGULAR LOGIN STATE ================= */
            <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
              <div className="mb-10">
                <h2 className="text-[26px] font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-[15px] font-medium">
                  Sign in to your admin dashboard
                </p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[14px] rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-sm animate-pulse">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="group/input">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#141c19] border border-gray-200 dark:border-white/10 rounded-2xl text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400
                        focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300 disabled:opacity-60 shadow-sm shadow-gray-200/40 dark:shadow-none"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="group/input">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                      Password
                    </label>
                    {/* 🚀 ফিক্স: Forgot Password লিংক অ্যাক্টিভ করা হয়েছে */}
                    <Link href="/forgot-password" className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-11 pr-12 py-3.5 bg-white dark:bg-[#141c19] border border-gray-200 dark:border-white/10 rounded-2xl text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400
                        focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 disabled:opacity-60 shadow-sm shadow-gray-200/40 dark:shadow-none"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 z-10"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 🚀 ফিক্স: Remember me স্টেট যুক্ত করা হয়েছে */}
                <label className="flex items-center gap-3 text-[14px] font-medium text-gray-600 dark:text-gray-400 cursor-pointer group mt-2 select-none w-max">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-gray-300 text-emerald-600 focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer" 
                  />
                  <span className="group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Remember me for 30 days
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2 py-4 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[15px] font-bold shadow-[0_6px_20px_0_rgba(5,150,105,0.3)] hover:shadow-[0_8px_25px_rgba(5,150,105,0.4)] transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 disabled:hover:shadow-none overflow-hidden"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Sign in to Dashboard</span>
                      <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                
                <div className="mt-8 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-all">
                    Create one now
                  </Link>
                </div>

              </form>
            </div>
          )}

          <p className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 mt-12 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
            © {new Date().getFullYear()} Bunon Labs. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}