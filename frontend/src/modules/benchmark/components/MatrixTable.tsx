"use client";

import React, { useState } from 'react';
import { Table, Server, Filter, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { MatrixBenchmarkRow } from '../types';

const INITIAL_MATRIX_ROWS: MatrixBenchmarkRow[] = [
  {
    id: 'MAT-01',
    device: 'In-Vehicle Telematics Unit (Intel Core i7 Gen 13)',
    backend: 'OpenVINO 2024.3',
    precision: 'INT8',
    latencyP50: 4.2,
    latencyP95: 5.1,
    fps: 238,
    powerWatts: 18.5,
    accuracyRetention: 98.4,
    status: 'optimal',
  },
  {
    id: 'MAT-02',
    device: 'Snapdragon Ride Flex (SoC ADAS)',
    backend: 'Qualcomm SNPE v2.22',
    precision: 'INT8',
    latencyP50: 3.8,
    latencyP95: 4.6,
    fps: 263,
    powerWatts: 12.0,
    accuracyRetention: 97.9,
    status: 'optimal',
  },
  {
    id: 'MAT-03',
    device: 'Hailo-8 M.2 AI Accelerator',
    backend: 'HailoRT 4.17',
    precision: 'INT8',
    latencyP50: 2.9,
    latencyP95: 3.4,
    fps: 344,
    powerWatts: 2.5,
    accuracyRetention: 98.1,
    status: 'optimal',
  },
  {
    id: 'MAT-04',
    device: 'NVIDIA Jetson Orin Nano (8GB)',
    backend: 'TensorRT 10.0',
    precision: 'FP16',
    latencyP50: 8.9,
    latencyP95: 10.4,
    fps: 112,
    powerWatts: 15.0,
    accuracyRetention: 99.6,
    status: 'acceptable',
  },
  {
    id: 'MAT-05',
    device: 'In-Vehicle Telematics Unit (Intel Core i7 Gen 13)',
    backend: 'PyTorch Native CPU',
    precision: 'FP32',
    latencyP50: 18.4,
    latencyP95: 22.8,
    fps: 54,
    powerWatts: 35.0,
    accuracyRetention: 100.0,
    status: 'heavy',
  },
];

export const MatrixTable: React.FC = () => {
  const [filterPrecision, setFilterPrecision] = useState<string>('all');
  const [rows] = useState<MatrixBenchmarkRow[]>(INITIAL_MATRIX_ROWS);

  const filteredRows = rows.filter((r) => {
    if (filterPrecision === 'all') return true;
    return r.precision === filterPrecision;
  });

  const getStatusBadge = (status: MatrixBenchmarkRow['status']) => {
    switch (status) {
      case 'optimal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] text-[11px] font-mono font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Chuẩn Edge SLA
          </span>
        );
      case 'acceptable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF2E8] text-[#8C6239] border border-[#EEDFCD] text-[11px] font-mono font-semibold">
            <AlertTriangle className="h-3 w-3" /> Cận SLA (&le; 10ms)
          </span>
        );
      case 'heavy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBEAE8] text-[#8C2E24] border border-[#F4CCC8] text-[11px] font-mono font-semibold">
            <XCircle className="h-3 w-3" /> Vượt SLA (&gt; 15ms)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 shadow-soft-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ECEAE2] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[#2D5A34]" />
            <h3 className="text-base font-bold text-[#1F2627] font-editorial">
              Ma Trận Phần Cứng Thực Địa (Edge Hardware Matrix)
            </h3>
          </div>
          <p className="text-xs text-[#5A6466] mt-0.5">
            Bảng đối soát hiệu năng và công suất tiêu thụ trên các dòng vi xử lý thực tế.
          </p>
        </div>

        {/* Filter precision */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#5A6466]" />
          <span className="text-xs text-[#5A6466]">Lượng tử:</span>
          <select
            value={filterPrecision}
            onChange={(e) => setFilterPrecision(e.target.value)}
            className="bg-[#FAF9F5] border border-[#ECEAE2] rounded-xl px-3 py-1.5 text-xs text-[#1F2627] focus:outline-none focus:border-[#7FA086]"
          >
            <option value="all">Tất cả định dạng</option>
            <option value="INT8">Chỉ INT8</option>
            <option value="FP16">Chỉ FP16</option>
            <option value="FP32">Chỉ FP32</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#ECEAE2] text-[#5A6466] font-mono font-semibold uppercase text-[11px]">
              <th className="py-3 px-3">Phần cứng & Thiết bị</th>
              <th className="py-3 px-3">Backend Runtime</th>
              <th className="py-3 px-3">Lượng tử</th>
              <th className="py-3 px-3">Độ trễ p50 / p95</th>
              <th className="py-3 px-3">FPS</th>
              <th className="py-3 px-3">Điện năng (W)</th>
              <th className="py-3 px-3">Độ giữ mAP (%)</th>
              <th className="py-3 px-3 text-right">Đánh giá SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECEAE2]">
            {filteredRows.map((row) => (
              <tr key={row.id} className="hover:bg-[#FAF9F5] transition-colors">
                <td className="py-3.5 px-3 font-medium text-[#1F2627]">
                  {row.device}
                </td>
                <td className="py-3.5 px-3 text-[#5A6466] font-mono">
                  {row.backend}
                </td>
                <td className="py-3.5 px-3">
                  <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                    row.precision === 'INT8'
                      ? 'bg-[#E8F0EA] text-[#2D5A34]'
                      : row.precision === 'FP16'
                      ? 'bg-[#E6F0F7] text-[#2A5778]'
                      : 'bg-[#EFEBF5] text-[#55476E]'
                  }`}>
                    {row.precision}
                  </span>
                </td>
                <td className="py-3.5 px-3 font-mono font-bold text-[#1F2627]">
                  {row.latencyP50}ms <span className="text-[#5A6466] font-normal text-[11px]">/ {row.latencyP95}ms</span>
                </td>
                <td className="py-3.5 px-3 font-mono font-bold text-[#2D5A34]">
                  {row.fps}
                </td>
                <td className="py-3.5 px-3 font-mono text-[#5A6466]">
                  {row.powerWatts}W
                </td>
                <td className="py-3.5 px-3 font-mono text-[#1F2627]">
                  {row.accuracyRetention}%
                </td>
                <td className="py-3.5 px-3 text-right">
                  {getStatusBadge(row.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
