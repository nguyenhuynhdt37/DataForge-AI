export type ExportFormat = 'coco' | 'yolo' | 'pascal_voc';
export type DedupAlgorithm = 'phash' | 'clip_embedding';

export interface DataSlice {
  id: string;
  name: string;
  description?: string;
  total_samples: number;
  hard_samples_count: number;
  tags: string[];
  weather_condition?: string;
  lighting_condition?: string;
  status: 'active' | 'archived' | 'processing';
  created_at: string;
  updated_at?: string;
}

export interface SliceQueryFilters {
  keyword?: string;
  tag?: string;
  min_uncertainty?: number;
  weather?: string;
  lighting?: string;
  limit?: number;
  offset?: number;
}

export interface DedupJobRequest {
  slice_id: string;
  similarity_threshold: number;
  algorithm: DedupAlgorithm;
}

export interface DedupJobResponse {
  job_id: string;
  slice_id: string;
  removed_duplicates: number;
  retained_samples: number;
  execution_time_ms: number;
  status: 'completed' | 'failed' | 'running';
}

export interface SliceExportRequest {
  slice_id: string;
  format: ExportFormat;
  include_hard_slices_only?: boolean;
}

export interface SliceExportResponse {
  export_id: string;
  download_url: string;
  file_size: string;
  total_exported: number;
  format: ExportFormat;
}
