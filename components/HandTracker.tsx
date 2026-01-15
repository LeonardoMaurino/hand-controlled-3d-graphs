
import React, { useEffect, useRef, useState } from 'react';
import * as mpHands from '@mediapipe/hands';
import * as mpCamera from '@mediapipe/camera_utils';

const Hands = (mpHands as any).Hands || (mpHands as any).default?.Hands || (window as any).Hands;
const Camera = (mpCamera as any).Camera || (mpCamera as any).default?.Camera || (window as any).Camera;

interface HandTrackerProps {
  onGesture: (delta: any) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGesture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs persistentes para instâncias do MediaPipe
  const handsInstanceRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);

  const stateRef = useRef({
    leftHandPos: null as { x: number, y: number } | null,
    rightPinchDist: null as number | null,
    kHistory: [] as number[],
    isDestroyed: false,
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current || !Hands || !Camera || initializedRef.current) return;

    stateRef.current.isDestroyed = false;

    try {
      const hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results: any) => {
        if (stateRef.current.isDestroyed) return;
        
        setIsLoading(false);
        
        let leftHandDetected = false;
        let rightHandDetected = false;

        if (results.multiHandLandmarks && results.multiHandedness) {
          results.multiHandLandmarks.forEach((landmarks: any, index: number) => {
            const classification = results.multiHandedness[index];
            const isRightHand = classification.label === 'Left'; 
            const state = stateRef.current;

            if (!isRightHand) {
              leftHandDetected = true;
              const palmCenter = {
                x: (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3,
                y: (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3,
              };

              if (state.leftHandPos) {
                const dx = (palmCenter.x - state.leftHandPos.x);
                const dy = (palmCenter.y - state.leftHandPos.y);
                
                if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
                  onGesture({ 
                    rotationDelta: { x: dy * 4.5, y: dx * 4.5, z: 0 } 
                  });
                }
              }
              state.leftHandPos = palmCenter;
            }

            if (isRightHand) {
              rightHandDetected = true;
              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              const currentPinchDist = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) + 
                Math.pow(thumbTip.y - indexTip.y, 2)
              );

              if (currentPinchDist < 0.15) {
                if (state.rightPinchDist !== null) {
                  const pinchDelta = (currentPinchDist - state.rightPinchDist);
                  if (Math.abs(pinchDelta) > 0.001) {
                    onGesture({ zoomDelta: pinchDelta * 4 });
                  }
                }
                state.rightPinchDist = currentPinchDist;
              } else {
                state.rightPinchDist = null;
              }

              const rawK = 0.5 + ((1 - landmarks[0].y) * 4.5);
              state.kHistory.push(rawK);
              if (state.kHistory.length > 5) state.kHistory.shift();
              const smoothedK = state.kHistory.reduce((a, b) => a + b, 0) / state.kHistory.length;
              onGesture({ parameterK: smoothedK });
            }
          });
        }

        if (!leftHandDetected) stateRef.current.leftHandPos = null;
        if (!rightHandDetected) stateRef.current.rightPinchDist = null;
      });

      handsInstanceRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          // A verificação do handsInstanceRef.current é essencial para evitar o erro SolutionWasm*
          if (!stateRef.current.isDestroyed && handsInstanceRef.current && videoRef.current) {
            try {
              await handsInstanceRef.current.send({ image: videoRef.current });
            } catch (e) {
              // Silenciar erros de envio durante o desligamento
            }
          }
        },
        width: 640,
        height: 480,
      });

      cameraInstanceRef.current = camera;
      camera.start();
      initializedRef.current = true;
    } catch (err) {
      console.error("Erro na inicialização do HandTracker:", err);
    }

    return () => {
      stateRef.current.isDestroyed = true;
      initializedRef.current = false;
      
      // Limpeza segura: para a câmera primeiro
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop();
        cameraInstanceRef.current = null;
      }
      
      // Anula a referência antes de chamar close() para que onFrame pare imediatamente
      if (handsInstanceRef.current) {
        const h = handsInstanceRef.current;
        handsInstanceRef.current = null;
        try {
          h.close();
        } catch (e) {
          // Erro esperado se o Wasm já estiver em processo de destruição
        }
      }
    };
  }, [onGesture]);

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover opacity-60"
        style={{ transform: 'scaleX(-1)' }}
        playsInline
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-white">Iniciando Visão AR...</p>
          <p className="text-sm text-gray-400 mt-2">Ativando detecção de mãos duplas</p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-indigo-500/20 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default HandTracker;
