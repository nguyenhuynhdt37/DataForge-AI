import { apiClient } from '@/shared/lib/apiClient';
import { 
  DatasetDistribution, 
  OverviewSummary, 
  RecentRun 
} from '../types';

export const overviewApi = {
  getSummary: () => {
    return apiClient.get<OverviewSummary>('/overview/summary');
  },

  getRecentRuns: () => {
    return apiClient.get<RecentRun[]>('/overview/recent-runs');
  },

  getDistribution: () => {
    return apiClient.get<DatasetDistribution[]>('/overview/distribution');
  },
};
