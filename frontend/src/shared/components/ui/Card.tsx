"use client";

import React from 'react';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { TiltedCard } from '../react-bits/TiltedCard';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  spotlight?: boolean;
  spotlightColor?: string;
  tilted?: boolean;
  maxRotate?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = true,
  spotlight = true,
  spotlightColor = 'rgba(183, 205, 187, 0.20)',
  tilted = false,
  maxRotate = 10,
  className = '',
  ...props
}) => {
  const baseCardClasses = `relative rounded-2xl border border-[#E5E3DC] bg-white p-6 shadow-soft-sm transition-all duration-300 ${
    hoverEffect ? 'hover:border-[#B7CDBB] hover:shadow-soft-md' : ''
  } ${className}`;

  if (tilted) {
    return (
      <TiltedCard maxRotate={maxRotate} className="w-full">
        <div className={baseCardClasses} {...props}>
          {children}
        </div>
      </TiltedCard>
    );
  }

  if (spotlight) {
    return (
      <SpotlightCard
        spotlightColor={spotlightColor}
        className={`${baseCardClasses}`}
        {...props}
      >
        {children}
      </SpotlightCard>
    );
  }

  return (
    <div className={baseCardClasses} {...props}>
      {children}
    </div>
  );
};
