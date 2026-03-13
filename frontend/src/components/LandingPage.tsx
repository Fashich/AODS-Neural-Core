/**
 * LandingPage - Multi-section 3D Holographic Landing
 * AODS - Autonomous Orchestration of Digital Systems
 * Mayar Vibecoding Competition 2026
 */

import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { LiveSystemStatus } from './LiveSystemStatus';

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string }) => Promise<string[]> };
  }
}

// ─── Hacker Text System ───────────────────────────────────────────

const HACKER_PHRASES: string[] = [
  'NEURAL_CORE::ONLINE', 'BLOCKCHAIN::SYNCED', 'AI_MODEL::CALIBRATED',
  'SECURE_CHANNEL::OK', 'ORCHESTRATION::ACTIVE', 'QUANTUM_ENCRYPT::ON',
  'ISO_27001::COMPLIANT', 'ACCESS::GRANTED', 'THREAT_LEVEL::ZERO',
  '> INIT METAVERSE...', 'DOCKER MESH::7 NODES', 'HPC::7 MICROSERVICES',
  '01001111 01010010', '01000011 01001000', 'TCP/IP::HANDSHAKE OK',
];

const buildScrambled = (target: string, progress: number): string =>
  target.split('').map((ch, i) => {
    if (ch === ' ') return ' ';
    return progress >= (i + 1) / target.length ? ch : Math.random() > 0.5 ? '1' : '0';
  }).join('');

const makeTextCanvas = (text: string, hexColor: string, alpha: number): HTMLCanvasElement => {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 72;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, 1024, 72);
  if (alpha <= 0) return cv;
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  ctx.font = 'bold 32px "Courier New", monospace';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.8})`;
  ctx.shadowBlur = 18;
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.fillText(text, 8, 36);
  return cv;
};

const HackerNode = ({ position, phraseIndex, color }: {
  position: [number, number, number]; phraseIndex: number; color: string;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const tex = useRef<THREE.CanvasTexture | null>(null);
  const mat = useRef<THREE.MeshBasicMaterial | null>(null);
  const t = useRef(Math.random() * 100);
  const timer = useRef(Math.random() * 2);
  const phase = useRef<'wait' | 'in' | 'show' | 'out'>('wait');
  const prog = useRef(0);
  const opac = useRef(0);
  const phrase = useRef(HACKER_PHRASES[phraseIndex % HACKER_PHRASES.length]);

  useEffect(() => {
    const cv = makeTextCanvas('', color, 0);
    const tx = new THREE.CanvasTexture(cv);
    tx.minFilter = THREE.LinearFilter;
    tex.current = tx;
    const m = new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    mat.current = m;
    if (meshRef.current) (meshRef.current as THREE.Mesh).material = m;
    return () => { tx.dispose(); m.dispose(); };
  }, []);

  useEffect(() => {
    if (meshRef.current && mat.current) (meshRef.current as THREE.Mesh).material = mat.current;
  });

  useFrame((_, delta) => {
    if (!groupRef.current || !tex.current || !mat.current) return;
    t.current += delta; timer.current += delta;
    groupRef.current.position.y = position[1] + Math.sin(t.current * 0.4) * 0.4;
    const target = phrase.current;
    if (phase.current === 'wait') {
      if (timer.current > 0.8) { phase.current = 'in'; prog.current = 0; timer.current = 0; }
    } else if (phase.current === 'in') {
      prog.current = Math.min(prog.current + delta * 0.68, 1);
      opac.current = Math.min(opac.current + delta * 3.5, 0.72);
      tex.current.image = makeTextCanvas(buildScrambled(target, prog.current), color, opac.current);
      tex.current.needsUpdate = true;
      mat.current.opacity = opac.current;
      if (prog.current >= 1) { phase.current = 'show'; timer.current = 0; }
    } else if (phase.current === 'show') {
      if (timer.current > 3.5) { phase.current = 'out'; prog.current = 1; timer.current = 0; }
    } else if (phase.current === 'out') {
      prog.current = Math.max(prog.current - delta * 0.65, 0);
      if (prog.current < 0.3) opac.current = Math.max(opac.current - delta * 2.8, 0);
      tex.current.image = makeTextCanvas(buildScrambled(target, prog.current), color, opac.current);
      tex.current.needsUpdate = true;
      mat.current.opacity = opac.current;
      if (prog.current <= 0 && opac.current <= 0) {
        phrase.current = HACKER_PHRASES[Math.floor(Math.random() * HACKER_PHRASES.length)];
        opac.current = 0; prog.current = 0; phase.current = 'wait'; timer.current = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef}><planeGeometry args={[5.0, 0.38]} /></mesh>
    </group>
  );
};

const SPAWN_POS: [number, number, number][] = [
  [-9, 3.5, -6], [-10, 0, -5], [-8, -3, -7], [7, 3.5, -6], [8, 0, -5],
  [9, -3, -7], [-2, 7.5, -7], [3, 8, -6], [-5, 2, -9], [5, -2, -9],
];
const SPAWN_COLORS = ['#ef4444', '#f87171', '#dc2626', '#fca5a5'];

const HackerCloud = () => {
  const [slots, setSlots] = useState([{ pos: SPAWN_POS[0], idx: 0, col: SPAWN_COLORS[0], key: 0 }]);
  const keyRef = useRef(1);
  useEffect(() => {
    const schedule = () => setTimeout(() => {
      setSlots(prev => {
        if (prev.length >= 3) return prev;
        const avail = SPAWN_POS.filter((_, i) => !prev.some(s => s.pos === SPAWN_POS[i]));
        if (!avail.length) return prev;
        const pos = avail[Math.floor(Math.random() * avail.length)];
        return [...prev, { pos, idx: Math.floor(Math.random() * HACKER_PHRASES.length), col: SPAWN_COLORS[Math.floor(Math.random() * 4)], key: keyRef.current++ }];
      });
      timerRef.current = schedule();
    }, 2500 + Math.random() * 2500);
    const timerRef = { current: schedule() };
    const cleanup = setInterval(() => setSlots(prev => prev.length > 1 ? prev.slice(1) : prev), 9000);
    return () => { clearTimeout(timerRef.current); clearInterval(cleanup); };
  }, []);
  return <>{slots.map(s => <HackerNode key={s.key} position={s.pos as [number, number, number]} phraseIndex={s.idx} color={s.col} />)}</>;
};

// ─── Neural Orb (shared between Landing bg & Coming Soon) ─────────

const OrbDot = ({ angle, radius, speed }: { angle: number; radius: number; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + angle;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 0.7) * 0.6, Math.sin(t) * radius);
  });
  return <mesh ref={ref}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#fca5a5" /></mesh>;
};

const NeuralOrb = ({ scale = 1 }: { scale?: number }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (coreRef.current) { coreRef.current.rotation.x = clock.elapsedTime * 0.14; coreRef.current.rotation.y = clock.elapsedTime * 0.19; }
    if (ringRef.current) { ringRef.current.rotation.y = clock.elapsedTime * 0.28; ringRef.current.rotation.z = clock.elapsedTime * 0.09; }
  });
  const s = scale;
  return (
    <group scale={[s, s, s]}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[2.1, 1]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.5} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[2.15, 1]} />
        <meshBasicMaterial color="#f87171" wireframe transparent opacity={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.7, 32, 32]} />
        <MeshDistortMaterial color="#ef4444" transparent opacity={0.07} speed={2} distort={0.3} />
      </mesh>
      <group ref={ringRef}>
        {([[3.4, 0.04, Math.PI / 2, 0, 0], [3.9, 0.03, Math.PI / 3, Math.PI / 4, 0], [4.4, 0.02, Math.PI / 6, Math.PI / 2, 0]] as [number,number,number,number,number][]).map(([r, t, rx, ry, rz], i) => (
          <mesh key={i} rotation={[rx, ry, rz]}>
            <torusGeometry args={[r, t, 16, 100]} />
            <meshBasicMaterial color={['#ef4444', '#f87171', '#fca5a5'][i]} transparent opacity={[0.7, 0.5, 0.3][i]} />
          </mesh>
        ))}
      </group>
      {Array.from({ length: 8 }).map((_, i) => <OrbDot key={i} angle={(i / 8) * Math.PI * 2} radius={3.4} speed={0.4 + i * 0.04} />)}
      <pointLight position={[0, 0, 0]} intensity={3} color="#ef4444" distance={12} decay={2} />
    </group>
  );
};

// ─── 3D Button ────────────────────────────────────────────────────

const Btn3D = ({ onClick, children, primary = false, icon }: {
  onClick?: () => void; children: React.ReactNode; primary?: boolean; icon?: React.ReactNode;
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const depth = pressed ? 1 : hovered ? 6 : 4;
  const faceGrad = primary
    ? 'linear-gradient(160deg,#ff6b6b 0%,#ef4444 40%,#b91c1c 100%)'
    : 'linear-gradient(160deg,#2d0a0a 0%,#1a0505 60%,#0d0000 100%)';

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onTapStart={() => setPressed(true)} onTap={() => setPressed(false)} onTapCancel={() => setPressed(false)}
      animate={{ scale: pressed ? 0.96 : hovered ? 1.05 : 1, rotateX: hovered && !pressed ? -6 : 0, y: pressed ? depth - 1 : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      style={{ perspective: 600, display: 'inline-block', cursor: 'pointer', position: 'relative', border: 'none', background: 'none', pointerEvents: 'auto' }}
    >
      <div style={{ position: 'absolute', bottom: -depth, left: 4, right: 4, height: depth, background: primary ? '#7f1d1d' : '#050000', borderRadius: '0 0 12px 12px', boxShadow: `0 ${depth + 4}px ${depth * 3}px ${primary ? '#ef444488' : '#ef444422'}` }} />
      <div style={{ position: 'relative', padding: '15px 36px', borderRadius: 12, fontFamily: "'Courier New',monospace", fontWeight: 800, fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase', color: primary ? '#fff' : '#f87171', background: faceGrad, border: `1px solid ${primary ? '#ff6b6b' : '#5a1a1a'}`, display: 'flex', alignItems: 'center', gap: 10, minWidth: 188, justifyContent: 'center', overflow: 'hidden' }}>
        <AnimatePresence>
          {hovered && <motion.div key="s" initial={{ x: '-110%' }} animate={{ x: '210%' }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.22) 50%,transparent 100%)', pointerEvents: 'none' }} />}
        </AnimatePresence>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        {children}
      </div>
    </motion.button>
  );
};

// ─── Trailer Modal — Coming Soon uses SAME NeuralOrb ─────────────

const TrailerModal = ({ onClose }: { onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.88, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(239,68,68,0.35)', background: '#060000', boxShadow: '0 0 80px rgba(239,68,68,0.12)' }}
      >
        {/* ── Header — more padding ── */}
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)', background: 'rgba(10,2,2,0.9)' }}>
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
            <span className="font-mono text-sm font-bold tracking-[0.2em]" style={{ color: '#f87171' }}>AODS — TRAILER</span>
          </div>
          <motion.button
            onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base transition-colors"
            style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >✕</motion.button>
        </div>

        {/* ── Video / Coming Soon ── */}
        <div className="relative" style={{ aspectRatio: '16/9', background: '#000' }}>
          {!hasError ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10" style={{ background: '#000' }}>
                  <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono text-xs tracking-widest" style={{ color: '#f87171' }}>LOADING...</span>
                </div>
              )}
              <video
                ref={videoRef} controls autoPlay className="w-full h-full"
                onError={() => { setHasError(true); setIsLoading(false); }}
                onCanPlay={() => setIsLoading(false)}
                style={{ display: isLoading ? 'none' : 'block', objectFit: 'cover' }}
              >
                <source src="/videos/trailer.mp4" type="video/mp4" />
              </video>
            </>
          ) : (
            /* ── COMING SOON — uses same NeuralOrb as landing page ── */
            <div className="absolute inset-0">
              {/* Same NeuralOrb 3D scene */}
              <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2, 13], fov: 60 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#ef4444" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#f87171" />
                <pointLight position={[0, -8, 5]} intensity={0.5} color="#dc2626" />
                <Stars radius={120} depth={60} count={4000} factor={5} saturation={0.2} fade speed={0.8} />
                <NeuralOrb scale={0.65} />
                <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
                  <mesh position={[-7, 2.5, -3]}>
                    <octahedronGeometry args={[0.9, 0]} />
                    <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
                  </mesh>
                </Float>
                <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1}>
                  <mesh position={[7, -2, -2]}>
                    <dodecahedronGeometry args={[0.8, 0]} />
                    <meshStandardMaterial color="#f87171" metalness={0.9} roughness={0.1} />
                  </mesh>
                </Float>
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
              </Canvas>

              {/* Overlay text on top of 3D */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.55) 100%)' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                  className="text-center px-6"
                >
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                    className="font-mono text-xs tracking-[0.3em] mb-3"
                    style={{ color: '#ef4444' }}
                  >// FILE NOT FOUND</motion.p>

                  <h2 className="font-black tracking-tight mb-3"
                    style={{ fontSize: 'clamp(32px,6vw,60px)', fontFamily: "'Courier New',monospace", background: 'linear-gradient(135deg,#fca5a5 0%,#ef4444 50%,#dc2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.5))' }}>
                    COMING SOON
                  </h2>

                  <p className="font-mono text-sm mb-1" style={{ color: 'rgba(252,165,165,0.7)', letterSpacing: 2 }}>Trailer sedang dalam produksi</p>

                  <motion.div
                    animate={{ scaleX: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="mx-auto my-4 h-px w-40"
                    style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }}
                  />

                  <p className="font-mono text-xs" style={{ color: 'rgba(239,68,68,0.35)', letterSpacing: 1 }}>
                    Tambahkan: /frontend/public/videos/trailer.mp4
                  </p>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Section: Hero ────────────────────────────────────────────────

const HeroSection = ({ onTrailer }: { onTrailer: () => void }) => {
  const navigate = useNavigate();
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center py-24 relative" style={{ pointerEvents: 'none', touchAction: 'pan-y' }}>
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ pointerEvents: 'auto' }} className="mb-6">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase backdrop-blur-sm"
          style={{ background: 'rgba(30,5,5,0.7)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '8px 36px', borderRadius: 999, letterSpacing: '0.18em', boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}>
          A Comprehensive Enterprise Metaverse Platform
        </span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} style={{ pointerEvents: 'auto' }} className="mb-5">
        <h1 className="font-black leading-none mb-3"
          style={{ fontSize: 'clamp(60px,13vw,108px)', background: 'linear-gradient(135deg,#fca5a5 0%,#ef4444 45%,#dc2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 35px #ef444466)', fontFamily: "'Courier New',monospace" }}>
          AODS
        </h1>
        <p className="font-semibold tracking-wide" style={{ fontSize: 'clamp(15px,2.6vw,22px)', color: '#ffe0e0', textShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
          Autonomous Orchestration of Digital Systems
        </p>
        <motion.p animate={{ opacity: [0.75, 1, 0.75] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ fontSize: 'clamp(12px,1.6vw,15px)', color: '#ff9999', letterSpacing: '0.25em', marginTop: 8, textShadow: '0 0 16px #ef4444cc', fontFamily: "'Courier New',monospace", fontWeight: 600 }}>
          ✦ The Holographic Enterprise Metaverse ✦
        </motion.p>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
        style={{ pointerEvents: 'auto', color: 'rgba(252,165,165,0.6)', maxWidth: 520, marginBottom: 44, fontSize: 'clamp(13px,1.5vw,16px)', lineHeight: 1.75 }}>
        Platform enterprise generasi berikutnya — AI Agent, blockchain, dan visualisasi 3D holografik dalam satu ekosistem.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}
        className="flex flex-col sm:flex-row gap-6 justify-center items-center" style={{ pointerEvents: 'auto' }}>
        <Btn3D onClick={onTrailer} primary icon="▶">Watch Trailer</Btn3D>
        <Btn3D onClick={() => navigate('/signup')} icon="◈">Explore Universe</Btn3D>
      </motion.div>

      {/* Scroll hint */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-1 text-xs font-mono" style={{ color: 'rgba(239,68,68,0.45)', letterSpacing: 2 }}>
          <span>SCROLL</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </motion.div>
      </motion.div>
    </section>
  );
};

// ─── Section: Stats ───────────────────────────────────────────────

const STATS = [
  { value: '9', label: 'Languages', sub: 'Polyglot Architecture' },
  { value: '8', label: 'Microservices', sub: 'Docker Containers' },
  { value: '9', label: 'Blockchain Modules', sub: 'Smart Contracts' },
  { value: '50+', label: 'API Endpoints', sub: 'REST + WebSocket' },
  { value: '12K+', label: 'Lines of Code', sub: '65+ Files' },
  { value: '60 FPS', label: '3D Performance', sub: 'GPU Accelerated' },
];

const StatsSection = () => (
  <section className="relative px-4 py-24" style={{ pointerEvents: 'auto' }}>
    <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }} />
    <div className="relative max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
        <p className="font-mono text-xs mb-3" style={{ color: '#ef4444', letterSpacing: 4 }}>// SYSTEM METRICS</p>
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: "'Courier New',monospace" }}>
          Platform <span style={{ color: '#f87171' }}>Statistics</span>
        </h2>
        <div className="mx-auto mt-4 h-px w-24" style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }} />
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {STATS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4, scale: 1.02 }}
            className="p-5 sm:p-7 rounded-2xl text-center relative overflow-hidden"
            style={{ background: 'rgba(20,5,5,0.85)', border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(12px)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)' }} />
            <p className="font-black mb-1"
              style={{ fontSize: 'clamp(28px,4vw,44px)', fontFamily: "'Courier New',monospace", background: 'linear-gradient(135deg,#fca5a5,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 10px #ef444455)' }}>
              {s.value}
            </p>
            <p className="font-bold text-white text-sm sm:text-base mb-1">{s.label}</p>
            <p className="text-xs" style={{ color: 'rgba(252,165,165,0.5)' }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: Tech Stack ──────────────────────────────────────────

const TECH_STACK = [
  { name: 'React + TypeScript', role: 'Frontend Framework', color: '#61DAFB', port: null },
  { name: 'Python FastAPI', role: 'API Gateway', color: '#3776AB', port: 9000 },
  { name: 'Python AI/ML', role: 'Neural Core', color: '#FFD43B', port: 9001 },
  { name: 'Go Telemetry', role: 'High-Performance Monitor', color: '#00ADD8', port: 9002 },
  { name: 'C++ HPC', role: 'Physics & Compute', color: '#00589C', port: 9003 },
  { name: 'C# Enterprise', role: 'SAP/Salesforce Bridge', color: '#512BD4', port: 9004 },
  { name: 'Java Bridge', role: 'Legacy Connectivity', color: '#E76F00', port: 9005 },
  { name: 'PHP Connector', role: 'Third-Party APIs', color: '#777BB4', port: 9006 },
  { name: 'Ruby Automation', role: 'Task Scheduling', color: '#CC342D', port: 9007 },
];

const TechStackSection = () => (
  <section className="relative px-4 py-24" style={{ pointerEvents: 'auto' }}>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.6) 0%,rgba(10,0,0,0.88) 100%)', backdropFilter: 'blur(8px)' }} />
    <div className="relative max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
        <p className="font-mono text-xs mb-3" style={{ color: '#ef4444', letterSpacing: 4 }}>// POLYGLOT ARCHITECTURE</p>
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: "'Courier New',monospace" }}>
          9 <span style={{ color: '#f87171' }}>Languages</span>, 1 Ecosystem
        </h2>
        <div className="mx-auto mt-4 h-px w-24" style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }} />
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TECH_STACK.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }}
            className="p-4 rounded-xl flex items-center gap-4"
            style={{ background: 'rgba(15,3,3,0.9)', border: '1px solid rgba(239,68,68,0.15)', backdropFilter: 'blur(12px)' }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}88` }} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{t.name}</p>
              <p className="text-xs" style={{ color: 'rgba(252,165,165,0.5)' }}>{t.role}</p>
            </div>
            {t.port && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                :{t.port}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: Blockchain ──────────────────────────────────────────

const BLOCKCHAIN_MODULES = [
  { icon: '₿', name: 'Crypto & Payments', tech: 'ERC-20', status: 'Live' },
  { icon: '📦', name: 'Supply Chain', tech: 'Hyperledger', status: 'Live' },
  { icon: '🏥', name: 'Healthcare', tech: 'ZK Proofs', status: 'Beta' },
  { icon: '🪪', name: 'Digital Identity', tech: 'DID Protocol', status: 'Live' },
  { icon: '🏢', name: 'Asset Tokenization', tech: 'ERC-1400', status: 'Live' },
  { icon: '🚀', name: 'ICO / IEO', tech: 'Escrow', status: 'Live' },
  { icon: '🎮', name: 'Gaming & Esports', tech: 'Play-to-Earn', status: 'Beta' },
  { icon: '🗳️', name: 'e-Voting', tech: 'DAO', status: 'Beta' },
  { icon: '🏦', name: 'P2P Lending', tech: 'DeFi', status: 'Live' },
];

const BlockchainSection = () => (
  <section className="relative px-4 py-24" style={{ pointerEvents: 'auto' }}>
    <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }} />
    <div className="relative max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
        <p className="font-mono text-xs mb-3" style={{ color: '#ef4444', letterSpacing: 4 }}>// WEB4 BLOCKCHAIN HUB</p>
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: "'Courier New',monospace" }}>
          9 Integrated <span style={{ color: '#f87171' }}>Blockchain</span> Modules
        </h2>
        <p className="text-sm" style={{ color: 'rgba(252,165,165,0.5)' }}>Smart Contracts · Solidity · Hyperledger Fabric · OpenZeppelin</p>
        <div className="mx-auto mt-4 h-px w-24" style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }} />
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BLOCKCHAIN_MODULES.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="p-4 rounded-xl"
            style={{ background: 'rgba(10,2,2,0.9)', border: '1px solid rgba(239,68,68,0.15)', backdropFilter: 'blur(10px)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(239,68,68,0.45)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{m.name}</p>
                <p className="text-xs" style={{ color: 'rgba(252,165,165,0.5)' }}>{m.tech}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                style={{ background: m.status === 'Live' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: m.status === 'Live' ? '#86efac' : '#fde047', border: `1px solid ${m.status === 'Live' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}` }}>
                {m.status === 'Live' ? '● Live' : '◐ Beta'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: Features ────────────────────────────────────────────

const FEATURES = [
  { icon: '🧠', title: 'AI Neural Core', desc: 'LSTM predictions, Isolation Forest anomaly detection, BERT NLP, dan 1536-dim vector embeddings untuk orkestrasi cerdas.' },
  { icon: '🔗', title: 'Blockchain Security', desc: 'Protokol keamanan terdesentralisasi Web4 dengan identitas DID, ZK Proofs, dan enkripsi end-to-end.' },
  { icon: '🌐', title: '3D Holographic UI', desc: 'Antarmuka imersif berbasis Three.js + AFrame VR dengan visualisasi metaverse enterprise real-time.' },
  { icon: '⚡', title: 'Multi-Language HPC', desc: '8 microservice (Python, Go, C++, C#, Java, PHP, Ruby) dengan Docker orchestration performa tinggi.' },
  { icon: '🎮', title: 'Gamification Layer', desc: 'Sistem XP, level, achievement, dan tournament esports dengan Play-to-Earn AODS token rewards.' },
  { icon: '🛡️', title: 'ISO 27001 / COBIT', desc: 'Compliance otomatis, audit logging, Row-Level Security database, dan report governance real-time.' },
];

const FeaturesSection = () => (
  <section className="relative px-4 py-24" style={{ pointerEvents: 'auto' }}>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.82) 0%,rgba(15,0,0,0.92) 100%)', backdropFilter: 'blur(8px)' }} />
    <div className="relative max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
        <p className="font-mono text-xs mb-3" style={{ color: '#ef4444', letterSpacing: 4 }}>// CORE CAPABILITIES</p>
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2" style={{ fontFamily: "'Courier New',monospace" }}>
          Platform <span style={{ color: '#f87171' }}>Next-Gen</span>
        </h2>
        <p className="text-sm" style={{ color: 'rgba(252,165,165,0.5)', letterSpacing: 2 }}>TEKNOLOGI TERDEPAN DALAM SATU EKOSISTEM HOLOGRAFIK</p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
            className="p-6 rounded-2xl"
            style={{ background: 'rgba(20,5,5,0.88)', border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(12px)' }}>
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-base font-bold mb-2" style={{ color: '#fca5a5' }}>{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(252,165,165,0.55)' }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: CTA ─────────────────────────────────────────────────

const CTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative px-4 py-28" style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }} />
      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="font-mono text-xs mb-4" style={{ color: '#ef4444', letterSpacing: 4 }}>AODS</p>
          <h2 className="font-black text-white mb-4"
            style={{ fontSize: 'clamp(24px,4vw,42px)', fontFamily: "'Courier New',monospace", lineHeight: 1.2 }}>
            Siap Memasuki<br /><span style={{ color: '#f87171' }}>Holographic Metaverse?</span>
          </h2>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'rgba(252,165,165,0.6)', maxWidth: 480, margin: '0 auto 40px' }}>
            Bergabunglah dengan AODS Neural Core — platform enterprise terdepan yang menggabungkan AI, blockchain, dan visualisasi 3D.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Btn3D onClick={() => navigate('/signup')} primary icon="◈">Create Account</Btn3D>
            <Btn3D onClick={() => navigate('/login')} icon="→">Sign In</Btn3D>
          </div>
          <p className="font-mono text-xs mt-14" style={{ color: 'rgba(127,29,29,0.5)', letterSpacing: 2 }}>
            AODS · Ahmad Fashich Azzuhri Ramadhani · 2026
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// ─── Eye Toggle ───────────────────────────────────────────────────

const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
  <motion.button onClick={onToggle} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
    className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center"
    style={{ background: 'rgba(0,0,0,0.8)', border: `1px solid ${show ? 'rgba(239,68,68,0.6)' : 'rgba(100,20,20,0.4)'}`, backdropFilter: 'blur(8px)', pointerEvents: 'auto' }}>
    {show
      ? <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      : <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>}
  </motion.button>
);

// ─── MAIN ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showContent, setShowContent] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <div
      className="w-full min-h-screen relative"
      style={{ background: 'radial-gradient(ellipse at 30% 30%,#1a0505 0%,#0a0000 50%,#000 100%)', overflowX: 'hidden' }}
    >
      {/* ── Fixed 3D Background — pointer-events:none so scroll works ── */}
      <div className="fixed inset-0" style={{ zIndex: 0, pointerEvents: 'none' }}>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 2, 13], fov: 60 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#ef4444" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#f87171" />
          <pointLight position={[0, -8, 5]} intensity={0.5} color="#dc2626" />
          <Stars radius={120} depth={60} count={5500} factor={5} saturation={0.2} fade speed={0.8} />
          <NeuralOrb />
          <HackerCloud />
          <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
            <mesh position={[-7, 2.5, -3]}>
              <octahedronGeometry args={[0.9, 0]} />
              <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
            </mesh>
          </Float>
          <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1}>
            <mesh position={[7, -2, -2]}>
              <dodecahedronGeometry args={[0.8, 0]} />
              <meshStandardMaterial color="#f87171" metalness={0.9} roughness={0.1} />
            </mesh>
          </Float>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
        </Canvas>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.05) 40%,rgba(0,0,0,0.65) 100%)' }} />
      </div>

      {/* Eye Toggle */}
      <EyeToggle show={showContent} onToggle={() => setShowContent(v => !v)} />

      {/* Trailer Modal */}
      <AnimatePresence>
        {showTrailer && <TrailerModal onClose={() => setShowTrailer(false)} />}
      </AnimatePresence>

      {/* ── Scrollable Content ── */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
            style={{ zIndex: 10 }}
          >
            <HeroSection onTrailer={() => setShowTrailer(true)} />
            <StatsSection />
            <LiveSystemStatus />
            <TechStackSection />
            <BlockchainSection />
            <FeaturesSection />
            <CTASection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
