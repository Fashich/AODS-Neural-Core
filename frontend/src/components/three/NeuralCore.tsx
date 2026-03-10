/**
 * Neural Core - Central Visualization Component
 * Represents the AI brain of AODS
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Trail, Float } from '@react-three/drei';
import * as THREE from 'three';

interface NeuralCoreProps {
  position: [number, number, number];
  scale?: number;
  status: string;
}

export default function NeuralCore({ position, scale = 1, status }: NeuralCoreProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  // Color based on status
  const coreColor = useMemo(() => {
    switch (status) {
      case 'online': return '#00ff88';
      case 'degraded': return '#ffaa00';
      case 'offline': return '#ff0044';
      default: return '#00ffff';
    }
  }, [status]);

  // Animation
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = -state.clock.elapsedTime * 0.4;
      innerRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Outer Energy Field */}
      <Float
        speed={1}
        rotationIntensity={0.2}
        floatIntensity={0.3}
      >
        <Sphere ref={coreRef} args={[2, 64, 64]}>
          <MeshDistortMaterial
            color={coreColor}
            transparent
            opacity={0.3}
            speed={3}
            distort={0.4}
            radius={1}
          />
        </Sphere>
      </Float>

      {/* Inner Core */}
      <Sphere ref={innerRef} args={[1, 32, 32]}>
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </Sphere>

      {/* Orbital Rings */}
      <group ref={ringRef}>
        {/* Ring 1 */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3, 0.02, 16, 100]} />
          <meshBasicMaterial color={coreColor} transparent opacity={0.6} />
        </mesh>
        
        {/* Ring 2 */}
        <mesh rotation={[0, Math.PI / 3, 0]}>
          <torusGeometry args={[3.5, 0.015, 16, 100]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
        </mesh>
        
        {/* Ring 3 */}
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[4, 0.01, 16, 100]} />
          <meshBasicMaterial color="#ff00ff" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Energy Particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 3.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <Trail
            key={i}
            width={0.1}
            length={4}
            color={coreColor}
            attenuation={(t) => t * t}
          >
            <mesh position={[x, Math.sin(i) * 0.5, z]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color={coreColor} />
            </mesh>
          </Trail>
        );
      })}

      {/* Pulse Effect */}
      <PulseRing color={coreColor} />

      {/* Core Glow */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={2} 
        color={coreColor}
        distance={10}
        decay={2}
      />
    </group>
  );
}

// Pulse ring effect component
function PulseRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      ringRef.current.scale.set(scale, scale, scale);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.5, 2.6, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}
