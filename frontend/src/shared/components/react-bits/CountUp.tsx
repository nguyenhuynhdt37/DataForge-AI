"use client";

import React, { useEffect, useRef, useState } from "react";

export interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  onEnd?: () => void;
}

export function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  decimals = 0,
  prefix = "",
  suffix = "",
  onEnd,
}: CountUpProps) {
  const [currentValue, setCurrentValue] = useState<number>(from);
  const elementRef = useRef<HTMLSpanElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startWhen) return;

    let timeoutId: NodeJS.Timeout;

    const startAnimation = () => {
      const startVal = direction === "down" ? to : from;
      const endVal = direction === "down" ? from : to;

      const easeOutExpo = (x: number): number => {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
      };

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);
        const easedProgress = easeOutExpo(progress);

        const current = startVal + (endVal - startVal) * easedProgress;
        setCurrentValue(current);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentValue(endVal);
          if (onEnd) onEnd();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      timeoutId = setTimeout(startAnimation, delay * 1000);
    } else {
      startAnimation();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      startTimeRef.current = null;
    };
  }, [to, from, direction, delay, duration, startWhen, onEnd]);

  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split(".");

    let formattedInt = intPart;
    if (separator) {
      formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }

    if (decimals > 0 && decPart !== undefined) {
      return `${formattedInt}.${decPart}`;
    }
    return formattedInt;
  };

  return (
    <span ref={elementRef} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {formatNumber(currentValue)}
      {suffix}
    </span>
  );
}
