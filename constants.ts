
export const DEFAULT_EQUATION = "sin(x * k) * cos(y * k)";
export const GRID_SIZE = 2;
export const RESOLUTION = 50;
export const CAMERA_FOV = 75;
export const PINCH_THRESHOLD = 0.05;

export const PRESETS = [
  { name: "Ondas de Interferência", eq: "sin(x * k) * cos(y * k)", mode: 'equation' as const },
  { name: "Sela de Macaco", eq: "x^2 - y^2", mode: 'equation' as const },
  { name: "Ripple de Água", eq: "cos(sqrt(x^2 + y^2) * k)", mode: 'equation' as const },
  { name: "Campo Harmônico", eq: "sin(x*k) + cos(y*k)", mode: 'equation' as const },
  { name: "Gaussiana Dinâmica", eq: "k * exp(-(x^2 + y^2))", mode: 'equation' as const },
  { name: "Pêndulo Duplo", eq: "", mode: 'pendulum' as const },
  { name: "Curvatura Gravitacional", eq: "", mode: 'gravity' as const }
];

// Física do Pêndulo
export const G = 9.81;
export const L1 = 1.0;
export const L2 = 1.0;
export const M1 = 1.0;
export const M2 = 1.0;
