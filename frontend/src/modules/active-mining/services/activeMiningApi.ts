import { apiClient } from '@/shared/lib/apiClient';
import { 
  KCenterRunPayload, 
  KCenterRunResult, 
  MiningPoint, 
  MiningWeights 
} from '../types';

export const activeMiningApi = {
  getPcaPoints: (projectId?: string) => {
    const endpoint = projectId 
      ? `/active-mining/pca-points?project_id=${encodeURIComponent(projectId)}` 
      : '/active-mining/pca-points';
    return apiClient.get<MiningPoint[]>(endpoint);
  },

  runKCenter: (payload: KCenterRunPayload) => {
    return apiClient.post<KCenterRunResult>('/active-mining/kcenter-select', payload);
  },

  updateWeights: (payload: MiningWeights) => {
    return apiClient.post<{ success: boolean; applied: MiningWeights }>('/active-mining/weights', payload);
  },
};
