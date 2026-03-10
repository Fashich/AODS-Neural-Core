/**
 * AODS Metaverse Scene - Three.js Core
 * Holographic Enterprise Visualization
 */

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  Text, 
  Box, 
  Torus,
  MeshDistortMaterial,
  Float,
} from '@react-three/drei';
import * as THREE from 'three';

// Import scene components
import NeuralCore from './NeuralCore';
import ServiceOrb from './ServiceOrb';
import DataStream from './DataStream';
import HolographicUI from './HolographicUI';
import ParticleField from './ParticleField';

interface MetaverseSceneProps {
  orchestrationData: {
    services: Array<{
      id: string;
      name: string;
      language: string;
      status: string;
      health: number;
    }>;
    workflows: Array<{
      id: string;
      name: string;
      status: string;
      progress: number;
    }>;
  };
  systemStatus: Record<string, string>;
}

export default function MetaverseScene({ orchestrationData, systemStatus }: MetaverseSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Animation loop
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  // Service positions in 3D space
  const servicePositions = useMemo(() => {
    const positions: Record<string, [number, number, number]> = {
      'python-ai': [4, 2, 0],
      'go-telemetry': [-4, 2, 0],
      'cpp-hpc': [0, 4, 2],
      'csharp-enterprise': [3, -2, 3],
      'java-bridge': [-3, -2, 3],
      'php-connector': [2, 0, -4],
      'ruby-automation': [-2, 0, -4],
    };
    return positions;
  }, []);

  // Service colors based on language
  const serviceColors: Record<string, string> = {
    'python': '#3776ab',
    'go': '#00add8',
    'cpp': '#00599c',
    'csharp': '#239120',
    'java': '#007396',
    'php': '#777bb4',
    'ruby': '#cc342d',
  };

  return (
    <group ref={groupRef}>
      {/* Central Neural Core */}
      <NeuralCore 
        position={[0, 0, 0]}
        scale={1.5}
        status={systemStatus.orchestration}
      />

      {/* Service Orbs - Microservices Visualization */}
      {orchestrationData.services.map((service, index) => {
        const position = servicePositions[service.name] || [
          Math.sin(index * 1.2) * 5,
          Math.cos(index * 0.8) * 3,
          Math.sin(index * 0.5) * 4
        ];
        
        return (
          <ServiceOrb
            key={service.id}
            position={position as [number, number, number]}
            name={service.name}
            language={service.language}
            status={service.status}
            health={service.health}
            color={serviceColors[service.language] || '#888888'}
            isHovered={hoveredService === service.id}
            isSelected={selectedNode === service.id}
            onHover={() => setHoveredService(service.id)}
            onUnhover={() => setHoveredService(null)}
            onClick={() => setSelectedNode(selectedNode === service.id ? null : service.id)}
          />
        );
      })}

      {/* Data Streams - Connections between services */}
      {orchestrationData.services.map((service, i) => {
        const nextService = orchestrationData.services[(i + 1) % orchestrationData.services.length];
        const startPos = servicePositions[service.name] || [0, 0, 0];
        const endPos = servicePositions[nextService.name] || [0, 0, 0];
        
        return (
          <DataStream
            key={`stream-${service.id}`}
            start={startPos as [number, number, number]}
            end={endPos as [number, number, number]}
            active={service.status === 'healthy'}
            speed={0.5 + Math.random() * 0.5}
          />
        );
      })}

      {/* Holographic UI Panels */}
      <HolographicUI 
        position={[0, -5, 0]}
        workflows={orchestrationData.workflows}
      />

      {/* Particle Field - Ambient effect */}
      <ParticleField 
        count={200}
        radius={15}
      />

      {/* Floating Info Text */}
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={0.5}
      >
        <Text
          position={[0, 6, 0]}
          fontSize={0.8}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Orbitron-Bold.ttf"
        >
          AODS NEURAL CORE
        </Text>
      </Float>

      {/* Status Rings */}
      <Torus
        args={[8, 0.05, 16, 100]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial 
          color={systemStatus.orchestration === 'online' ? '#00ff00' : '#ff0000'}
          transparent
          opacity={0.5}
        />
      </Torus>

      <Torus
        args={[10, 0.03, 16, 100]}
        rotation={[Math.PI / 2, 0.2, 0]}
      >
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.3}
        />
      </Torus>

      {/* Workflow Indicators */}
      {orchestrationData.workflows.map((workflow, index) => {
        const angle = (index / orchestrationData.workflows.length) * Math.PI * 2;
        const radius = 6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <group key={workflow.id} position={[x, 3, z]}>
            <Box args={[0.5, 0.5, 0.5]}>
              <MeshDistortMaterial
                color={workflow.status === 'running' ? '#00ff00' : '#ffff00'}
                speed={2}
                distort={0.3}
              />
            </Box>
            <Text
              position={[0, 0.8, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
            >
              {workflow.name}
            </Text>
            <Text
              position={[0, -0.8, 0]}
              fontSize={0.2}
              color="#aaaaaa"
              anchorX="center"
            >
              {workflow.progress}%
            </Text>
          </group>
        );
      })}

      {/* Ambient Lighting */}
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <pointLight position={[10, 0, 10]} intensity={0.3} color="#ff00ff" />
      <pointLight position={[-10, 0, -10]} intensity={0.3} color="#00ff00" />
    </group>
  );
}
