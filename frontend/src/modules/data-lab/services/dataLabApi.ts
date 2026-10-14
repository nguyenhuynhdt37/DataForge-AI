import { apiClient } from '@/shared/lib/apiClient';
import { 
  DataSlice, 
  DedupJobRequest, 
  DedupJobResponse, 
  SliceExportRequest, 
  SliceExportResponse, 
  SliceQueryFilters 
} from '../types';

export const dataLabApi = {
  getSlices: (filters?: SliceQueryFilters) => {
    const params = new URLSearchParams();
    if (filters?.keyword) params.append('keyword', filters.keyword);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.min_uncertainty !== undefined) params.append('min_uncertainty', String(filters.min_uncertainty));
    if (filters?.weather) params.append('weather', filters.weather);
    if (filters?.lighting) params.append('lighting', filters.lighting);
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
    if (filters?.offset !== undefined) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const endpoint = queryString ? `/data-lab/slices?${queryString}` : '/data-lab/slices';
    return apiClient.get<DataSlice[]>(endpoint);
  },

  getSliceById: (sliceId: string) => {
    return apiClient.get<DataSlice>(`/data-lab/slices/${encodeURIComponent(sliceId)}`);
  },

  triggerDedup: (payload: DedupJobRequest) => {
    return apiClient.post<DedupJobResponse>('/data-lab/dedup', payload);
  },

  exportSlice: (payload: SliceExportRequest) => {
    return apiClient.post<SliceExportResponse>('/data-lab/export', payload);
  },
};
