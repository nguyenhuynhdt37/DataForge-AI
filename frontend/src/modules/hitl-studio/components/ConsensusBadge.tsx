"use client";

import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface ConsensusBadgeProps {
  iouScore?: number;
  isAutoVerified: boolean;
}

export const ConsensusBadge: React.FC<ConsensusBadgeProps> = ({
  iouScore,
  isAutoVerified,
}) => {
  const score = iouScore ?? 0.88;
  const isHighAgreement = score >= 0.80;

  if (isAutoVerified && isHighAgreement) {
    return (
      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>IoU: {score.toFixed(2)} — Tự động Duyệt (Consensus Đạt)</span>
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium flex items-center gap-1.5">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>IoU: {score.toFixed(2)} — Cần Chuyên gia QA Kiểm Tra</span>
    </span>
  );
};
