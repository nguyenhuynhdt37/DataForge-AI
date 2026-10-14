"use client";

import React from "react";
import { motion } from "framer-motion";

export interface AnimatedContentProps {
  children: React.ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

export function AnimatedContent({
  children,
  distance = 30,
  direction = "vertical",
  reverse = false,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  delay = 0,
  duration = 0.5,
  className = "",
}: AnimatedContentProps) {
  const offset = reverse ? -distance : distance;

  const initialTransform =
    direction === "vertical"
      ? { y: offset, x: 0 }
      : { x: offset, y: 0 };

  return (
    <motion.div
      initial={{
        ...initialTransform,
        opacity: animateOpacity ? initialOpacity : 1,
        scale: scale !== 1 ? scale : 1,
      }}
      animate={{
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
