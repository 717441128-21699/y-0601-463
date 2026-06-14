import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WaterFlow } from '../effects/WaterFlow';
import type { PipelineSegment } from '../../types';

interface PipelineProps {
  segment: PipelineSegment;
  showFlow?: boolean;
}

export function Pipeline({ segment, showFlow = true }: PipelineProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { position, rotation, length } = useMemo(() => {
    const start = new THREE.Vector3(...segment.start);
    const end = new THREE.Vector3(...segment.end);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    
    const rotation = new THREE.Euler();
    if (length > 0) {
      const axis = new THREE.Vector3(0, 1, 0);
      const dirNorm = direction.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dirNorm);
      rotation.setFromQuaternion(quaternion);
    }
    
    return {
      position: midPoint.toArray() as [number, number, number],
      rotation: [rotation.x, rotation.y, rotation.z] as [number, number, number],
      length,
    };
  }, [segment.start, segment.end]);

  useFrame((state) => {
    if (meshRef.current && segment.flowRate > 0) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const pipeColor = segment.flowRate > 0 ? segment.color : '#4A5568';
  const glowIntensity = segment.flowRate > 0 ? 0.3 : 0;

  return (
    <group>
      <mesh ref={meshRef} position={position} rotation={rotation} castShadow>
        <cylinderGeometry args={[0.25, 0.25, length, 12]} />
        <meshStandardMaterial
          color="#2D3748"
          roughness={0.6}
          metalness={0.4}
          emissive={pipeColor}
          emissiveIntensity={glowIntensity}
        />
      </mesh>
      
      <mesh position={position} rotation={rotation}>
        <cylinderGeometry args={[0.28, 0.28, length + 0.1, 12]} />
        <meshBasicMaterial
          color={pipeColor}
          transparent
          opacity={0.15}
        />
      </mesh>
      
      {showFlow && segment.flowRate > 0 && (
        <WaterFlow
          start={segment.start}
          end={segment.end}
          flowRate={segment.flowRate / 100}
          color={segment.color}
          pipeRadius={0.2}
        />
      )}
    </group>
  );
}
