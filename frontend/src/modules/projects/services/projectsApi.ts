import { apiClient } from '@/shared/lib/apiClient';
import { ApiResponse } from '@/shared/types/common';
import { CreateProjectPayload, ProjectItem } from '../types';

export const projectsApi = {
  getProjects: (options?: { requiresAuth?: boolean }) => {
    return apiClient.get<ProjectItem[]>('/projects', { 
      requiresAuth: options?.requiresAuth ?? false 
    });
  },

  getProjectById: (id: string, options?: { requiresAuth?: boolean }) => {
    return apiClient.get<ProjectItem>(`/projects/${id}`, { 
      requiresAuth: options?.requiresAuth ?? false 
    });
  },

  createProject: (payload: CreateProjectPayload, options?: { requiresAuth?: boolean }) => {
    return apiClient.post<ProjectItem>('/projects', payload, { 
      requiresAuth: options?.requiresAuth ?? false 
    });
  },

  updateProject: (id: string, payload: Partial<CreateProjectPayload>, options?: { requiresAuth?: boolean }) => {
    return apiClient.patch<ProjectItem>(`/projects/${id}`, payload, { 
      requiresAuth: options?.requiresAuth ?? false 
    });
  },

  deleteProject: (id: string, options?: { requiresAuth?: boolean }) => {
    return apiClient.delete<{ success: boolean; id: string }>(`/projects/${id}`, { 
      requiresAuth: options?.requiresAuth ?? false 
    });
  },
};
