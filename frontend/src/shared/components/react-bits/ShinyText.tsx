"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/shared/lib/utils";

interface ShinyTextProps {
  text: string;
  className?: string;
}

export function ShinyText({ text, className }: ShinyTextProps) {
  return (
    <motion.span
      initial={{ backgroundPosition: "200% center" }}
      animate={{ backgroundPosition: "-200% center" }}
      transition={{
        repeat: Infinity,
        duration: 3,
        ease: "linear",
      }}
      className={cn(
        "inline-block bg-[linear-gradient(110deg,#a1a1aa,45%,#ffffff,55%,#a1a1aa)] bg-[length:200%_100%] bg-clip-text text-transparent",
        className
      )}
    >
      {text}
    </motion.span>
  );
}
