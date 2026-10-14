"use client";

import React from 'react';
import { Layers, TrendingUp, ShieldAlert } from 'lucide-react';
import { SliceAccuracyDelta } from '../types';

const INITIAL_SLICE_DELTAS: SliceAccuracyDelta[] = [
  {
    sliceId: 'SLC-NIGHT-RAIN',
    sliceName: 'Mưa Đêm & Đèn Pha Chói',
    condition: 'Trời mưa lớn ban đêm, phản chiếu đèn pha xe ngược chiều gây chói lóa',
    baselineMap50: 0.582,
    activeTrainedMap50: 0.748,
    deltaPercent: 28.5,
    sampleCount: 1250,
    tag: 'Chói sáng đèn pha',
  },
  {
    sliceId: 'SLC-MOTORBIKE-BLIND',
    sliceName: 'Xe Máy Tạt Đầu Điểm Mù',
    condition: 'Xe máy vượt gấp sát cản trước và góc mù camera gương chiếu hậu',
    baselineMap50: 0.634,
    activeTrainedMap50: 0.812,
    deltaPercent: 28.1,
    sampleCount: 1840,
    tag: 'Góc mù camera',
  },
  {
    sliceId: 'SLC-FOG-HIGHWAY',
    sliceName: 'Sương Mù Cao Tốc Hải Phòng',
    condition: 'Tầm nhìn xa dưới 30 mét, độ tương phản mờ đục trên làn tốc độ cao',
    baselineMap50: 0.518,
    activeTrainedMap50: 0.695,
    deltaPercent: 34.2,
    sampleCount: 920,
    tag: 'Thời tiết cực đoan',
  },
  {
    sliceId: 'SLC-NARROW-ALLEY',
    sliceName: 'Ngõ Hẹp Đô Thị Phức Tạp',
    condition: 'Mật độ chướng ngại vật cao (xe đẩy, biển hiệu, người đi bộ bất ngờ)',
    baselineMap50: 0.710,
    activeTrainedMap50: 0.834,
    deltaPercent: 17.5,
    sampleCount: 1450,
    tag: 'Đô thị mật độ cao',
  },
];

export const SliceDeltaTable: React.FC = () => {
  return (
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 shadow-soft-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ECEAE2] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#2D5A34]" />
            <h3 className="text-base font-bold text-[#1F2627] font-editorial">
              Phân Tích Cải Thiện Trên Các Ca Khó (Hard Slices Delta mAP)
            </h3>
          </div>
          <p className="text-xs text-[#5A6466] mt-0.5">
            So sánh độ chính xác nhận diện giữa mô hình gốc (Baseline) và mô hình sau khi huấn luyện với mẫu Active Mining từ DataForge AI.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0EA] border border-[#CDE0D1] text-[11px] font-mono text-[#2D5A34] font-semibold">
          <TrendingUp className="h-3 w-3" />
          <span>Trung bình tăng +27.1% trên ca khó</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#ECEAE2] text-[#5A6466] font-mono font-semibold uppercase text-[11px]">
              <th className="py-3 px-3">Phân đoạn Ca Khó (Slice)</th>
              <th className="py-3 px-3">Bối cảnh môi trường</th>
              <th className="py-3 px-3">Mẫu đã bổ sung</th>
              <th className="py-3 px-3">mAP@50 Baseline</th>
              <th className="py-3 px-3">mAP@50 DataForge</th>
              <th className="py-3 px-3 text-right">Tăng trưởng Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECEAE2]">
            {INITIAL_SLICE_DELTAS.map((item) => (
              <tr key={item.sliceId} className="hover:bg-[#FAF9F5] transition-colors">
                <td className="py-3.5 px-3">
                  <div className="font-bold text-[#1F2627] font-editorial">
                    {item.sliceName}
                  </div>
                  <div className="text-[11px] font-mono text-[#5A6466]">
                    {item.sliceId}
                  </div>
                </td>
                <td className="py-3.5 px-3 max-w-xs text-[#5A6466]">
                  {item.condition}
                </td>
                <td className="py-3.5 px-3 font-mono font-bold text-[#1F2627]">
                  {item.sampleCount.toLocaleString()} ảnh
                </td>
                <td className="py-3.5 px-3 font-mono text-[#5A6466]">
                  {(item.baselineMap50 * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-3 font-mono font-bold text-[#2D5A34]">
                  {(item.activeTrainedMap50 * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-3 text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] font-mono font-bold text-xs">
                    <TrendingUp className="h-3 w-3" />
                    +{item.deltaPercent.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
