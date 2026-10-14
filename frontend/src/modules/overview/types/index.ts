export interface OverviewSummary {
  totalProjects: number;
  totalAnnotatedFrames: number;
  activeTasks: number;
  qualityRate: number;
  unresolvedHardSlices: number;
}

export interface RecentRun {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'completed' | 'failed';
  duration: string;
  completedAt: string;
}

export interface DatasetDistribution {
  category: string;
  count: number;
  percentage: number;
}
