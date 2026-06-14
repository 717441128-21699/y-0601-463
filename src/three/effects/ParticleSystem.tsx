import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
  position: [number, number, number];
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
}

export function ParticleSystem({ 
  position, 
  count = 200, 
  color = '#00D4FF', 
  size = 0.05,
  speed = 1 
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, velocities, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 5 + Math.random() * 10;
      
      positions[i * 3] = position[0] + radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = position[1] + radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = position[2] + radius * Math.cos(phi);
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = 0.01 + Math.random() * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      sizes[i] = size * (0.5 + Math.random() * 0.5);
    }
    
    return { positions, velocities, sizes };
  }, [position, count, size]);

  useFrame(() => {
    if (!pointsRef.current) return;
    
    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] += velocities[i * 3] * speed;
      posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] * speed;
      posAttr.array[i * 3 + 2] += velocities[i * 3 + 2] * speed;
      
      if (posAttr.array[i * 3 + 1] > position[1] + 15) {
        posAttr.array[i * 3 + 1] = position[1] - 5;
      }
    }
    
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
