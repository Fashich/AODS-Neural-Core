/**
 * Holographic UI - 3D Dashboard Panels
 * Displays workflow status and system metrics
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface HolographicUIProps {
  position: [number, number, number];
  workflows: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
  }>;
}

export default function HolographicUI({ position, workflows }: HolographicUIProps) {
  const groupRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Mesh>(null);

  // Animate panels
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
    if (panelRef.current) {
      const material = panelRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  // Create grid texture
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    
    // Draw grid
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  return (
    <group ref={groupRef} position={position}>
      {/* Main Panel */}
      <mesh ref={panelRef} rotation={[-Math.PI / 6, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshBasicMaterial 
          map={gridTexture}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Panel Border */}
      <lineSegments rotation={[-Math.PI / 6, 0, 0]} position={[0, 0, 0.01]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(12, 6)]} />
        <lineBasicMaterial color="#00ffff" linewidth={2} />
      </lineSegments>

      {/* Title */}
      <Text
        position={[0, 2.5, 0.1]}
        rotation={[-Math.PI / 6, 0, 0]}
        fontSize={0.4}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Bold.ttf"
      >
        ACTIVE WORKFLOWS
      </Text>

      {/* Workflow Items */}
      {workflows.slice(0, 5).map((workflow, index) => {
        const yPos = 1.5 - index * 0.8;
        const statusColor = workflow.status === 'running' ? '#00ff00' : 
                           workflow.status === 'pending' ? '#ffff00' : '#ff0000';
        
        return (
          <group 
            key={workflow.id}
            position={[-5, yPos, 0.1]}
            rotation={[-Math.PI / 6, 0, 0]}
          >
            {/* Workflow Name */}
            <Text
              position={[0, 0, 0]}
              fontSize={0.25}
              color="white"
              anchorX="left"
              anchorY="middle"
            >
              {workflow.name}
            </Text>

            {/* Status Indicator */}
            <mesh position={[8, 0, 0]}>
              <circleGeometry args={[0.15, 16]} />
              <meshBasicMaterial color={statusColor} />
            </mesh>

            {/* Progress Bar Background */}
            <mesh position={[4, -0.3, 0]}>
              <planeGeometry args={[4, 0.15]} />
              <meshBasicMaterial color="#333333" />
            </mesh>

            {/* Progress Bar Fill */}
            <mesh position={[4 - (4 - (workflow.progress / 100) * 4) / 2, -0.3, 0.01]}>
              <planeGeometry args={[(workflow.progress / 100) * 4, 0.12]} />
              <meshBasicMaterial color={statusColor} />
            </mesh>

            {/* Progress Text */}
            <Text
              position={[8.5, -0.3, 0]}
              fontSize={0.2}
              color="#aaaaaa"
              anchorX="left"
              anchorY="middle"
            >
              {workflow.progress}%
            </Text>
          </group>
        );
      })}

      {/* Decorative Elements */}
      <CornerDecoration position={[-6, 3, 0]} rotation={[-Math.PI / 6, 0, 0]} />
      <CornerDecoration position={[6, 3, 0]} rotation={[-Math.PI / 6, 0, Math.PI / 2]} />
      <CornerDecoration position={[-6, -3, 0]} rotation={[-Math.PI / 6, 0, -Math.PI / 2]} />
      <CornerDecoration position={[6, -3, 0]} rotation={[-Math.PI / 6, 0, Math.PI]} />

      {/* Scanline Effect */}
      <ScanlineEffect rotation={[-Math.PI / 6, 0, 0]} />
    </group>
  );
}

// Corner decoration component
function CornerDecoration({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[1, 0.05]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[1, 0.05]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
    </group>
  );
}

// Scanline animation
function ScanlineEffect({ rotation }: { rotation: [number, number, number] }) {
  const scanlineRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (scanlineRef.current) {
      const y = Math.sin(state.clock.elapsedTime * 2) * 3;
      scanlineRef.current.position.y = y;
    }
  });

  return (
    <mesh ref={scanlineRef} rotation={rotation} position={[0, 0, 0.02]}>
      <planeGeometry args={[12, 0.02]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
    </mesh>
  );
}
