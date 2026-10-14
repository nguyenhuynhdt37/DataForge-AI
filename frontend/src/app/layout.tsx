import React from 'react';
import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: "DataForge AI — Soft Editorial Data-Centric Platform",
  description: "A Human-Designed, Soft Editorial AI Platform for Computer Vision & HITL Data Operations",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="bg-[#F8F7F2] text-[#303A3B] antialiased selection:bg-[#DCEBE0] selection:text-[#303A3B]">
        {children}
      </body>
    </html>
  );
}
