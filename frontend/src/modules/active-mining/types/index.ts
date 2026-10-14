export interface MiningPoint {
  id: number | string;
  x: number;
  y: number;
  isHardSlice: boolean;
  scale?: number;
  confidence?: number;
  entropy?: number;
}

export interface MiningWeights {
  uncertaintyMargin: number;
  sliceWeight: number;
  diversity: number;
}

export interface KCenterRunPayload {
  projectId?: string;
  budget: number;
  weights: MiningWeights;
}

export interface KCenterRunResult {
  selectedSampleIds: string[];
  totalScanned: number;
  executionTimeMs: number;
  hardSlicesFound: number;
  distributionScore: number;
}
