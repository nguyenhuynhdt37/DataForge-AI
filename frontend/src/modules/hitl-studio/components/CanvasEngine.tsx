"use client";

import React, { useRef, useState } from 'react';
import { BoundingBox } from '../types';
import { LABEL_CLASSES } from './LabelToolbar';

interface CanvasEngineProps {
  boxes: BoundingBox[];
  selectedBoxId: string | null;
  activeTool: 'select' | 'bbox';
  activeClass: string;
  onSelectBox: (id: string | null) => void;
  onAddBox: (box: BoundingBox) => void;
  frameImageUrl?: string;
}

export const CanvasEngine: React.FC<CanvasEngineProps> = ({
  boxes,
  selectedBoxId,
  activeTool,
  activeClass,
  onSelectBox,
  onAddBox,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);

  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'bbox') return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentPos(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    setCurrentPos(coords);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPos || !currentPos) {
      setIsDrawing(false);
      return;
    }

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width > 15 && height > 15) {
      const newBox: BoundingBox = {
        id: `box-${Date.now()}`,
        label: activeClass,
        x,
        y,
        width,
        height,
        confidence: 1.0,
        isAutoAnnotated: false,
      };
      onAddBox(newBox);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  const getClassColor = (label: string) => {
    const found = LABEL_CLASSES.find((c) => c.id === label);
    return found ? found.color : 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden select-none ${
        activeTool === 'bbox' ? 'cursor-crosshair' : 'cursor-default'
      }`}
    >
      {/* Background Simulation Feed: Camera HUD */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/60 via-zinc-950 to-zinc-950" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

      {/* Crosshair Center */}
      <div className="absolute w-8 h-8 border border-zinc-700/50 rounded-full pointer-events-none" />

      {/* Render Existing Bounding Boxes */}
      {boxes.map((box) => {
        const isSelected = selectedBoxId === box.id;
        const colorClasses = getClassColor(box.label);

        return (
          <div
            key={box.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBox(box.id);
            }}
            style={{
              left: `${box.x}px`,
              top: `${box.y}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
            className={`absolute border-2 rounded-sm transition-all cursor-pointer ${colorClasses} ${
              isSelected ? 'ring-2 ring-white shadow-lg' : 'opacity-85 hover:opacity-100'
            }`}
          >
            {/* Tag Label on Top */}
            <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded bg-zinc-900/90 text-[10px] font-mono font-bold text-white whitespace-nowrap shadow flex items-center gap-1">
              <span>{box.label}</span>
              {box.confidence !== undefined && (
                <span className="text-emerald-400">{(box.confidence * 100).toFixed(0)}%</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Render Current In-Progress Drawing Box */}
      {isDrawing && startPos && currentPos && (
        <div
          style={{
            left: `${Math.min(startPos.x, currentPos.x)}px`,
            top: `${Math.min(startPos.y, currentPos.y)}px`,
            width: `${Math.abs(currentPos.x - startPos.x)}px`,
            height: `${Math.abs(currentPos.y - startPos.y)}px`,
          }}
          className="absolute border-2 border-emerald-400 border-dashed bg-emerald-500/20 pointer-events-none"
        />
      )}

      {/* Camera telemetry watermark */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 text-[11px] font-mono text-zinc-500 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
        <span>CAM: FRONT_WIDE_4K</span>
        <span>FPS: 30.0</span>
        <span>LAT: 21.0285° N</span>
        <span>LONG: 105.8542° E</span>
      </div>
    </div>
  );
};
