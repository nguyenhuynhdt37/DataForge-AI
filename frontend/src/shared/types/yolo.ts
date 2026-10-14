export type YoloClass = 
  | 'car'
  | 'suv'
  | 'motorbike'
  | 'truck'
  | 'bus'
  | 'pedestrian'
  | 'traffic_sign'
  | 'traffic_light'
  | 'road_barrier'
  | 'cone';

export interface BoundingBoxCoord {
  id: string;
  label: YoloClass;
  x: number;      // Tọa độ góc trên bên trái (chuẩn hóa 0..1 hoặc pixel)
  y: number;
  width: number;
  height: number;
  confidence?: number;
  color?: string;
}

export interface YoloDetection {
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  confidence: number;
  class_id: number;
  class_name: YoloClass;
}

export interface ModelInferenceResult {
  image_id: string;
  image_width: number;
  image_height: number;
  detections: YoloDetection[];
  inference_time_ms: number;
  preprocess_time_ms?: number;
  postprocess_time_ms?: number;
  model_name: string;
  hardware_target?: string;
}

export interface HardSliceCriteria {
  min_uncertainty: number;
  min_entropy?: number;
  low_confidence_ratio?: number;
  weather_anomaly?: boolean;
}
