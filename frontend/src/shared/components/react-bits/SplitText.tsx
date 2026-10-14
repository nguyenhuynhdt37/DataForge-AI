"use client";

import React from "react";
import { motion } from "framer-motion";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationFrom?: { opacity: number; transform: string };
  animationTo?: { opacity: number; transform: string };
  easing?: string;
  threshold?: number;
  rootMargin?: string;
  textAlign?: "left" | "right" | "center" | "justify" | "initial" | "inherit";
  onLetterAnimationComplete?: () => void;
}

export function SplitText({
  text,
  className = "",
  delay = 30,
  animationFrom = { opacity: 0, transform: "translate3d(0, 20px, 0)" },
  animationTo = { opacity: 1, transform: "translate3d(0, 0, 0)" },
  textAlign = "left",
  onLetterAnimationComplete,
}: SplitTextProps) {
  const letters = text.split("");

  return (
    <span
      className={`inline-block ${className}`}
      style={{ textAlign, whiteSpace: "normal", wordWrap: "break-word" }}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={animationFrom}
          animate={animationTo}
          transition={{
            duration: 0.4,
            delay: (index * delay) / 1000,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
          onAnimationComplete={
            index === letters.length - 1 ? onLetterAnimationComplete : undefined
          }
          className="inline-block"
          style={{ willChange: "transform, opacity" }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </span>
  );
}
