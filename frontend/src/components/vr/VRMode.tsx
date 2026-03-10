/**
 * VR Mode - AFrame.js Integration
 * Virtual Reality access to the AODS Metaverse
 */

import { useEffect, useRef } from 'react';
import 'aframe';

interface VRModeProps {
  orchestrationData: {
    services: Array<{
      id: string;
      name: string;
      language: string;
      status: string;
    }>;
    workflows: Array<{
      id: string;
      name: string;
      status: string;
      progress: number;
    }>;
  };
  onExit: () => void;
}

// Extend A-Frame types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-entity': any;
      'a-box': any;
      'a-sphere': any;
      'a-cylinder': any;
      'a-plane': any;
      'a-sky': any;
      'a-text': any;
      'a-ring': any;
      'a-torus': any;
      'a-light': any;
      'a-camera': any;
      'a-cursor': any;
      'a-animation': any;
      'a-particle-system': any;
      'a-assets': any;
      'a-mixin': any;
      'a-icosahedron': any;
      'a-grid': any;
    }
  }
}

export default function VRMode({ orchestrationData, onExit }: VRModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register custom A-Frame components
    const registerComponents = () => {
      if (typeof AFRAME !== 'undefined' && !AFRAME.components['service-orb']) {
        AFRAME.registerComponent('service-orb', {
          schema: {
            name: { type: 'string', default: '' },
            language: { type: 'string', default: '' },
            status: { type: 'string', default: 'healthy' }
          },
          init: function() {
            const color = this.data.status === 'healthy' ? '#00ff00' : 
                         this.data.status === 'degraded' ? '#ffaa00' : '#ff0000';
            this.el.setAttribute('material', `color: ${color}; metalness: 0.8; roughness: 0.2`);
            
            // Add hover animation
            this.el.addEventListener('mouseenter', () => {
              this.el.setAttribute('scale', '1.5 1.5 1.5');
            });
            this.el.addEventListener('mouseleave', () => {
              this.el.setAttribute('scale', '1 1 1');
            });
          },
          tick: function() {
            this.el.object3D.rotation.y += 0.01;
            this.el.object3D.rotation.x += 0.005;
          }
        });

        AFRAME.registerComponent('neural-core', {
          init: function() {
            this.el.setAttribute('material', 'color: #00ffff; transparent: true; opacity: 0.7');
          },
          tick: function(time: number) {
            this.el.object3D.rotation.y = time * 0.001;
            this.el.object3D.rotation.z = time * 0.0005;
            const scale = 1 + Math.sin(time * 0.002) * 0.1;
            this.el.object3D.scale.set(scale, scale, scale);
          }
        });

        AFRAME.registerComponent('data-stream', {
          schema: {
            active: { type: 'boolean', default: true }
          },
          init: function() {
            if (this.data.active) {
              this.el.setAttribute('material', 'color: #00ffff; transparent: true; opacity: 0.5');
            }
          },
          tick: function(time: number) {
            if (this.data.active) {
              const opacity = 0.3 + Math.sin(time * 0.005) * 0.2;
              this.el.setAttribute('material', 'opacity', opacity);
            }
          }
        });
      }
    };

    registerComponents();

    // Handle exit with VR controller
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onExit]);

  // Service positions in VR space
  const servicePositions = [
    { pos: '4 2 -5', rot: '0 -30 0', name: 'python-ai', lang: 'python' },
    { pos: '-4 2 -5', rot: '0 30 0', name: 'go-telemetry', lang: 'go' },
    { pos: '0 4 -4', rot: '0 0 0', name: 'cpp-hpc', lang: 'cpp' },
    { pos: '3 -2 -6', rot: '0 -20 0', name: 'csharp-enterprise', lang: 'csharp' },
    { pos: '-3 -2 -6', rot: '0 20 0', name: 'java-bridge', lang: 'java' },
    { pos: '2 0 -7', rot: '0 -10 0', name: 'php-connector', lang: 'php' },
    { pos: '-2 0 -7', rot: '0 10 0', name: 'ruby-automation', lang: 'ruby' },
  ];

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
    <div ref={containerRef} className="vr-mode-container">
      {/* Exit VR Button */}
      <button 
        className="vr-exit-button"
        onClick={onExit}
      >
        Exit VR Mode (ESC)
      </button>

      <a-scene embedded vr-mode-ui="enabled: true">
        {/* Assets */}
        <a-assets>
          <img id="sky-texture" src="/assets/vr-sky.jpg" crossOrigin="anonymous" />
          <a-mixin id="service-geometry" geometry="primitive: icosahedron; radius: 0.8; detail: 1" />
        </a-assets>

        {/* Camera and Controls */}
        <a-entity position="0 1.6 5">
          <a-camera look-controls wasd-controls>
            <a-cursor 
              color="#00ffff"
              fuse="true"
              fuse-timeout="1500"
              animation__click="property: scale; startEvents: click; easing: easeInCubic; dur: 150; from: 0.1 0.1 0.1; to: 1 1 1"
              animation__fusing="property: scale; startEvents: fusing; easing: easeInCubic; dur: 1500; from: 1 1 1; to: 0.1 0.1 0.1"
              animation__mouseleave="property: scale; startEvents: mouseleave; easing: easeInCubic; dur: 500; to: 1 1 1"
            />
          </a-camera>
        </a-entity>

        {/* Lighting */}
        <a-light type="ambient" color="#222" intensity="0.5" />
        <a-light type="point" position="0 5 0" color="#00ffff" intensity="0.8" />
        <a-light type="point" position="5 0 5" color="#ff00ff" intensity="0.5" />
        <a-light type="point" position="-5 0 -5" color="#00ff00" intensity="0.5" />

        {/* Sky */}
        <a-sky color="#000011">
          <a-animation
            attribute="material.color"
            from="#000011"
            to="#000022"
            dur="10000"
            direction="alternate"
            repeat="indefinite"
          />
        </a-sky>

        {/* Stars */}
        {Array.from({ length: 100 }).map((_, i) => {
          const x = (Math.random() - 0.5) * 100;
          const y = (Math.random() - 0.5) * 100;
          const z = (Math.random() - 0.5) * 100;
          return (
            <a-sphere
              key={i}
              position={`${x} ${y} ${z}`}
              radius="0.1"
              color="#ffffff"
              opacity="0.8"
            />
          );
        })}

        {/* Central Neural Core */}
        <a-entity position="0 0 -5">
          {/* Outer sphere */}
          <a-sphere 
            neural-core
            radius="2"
            color="#00ffff"
            opacity="0.3"
            transparent="true"
          />
          {/* Inner core */}
          <a-sphere 
            radius="1"
            color="#00ff88"
            emissive="#00ff88"
            emissive-intensity="0.5"
            metalness="0.9"
            roughness="0.1"
          />
          {/* Orbital rings */}
          <a-ring radius-inner="3" radius-outer="3.1" rotation="90 0 0" color="#00ffff" opacity="0.5">
            <a-animation attribute="rotation" to="90 360 0" dur="20000" repeat="indefinite" />
          </a-ring>
          <a-ring radius-inner="3.5" radius-outer="3.55" rotation="45 0 0" color="#ff00ff" opacity="0.3">
            <a-animation attribute="rotation" to="45 360 0" dur="25000" repeat="indefinite" />
          </a-ring>
        </a-entity>

        {/* Service Orbs */}
        {orchestrationData.services.map((service, index) => {
          const pos = servicePositions[index] || { pos: '0 0 -5', rot: '0 0 0', name: service.name, lang: service.language };
          const color = serviceColors[pos.lang] || '#888888';
          
          return (
            <a-entity key={service.id} position={pos.pos} rotation={pos.rot}>
              <a-icosahedron
                mixin="service-geometry"
                service-orb={`name: ${service.name}; language: ${service.language}; status: ${service.status}`}
                color={color}
                animation="property: position; dir: alternate; dur: 2000; easing: easeInSine; loop: true; to: 0 0.5 0"
              />
              {/* Label */}
              <a-text
                value={service.name}
                position="0 -1.2 0"
                align="center"
                color={color}
                width="4"
              />
              {/* Status indicator */}
              <a-sphere
                position="1 0 0"
                radius="0.15"
                color={service.status === 'healthy' ? '#00ff00' : '#ff0000'}
              />
              {/* Glow */}
              <a-sphere
                radius="1.2"
                color={color}
                opacity="0.2"
                transparent="true"
              />
            </a-entity>
          );
        })}

        {/* Data Streams - Connections */}
        {orchestrationData.services.map((service, i) => {
          const nextIndex = (i + 1) % orchestrationData.services.length;
          const start = servicePositions[i]?.pos || '0 0 -5';
          const end = servicePositions[nextIndex]?.pos || '0 0 -5';
          
          return (
            <a-entity key={`stream-${service.id}`}>
              <a-cylinder
                data-stream={`active: ${service.status === 'healthy'}`}
                position={start}
                height="5"
                radius="0.02"
                color="#00ffff"
                opacity="0.3"
                look-at={end}
              />
            </a-entity>
          );
        })}

        {/* Workflow Indicators */}
        {orchestrationData.workflows.map((workflow, index) => {
          const angle = (index / orchestrationData.workflows.length) * Math.PI * 2;
          const radius = 6;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius - 5;
          const y = 3;
          
          return (
            <a-entity key={workflow.id} position={`${x} ${y} ${z}`}>
              <a-box
                width="0.5"
                height="0.5"
                depth="0.5"
                color={workflow.status === 'running' ? '#00ff00' : '#ffff00'}
                animation="property: rotation; to: 360 360 360; dur: 10000; repeat: indefinite"
              />
              <a-text
                value={workflow.name}
                position="0 0.6 0"
                align="center"
                color="white"
                width="3"
              />
              <a-text
                value={`${workflow.progress}%`}
                position="0 -0.6 0"
                align="center"
                color="#aaaaaa"
                width="2"
              />
            </a-entity>
          );
        })}

        {/* Info Panel */}
        <a-entity position="-5 2 -3" rotation="0 30 0">
          <a-plane
            width="4"
            height="3"
            color="#000000"
            opacity="0.7"
            transparent="true"
          />
          <a-text
            value="AODS Neural Core\n\nStatus: Online\nServices: 7 Active\nWorkflows: Running"
            position="0 0 0.01"
            align="center"
            color="#00ffff"
            width="5"
          />
        </a-entity>

        {/* Floor Grid */}
        <a-grid
          position="0 -3 0"
          rotation="-90 0 0"
          width="50"
          height="50"
          color="#00ffff"
          opacity="0.2"
        />
      </a-scene>
    </div>
  );
}
