
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'https://esm.sh/three@0.182.0/examples/jsm/loaders/GLTFLoader.js';
import { MathConfig, InteractionState } from '../types';
import * as math from 'mathjs';
import { G, L1, L2, M1, M2 } from '../constants';

interface ArSceneProps {
  config: MathConfig;
  interaction: InteractionState;
}

// Estrutura para o estado físico do pêndulo
interface PendulumData {
  a1: number;
  a2: number;
  w1: number; // velocidade angular 1
  w2: number; // velocidade angular 2
}

const ArScene: React.FC<ArSceneProps> = ({ config, interaction }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const contentGroupRef = useRef<THREE.Group | null>(null);
  const isMountedRef = useRef(true);
  
  // Ref para física do pêndulo com RK4
  const pendulumState = useRef<PendulumData>({
    a1: Math.PI / 2 + 0.1, // Offset inicial para garantir caos imediato
    a2: Math.PI / 2,
    w1: 0,
    w2: 0,
  });

  // Ref para o rastro otimizado
  const trailRef = useRef({
    points: [] as THREE.Vector3[],
    maxPoints: 5000,
  });

  // Função que calcula as derivadas para o RK4
  const getDerivs = (state: PendulumData): PendulumData => {
    const { a1, a2, w1, w2 } = state;
    
    // Equação da aceleração angular 1 (dw1/dt)
    let num1 = -G * (2 * M1 + M2) * Math.sin(a1);
    let num2 = -M2 * G * Math.sin(a1 - 2 * a2);
    let num3 = -2 * Math.sin(a1 - a2) * M2;
    let num4 = w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(a1 - a2);
    let den = L1 * (2 * M1 + M2 - M2 * Math.cos(2 * a1 - 2 * a2));
    const dw1 = (num1 + num2 + num3 * num4) / den;

    // Equação da aceleração angular 2 (dw2/dt)
    num1 = 2 * Math.sin(a1 - a2);
    num2 = (w1 * w1 * L1 * (M1 + M2));
    num3 = G * (M1 + M2) * Math.cos(a1);
    num4 = w2 * w2 * L2 * M2 * Math.cos(a1 - a2);
    den = L2 * (2 * M1 + M2 - M2 * Math.cos(2 * a1 - 2 * a2));
    const dw2 = (num1 * (num2 + num3 + num4)) / den;

    return {
      a1: w1, // da1/dt = w1
      a2: w2, // da2/dt = w2
      w1: dw1,
      w2: dw2
    };
  };

  // Passo de Integração RK4
  const rk4Step = (state: PendulumData, dt: number): PendulumData => {
    const k1 = getDerivs(state);
    
    const s2 = {
      a1: state.a1 + k1.a1 * dt / 2,
      a2: state.a2 + k1.a2 * dt / 2,
      w1: state.w1 + k1.w1 * dt / 2,
      w2: state.w2 + k1.w2 * dt / 2
    };
    const k2 = getDerivs(s2);

    const s3 = {
      a1: state.a1 + k2.a1 * dt / 2,
      a2: state.a2 + k2.a2 * dt / 2,
      w1: state.w1 + k2.w1 * dt / 2,
      w2: state.w2 + k2.w2 * dt / 2
    };
    const k3 = getDerivs(s3);

    const s4 = {
      a1: state.a1 + k3.a1 * dt,
      a2: state.a2 + k3.a2 * dt,
      w1: state.w1 + k3.w1 * dt,
      w2: state.w2 + k3.w2 * dt
    };
    const k4 = getDerivs(s4);

    return {
      a1: state.a1 + (dt / 6) * (k1.a1 + 2 * k2.a1 + 2 * k3.a1 + k4.a1),
      a2: state.a2 + (dt / 6) * (k1.a2 + 2 * k2.a2 + 2 * k3.a2 + k4.a2),
      w1: state.w1 + (dt / 6) * (k1.w1 + 2 * k2.w1 + 2 * k3.w1 + k4.w1),
      w2: state.w2 + (dt / 6) * (k1.w2 + 2 * k2.w2 + 2 * k3.w2 + k4.w2)
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;
    isMountedRef.current = true;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const contentGroup = new THREE.Group();
    scene.add(contentGroup);
    contentGroupRef.current = contentGroup;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const animate = () => {
      if (!isMountedRef.current) return;
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!contentGroupRef.current || !sceneRef.current) return;
    const group = contentGroupRef.current;

    while(group.children.length > 0){ 
      const obj = group.children[0];
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) (obj as any).material.forEach((m:any) => m.dispose());
        else (obj as any).material.dispose();
      }
      group.remove(obj); 
    }

    if (config.mode === 'equation') {
      try {
        const { equation, resolution } = config;
        const compiled = math.compile(equation);
        const size = 4;
        const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
        const positions = geometry.attributes.position.array as Float32Array;

        for (let i = 0; i <= resolution; i++) {
          for (let j = 0; j <= resolution; j++) {
            const x = (i / resolution) * size - size / 2;
            const y = (j / resolution) * size - size / 2;
            let z = compiled.evaluate({ x, y, k: interaction.parameterK });
            if (isNaN(z) || !isFinite(z)) z = 0;
            const index = (i * (resolution + 1) + j) * 3;
            positions[index + 2] = z * 0.5;
          }
        }
        geometry.computeVertexNormals();
        const material = new THREE.MeshPhongMaterial({ color: 0x4f46e5, side: THREE.DoubleSide, shininess: 80 });
        group.add(new THREE.Mesh(geometry, material));
      } catch(e) {}
    } 
    
    else if (config.mode === 'gravity') {
      const size = 6;
      const resolution = 60;
      const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
      const positions = geometry.attributes.position.array as Float32Array;
      const mass = interaction.parameterK * 0.5;

      for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
          const x = (i / resolution) * size - size / 2;
          const y = (j / resolution) * size - size / 2;
          const distSq = x*x + y*y;
          const z = -mass / (Math.sqrt(distSq) + 0.3);
          const index = (i * (resolution + 1) + j) * 3;
          positions[index + 2] = z;
        }
      }
      geometry.computeVertexNormals();
      const material = new THREE.MeshPhongMaterial({ color: 0x1e1b4b, wireframe: true, emissive: 0x4338ca, emissiveIntensity: 0.5 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);

      const sphere = new THREE.Mesh(new THREE.SphereGeometry(mass * 0.2, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x6366f1 }));
      sphere.position.y = -mass * 0.5;
      group.add(sphere);
    }

    else if (config.mode === 'pendulum') {
      const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L1), new THREE.MeshStandardMaterial({color: 0x818cf8, metalness: 0.8, roughness: 0.1}));
      const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L2), new THREE.MeshStandardMaterial({color: 0x818cf8, metalness: 0.8, roughness: 0.1}));
      const bob1 = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshStandardMaterial({color: 0x4f46e5, emissive: 0x4f46e5, emissiveIntensity: 0.4}));
      const bob2 = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshStandardMaterial({color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.8}));
      
      group.add(rod1, rod2, bob1, bob2);

      // Rastro ULTRA Otimizado
      const maxTrailPoints = trailRef.current.maxPoints;
      const trailPositions = new Float32Array(maxTrailPoints * 3);
      const trailGeometry = new THREE.BufferGeometry();
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      
      const trailMaterial = new THREE.LineBasicMaterial({ 
        color: 0xec4899, 
        transparent: true, 
        opacity: 0.5,
        blending: THREE.AdditiveBlending 
      });
      const trailLine = new THREE.Line(trailGeometry, trailMaterial);
      group.add(trailLine);

      // Limpar rastro ao trocar de modo ou reiniciar
      trailRef.current.points = [];

      let physicsFrameId: number;
      const physicsLoop = () => {
        if (!isMountedRef.current || config.mode !== 'pendulum') return;
        
        // Fator dt controlado pela mão (parameterK)
        // Usamos sub-steps para garantir estabilidade mesmo em alta velocidade
        const dtBase = (interaction.parameterK * 0.008); 
        const subSteps = 4;
        const dt = dtBase / subSteps;

        for (let i = 0; i < subSteps; i++) {
          pendulumState.current = rk4Step(pendulumState.current, dt);
        }

        const { a1, a2 } = pendulumState.current;
        const x1 = L1 * Math.sin(a1);
        const y1 = -L1 * Math.cos(a1);
        const x2 = x1 + L2 * Math.sin(a2);
        const y2 = y1 - L2 * Math.cos(a2);

        bob1.position.set(x1, y1, 0);
        bob2.position.set(x2, y2, 0);
        rod1.position.set(x1/2, y1/2, 0);
        rod1.rotation.z = Math.atan2(y1, x1) + Math.PI/2;
        rod2.position.set(x1 + (x2-x1)/2, y1 + (y2-y1)/2, 0);
        rod2.rotation.z = Math.atan2(y2-y1, x2-x1) + Math.PI/2;

        // Atualização do Rastro por Buffer
        const points = trailRef.current.points;
        points.push(new THREE.Vector3(x2, y2, 0));
        if (points.length > maxTrailPoints) points.shift();

        const posAttr = trailLine.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < points.length; i++) {
          posAttr.setXYZ(i, points[i].x, points[i].y, points[i].z);
        }
        // Marcar pontos não utilizados como o último ponto válido para não desenhar linhas para o centro (0,0,0)
        for (let i = points.length; i < maxTrailPoints; i++) {
          const last = points[points.length - 1] || new THREE.Vector3();
          posAttr.setXYZ(i, last.x, last.y, last.z);
        }
        posAttr.needsUpdate = true;

        physicsFrameId = requestAnimationFrame(physicsLoop);
      };
      physicsLoop();

      return () => cancelAnimationFrame(physicsFrameId);
    }

    else if (config.mode === 'model' && config.modelUrl) {
      const loader = new GLTFLoader();
      loader.load(config.modelUrl, (gltf: any) => {
        if (!isMountedRef.current) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const scale = 3 / Math.max(size.x, size.y, size.z);
        model.scale.set(scale, scale, scale);
        group.add(model);
      });
    }

  }, [config, interaction.parameterK]);

  useEffect(() => {
    if (contentGroupRef.current) {
      contentGroupRef.current.rotation.x = interaction.rotation.x;
      contentGroupRef.current.rotation.y = interaction.rotation.y;
      const s = interaction.zoom;
      contentGroupRef.current.scale.set(s, s, s);
    }
  }, [interaction.rotation, interaction.zoom]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ArScene;
