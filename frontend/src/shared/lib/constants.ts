export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    SESSIONS: '/auth/sessions',
  },
  PROJECTS: {
    BASE: '/projects',
  },
  DATA_LAB: {
    SLICES: '/data-lab/slices',
    DEDUP: '/data-lab/dedup',
    EXPORT: '/data-lab/export',
  },
  ACTIVE_MINING: {
    PCA_POINTS: '/active-mining/pca-points',
    KCENTER_SELECT: '/active-mining/kcenter-select',
    WEIGHTS: '/active-mining/weights',
  },
  HITL: {
    BATCHES: '/hitl/batches',
    TASKS: '/hitl/tasks',
    ANNOTATIONS: '/hitl/annotations',
  },
  BENCHMARK: {
    PROFILES: '/benchmark/profiles',
    RUN: '/benchmark/run',
    RUNS: '/benchmark/runs',
  },
  OVERVIEW: {
    SUMMARY: '/overview/summary',
    RECENT_RUNS: '/overview/recent-runs',
    DISTRIBUTION: '/overview/distribution',
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'greensm_access_token',
  REFRESH_TOKEN: 'greensm_refresh_token',
  USER: 'greensm_user',
} as const;

export const DEFAULT_PAGE_SIZE = 12;

export const YOLO_DETECTION_CLASSES = [
  'car',
  'suv',
  'motorbike',
  'truck',
  'bus',
  'pedestrian',
  'traffic_sign',
  'traffic_light',
] as const;

export const CVAT_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_CVAT_URL || 'https://cvat.itup.io.vn',
  get HOSTNAME(): string {
    try {
      const url = new URL(this.BASE_URL);
      return url.hostname;
    } catch {
      return 'cvat.itup.io.vn';
    }
  },
} as const;

