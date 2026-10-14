"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

export interface TrueFocusProps {
  sentence?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
  wordClassName?: string;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function TrueFocus({
  sentence = "True Focus",
  manualMode = false,
  blurAmount = 5,
  borderColor = "#10b981",
  glowColor = "rgba(16, 185, 129, 0.45)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className = "",
  wordClassName = "",
}: TrueFocusProps) {
  const words = sentence.split(" ");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const updateFocusRect = useCallback(() => {
    if (!containerRef.current) return;
    const activeEl = wordRefs.current[currentIndex];
    if (!activeEl) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
    setIsReady(true);
  }, [currentIndex]);

  useEffect(() => {
    updateFocusRect();
  }, [currentIndex, updateFocusRect]);

  useEffect(() => {
    const handleResize = () => updateFocusRect();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateFocusRect]);

  useEffect(() => {
    if (manualMode) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, (animationDuration + pauseBetweenAnimations) * 1000);

    return () => clearInterval(interval);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode && lastActiveIndex !== null) {
      setCurrentIndex(lastActiveIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-wrap items-center gap-x-2 gap-y-1 select-none ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={`${word}-${index}`}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onClick={() => setCurrentIndex(index)}
            className={`relative cursor-pointer transition-all duration-300 font-bold ${wordClassName}`}
            style={{
              filter: isActive ? "blur(0px)" : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.45,
              transform: isActive ? "scale(1.02)" : "scale(1)",
            }}
          >
            {word}
          </span>
        );
      })}

      {/* Animated Focus Box with Corner Brackets */}
      <motion.div
        className="pointer-events-none absolute box-border"
        animate={{
          x: focusRect.x - 4,
          y: focusRect.y - 4,
          width: focusRect.width + 8,
          height: focusRect.height + 8,
          opacity: isReady ? 1 : 0,
        }}
        transition={{
          duration: animationDuration,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {/* Top-Left Bracket */}
        <span
          className="absolute -top-[2px] -left-[2px] w-2.5 h-2.5 border-t-2 border-l-2 rounded-tl-sm"
          style={{
            borderColor,
            filter: `drop-shadow(0 0 4px ${glowColor})`,
          }}
        />
        {/* Top-Right Bracket */}
        <span
          className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 border-t-2 border-r-2 rounded-tr-sm"
          style={{
            borderColor,
            filter: `drop-shadow(0 0 4px ${glowColor})`,
          }}
        />
        {/* Bottom-Left Bracket */}
        <span
          className="absolute -bottom-[2px] -left-[2px] w-2.5 h-2.5 border-b-2 border-l-2 rounded-bl-sm"
          style={{
            borderColor,
            filter: `drop-shadow(0 0 4px ${glowColor})`,
          }}
        />
        {/* Bottom-Right Bracket */}
        <span
          className="absolute -bottom-[2px] -right-[2px] w-2.5 h-2.5 border-b-2 border-r-2 rounded-br-sm"
          style={{
            borderColor,
            filter: `drop-shadow(0 0 4px ${glowColor})`,
          }}
        />
      </motion.div>
    </div>
  );
}
