import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PumpProps {
  position: [number, number, number];
  isRunning: boolean;
  frequency?: number;
}

export function Pump({ position, isRunning, frequency = 50 }: PumpProps) {
  const groupRef = useRef<THREE.Group>(null);
  const impellerRef = useRef<THREE.Group>(null);
  const motorRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (impellerRef.current && isRunning) {
      const speed = (frequency / 50) * 0.3;
      impellerRef.current.rotation.y += speed * state.clock.getDelta() * 10;
    }
    
    if (motorRef.current && isRunning) {
      const child = motorRef.current.children[0] as THREE.Mesh;
      const material = child.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 2]} />
        <meshStandardMaterial
          color="#2D3748"
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>
      
      <mesh position={[0, 0.5, 1.2]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.6, 16]} />
        <meshStandardMaterial
          color="#4A5568"
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>
      
      <mesh position={[0, 0.5, -1.2]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.6, 16]} />
        <meshStandardMaterial
          color="#4A5568"
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>
      
      <group ref={motorRef} position={[0, 1.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.8, 16]} />
          <meshStandardMaterial
            color={isRunning ? '#1A365D' : '#4A5568'}
            roughness={0.3}
            metalness={0.8}
            emissive={isRunning ? '#00D4FF' : '#000000'}
            emissiveIntensity={isRunning ? 0.3 : 0}
          />
        </mesh>
        
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 8]} />
          <meshStandardMaterial
            color="#00D4FF"
            emissive="#00D4FF"
            emissiveIntensity={isRunning ? 0.8 : 0}
          />
        </mesh>
      </group>
      
      <group ref={impellerRef} position={[0, 0.5, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.8]} />
            <meshStandardMaterial
              color="#A0AEC0"
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
        ))}
      </group>
      
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1, 1.1, 0.1, 16]} />
        <meshStandardMaterial
          color="#1A202C"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}
