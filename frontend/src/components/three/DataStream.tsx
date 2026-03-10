/**
 * Data Stream - Visual connection between services
 * Shows data flow in the metaverse
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DataStreamProps {
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
  speed?: number;
}

export default function DataStream({ start, end, active, speed = 1 }: DataStreamProps) {
  const lineRef = useRef<any>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Create curve between points
  const curve = useMemo(() => {
    const midPoint = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 1,
      (start[2] + end[2]) / 2
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...midPoint),
      new THREE.Vector3(...end)
    );
  }, [start, end]);

  // Line geometry
  const lineGeometry = useMemo(() => {
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [curve]);

  // Particle system for data packets
  const particleCount = 20;
  const particlePositions = useMemo(() => {
    return new Float32Array(particleCount * 3);
  }, []);

  const particleProgress = useRef(new Float32Array(particleCount).fill(0).map(() => Math.random()));

  // Animate particles along the curve
  useFrame((_, delta) => {
    if (!active || !particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      // Update progress
      particleProgress.current[i] += delta * speed * 0.5;
      if (particleProgress.current[i] > 1) {
        particleProgress.current[i] = 0;
      }

      // Get position on curve
      const point = curve.getPoint(particleProgress.current[i]);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <group>
      {/* Connection Line */}
      <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: "#00ffff", transparent: true, opacity: 0.3 }))} ref={lineRef} />

      {/* Data Packets */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00ff88"
          size={0.15}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Glow effect along the line */}
      <mesh>
        <tubeGeometry args={[curve, 64, 0.05, 8, false]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}
