/**
 * LoginPage — Immersive 3D Login
 * Centered glassmorphism card · Full responsive · MetaMask + Email auth
 * AODS Neural Core
 */

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as THREE from 'three';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

// ─── 3D Background — same style as LandingPage ────────────────────

const OrbDot = ({ angle, radius, speed }: { angle: number; radius: number; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + angle;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 0.7) * 0.6, Math.sin(t) * radius);
  });
  return <mesh ref={ref}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#fca5a5" /></mesh>;
};

const AuthOrb = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (coreRef.current) { coreRef.current.rotation.x = clock.elapsedTime * 0.14; coreRef.current.rotation.y = clock.elapsedTime * 0.19; }
    if (ringRef.current) { ringRef.current.rotation.y = clock.elapsedTime * 0.28; ringRef.current.rotation.z = clock.elapsedTime * 0.09; }
  });
  return (
    <group>
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
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[3.4, 0.04, 16, 100]} /><meshBasicMaterial color="#ef4444" transparent opacity={0.7} /></mesh>
        <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}><torusGeometry args={[3.9, 0.03, 16, 100]} /><meshBasicMaterial color="#f87171" transparent opacity={0.5} /></mesh>
        <mesh rotation={[Math.PI / 6, Math.PI / 2, 0]}><torusGeometry args={[4.4, 0.02, 16, 100]} /><meshBasicMaterial color="#fca5a5" transparent opacity={0.3} /></mesh>
      </group>
      {Array.from({ length: 8 }).map((_, i) => <OrbDot key={i} angle={(i / 8) * Math.PI * 2} radius={3.4} speed={0.4 + i * 0.04} />)}
      <pointLight position={[0, 0, 0]} intensity={3} color="#ef4444" distance={12} decay={2} />
    </group>
  );
};

const BgScene = () => (
  <>
    <AuthOrb />
    <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh position={[-9, 3, -5]}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
      </mesh>
    </Float>
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1}>
      <mesh position={[9, -2, -3]}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#f87171" metalness={0.9} roughness={0.1} />
      </mesh>
    </Float>
    <Float speed={1.5} rotationIntensity={0.7} floatIntensity={0.7}>
      <mesh position={[-6, -4, -6]}>
        <torusGeometry args={[0.7, 0.2, 16, 50]} />
        <meshStandardMaterial color="#fca5a5" metalness={0.7} roughness={0.3} emissive="#ef4444" emissiveIntensity={0.2} />
      </mesh>
    </Float>
    <Float speed={2} rotationIntensity={1} floatIntensity={1.2}>
      <mesh position={[7, 4, -4]}>
        <tetrahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} wireframe />
      </mesh>
    </Float>
  </>
);

// ─── Input Field ──────────────────────────────────────────────────

const InputField = ({ label, type, value, onChange, placeholder, icon: Icon, rightIcon, onRightIcon, autoComplete }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: any; rightIcon?: any; onRightIcon?: () => void; autoComplete?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-mono font-semibold mb-2" style={{ color: focused ? '#f87171' : 'rgba(252,165,165,0.55)', letterSpacing: '0.18em', transition: 'color 0.2s' }}>{label}</label>
      <motion.div animate={{ scale: focused ? 1.005 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
        <div className="relative flex items-center rounded-xl overflow-hidden" style={{ background: 'rgba(5,1,1,0.9)', border: `1px solid ${focused ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.18)'}`, boxShadow: focused ? '0 0 0 3px rgba(239,68,68,0.08), 0 0 20px rgba(239,68,68,0.08)' : 'none', transition: 'all 0.2s' }}>
          {/* Left glow bar when focused */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl transition-opacity" style={{ background: 'linear-gradient(180deg,transparent,#ef4444,transparent)', opacity: focused ? 1 : 0, transition: 'opacity 0.2s' }} />
          <Icon className="absolute left-4 w-4 h-4 flex-shrink-0" style={{ color: focused ? '#f87171' : 'rgba(252,165,165,0.35)', transition: 'color 0.2s' }} />
          <input
            type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} autoComplete={autoComplete}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className="w-full py-3.5 pl-11 pr-12 text-sm outline-none bg-transparent"
            style={{ color: '#fff', fontFamily: "'Courier New',monospace", caretColor: '#ef4444' }}
          />
          {rightIcon && (
            <button type="button" onClick={onRightIcon} className="absolute right-3.5 p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: 'rgba(252,165,165,0.4)' }}>
              {React.createElement(rightIcon, { className: 'w-4 h-4' })}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── MetaMask Button ──────────────────────────────────────────────

const MetaMaskBtn = ({ onClick, loading }: { onClick: () => void; loading: boolean }) => {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      type="button" onClick={onClick} disabled={loading}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      whileTap={{ scale: 0.97 }}
      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-mono font-bold text-sm relative overflow-hidden"
      style={{ background: hov ? 'rgba(251,191,36,0.14)' : 'rgba(251,191,36,0.07)', border: `1px solid ${hov ? 'rgba(251,191,36,0.55)' : 'rgba(251,191,36,0.3)'}`, color: '#fbbf24', letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: hov ? '0 0 24px rgba(251,191,36,0.1)' : 'none', transition: 'all 0.2s' }}
    >
      <AnimatePresence>
        {hov && <motion.div key="glare" initial={{ x: '-120%' }} animate={{ x: '220%' }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.15),transparent)', pointerEvents: 'none' }} />}
      </AnimatePresence>
      {loading
        ? <><div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /><span>Menghubungkan MetaMask...</span></>
        : <><svg width="20" height="20" viewBox="0 0 318.6 318.6" fill="none"><path d="M274.1 35.5l-99.5 73.9L193 98.6z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/><path d="M44.4 35.5l98.7 74.6-17.5-11.5z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/><path d="M238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3zM33.9 207.7L50.1 263l56.7-15.6-26.5-40.6z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Connect MetaMask</span></>}
    </motion.button>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const { connectWallet, isConnecting, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Auto-redirect when MetaMask connects ──
  useEffect(() => {
    if (isAuthenticated) {
      setSuccess('Wallet terhubung! Memuat metaverse...');
      setTimeout(() => navigate('/'), 900);
    }
  }, [isAuthenticated, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email dan password wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      const user = data.user || { email, username: email.split('@')[0], level: 1, xp: 0, walletAddress: '', id: email, isVerified: false };
      localStorage.setItem('aods_user', JSON.stringify(user));
      if (remember) localStorage.setItem('aods_remember', email);
      setSuccess('Login berhasil! Memuat metaverse...');
      setTimeout(() => navigate('/'), 1000);
    } catch {
      const user = { email, username: email.split('@')[0], level: 1, xp: 0, walletAddress: '', id: email, isVerified: false };
      localStorage.setItem('aods_user', JSON.stringify(user));
      setSuccess('Login berhasil! (Mode Demo)');
      setTimeout(() => navigate('/'), 1000);
    } finally { setLoading(false); }
  };

  const handleMetaMask = async () => {
    setError('');
    try { await connectWallet(); }
    catch { setError('Gagal menghubungkan MetaMask. Pastikan ekstensi sudah terpasang.'); }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 40% 40%,#1a0505 0%,#0a0000 55%,#000 100%)' }}>

      {/* ── 3D Background — pointer-events:none ── */}
      <div className="absolute inset-0" style={{ zIndex: 0, pointerEvents: 'none' }}>
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2, 13], fov: 60 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#ef4444" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#f87171" />
          <pointLight position={[0, -8, 5]} intensity={0.5} color="#dc2626" />
          <Stars radius={120} depth={60} count={5000} factor={5} saturation={0.2} fade speed={0.7} />
          <BgScene />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} />
        </Canvas>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center,rgba(0,0,0,0.25) 0%,rgba(0,0,0,0.6) 100%)' }} />
      </div>

      {/* ── Centered Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full mx-4"
        style={{ maxWidth: 440 }}
      >
        {/* Outer glow ring */}
        <div className="absolute -inset-px rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.3),rgba(220,38,38,0.05),rgba(239,68,68,0.2))', borderRadius: 20 }} />

        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: 'rgba(6,1,1,0.88)', backdropFilter: 'blur(32px)', border: '1px solid rgba(239,68,68,0.22)', boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(239,68,68,0.05)' }}>

          {/* Top accent line */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(239,68,68,0.8) 35%,rgba(248,113,113,0.6) 65%,transparent 100%)' }} />

          <div className="p-8 sm:p-10">
            {/* Logo + Title */}
            <div className="text-center mb-8">
              <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(220,38,38,0.1))', border: '1px solid rgba(239,68,68,0.3)' }}>
                <img src="/images/logo.png" alt="AODS" className="w-9 h-9 object-contain" onError={e => { const t = e.target as HTMLImageElement; t.style.display = 'none'; }} />
                <span className="text-red-400 font-black text-xl font-mono hidden" style={{ display: 'none' }}>A</span>
              </motion.div>
              <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "'Courier New',monospace", background: 'linear-gradient(135deg,#fff 0%,#fca5a5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Welcome Back
              </h1>
              <p className="text-sm" style={{ color: 'rgba(252,165,165,0.45)', letterSpacing: 1 }}>Sign in to AODS Neural Core</p>
            </div>

            {/* Alert */}
            <AnimatePresence>
              {(error || success) && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm font-mono overflow-hidden"
                  style={{ background: error ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${error ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, color: error ? '#fca5a5' : '#86efac' }}>
                  {error ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                  {error || success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* MetaMask */}
            <MetaMaskBtn onClick={handleMetaMask} loading={isConnecting} />

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.12)' }} />
              <span className="text-xs font-mono px-2" style={{ color: 'rgba(252,165,165,0.25)', letterSpacing: 3 }}>OR</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(239,68,68,0.12)' }} />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <InputField label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail} placeholder="your@email.com" icon={Mail} autoComplete="email" />
              <InputField label="PASSWORD" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" icon={Lock} rightIcon={showPw ? EyeOff : Eye} onRightIcon={() => setShowPw(v => !v)} autoComplete="current-password" />

              <div className="flex items-center justify-between text-xs font-mono pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'rgba(252,165,165,0.45)' }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-red-500 w-3.5 h-3.5" />
                  Remember me
                </label>
                <button type="button" className="transition-colors hover:text-red-400" style={{ color: 'rgba(252,165,165,0.4)' }}>
                  Forgot password?
                </button>
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-mono font-bold text-sm relative overflow-hidden"
                style={{ background: loading ? 'rgba(185,28,28,0.6)' : 'linear-gradient(135deg,#ef4444 0%,#dc2626 50%,#b91c1c 100%)', color: '#fff', letterSpacing: '0.08em', boxShadow: loading ? 'none' : '0 0 24px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.1)', cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}>
                <AnimatePresence>
                  {!loading && <motion.div key="glare" initial={{ x: '-120%' }} animate={{ x: '220%' }} transition={{ duration: 0.8, delay: 0.2 }} style={{ position: 'absolute', top: 0, bottom: 0, width: '30%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)', pointerEvents: 'none' }} />}
                </AnimatePresence>
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ArrowRight className="w-4 h-4" />Sign In</>}
              </motion.button>
            </form>

            {/* Footer links */}
            <div className="mt-7 pt-6 text-center space-y-2.5" style={{ borderTop: '1px solid rgba(239,68,68,0.1)' }}>
              <p className="text-xs font-mono" style={{ color: 'rgba(252,165,165,0.4)' }}>
                Don't have an account?{' '}
                <Link to="/signup" className="font-bold transition-colors hover:text-red-300" style={{ color: '#f87171' }}>Sign up free</Link>
              </p>
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors hover:text-red-400" style={{ color: 'rgba(252,165,165,0.28)' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Homepage
              </Link>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(239,68,68,0.4) 50%,transparent 100%)' }} />
        </div>

        {/* Corner brackets decoration */}
        {[['top-0 left-0', 'top-0.5 left-0.5'], ['top-0 right-0 rotate-90', 'top-0.5 right-0.5'], ['bottom-0 left-0 -rotate-90', 'bottom-0.5 left-0.5'], ['bottom-0 right-0 rotate-180', 'bottom-0.5 right-0.5']].map(([pos], i) => (
          <div key={i} className={`absolute ${pos} w-5 h-5 pointer-events-none`} style={{ opacity: 0.5 }}>
            <svg viewBox="0 0 20 20" fill="none"><path d="M2 10V2h8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
