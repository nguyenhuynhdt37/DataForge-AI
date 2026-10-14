export interface BoundingBox {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  isAutoAnnotated?: boolean;
}

export interface HitlFrameTask {
  id: string;
  batchId: string;
  frameIndex: number;
  totalFrames: number;
  imageUrl: string;
  iouScore?: number;
  isAutoVerified: boolean;
  boxes: BoundingBox[];
}

export interface SaveAnnotationPayload {
  taskId: string;
  batchId: string;
  boxes: BoundingBox[];
  timeSpentSeconds?: number;
}

export interface IoUValidationResult {
  taskId: string;
  iou: number;
  passed: boolean;
  discrepanciesCount: number;
  message?: string;
}
