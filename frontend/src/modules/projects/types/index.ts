export type CampaignType = 
  | 'Active Learning V3' 
  | 'Hard Slice Curation' 
  | 'Edge INT8 Benchmark' 
  | 'Zero-Shot Discovery';

export interface ProjectItem {
  id: string;
  name: string;
  title?: string;
  description?: string;
  type: string;
  status: string;
  status_color?: string;
  statusColor?: string;
  progress: number;
  total_frames?: string;
  totalFrames?: string;
  annotated_frames?: string;
  annotatedFrames?: string;
  annotators: number;
  lead: string;
  last_active?: string;
  lastActive?: string;
  tasks_count?: number;
  tasksCount?: number;
  created_at?: string;
}

export interface CreateProjectPayload {
  id?: string;
  name: string;
  description?: string;
  campaign_type?: CampaignType | string;
}

export interface ProjectFilterState {
  searchTerm: string;
  status?: string;
  type?: string;
}
