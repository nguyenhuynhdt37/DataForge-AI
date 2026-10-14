"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BrandHeaderProps {
  className?: string;
}

export function BrandHeader({ className = "" }: BrandHeaderProps) {
  return (
    <Link 
      href="/" 
      className={`inline-flex items-center gap-3.5 group transition-opacity hover:opacity-90 ${className}`}
    >
      <div className="relative h-10 w-10 shrink-0">
        <Image 
          src="/logo.png" 
          alt="DataForge AI Logo" 
          fill 
          className="object-contain" 
          priority
        />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-lg font-bold tracking-tight text-[#1F2627] font-editorial leading-tight">
          DataForge AI
        </span>
        <span className="text-xs uppercase font-mono tracking-wider text-[#475254] font-semibold">
          Editorial Vision Platform
        </span>
      </div>
    </Link>
  );
}
