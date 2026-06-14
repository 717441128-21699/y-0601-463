import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ValveStatus } from '../../types';

interface ValveProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  status: ValveStatus;
}

export function Valve({ position, rotation = [0, 0, 0], status }: ValveProps) {
  const handleRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);

  useEffect(() => {
    if (status === 'open' || status === 'opening') {
      targetRotation.current = Math.PI / 2;
    } else {
      targetRotation.current = 0;
    }
  }, [status]);

  useFrame((state) => {
    if (handleRef.current) {
      const speed = 0.05;
      if (Math.abs(currentRotation.current - targetRotation.current) > 0.01) {
        if (currentRotation.current < targetRotation.current) {
          currentRotation.current = Math.min(targetRotation.current, currentRotation.current + speed);
        } else {
          currentRotation.current = Math.max(targetRotation.current, currentRotation.current - speed);
        }
        handleRef.current.rotation.z = currentRotation.current;
      }
      
      const child = handleRef.current.children[1] as THREE.Mesh;
      const material = child.material as THREE.MeshStandardMaterial;
      const isMoving = status === 'opening' || status === 'closing';
      material.emissiveIntensity = isMoving ? 0.5 + Math.sin(state.clock.elapsedTime * 8) * 0.3 : 0.2;
    }
  });

  const valveColor = status === 'open' || status === 'opening' ? '#2ED573' : '#FF4757';
  const glowIntensity = status === 'open' ? 0.3 : status === 'closed' ? 0.2 : 0.5;

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 12]} />
        <meshStandardMaterial
          color="#4A5568"
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>
      
      <mesh position={[0, 0, 0.25]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.15, 8]} />
        <meshStandardMaterial
          color={valveColor}
          emissive={valveColor}
          emissiveIntensity={glowIntensity}
        />
      </mesh>
      
      <mesh position={[0, 0, -0.25]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.15, 8]} />
        <meshStandardMaterial
          color={valveColor}
          emissive={valveColor}
          emissiveIntensity={glowIntensity}
        />
      </mesh>
      
      <group ref={handleRef} position={[0, 0.35, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
          <meshStandardMaterial
            color="#2D3748"
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
        
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <meshStandardMaterial
            color={valveColor}
            emissive={valveColor}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
      
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.15, 0.02, 8, 16]} />
        <meshStandardMaterial
          color={valveColor}
          emissive={valveColor}
          emissiveIntensity={glowIntensity}
        />
      </mesh>
    </group>
  );
}
