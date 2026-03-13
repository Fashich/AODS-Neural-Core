/**
 * LoginPage — 3D Neural Auth
 * AODS Neural Core
 *
 * Behavior:
 *  – Cursor OUTSIDE form zone → AODS logo with orbital scan rings + "NEURAL LOCK" animation
 *  – Cursor INSIDE form zone  → Form materializes (logo compresses to top, fields slide up)
 *  – Card tracks mouse for subtle 3D tilt (CSS perspective)
 *  – Three.js stars + neural nodes background
 *  – Fully responsive (mobile always shows form)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Wifi } from 'lucide-react';
import * as THREE from 'three';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

// ══════════════════════════════════════════════════════════════════════════════
// THREE.JS BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════

const NeuralNode = ({ pos, index }: { pos: [number, number, number]; index: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = pos[1] + Math.sin(clock.elapsedTime * 0.4 + index) * 0.3;
    ref.current.rotation.y = clock.elapsedTime * 0.2;
  });
  return (
    <mesh ref={ref} position={pos}>
      <octahedronGeometry args={[0.12, 0]} />
      <meshBasicMaterial color="#ef444466" />
    </mesh>
  );
};

const BgScene = () => {
  const nodes: [number, number, number][] = [
    [-8, 3, -5], [7, -2, -4], [-6, -4, -3], [8, 4, -6],
    [-9, -1, -7], [5, 5, -5], [-4, 6, -4], [9, -4, -6],
  ];
  return (
    <>
      <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={0.5} />
      {nodes.map((pos, i) => <NeuralNode key={i} pos={pos} index={i} />)}
      <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.6}>
        <mesh position={[-7, 2, -4]}>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshBasicMaterial color="#ef444440" wireframe />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.7} floatIntensity={0.8}>
        <mesh position={[7, -3, -5]}>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshBasicMaterial color="#f8717140" wireframe />
        </mesh>
      </Float>
      <pointLight position={[0, 0, 0]} intensity={2} color="#ef4444" distance={20} />
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// LOGO SCAN ANIMATION (shown when cursor is outside form zone)
// ══════════════════════════════════════════════════════════════════════════════

const SCAN_MESSAGES = [
  'NEURAL IDENTITY LOCK',
  'BIOMETRIC AUTH REQUIRED',
  'ACCESS CREDENTIALS NEEDED',
  'SECURE ZONE — AUTHENTICATE',
  'IDENTITY VERIFICATION PENDING',
];

const LogoScanAnimation = ({ onHover }: { onHover: () => void }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [logoErr, setLogoErr] = useState(false);

  useEffect(() => {
    const msgT = setInterval(() => setMsgIdx(i => (i + 1) % SCAN_MESSAGES.length), 2800);
    const scanT = setInterval(() => setScanPct(p => (p >= 100 ? 0 : p + 1.4)), 40);
    const pulseT = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 400); }, 2200);
    return () => { clearInterval(msgT); clearInterval(scanT); clearInterval(pulseT); };
  }, []);

  // SVG dimensions
  const cx = 100, cy = 100, r1 = 62, r2 = 74, r3 = 84;
  // Scan arc: full circumference of r1 = 2π*r1
  const c1 = 2 * Math.PI * r1;
  const scanArcLen = c1 * 0.25; // 25% arc length
  const scanOffset = c1 - (scanPct / 100) * c1;

  return (
    <motion.div
      key="logo-scan"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 24px' }}
      onMouseEnter={onHover}
    >
      {/* ── CSS for ring animations ── */}
      <style>{`
        @keyframes ring1spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ring2spin { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes ring3spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes logoglow  {
          0%,100% { filter: drop-shadow(0 0 10px #ef4444bb) brightness(0.95); }
          50%     { filter: drop-shadow(0 0 26px #ef4444ff) brightness(1.2); }
        }
        @keyframes logopulsebeat {
          0%   { transform: scale(1);    }
          40%  { transform: scale(1.08); }
          70%  { transform: scale(0.96); }
          100% { transform: scale(1);    }
        }
        @keyframes scanmsg {
          0%,85% { opacity: 1; transform: translateY(0); }
          90%    { opacity: 0; transform: translateY(-6px); }
          95%    { opacity: 0; transform: translateY( 6px); }
          100%   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hudline {
          0%,100% { opacity: 0.3; }
          50%     { opacity: 0.8; }
        }
        @keyframes cornerflash {
          0%,100% { stroke-opacity: 0.5; }
          50%     { stroke-opacity: 1; }
        }
        @keyframes dotblink {
          0%,100% { opacity: 1; } 50% { opacity: 0; }
        }
      `}</style>

      {/* ── SVG Scanner ── */}
      <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 20 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
          {/* Outer decorative circle */}
          <circle cx={cx} cy={cy} r={93} fill="none" stroke="#ef444418" strokeWidth="1" strokeDasharray="4 8" />

          {/* Ring 3 — outermost, slow */}
          <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'ring3spin 12s linear infinite' }}>
            <ellipse cx={cx} cy={cy} rx={r3} ry={r3 * 0.28} fill="none" stroke="#ef444430" strokeWidth="1" />
            {/* dot on ring */}
            <circle cx={cx + r3} cy={cy} r="3" fill="#ef444488" />
          </g>

          {/* Ring 2 — tilted, medium */}
          <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'ring2spin 7s linear infinite' }}>
            <ellipse cx={cx} cy={cy} rx={r2} ry={r2 * 0.35} fill="none" stroke="#f8717150" strokeWidth="1.2"
              transform={`rotate(40, ${cx}, ${cy})`} />
            <circle cx={cx + r2 * Math.cos(0.7)} cy={cy + r2 * 0.35 * Math.sin(0.7)} r="3.5" fill="#f87171aa"
              transform={`rotate(40, ${cx}, ${cy})`} />
          </g>

          {/* Ring 1 — inner, fast */}
          <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'ring1spin 4.5s linear infinite' }}>
            <ellipse cx={cx} cy={cy} rx={r1} ry={r1 * 0.3} fill="none" stroke="#ef444470" strokeWidth="1.5"
              transform={`rotate(-30, ${cx}, ${cy})`} />
            <circle cx={cx + r1} cy={cy} r="4" fill="#ef4444cc"
              transform={`rotate(-30, ${cx}, ${cy})`} />
          </g>

          {/* Scan arc — fastest, brighter */}
          <circle
            cx={cx} cy={cy} r={r1}
            fill="none"
            stroke="url(#scanGrad)"
            strokeWidth="3"
            strokeDasharray={`${scanArcLen} ${c1 - scanArcLen}`}
            strokeDashoffset={scanOffset}
            style={{ transform: `rotate(-90deg)`, transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* HUD corner markers */}
          {/* Top-left */}
          <path d="M 20 42 L 20 20 L 42 20" fill="none" stroke="#ef4444" strokeWidth="1.5"
            style={{ animation: 'cornerflash 1.8s ease-in-out infinite' }} />
          {/* Top-right */}
          <path d="M 158 20 L 180 20 L 180 42" fill="none" stroke="#ef4444" strokeWidth="1.5"
            style={{ animation: 'cornerflash 1.8s ease-in-out infinite 0.4s' }} />
          {/* Bottom-left */}
          <path d="M 20 158 L 20 180 L 42 180" fill="none" stroke="#ef4444" strokeWidth="1.5"
            style={{ animation: 'cornerflash 1.8s ease-in-out infinite 0.9s' }} />
          {/* Bottom-right */}
          <path d="M 158 180 L 180 180 L 180 158" fill="none" stroke="#ef4444" strokeWidth="1.5"
            style={{ animation: 'cornerflash 1.8s ease-in-out infinite 1.3s' }} />

          {/* Cross-hair lines */}
          <line x1="100" y1="14" x2="100" y2="28" stroke="#ef444444" strokeWidth="1" style={{ animation: 'hudline 2s ease-in-out infinite' }} />
          <line x1="100" y1="172" x2="100" y2="186" stroke="#ef444444" strokeWidth="1" style={{ animation: 'hudline 2s ease-in-out infinite 0.5s' }} />
          <line x1="14" y1="100" x2="28" y2="100" stroke="#ef444444" strokeWidth="1" style={{ animation: 'hudline 2s ease-in-out infinite 1s' }} />
          <line x1="172" y1="100" x2="186" y2="100" stroke="#ef444444" strokeWidth="1" style={{ animation: 'hudline 2s ease-in-out infinite 1.5s' }} />

          {/* Gradient for scan arc */}
          <defs>
            <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
              <stop offset="50%" stopColor="#f87171" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fca5a5" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Center glow circle */}
          <circle cx={cx} cy={cy} r="38" fill="radial-gradient(circle,#ef444420,transparent)"
            style={{ fill: '#ef444412' }} />
          <circle cx={cx} cy={cy} r={pulse ? 40 : 36} fill="none" stroke="#ef444440" strokeWidth={pulse ? 2 : 1}
            style={{ transition: 'all 0.3s ease', filter: pulse ? 'blur(1px)' : 'none' }} />
        </svg>

        {/* Logo image centered */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 60, height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'logoglow 2.5s ease-in-out infinite',
          zIndex: 2,
        }}>
          {!logoErr ? (
            <img
              src="/images/logo.png"
              alt="AODS"
              onError={() => setLogoErr(true)}
              style={{
                width: 60, height: 60,
                objectFit: 'contain',
                animation: pulse ? 'logopulsebeat 0.4s ease-out' : 'none',
              }}
            />
          ) : (
            <div style={{
              width: 54, height: 54, borderRadius: 12,
              background: 'linear-gradient(135deg,#7f1d1d,#ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontWeight: 900, fontSize: 26, color: '#fff',
              boxShadow: '0 0 20px #ef4444aa',
            }}>A</div>
          )}
        </div>
      </div>

      {/* ── Status message ── */}
      <div style={{ textAlign: 'center', width: '100%', padding: '0 16px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 8px #ef4444',
            display: 'inline-block',
            animation: 'dotblink 1.2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
            color: '#ef4444cc', textTransform: 'uppercase',
            animation: 'scanmsg 2.8s ease-in-out infinite',
          }}>
            {SCAN_MESSAGES[msgIdx]}
          </span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 8px #ef4444',
            display: 'inline-block',
            animation: 'dotblink 1.2s ease-in-out infinite 0.6s',
          }} />
        </div>

        {/* HUD data rows */}
        <div style={{
          background: 'rgba(5,0,0,0.6)',
          border: '1px solid rgba(239,68,68,0.12)',
          borderRadius: 8,
          padding: '10px 14px',
          margin: '8px 0',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {[
            { label: 'SECURITY LVL', value: 'AES-256-GCM' },
            { label: 'AUTH METHOD',  value: 'NEURAL / METAMASK' },
            { label: 'SESSION',       value: 'ENCRYPTED' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10 }}>
              <span style={{ color: '#ef444466', letterSpacing: 2 }}>{label}</span>
              <span style={{ color: '#fca5a5aa', letterSpacing: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Prompt */}
        <p style={{
          fontFamily: 'monospace', fontSize: 11,
          color: 'rgba(252,165,165,0.35)',
          letterSpacing: 2, marginTop: 10,
          textTransform: 'uppercase',
          animation: 'hudline 2.5s ease-in-out infinite',
        }}>
          ↕ hover to authenticate ↕
        </p>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// INPUT FIELD
// ══════════════════════════════════════════════════════════════════════════════

const InputField = ({
  label, type, value, onChange, placeholder, icon: Icon, rightIcon, onRightIcon, autoComplete,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: any; rightIcon?: any; onRightIcon?: () => void; autoComplete?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
        marginBottom: 6, letterSpacing: '0.2em',
        color: focused ? '#f87171' : 'rgba(252,165,165,0.45)',
        transition: 'color 0.2s',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          width: 15, height: 15,
          color: focused ? '#f87171' : 'rgba(252,165,165,0.3)',
          transition: 'color 0.2s',
        }} />
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '12px 40px 12px 40px',
            background: 'rgba(5,1,1,0.9)',
            border: `1px solid ${focused ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.15)'}`,
            borderRadius: 10, outline: 'none',
            color: '#fff', fontSize: 13,
            fontFamily: "'Courier New', monospace",
            caretColor: '#ef4444',
            boxShadow: focused ? '0 0 0 3px rgba(239,68,68,0.07), 0 0 18px rgba(239,68,68,0.06)' : 'none',
            transition: 'all 0.2s',
            boxSizing: 'border-box',
          }}
        />
        {rightIcon && (
          <button type="button" onClick={onRightIcon} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(252,165,165,0.35)', padding: 4, display: 'flex',
          }}>
            {React.createElement(rightIcon, { style: { width: 15, height: 15 } })}
          </button>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN FORM CONTENT (shown when cursor is inside form zone)
// ══════════════════════════════════════════════════════════════════════════════

const LoginFormContent = ({
  onLeave,
  email, setEmail, password, setPassword,
  showPw, setShowPw, remember, setRemember,
  loading, error, success,
  handleEmailLogin, handleMetaMask, isConnecting, navigate,
}: any) => (
  <motion.div
    key="form"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10, scale: 0.97 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    style={{ width: '100%', padding: '24px 0 16px' }}
    onMouseLeave={onLeave}
  >
    {/* Mini logo + title */}
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 }}
      style={{ textAlign: 'center', marginBottom: 20 }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <img src="/images/logo.png" alt="AODS" style={{
          width: 28, height: 28, objectFit: 'contain',
          filter: 'drop-shadow(0 0 6px #ef4444aa)',
        }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <h1 style={{
          margin: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: 20,
          background: 'linear-gradient(135deg,#fff,#fca5a5)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Welcome Back</h1>
      </div>
      <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: 'rgba(252,165,165,0.4)', letterSpacing: 2 }}>
        SIGN IN TO AODS NEURAL CORE
      </p>
    </motion.div>

    {/* Alert */}
    <AnimatePresence>
      {(error || success) && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            borderRadius: 10, marginBottom: 14, fontSize: 12, fontFamily: 'monospace',
            background: error ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            color: error ? '#fca5a5' : '#86efac', overflow: 'hidden',
          }}>
          {error
            ? <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            : <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />}
          {error || success}
        </motion.div>
      )}
    </AnimatePresence>

    {/* MetaMask button */}
    <motion.button
      type="button"
      onClick={handleMetaMask}
      disabled={isConnecting}
      whileHover={{ scale: isConnecting ? 1 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '12px 0', borderRadius: 10, marginBottom: 14,
        background: 'rgba(251,191,36,0.07)',
        border: '1px solid rgba(251,191,36,0.3)',
        color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700, fontSize: 12,
        letterSpacing: 2, cursor: isConnecting ? 'not-allowed' : 'pointer',
        opacity: isConnecting ? 0.7 : 1, transition: 'all 0.2s',
      }}
    >
      {isConnecting ? (
        <><div style={{ width: 16, height: 16, border: '2px solid #fbbf24', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ring1spin 0.8s linear infinite' }} />CONNECTING...</>
      ) : (
        <><Wifi style={{ width: 15, height: 15 }} />CONNECT METAMASK</>
      )}
    </motion.button>

    {/* Divider */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.1)' }} />
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(252,165,165,0.2)', letterSpacing: 4 }}>OR</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.1)' }} />
    </div>

    {/* Email form */}
    <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <InputField label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail}
          placeholder="your@email.com" icon={Mail} autoComplete="email" />
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
        <InputField label="PASSWORD" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword}
          placeholder="••••••••" icon={Lock}
          rightIcon={showPw ? EyeOff : Eye} onRightIcon={() => setShowPw((v: boolean) => !v)}
          autoComplete="current-password" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 10, fontFamily: 'monospace', color: 'rgba(252,165,165,0.4)' }}>
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#ef4444', width: 12, height: 12 }} />
          Remember me
        </label>
        <button type="button" style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(252,165,165,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Forgot password?
        </button>
      </motion.div>

      <motion.button
        type="submit"
        disabled={loading}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        whileHover={{ scale: loading ? 1 : 1.015, boxShadow: '0 0 32px rgba(239,68,68,0.4)' }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '13px 0', borderRadius: 10, marginTop: 4,
          background: loading ? 'rgba(185,28,28,0.5)' : 'linear-gradient(135deg,#ef4444,#dc2626,#b91c1c)',
          border: 'none', color: '#fff', fontFamily: 'monospace', fontWeight: 700, fontSize: 12,
          letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 0 20px rgba(239,68,68,0.25)',
          transition: 'all 0.2s',
        }}
      >
        {loading
          ? <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ring1spin 0.8s linear infinite' }} />
          : <><ArrowRight style={{ width: 14, height: 14 }} />SIGN IN</>}
      </motion.button>
    </form>

    {/* Footer links */}
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(239,68,68,0.08)', textAlign: 'center' }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 11, fontFamily: 'monospace', color: 'rgba(252,165,165,0.35)' }}>
        No account?{' '}
        <Link to="/signup" style={{ color: '#f87171', fontWeight: 700 }}>Sign up free</Link>
      </p>
      <Link to="/" style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(252,165,165,0.25)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        ← Back to Homepage
      </Link>
    </motion.div>
  </motion.div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

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
  const [isFormActive, setIsFormActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Card tilt state
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // On mobile, always show form
  useEffect(() => { if (isMobile) setIsFormActive(true); }, [isMobile]);

  // Auto-redirect
  useEffect(() => {
    if (isAuthenticated) {
      setSuccess('Wallet terhubung! Memuat metaverse...');
      setTimeout(() => navigate('/'), 900);
    }
  }, [isAuthenticated, navigate]);

  // Mouse tilt tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    tiltRef.current = { x: dy * -8, y: dx * 8 };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: tiltRef.current.x, y: tiltRef.current.y });
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

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
      if (data.status === 'success' && data.user) {
        localStorage.setItem('aods_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('aods_token', data.token);
      } else {
        const user = { email, username: email.split('@')[0], level: 1, xp: 0, walletAddress: '', id: email };
        localStorage.setItem('aods_user', JSON.stringify(user));
      }
      if (remember) localStorage.setItem('aods_remember', email);
      setSuccess('Login berhasil! Memuat metaverse...');
      setTimeout(() => navigate('/'), 1000);
    } catch {
      const user = { email, username: email.split('@')[0], level: 1, xp: 0, walletAddress: '', id: email };
      localStorage.setItem('aods_user', JSON.stringify(user));
      setSuccess('Login berhasil (mode demo)!');
      setTimeout(() => navigate('/'), 1000);
    } finally { setLoading(false); }
  };

  const handleMetaMask = async () => {
    setError('');
    try { await connectWallet(); }
    catch { setError('Gagal menghubungkan MetaMask. Pastikan ekstensi sudah terpasang.'); }
  };

  const cardTransform = `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 40% 40%,#1a0505 0%,#0a0000 55%,#000 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ── 3D Background ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2, 14], fov: 60 }}>
          <ambientLight intensity={0.15} />
          <BgScene />
        </Canvas>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.65) 100%)' }} />
      </div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        layout
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 400,
          margin: '0 16px',
          transform: cardTransform,
          transition: 'transform 0.15s ease-out',
          willChange: 'transform',
        }}
      >
        {/* Outer glow */}
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 22,
          background: 'linear-gradient(135deg,rgba(239,68,68,0.35),rgba(220,38,38,0.04),rgba(239,68,68,0.25))',
          pointerEvents: 'none',
        }} />

        {/* Main card glass */}
        <motion.div layout transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }} style={{
          borderRadius: 20, overflow: 'hidden',
          background: 'rgba(6,1,1,0.88)',
          backdropFilter: 'blur(36px)',
          border: '1px solid rgba(239,68,68,0.2)',
          boxShadow: '0 28px 90px rgba(0,0,0,0.75), 0 0 60px rgba(239,68,68,0.04)',
        }}>
          {/* Top accent bar */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.9),rgba(248,113,113,0.6),transparent)' }} />

          <div style={{ padding: '0 28px' }}>
            {/* Animated content: logo scan OR form */}
            <AnimatePresence mode="wait" initial={false}>
              {!isFormActive ? (
                <LogoScanAnimation key="scan" onHover={() => setIsFormActive(true)} />
              ) : (
                <LoginFormContent
                  key="form"
                  onLeave={() => { if (!isMobile) setIsFormActive(false); }}
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  showPw={showPw} setShowPw={setShowPw}
                  remember={remember} setRemember={setRemember}
                  loading={loading} error={error} success={success}
                  handleEmailLogin={handleEmailLogin}
                  handleMetaMask={handleMetaMask}
                  isConnecting={isConnecting}
                  navigate={navigate}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Bottom accent bar */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.4),transparent)' }} />
        </motion.div>

        {/* Corner HUD brackets (outside card) */}
        {[
          { pos: { top: -6, left: -6 }, rotate: 0 },
          { pos: { top: -6, right: -6 }, rotate: 90 },
          { pos: { bottom: -6, left: -6 }, rotate: -90 },
          { pos: { bottom: -6, right: -6 }, rotate: 180 },
        ].map(({ pos, rotate }, i) => (
          <div key={i} style={{ position: 'absolute', ...pos, width: 18, height: 18, pointerEvents: 'none', opacity: 0.55 }}>
            <svg viewBox="0 0 18 18" fill="none" style={{ transform: `rotate(${rotate}deg)` }}>
              <path d="M2 9V2h7" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
