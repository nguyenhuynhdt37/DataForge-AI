export type ModelQuantization = 'INT8' | 'FP16' | 'FP32';

export interface BenchmarkProfile {
  id: string;
  modelName: string;
  quantization: ModelQuantization;
  latencyMs: number;
  fps: number;
  mAP50: number;
  mAP50_95: number;
  memoryMb: number;
  device: string;
  testedAt: string;
}

export interface BenchmarkRunPayload {
  modelName: string;
  quantization: ModelQuantization;
  datasetSliceId?: string;
  iterations?: number;
}

export interface BenchmarkRunResponse {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  profile?: BenchmarkProfile;
  message?: string;
}

export interface MatrixBenchmarkRow {
  id: string;
  device: string;
  backend: string;
  precision: ModelQuantization;
  latencyP50: number;
  latencyP95: number;
  fps: number;
  powerWatts: number;
  accuracyRetention: number;
  status: 'optimal' | 'acceptable' | 'heavy';
}

export interface SliceAccuracyDelta {
  sliceId: string;
  sliceName: string;
  condition: string;
  baselineMap50: number;
  activeTrainedMap50: number;
  deltaPercent: number;
  sampleCount: number;
  tag: string;
}
