
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ArScene from './components/ArScene';
import HandTracker from './components/HandTracker';
import Sidebar from './components/Sidebar';
import { MathConfig, InteractionState, VisualizationMode } from './types';
import { DEFAULT_EQUATION } from './constants';

const App: React.FC = () => {
  const [config, setConfig] = useState<MathConfig>({
    mode: 'equation',
    equation: DEFAULT_EQUATION,
    resolution: 50,
    scale: 1,
    k: 2.0,
  });

  const [interaction, setInteraction] = useState<InteractionState>({
    rotation: { x: 0, y: 0, z: 0 },
    zoom: 1,
    parameterK: 2.0,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleGestures = useCallback((delta: any) => {
    setInteraction(prev => {
      const newRotation = delta.rotationDelta 
        ? {
            x: prev.rotation.x + delta.rotationDelta.x,
            y: prev.rotation.y + delta.rotationDelta.y,
            z: prev.rotation.z + (delta.rotationDelta.z || 0),
          }
        : prev.rotation;

      const newZoom = delta.zoomDelta !== undefined 
        ? Math.max(0.1, Math.min(5, prev.zoom + delta.zoomDelta))
        : prev.zoom;

      // Restaurado para 1 para todos os modos, permitindo controle total
      const kFactor = 1;
      const finalK = delta.parameterK !== undefined ? delta.parameterK * kFactor : prev.parameterK;

      return {
        ...prev,
        rotation: newRotation,
        zoom: newZoom,
        parameterK: finalK,
      };
    });
  }, []);

  const resetView = () => {
    setInteraction(prev => ({
      ...prev,
      rotation: { x: 0, y: 0, z: 0 },
      zoom: 1
    }));
  };

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setConfig(prev => ({
      ...prev,
      mode: 'model',
      modelUrl: url
    }));
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-black text-white">
      <HandTracker onGesture={handleGestures} />

      <div className="absolute inset-0 pointer-events-none">
        <ArScene 
          config={config} 
          interaction={interaction} 
        />
      </div>

      <div className={`absolute left-0 top-0 h-full z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          config={config} 
          setConfig={setConfig} 
          interaction={interaction}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onResetView={resetView}
          onFileUpload={handleFileUpload}
        />
      </div>

      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-4 top-4 z-50 p-3 bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Legenda de Controle Adaptativa */}
      <div className="absolute bottom-6 right-6 p-5 bg-black/70 backdrop-blur-lg rounded-2xl border border-white/10 max-w-xs pointer-events-none select-none shadow-2xl">
        <h3 className="text-xs font-black text-indigo-400 mb-3 uppercase tracking-[0.2em]">Esquema de Controle</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Mão Esquerda</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-gray-200">Mover: Rotacionar Objeto</span>
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Mão Direita</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-xs text-gray-200">Pinça: Zoom (aproximar/afastar)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-xs text-gray-200">
                Altura: {config.mode === 'pendulum' ? 'Velocidade Física' : config.mode === 'gravity' ? 'Massa/Gravidade' : 'Parâmetro k'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
