import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

// Vercel Build Trigger - Structure verified at root level

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartQueue Maroc v2 - Gestion de file d'attente",
  description: "Système de gestion de file d'attente pour cabinets médicaux au Maroc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Pages without navbar
  const isDashboardPage = typeof window !== 'undefined' && 
    (window.location.pathname.includes('/dashboard-secretaire') || 
     window.location.pathname.includes('/cabinet'));

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {!isDashboardPage && <Navbar />}
        {children}
      </body>
    </html>
  );
}
