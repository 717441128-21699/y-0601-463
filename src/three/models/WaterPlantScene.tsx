import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sky } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ProcessPool } from './ProcessPool';
import { Pipeline } from './Pipeline';
import { Pump } from './Pump';
import { Valve } from './Valve';
import { Bubbles } from '../effects/Bubbles';
import { ParticleSystem } from '../effects/ParticleSystem';
import { useWaterPlantStore } from '../../store/useWaterPlantStore';
import { mockPipelines } from '../../services/mock/pools';
import type { CameraPreset } from '../../types';

interface WaterPlantSceneProps {
  onPoolClick: (poolId: string) => void;
  cameraPreset?: CameraPreset;
}

export function WaterPlantScene({ onPoolClick, cameraPreset }: WaterPlantSceneProps) {
  const { pools, filters, pumpHouseData, selectedPoolId, setSelectedPool } = useWaterPlantStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (cameraPreset && controlsRef.current) {
      const startPos = camera.position.clone();
      const startTarget = controlsRef.current.target.clone();
      const endPos = new THREE.Vector3(...cameraPreset.position);
      const endTarget = new THREE.Vector3(...cameraPreset.target);
      
      let progress = 0;
      const animate = () => {
        progress += 0.02;
        if (progress <= 1) {
          camera.position.lerpVectors(startPos, endPos, progress);
          controlsRef.current.target.lerpVectors(startTarget, endTarget, progress);
          controlsRef.current.update();
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }, [cameraPreset, camera]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  const sortedFilters = [...filters].sort((a, b) => b.priority - a.priority);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        dampingFactor={0.05}
        enableDamping
      />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#87CEEB', '#1A365D', 0.6]} />
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <pointLight position={[-10, 5, -16]} intensity={0.8} color="#FFA502" distance={20} />
      <pointLight position={[0, 5, 0]} intensity={0.6} color="#00D4FF" distance={25} />
      <pointLight position={[18, 5, 0]} intensity={0.6} color="#1E90FF" distance={20} />
      <pointLight position={[0, 8, 15]} intensity={1} color="#00D4FF" distance={30} />

      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.5}
        azimuth={0.25}
        rayleigh={2}
        turbidity={8}
      />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#1A202C"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      <mesh position={[0, 0, -30]}>
        <boxGeometry args={[100, 15, 1]} />
        <meshStandardMaterial
          color="#2D3748"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {pools.map(pool => (
        <ProcessPool
          key={pool.id}
          pool={pool}
          isSelected={selectedPoolId === pool.id}
          onClick={() => {
            setSelectedPool(pool.id);
            onPoolClick(pool.id);
          }}
        />
      ))}

      {mockPipelines.map(pipe => {
        const isDosingPipe = pipe.type === 'chemical';
        const isBackwashPipe = pipe.type === 'backwash';
        const filter = filters.find(f => 
          f.position.every((v, i) => v === pipe.start[i] || v === pipe.end[i])
        );
        
        let flowRate = pipe.flowRate;
        if (isBackwashPipe && filter) {
          flowRate = filter.isBackwashing ? 800 : 0;
        }
        
        return (
          <Pipeline
            key={pipe.id}
            segment={{ ...pipe, flowRate }}
            showFlow={isDosingPipe || flowRate > 0}
          />
        );
      })}

      {filters.map(filter => (
        filter.isBackwashing && (
          <Bubbles
            key={`bubbles-${filter.id}`}
            position={[filter.position[0], filter.position[1] + 0.5, filter.position[2]]}
            count={80}
            areaSize={[4, 5]}
            speed={1.5}
            enabled={filter.isBackwashing}
          />
        )
      ))}

      {[0, 1, 2, 3, 4].map(i => {
        const x = 18 + (i % 2) * 2.5 - 2.5;
        const z = i < 2 ? 2 : -2;
        const isRunning = i < pumpHouseData.runningPumps || 
          (i === 4 && pumpHouseData.standbyPumpOn);
        return (
          <Pump
            key={`pump-${i}`}
            position={[x, 0, z]}
            isRunning={isRunning}
            frequency={pumpHouseData.frequency}
          />
        );
      })}

      {Object.entries(pumpHouseData.valveStatus).map(([id, status], i) => (
        <Valve
          key={`valve-${id}`}
          position={[22, 0.5, -3 + i * 1.5]}
          rotation={[0, Math.PI / 2, 0]}
          status={status}
        />
      ))}

      <ParticleSystem position={[0, 10, 0]} count={150} color="#00D4FF" size={0.08} speed={0.5} />
      <ParticleSystem position={[-15, 8, -10]} count={80} color="#1E90FF" size={0.05} speed={0.3} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
          mipmapBlur
        />
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.02}
          bokehScale={2}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>

      <fog attach="fog" args={['#0A1628', 40, 100]} />
    </>
  );
}
