"use client";

import { useState, useEffect, useCallback } from 'react';
import { DataSlice, SliceQueryFilters } from '../types';
import { dataLabApi } from '../services/dataLabApi';

export const INITIAL_SLICES: DataSlice[] = [
  {
    id: 'SLC-VF8-RAIN-01',
    name: 'Mưa lớn cao tốc & Bắn nước bánh xe',
    description: 'Ảnh từ camera trước VF8 trên cao tốc Pháp Vân - Cầu Giẽ lúc mưa to, gạt nước che khuất biển số xe trước.',
    total_samples: 14200,
    hard_samples_count: 4280,
    tags: ['rain', 'highway', 'high-speed', 'spray'],
    weather_condition: 'rain',
    lighting_condition: 'day',
    status: 'active',
    created_at: '2026-10-08T10:00:00Z',
  },
  {
    id: 'SLC-VF9-NIGHT-GLARE',
    name: 'Đêm tối & Đèn pha chói lóa ngược chiều',
    description: 'Góc cua đô thị Nguyễn Trãi lúc 21h, đèn pha xe tải ngược chiều gây bão hòa cảm biến CMOS.',
    total_samples: 9800,
    hard_samples_count: 3650,
    tags: ['night', 'glare', 'urban', 'trucks'],
    weather_condition: 'clear',
    lighting_condition: 'night',
    status: 'active',
    created_at: '2026-10-07T14:30:00Z',
  },
  {
    id: 'SLC-VF-MOTORBIKE-CUT',
    name: 'Xe máy tạt đầu ngã tư giờ cao điểm',
    description: 'Khoảng cách phanh an toàn dưới 2m, xe máy chen lấn điểm mù camera góc rộng bên phải.',
    total_samples: 22400,
    hard_samples_count: 8120,
    tags: ['motorbikes', 'cut-in', 'blindspot', 'rush-hour'],
    weather_condition: 'clear',
    lighting_condition: 'day',
    status: 'active',
    created_at: '2026-10-06T08:15:00Z',
  },
  {
    id: 'SLC-FOG-SAPA-PASS',
    name: 'Sương mù dày đặc đèo Ô Quy Hồ',
    description: 'Tầm nhìn xa dưới 15 mét, độ tương phản mờ đục, yêu cầu thuật toán khử sương và tăng cường tương phản.',
    total_samples: 6400,
    hard_samples_count: 2890,
    tags: ['fog', 'mountain', 'low-contrast'],
    weather_condition: 'fog',
    lighting_condition: 'day',
    status: 'active',
    created_at: '2026-10-05T16:00:00Z',
  },
];

export function useSliceQuery(initialFilters?: SliceQueryFilters) {
  const [filters, setFilters] = useState<SliceQueryFilters>(initialFilters || {});
  const [slices, setSlices] = useState<DataSlice[]>(INITIAL_SLICES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dataLabApi.getSlices(filters);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setSlices(res.data);
      }
    } catch (err: unknown) {
      console.warn('Fallback to local slices cache:', err);
      // Giữ dữ liệu mẫu khi backend endpoint chưa triển khai
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSlices();
  }, [fetchSlices]);

  const updateFilters = (updated: Partial<SliceQueryFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    slices,
    filters,
    isLoading,
    error,
    updateFilters,
    resetFilters,
    refetch: fetchSlices,
  };
}
