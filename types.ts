
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type VisualizationMode = 'equation' | 'pendulum' | 'gravity' | 'model';

export interface MathConfig {
  mode: VisualizationMode;
  equation: string;
  resolution: number;
  scale: number;
  k: number;
  modelUrl?: string;
}

export interface InteractionState {
  rotation: { x: number; y: number; z: number };
  zoom: number;
  parameterK: number;
}
