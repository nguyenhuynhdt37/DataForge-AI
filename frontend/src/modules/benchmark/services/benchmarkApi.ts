import { apiClient } from '@/shared/lib/apiClient';
import { 
  BenchmarkProfile, 
  BenchmarkRunPayload, 
  BenchmarkRunResponse 
} from '../types';

export const benchmarkApi = {
  getProfiles: () => {
    return apiClient.get<BenchmarkProfile[]>('/benchmark/profiles');
  },

  runBenchmark: (payload: BenchmarkRunPayload) => {
    return apiClient.post<BenchmarkRunResponse>('/benchmark/run', payload);
  },

  getBenchmarkRunStatus: (runId: string) => {
    return apiClient.get<BenchmarkRunResponse>(`/benchmark/runs/${encodeURIComponent(runId)}`);
  },
};
