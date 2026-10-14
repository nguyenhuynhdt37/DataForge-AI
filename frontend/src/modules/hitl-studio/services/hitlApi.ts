import { apiClient } from '@/shared/lib/apiClient';
import { 
  BoundingBox, 
  HitlFrameTask, 
  IoUValidationResult, 
  SaveAnnotationPayload 
} from '../types';

export const hitlApi = {
  getBatchTasks: (batchId: string) => {
    return apiClient.get<HitlFrameTask[]>(`/hitl/batches/${encodeURIComponent(batchId)}/tasks`);
  },

  getTaskById: (taskId: string) => {
    return apiClient.get<HitlFrameTask>(`/hitl/tasks/${encodeURIComponent(taskId)}`);
  },

  saveAnnotation: (payload: SaveAnnotationPayload) => {
    return apiClient.post<{ success: boolean; taskId: string }>('/hitl/annotations', payload);
  },

  validateIoU: (taskId: string, boxes: BoundingBox[]) => {
    return apiClient.post<IoUValidationResult>(`/hitl/tasks/${encodeURIComponent(taskId)}/validate-iou`, {
      boxes,
    });
  },
};
