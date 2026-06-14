import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BubblesProps {
  position: [number, number, number];
  count?: number;
  areaSize?: [number, number];
  speed?: number;
  enabled?: boolean;
}

export function Bubbles({ position, count = 100, areaSize = [4, 4], speed = 1, enabled = true }: BubblesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const data = useMemo(() => {
    const bubbles: {
      offset: [number, number, number];
      speed: number;
      size: number;
      phase: number;
    }[] = [];
    
    for (let i = 0; i < count; i++) {
      bubbles.push({
        offset: [
          (Math.random() - 0.5) * areaSize[0],
          Math.random() * 3,
          (Math.random() - 0.5) * areaSize[1],
        ],
        speed: 0.5 + Math.random() * 1,
        size: 0.05 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return bubbles;
  }, [count, areaSize]);

  useFrame((state) => {
    if (!meshRef.current || !enabled) return;
    
    const time = state.clock.elapsedTime;
    
    data.forEach((bubble, i) => {
      const y = ((time * bubble.speed * speed + bubble.phase) % 3) - 0.5;
      const x = Math.sin(time * 2 + bubble.phase) * 0.1;
      const z = Math.cos(time * 1.5 + bubble.phase) * 0.1;
      
      dummy.position.set(
        position[0] + bubble.offset[0] + x,
        position[1] + y,
        position[2] + bubble.offset[2] + z
      );
      dummy.scale.setScalar(bubble.size * (0.8 + Math.sin(time * 3 + bubble.phase) * 0.2));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshPhysicalMaterial
        transparent
        opacity={0.6}
        color="#ffffff"
        roughness={0.1}
        metalness={0.1}
        transmission={0.9}
        thickness={0.5}
        emissive="#00D4FF"
        emissiveIntensity={0.3}
      />
    </instancedMesh>
  );
}
