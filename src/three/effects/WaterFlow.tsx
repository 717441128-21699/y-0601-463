import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaterFlowProps {
  start: [number, number, number];
  end: [number, number, number];
  flowRate?: number;
  color?: string;
  pipeRadius?: number;
}

export function WaterFlow({ 
  start, 
  end, 
  flowRate = 1, 
  color = '#00D4FF',
  pipeRadius = 0.3 
}: WaterFlowProps) {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = Math.floor(flowRate * 20);
  
  const { positions, offsets } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const offsets = new Float32Array(particleCount);
    
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pos = startVec.clone().lerp(endVec, t);
      
      const perpendicular = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize().multiplyScalar(pipeRadius * 0.3);
      
      positions[i * 3] = pos.x + perpendicular.x;
      positions[i * 3 + 1] = pos.y + perpendicular.y;
      positions[i * 3 + 2] = pos.z + perpendicular.z;
      
      offsets[i] = Math.random();
    }
    
    return { positions, offsets };
  }, [start, end, particleCount, pipeRadius]);

  useFrame((state) => {
    if (!particlesRef.current || particleCount === 0) return;
    
    const time = state.clock.elapsedTime;
    const geometry = particlesRef.current.geometry;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    
    for (let i = 0; i < particleCount; i++) {
      let t = ((time * 0.5 * flowRate + offsets[i]) % 1.0);
      
      const pos = startVec.clone().lerp(endVec, t);
      
      const wave = Math.sin(time * 3 + offsets[i] * 10) * 0.1;
      const perp = new THREE.Vector3(
        Math.sin(time * 2 + offsets[i] * 5) * 0.1,
        wave,
        Math.cos(time * 2 + offsets[i] * 5) * 0.1
      );
      
      pos.add(perp);
      
      posAttr.array[i * 3] = pos.x;
      posAttr.array[i * 3 + 1] = pos.y;
      posAttr.array[i * 3 + 2] = pos.z;
    }
    
    posAttr.needsUpdate = true;
  });

  if (particleCount === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
