"use client";

import React from 'react';
import { Keyboard } from 'lucide-react';

export const HotkeyLegend: React.FC = () => {
  const hotkeys = [
    { key: 'Space', desc: 'Lưu & Sang ảnh tiếp' },
    { key: 'Delete / Backspace', desc: 'Xóa Bounding Box đang chọn' },
    { key: '1 - 6', desc: 'Chuyển đổi Class phân loại' },
    { key: 'V / B', desc: 'Chế độ Trỏ (V) / Vẽ Box (B)' },
    { key: 'Esc', desc: 'Bỏ chọn Box' },
  ];

  return (
    <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2 text-xs">
      <div className="flex items-center gap-1.5 text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
        <Keyboard className="h-3.5 w-3.5 text-emerald-400" />
        <span>Phím tắt Thao tác Nhanh (Hotkeys)</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {hotkeys.map((hk) => (
          <div key={hk.key} className="flex items-center justify-between gap-1 text-zinc-300">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-[10px]">
              {hk.key}
            </kbd>
            <span className="text-zinc-400 truncate">{hk.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
