import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // ডেভেলপমেন্ট মোডে PWA বন্ধ থাকবে
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* আপনার অন্যান্য config options এখানে থাকবে */
  reactStrictMode: true,
};

// 🚀 nextConfig-কে PWA দিয়ে র‍্যাপ করে এক্সপোর্ট করা হলো
export default withPWA(nextConfig);