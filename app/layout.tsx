import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata = {
  title: "Fcom-Suite",
  description: "Smart tools for smarter business.",
  manifest: "/manifest.json", // 🚀 PWA-র জন্য ম্যানিফেস্ট ফাইল যুক্ত করা হলো
};

// 🚀 Next.js-এর নতুন নিয়ম অনুযায়ী themeColor আলাদা viewport অবজেক্টে দিতে হয়
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // এটি জুম করা বন্ধ করবে
  themeColor: "#059669", // আপনার ব্র্যান্ডের এমারেল্ড গ্রিন কালার
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
  
}