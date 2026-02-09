
export enum RoadDefectType {
  LONGITUDINAL = 'Longitudinal Crack',
  TRANSVERSE = 'Transverse Crack',
  ALLIGATOR = 'Alligator/Fatigue Crack',
  EDGE = 'Edge Crack',
  BLOCK = 'Block Cracking',
  POTHOLE = 'Pothole',
  RUTTING = 'Rutting',
  BLEEDING = 'Bleeding',
  DEPRESSION = 'Depression/Settlement',
  SURFACE_WEAR = 'Surface Wear/Raveling',
  PATCHING = 'Patching/Utility Cut',
  NONE = 'None'
}

export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface Point {
  x: number;
  y: number;
}

export interface Coordinates {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Detection {
  id: string;
  type: RoadDefectType;
  severity: Severity;
  confidence: number;
  dimensions: string;
  coordinates: Coordinates;
  polygonPoints?: Point[]; // Precision geometry
  description: string;
}

export interface AnalysisReport {
  id: string;
  timestamp: number;
  imageName: string;
  imageData: string;
  status: 'Issues Detected' | 'No Issues Found';
  totalDetections: number;
  overallSeverityIndex: Severity;
  detections: Detection[];
  maintenancePriority: number;
  suggestedAction: string;
}
