import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ProcessPool as ProcessPoolType, PoolType } from '../../types';
import { getStatusColor, formatFlow, formatTurbidity, formatPH, formatResidualChlorine } from '../../utils/formatters';

interface ProcessPoolProps {
  pool: ProcessPoolType;
  isSelected: boolean;
  onClick: () => void;
}

const poolColors: Record<PoolType, { body: string; water: string; accent: string }> = {
  intake: { body: '#4A5568', water: '#2D3748', accent: '#00D4FF' },
  sedimentation: { body: '#2D3748', water: '#1A365D', accent: '#00B5D8' },
  filter: { body: '#1A365D', water: '#2C5282', accent: '#00CED1' },
  clearWater: { body: '#1E3A8A', water: '#2B6CB0', accent: '#1E90FF' },
  dosing: { body: '#744210', water: '#975A16', accent: '#FFA502' },
  pumpHouse: { body: '#2D3748', water: '#1A202C', accent: '#00D4FF' },
  controlRoom: { body: '#1A202C', water: '#171923', accent: '#00D4FF' },
};

export function ProcessPool({ pool, isSelected, onClick }: ProcessPoolProps) {
  const groupRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const colors = poolColors[pool.type];
  const statusColor = getStatusColor(pool.status);
  const [w, h, d] = pool.size;
  const hasWaterQuality = pool.type !== 'dosing' && pool.type !== 'controlRoom';
  const statusText = pool.status === 'normal' ? '正常' : pool.status === 'warning' ? '预警' : '告警';

  useFrame((state) => {
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.MeshPhysicalMaterial;
      const wave = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      material.emissiveIntensity = 0.3 + wave * 2;
    }
    
    if (groupRef.current && pool.status === 'alarm') {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  const waterHeight = pool.type === 'intake' ? h * 0.7 : 
                      pool.type === 'sedimentation' ? h * 0.75 :
                      pool.type === 'clearWater' ? h * 0.85 : h * 0.65;

  return (
    <group
      ref={groupRef}
      position={pool.position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={colors.body}
          roughness={0.7}
          metalness={0.3}
          emissive={isSelected ? colors.accent : hovered ? colors.accent : '#000000'}
          emissiveIntensity={isSelected ? 0.15 : hovered ? 0.08 : 0}
        />
      </mesh>

      {pool.type !== 'controlRoom' && pool.type !== 'dosing' && (
        <mesh ref={waterRef} position={[0, waterHeight / 2 + 0.05, 0]}>
          <boxGeometry args={[w * 0.95, waterHeight, d * 0.95]} />
          <meshPhysicalMaterial
            color={colors.water}
            transparent
            opacity={0.7}
            roughness={0.1}
            metalness={0.1}
            transmission={0.3}
            thickness={1}
            emissive={colors.water}
            emissiveIntensity={0.2}
          />
        </mesh>
      )}

      <mesh position={[0, h + 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 16]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={pool.status === 'alarm' ? 0.8 : 0.4}
        />
      </mesh>

      {isSelected && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.3, h + 0.3, d + 0.3]} />
          <meshBasicMaterial
            color={colors.accent}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {pool.type === 'controlRoom' && (
        <>
          <mesh position={[0, h + 0.5, 0]}>
            <boxGeometry args={[w * 0.6, 0.8, d * 0.6]} />
            <meshStandardMaterial color="#1A202C" roughness={0.5} metalness={0.5} />
          </mesh>
          {[[-w * 0.2, 0], [w * 0.2, 0], [0, -d * 0.2], [0, d * 0.2]].map((pos, i) => (
            <mesh key={i} position={[pos[0], h + 0.5, pos[1]]}>
              <boxGeometry args={[0.4, 0.3, 0.05]} />
              <meshStandardMaterial
                color="#00D4FF"
                emissive="#00D4FF"
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </>
      )}

      {pool.type === 'dosing' && (
        <>
          <mesh position={[-w * 0.3, h * 0.3, 0]}>
            <cylinderGeometry args={[0.6, 0.7, h * 0.5, 16]} />
            <meshStandardMaterial color="#744210" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[w * 0.3, h * 0.3, 0]}>
            <cylinderGeometry args={[0.6, 0.7, h * 0.5, 16]} />
            <meshStandardMaterial color="#975A16" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, h * 0.6, 0]}>
            <boxGeometry args={[w * 0.8, 0.3, d * 0.6]} />
            <meshStandardMaterial color="#2D3748" roughness={0.5} metalness={0.5} />
          </mesh>
        </>
      )}

      {/* 漂浮数据标签 - 池号和状态 */}
      <Html
        position={[0, h + 1.5, 0]}
        center
        distanceFactor={15}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(10, 22, 40, 0.92)',
          border: `1px solid ${colors.accent}`,
          borderRadius: '10px',
          padding: '8px 14px',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 20px ${colors.accent}33`,
          minWidth: '160px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
            <span style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#fff',
              letterSpacing: '0.5px',
            }}>
              {pool.poolNo}
            </span>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              animation: pool.status === 'alarm' ? 'pulse-glow 0.5s infinite' : 'none',
            }} />
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: statusColor,
            fontWeight: '600',
          }}>
            {statusText}运行
          </div>
        </div>
      </Html>

      {/* 漂浮数据标签 - 处理水量 */}
      <Html
        position={[-w / 2 - 0.8, h + 0.5, 0]}
        center
        distanceFactor={15}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(10, 22, 40, 0.88)',
          borderLeft: `3px solid #00D4FF`,
          borderRadius: '8px',
          padding: '6px 10px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0, 212, 255, 0.15)',
          minWidth: '120px',
        }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: '#94a3b8',
            marginBottom: '2px',
          }}>
            处理水量
          </div>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#00D4FF',
            lineHeight: 1.2,
          }}>
            {formatFlow(pool.currentFlow)}
          </div>
        </div>
      </Html>

      {/* 漂浮数据标签 - 水质参数 */}
      {hasWaterQuality && (
        <Html
          position={[w / 2 + 0.8, h / 2 + 0.5, 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(10, 22, 40, 0.88)',
            borderRight: `3px solid ${colors.accent}`,
            borderRadius: '8px',
            padding: '8px 10px',
            backdropFilter: 'blur(8px)',
            boxShadow: `0 4px 16px ${colors.accent}22`,
            minWidth: '110px',
          }}>
            <div style={{ marginBottom: '5px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1px',
              }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '9px',
                  color: '#94a3b8',
                }}>浊度</span>
                <span style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: pool.turbidity > 5 ? '#FF4757' : '#FFA502',
                }}>
                  {formatTurbidity(pool.turbidity)}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1px',
              }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '9px',
                  color: '#94a3b8',
                }}>pH</span>
                <span style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: (pool.pH < 6.5 || pool.pH > 8.5) ? '#FF4757' : '#2ED573',
                }}>
                  {formatPH(pool.pH)}
                </span>
              </div>
            </div>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '9px',
                  color: '#94a3b8',
                }}>余氯</span>
                <span style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: pool.residualChlorine < 0.3 ? '#FF4757' : '#1E90FF',
                }}>
                  {formatResidualChlorine(pool.residualChlorine)}
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
