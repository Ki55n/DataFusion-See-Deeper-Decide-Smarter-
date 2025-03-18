import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthContextProvider } from "./context/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Datatuket - AI-Powered Data Analysis",
  description: "See Deeper, Decide Smarter with advanced AI-powered data analysis tools",
  icons: {
    icon: "/icon.png",
  },
  keywords: ["AI", "Data Analysis", "Machine Learning", "Analytics", "Business Intelligence"],
  authors: [{ name: "Datatuket Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#1a1b1e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-gray-100 min-h-screen`}
      >
        <AuthContextProvider>
          <div className="relative">
            {/* Background gradient */}
            <div className="fixed inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </AuthContextProvider>
      </body>
    </html>
  );
}
