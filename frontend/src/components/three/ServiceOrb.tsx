/**
 * Service Orb - Visual representation of a microservice
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

interface ServiceOrbProps {
  position: [number, number, number];
  name: string;
  language: string;
  status: string;
  health: number;
  color: string;
  isHovered: boolean;
  isSelected: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}

export default function ServiceOrb({
  position,
  name,
  language,
  status,
  health,
  color,
  isHovered,
  isSelected,
  onHover,
  onUnhover,
  onClick
}: ServiceOrbProps) {
  const orbRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Animation
  useFrame((state) => {
    if (orbRef.current) {
      // Gentle floating animation
      orbRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
      
      // Rotation based on health
      const rotationSpeed = (health / 100) * 0.02;
      orbRef.current.rotation.y += rotationSpeed;
      orbRef.current.rotation.x += rotationSpeed * 0.5;
    }
    
    if (glowRef.current) {
      // Pulsing glow effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  // Status color
  const statusColor = status === 'healthy' ? color : status === 'degraded' ? '#ffaa00' : '#ff0044';

  return (
    <group position={position}>
      {/* Glow Effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial 
          color={statusColor} 
          transparent 
          opacity={0.2}
        />
      </mesh>

      {/* Main Orb */}
      <Float
        speed={1 + Math.random()}
        rotationIntensity={0.3}
        floatIntensity={0.5}
      >
        <mesh
          ref={orbRef}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover();
            setShowTooltip(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onUnhover();
            setShowTooltip(false);
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          scale={isHovered ? 1.3 : isSelected ? 1.2 : 1}
        >
          <icosahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={0.4}
            metalness={0.8}
            roughness={0.2}
            wireframe={isSelected}
          />
        </mesh>
      </Float>

      {/* Language Icon */}
      <Text
        position={[0, 0, 0.9]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {language.charAt(0).toUpperCase()}
      </Text>

      {/* Service Name Label */}
      <Text
        position={[0, -1.3, 0]}
        fontSize={0.25}
        color={statusColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Regular.woff"
      >
        {name}
      </Text>

      {/* Health Bar */}
      <group position={[0, -1.6, 0]}>
        {/* Background */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.5, 0.1]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        {/* Health fill */}
        <mesh position={[-(1.5 - (health / 100) * 1.5) / 2, 0, 0.01]}>
          <planeGeometry args={[(health / 100) * 1.5, 0.08]} />
          <meshBasicMaterial 
            color={health > 80 ? '#00ff00' : health > 50 ? '#ffff00' : '#ff0000'} 
          />
        </mesh>
      </group>

      {/* Tooltip */}
      {showTooltip && (
        <Html distanceFactor={10}>
          <div className="service-tooltip">
            <h4>{name}</h4>
            <p>Language: {language}</p>
            <p>Status: {status}</p>
            <p>Health: {health}%</p>
          </div>
        </Html>
      )}

      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.6, 64]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Connection Point Light */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.5}
        color={statusColor}
        distance={5}
      />
    </group>
  );
}
