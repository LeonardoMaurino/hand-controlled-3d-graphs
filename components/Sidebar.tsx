
import React, { useState, useRef } from 'react';
import { MathConfig, InteractionState, VisualizationMode } from '../types';
import { PRESETS } from '../constants';

interface SidebarProps {
  config: MathConfig;
  setConfig: React.Dispatch<React.SetStateAction<MathConfig>>;
  interaction: InteractionState;
  onToggle: () => void;
  onResetView: () => void;
  onFileUpload: (file: File) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, interaction, onToggle, onResetView, onFileUpload }) => {
  const [localEquation, setLocalEquation] = useState(config.equation);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = () => {
    setConfig(prev => ({ ...prev, mode: 'equation', equation: localEquation }));
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    if (preset.mode === 'equation') {
      setLocalEquation(preset.eq);
      setConfig(prev => ({ ...prev, mode: 'equation', equation: preset.eq }));
    } else {
      setConfig(prev => ({ ...prev, mode: preset.mode as VisualizationMode }));
    }
  };

  return (
    <div className="w-80 h-full bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 p-6 flex flex-col shadow-2xl overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white">M</div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            MathAR <span className="text-[10px] text-gray-500 font-normal">v2.0</span>
          </h1>
        </div>
        <button onClick={onToggle} className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {/* Seção de Equação */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Entrada de Dados</label>
          <div className="relative group">
            <span className="absolute left-3 top-2.5 text-indigo-500 font-mono text-sm group-focus-within:text-cyan-400 transition-colors">f(x,y)=</span>
            <input
              type="text"
              value={localEquation}
              onChange={(e) => setLocalEquation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl py-2.5 pl-16 pr-3 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
              placeholder="sin(x) * cos(y)"
            />
          </div>
          <button 
            onClick={handleUpdate}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm"
          >
            Visualizar Função
          </button>
        </section>

        {/* Presets e Simulações */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Catálogo de Visualização</label>
          <div className="space-y-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => selectPreset(p)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex justify-between items-center group ${
                  (config.mode === p.mode && (p.mode !== 'equation' || config.equation === p.eq))
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/20' 
                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{p.name}</span>
                  {p.mode === 'equation' && <span className="text-[9px] font-mono opacity-60 truncate w-40">{p.eq}</span>}
                  {p.mode === 'pendulum' && <span className="text-[9px] opacity-60">Caos e Gravidade</span>}
                  {p.mode === 'gravity' && <span className="text-[9px] opacity-60">Distorção Espaço-Tempo</span>}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full transition-all ${config.mode === p.mode && (p.mode !== 'equation' || config.equation === p.eq) ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-transparent'}`}></div>
              </button>
            ))}
          </div>
        </section>

        {/* Modelos 3D Locais */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Meus Modelos</label>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".glb,.gltf"
            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 py-4 rounded-2xl text-xs font-bold text-gray-400 transition-all group"
          >
            <svg className="w-5 h-5 text-indigo-400 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar .GLB / .GLTF
          </button>
          {config.mode === 'model' && (
             <p className="text-[10px] text-cyan-400 text-center font-mono animate-pulse">Modelo 3D Ativo</p>
          )}
        </section>

        {/* Telemetria de Gestos */}
        <section className="bg-slate-800/40 rounded-2xl p-4 border border-white/5 space-y-4 shadow-inner">
          <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest">Interface de Gestos</label>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-400 uppercase">Input K / Vel:</span>
              <span className="font-mono text-cyan-400 font-bold">{interaction.parameterK.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-900/50 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300" 
                style={{ width: `${Math.min(100, (interaction.parameterK / 5) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-gray-500 uppercase">Rotação</span>
              <span className="text-[10px] font-mono text-indigo-400">
                {(interaction.rotation.y * 180 / Math.PI).toFixed(0)}° Y
              </span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[9px] text-gray-500 uppercase">Zoom</span>
              <span className="text-[10px] font-mono text-indigo-400">{interaction.zoom.toFixed(2)}x</span>
            </div>
          </div>

          <button 
            onClick={onResetView}
            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-gray-300 transition-all border border-white/5 active:scale-95"
          >
            RESETAR VISÃO
          </button>
        </section>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-[9px] text-gray-600 text-center uppercase tracking-tighter">
          Engenharia de Realidade Aumentada & Visão Computacional
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
