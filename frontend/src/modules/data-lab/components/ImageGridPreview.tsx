"use client";

import React from 'react';
import { Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface SampleFrame {
  id: string;
  camera: 'Fisheye 360' | 'Telephoto Front' | 'Telephoto Rear' | 'Wide Cabin';
  timestamp: string;
  uncertaintyScore: number;
  condition: string;
  boxesCount: number;
  isHardSlice: boolean;
}

interface ImageGridPreviewProps {
  samples: SampleFrame[];
  onSelectSample?: (sample: SampleFrame) => void;
}

export const ImageGridPreview: React.FC<ImageGridPreviewProps> = ({
  samples,
  onSelectSample,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {samples.map((item) => {
        return (
          <div
            key={item.id}
            onClick={() => onSelectSample?.(item)}
            className="group relative bg-[#FAF9F5] border border-[#ECEAE2] hover:border-[#7FA086] rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-soft-md flex flex-col justify-between"
          >
            {/* Visual Canvas Representation */}
            <div className="relative aspect-video bg-zinc-900 flex items-center justify-center p-3 text-center overflow-hidden">
              {/* Fake visual grid representing camera feed */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

              <div className="relative z-10 flex flex-col items-center">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {item.camera}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  ID: {item.id}
                </span>
              </div>

              {/* Hard Slice Indicator Badge */}
              {item.isHardSlice && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500/90 text-zinc-950 text-[10px] font-bold font-mono flex items-center gap-1 shadow">
                  <ShieldAlert className="h-3 w-3" />
                  Hard Slice
                </div>
              )}

              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/70 px-1.5 py-0.5 rounded">
                Uncertainty: {item.uncertaintyScore.toFixed(2)}
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="p-3 bg-white flex items-center justify-between border-t border-[#ECEAE2]">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#1F2627]">
                  {item.condition}
                </span>
                <span className="text-[10px] text-[#5A6466] font-mono">
                  {item.boxesCount} BBoxes phát hiện
                </span>
              </div>

              <div className="p-1 rounded-lg bg-[#FAF9F5] group-hover:bg-[#E8F0EA] group-hover:text-[#2D5A34] text-[#5A6466] transition-colors">
                <Eye className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
