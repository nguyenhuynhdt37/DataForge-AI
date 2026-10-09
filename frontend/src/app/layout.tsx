import React from 'react';
import { Inter } from 'next/font/google';
import "./globals.css";

// Tải font Inter - Chuẩn nét và hiện đại nhất cho UI Dashboard
const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: "GreenSM Hub | Tailwind",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
