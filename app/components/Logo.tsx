import React from "react";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Mark (Icon) */}
      <div className="relative w-10 h-10 flex-shrink-0 group">
        {/* Background Glow Effect */}
        <div className="absolute inset-0 bg-emerald-500 blur-[10px] opacity-40 rounded-xl group-hover:opacity-60 transition-opacity duration-300"></div>
        
        {/* Main Icon Box */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 rounded-xl flex items-center justify-center border border-white/20 shadow-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
          
          {/* Glassmorphism Reflection (Top light) */}
          <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/40 to-transparent"></div>
          
          {/* Custom 'F' SVG Icon with Sparkle */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-sm">
            {/* The letter 'F' */}
            <rect x="6" y="4" width="4.5" height="16" rx="2" fill="white" />
            <rect x="6" y="4" width="13" height="4.5" rx="2" fill="white" />
            <rect x="6" y="11" width="9" height="4.5" rx="2" fill="white" />
            
            {/* Premium Sparkle/Star Icon */}
            <path d="M16.5 13.5L17.5 16L20 17L17.5 18L16.5 20.5L15.5 18L13 17L15.5 16L16.5 13.5Z" fill="#a7f3d0" className="animate-pulse" />
          </svg>

        </div>
      </div>

      {/* Logo Text */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white leading-none">
          Fcom<span className="text-emerald-600 dark:text-emerald-400 font-semibold">-Suite</span>
        </h1>
      </div>
    </div>
  );
}