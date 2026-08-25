import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata = {
  title: "Fcom-Suite",
  description: "Smart tools for smarter business.",
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