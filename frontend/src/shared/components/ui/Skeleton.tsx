"use client";

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  shimmer = true, 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-[#ECEAE2] rounded-xl ${
        shimmer
          ? "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent"
          : "opacity-80"
      } ${className}`}
      {...props}
    />
  );
};
