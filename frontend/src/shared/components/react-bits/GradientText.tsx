"use client";

import React from "react";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export function GradientText({
  children,
  className = "",
  colors = ["#10b981", "#34d399", "#06b6d4", "#10b981"],
  animationSpeed = 4,
  showBorder = false,
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <span
      className={`inline-block text-transparent bg-clip-text bg-[length:200%_auto] animate-gradient-x ${className}`}
      style={gradientStyle}
    >
      {children}
    </span>
  );
}
