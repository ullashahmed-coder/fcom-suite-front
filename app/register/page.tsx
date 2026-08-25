"use client";

import React, { useState, useEffect } from "react";
import Logo from "../components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  User, Mail, Lock, ArrowRight, Eye, EyeOff, 
  Loader2, CheckCircle2, ShieldCheck, Building2, Phone, Sun, Moon 
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    shopName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    if (!formData.phone) {
      setError("Phone number is required!");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the Terms & Conditions");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      // 🚀 ডেমো কোড বাদ দিয়ে আসল API কল করা হলো
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopName: formData.shopName,
          shopEmail: formData.email, // আপাতত শপ এবং ওনারের ইমেইল একই রাখা হচ্ছে
          ownerName: formData.fullName,
          ownerEmail: formData.email,
          password: formData.password,
          phone: formData.phone
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed!");
      }
      
      setSuccess(true);
      setTimeout(() => {
        // সফল হলে লগইন পেজে নিয়ে যাবে
        window.location.href = "/login";
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8faf9] dark:bg-[#0c1210] font-sans selection:bg-emerald-500/30 relative">
      
      {/* ================= THEME TOGGLE BUTTON ================= */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="fixed top-4 right-4 sm:top-6 sm:right-8 z-50 p-2.5 rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Toggle theme"
          title="Toggle Light/Dark Mode"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}

      {/* ================= LEFT SIDE (HERO) ================= */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white overflow-hidden shadow-2xl z-10">
        
        {/* Animated Background Blobs & Patterns */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[size:24px_24px]" />
        <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] bg-emerald-400/30 rounded-full blur-[120px] animate-blob-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-400/30 rounded-full blur-[100px] animate-blob-float-reverse"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full h-full">
          
          <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
            <div className="mb-16">
              {/* Premium Logo Forced White Text */}
              <Logo className="[&_h1]:!text-white [&_h1_span]:!text-emerald-200 drop-shadow-md" />
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] mb-5 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
              Start growing<br />
              your business today.
            </h1>
            <p className="text-emerald-100/80 text-lg max-w-md leading-relaxed font-medium">
              Create your account and get access to powerful tools for managing your shop effortlessly.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { title: "Free 14-day trial", desc: "No credit card required" },
              { title: "Setup in minutes", desc: "Quick onboarding process" },
              { title: "Cancel anytime", desc: "No long-term commitment" }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-4 animate-slide-up"
                style={{ animationDelay: `${0.3 + (idx * 0.1)}s`, animationFillMode: 'backwards' }}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs font-bold border border-white/10 shadow-sm mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-bold text-[15px] text-white/90">{item.title}</p>
                  <p className="text-emerald-100/70 text-xs mt-0.5 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE (FORM) ================= */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-y-auto custom-scrollbar">
        
        {/* Subtle glow for dark mode right side */}
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none fixed"></div>

        <div className="w-full max-w-[460px] relative z-10 py-10 animate-fade-in-scale">
          
          {/* Card Body */}
          <div className="bg-white/95 dark:bg-[#141c19]/95 backdrop-blur-2xl rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] border border-white/60 dark:border-white/5 overflow-hidden relative">
            
            {/* Top Gradient Accent */}
            <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 relative overflow-hidden">
               <div className="absolute inset-0 bg-white/40 animate-shimmer-fast translate-x-[-100%]"></div>
            </div>

            <div className="p-8 sm:p-10">
              
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-8 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
                <Logo className="scale-110" />
              </div>

              <div className="mb-8 text-center animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
                <h2 className="text-[24px] font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Create an account
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-[14px] font-medium">
                  Already have an account?{" "}
                  <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-all">
                    Sign in
                  </Link>
                </p>
              </div>

              {success ? (
                /* Success State */
                <div className="py-8 flex flex-col items-center text-center animate-slide-up">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center mb-5 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-500/20 animate-ping opacity-30"></div>
                    <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Account Created!</h3>
                  <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 font-medium">
                    <Loader2 size={16} className="animate-spin text-emerald-500" /> Redirecting to login...
                  </p>
                </div>
              ) : (
                /* Form State */
                <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
                  
                  {error && (
                    <div className="mb-6 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[13px] rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm animate-shake">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    
                    {/* Name & Phone Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="group/input">
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" size={17} />
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/5 rounded-xl text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400/80
                              focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/80 transition-all duration-300 disabled:opacity-60 shadow-sm shadow-gray-100/50 dark:shadow-none"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="group/input">
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" size={17} />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/5 rounded-xl text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400/80
                              focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/80 transition-all duration-300 disabled:opacity-60 shadow-sm shadow-gray-100/50 dark:shadow-none"
                            placeholder="017xxxxxxxx"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shop Name */}
                    <div className="group/input">
                      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                        Shop Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" size={17} />
                        <input
                          type="text"
                          name="shopName"
                          value={formData.shopName}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/5 rounded-xl text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400/80
                            focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/80 transition-all duration-300 disabled:opacity-60 shadow-sm shadow-gray-100/50 dark:shadow-none"
                          placeholder="Deshio Tati"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="group/input">
                      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" size={17} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/5 rounded-xl text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400/80
                            focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/80 transition-all duration-300 disabled:opacity-60 shadow-sm shadow-gray-100/50 dark:shadow-none"
                          placeholder="ceo@deshiotati.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Passwords Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Password */}
                      <div className="group/input">
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" size={17} />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full pl-10 pr-10 py-3 bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/5 rounded-xl text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400/80
                              focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/80 transition-all duration-300 disabled:opacity-60 shadow-sm shadow-gray-100/50 dark:shadow-none"
                            placeholder="Min. 6 chars"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10 outline-none"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="group/input">
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-emerald-400">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" size={17} />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full pl-10 pr-10 py-3 bg-gray-50/70 dark:bg-black/30 border border-gray-200/80 dark:border-white/5 rounded-xl text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400/80
                              focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/80 transition-all duration-300 disabled:opacity-60 shadow-sm shadow-gray-100/50 dark:shadow-none"
                            placeholder="Confirm"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10 outline-none"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-3 text-[13px] font-medium text-gray-600 dark:text-gray-400 cursor-pointer group pt-2 pb-1 select-none">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                      />
                      <span className="leading-snug transition-colors group-hover:text-gray-800 dark:group-hover:text-gray-200">
                        I agree to the <button type="button" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline outline-none">Terms of Service</button> and <button type="button" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline outline-none">Privacy Policy</button>.
                      </span>
                    </label>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex items-center justify-center gap-2 py-4 mt-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl text-[15px] font-bold shadow-[0_6px_20px_0_rgba(5,150,105,0.3)] hover:shadow-[0_8px_25px_rgba(5,150,105,0.4)] transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:shadow-none overflow-hidden"
                    >
                      {!loading && (
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer"></div>
                      )}

                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative z-10">Create Account</span>
                          <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 mt-8 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
            © {new Date().getFullYear()} Bunon Labs. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}