/**
 * SignupPage — 3D Neural Auth Registration
 * AODS Neural Core
 *
 * Same interaction model as LoginPage:
 *  – Cursor OUTSIDE → AODS logo with "CREATING IDENTITY" scan animation
 *  – Cursor INSIDE  → Registration form materializes
 *  – 3D card mouse-tracking tilt
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as THREE from 'three';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

// ══════════════════════════════════════════════════════════════════════════════
// THREE.JS BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════

const FloatNode = ({ pos, index }: { pos: [number, number, number]; index: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = pos[1] + Math.sin(clock.elapsedTime * 0.35 + index * 1.2) * 0.35;
    ref.current.rotation.x = clock.elapsedTime * 0.18;
  });
  return (
    <mesh ref={ref} position={pos}>
      <tetrahedronGeometry args={[0.15, 0]} />
      <meshBasicMaterial color="#f8717155" />
    </mesh>
  );
};

const BgSceneSignup = () => {
  const nodes: [number, number, number][] = [
    [-8, 2, -5], [7, -3, -4], [-5, -4, -3], [9, 3, -6],
    [-7, -2, -7], [4, 5, -5], [-3, 5, -4], [8, -4, -6],
  ];
  return (
    <>
      <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={0.5} />
      {nodes.map((pos, i) => <FloatNode key={i} pos={pos} index={i} />)}
      <Float speed={1.3} rotationIntensity={0.6} floatIntensity={0.7}>
        <mesh position={[-6, 3, -4]}>
          <dodecahedronGeometry args={[0.65, 0]} />
          <meshBasicMaterial color="#ef444435" wireframe />
        </mesh>
      </Float>
      <Float speed={1.6} rotationIntensity={0.8} floatIntensity={0.9}>
        <mesh position={[7, -2, -5]}>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshBasicMaterial color="#f8717135" wireframe />
        </mesh>
      </Float>
      <pointLight position={[0, 0, 0]} intensity={2} color="#f87171" distance={20} />
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// LOGO SCAN ANIMATION (signup variant — "CREATING IDENTITY")
// ══════════════════════════════════════════════════════════════════════════════

const CREATE_MESSAGES = [
  'CREATING NEW IDENTITY',
  'INITIALIZING NEURAL PROFILE',
  'ALLOCATING SECURE NAMESPACE',
  'PREPARING BLOCKCHAIN WALLET',
  'ENTER TO REGISTER',
];

const LogoCreateAnimation = ({ onHover }: { onHover: () => void }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [logoErr, setLogoErr] = useState(false);
  const [buildPct, setBuildPct] = useState(0);

  useEffect(() => {
    const msgT = setInterval(() => setMsgIdx(i => (i + 1) % CREATE_MESSAGES.length), 2600);
    const scanT = setInterval(() => setScanPct(p => (p >= 100 ? 0 : p + 1.2)), 40);
    const pulseT = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 350); }, 2500);
    const buildT = setInterval(() => setBuildPct(p => (p >= 100 ? 0 : p + 0.5)), 80);
    return () => { clearInterval(msgT); clearInterval(scanT); clearInterval(pulseT); clearInterval(buildT); };
  }, []);

  const cx = 100, cy = 100, r1 = 58, r2 = 70, r3 = 80;
  const c1 = 2 * Math.PI * r1;
  const scanArcLen = c1 * 0.3;
  const scanOffset = c1 - (scanPct / 100) * c1;
  const buildCirc = 2 * Math.PI * 88;
  const buildDash = (buildPct / 100) * buildCirc;

  return (
    <motion.div
      key="logo-create"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.5 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 24px' }}
      onMouseEnter={onHover}
    >
      <style>{`
        @keyframes su_ring1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes su_ring2 { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes su_ring3 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes su_glow  {
          0%,100% { filter: drop-shadow(0 0 10px #f87171bb) brightness(0.95); }
          50%     { filter: drop-shadow(0 0 28px #f87171ff) brightness(1.25); }
        }
        @keyframes su_corner {
          0%,100% { stroke-opacity: 0.45; }
          50%     { stroke-opacity: 1; }
        }
        @keyframes su_dot { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes su_msg  {
          0%,85% { opacity: 1; transform: translateY(0); }
          90%    { opacity: 0; transform: translateY(-5px); }
          95%    { opacity: 0; transform: translateY( 5px); }
          100%   { opacity: 1; transform: translateY(0); }
        }
        @keyframes su_hud  { 0%,100% { opacity: 0.25; } 50% { opacity: 0.7; } }
        @keyframes su_pulse {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.1); }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 20 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
          {/* Progress ring (build percentage) */}
          <circle cx={cx} cy={cy} r={88} fill="none" stroke="#f8717110" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={88} fill="none"
            stroke="#f87171" strokeWidth="2"
            strokeDasharray={`${buildDash} ${buildCirc}`}
            strokeDashoffset={buildCirc * 0.25}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.08s linear' }}
            opacity="0.6"
          />
          {/* % label */}
          <text x={cx} y={25} textAnchor="middle" fill="#f87171aa" fontSize="9"
            fontFamily="monospace" letterSpacing="2">
            {Math.round(buildPct)}%
          </text>

          {/* Outer dashed circle */}
          <circle cx={cx} cy={cy} r={93} fill="none" stroke="#f8717118" strokeWidth="1" strokeDasharray="3 9" />

          {/* Ring 3 */}
          <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'su_ring3 14s linear infinite' }}>
            <ellipse cx={cx} cy={cy} rx={r3} ry={r3 * 0.27} fill="none" stroke="#f8717128" strokeWidth="1" />
            <circle cx={cx + r3} cy={cy} r="3" fill="#f8717180" />
          </g>

          {/* Ring 2 */}
          <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'su_ring2 8s linear infinite' }}>
            <ellipse cx={cx} cy={cy} rx={r2} ry={r2 * 0.36} fill="none" stroke="#fca5a545" strokeWidth="1.2"
              transform={`rotate(55, ${cx}, ${cy})`} />
            <circle cx={cx + r2 * 0.7} cy={cy} r="3.5" fill="#fca5a588"
              transform={`rotate(55, ${cx}, ${cy})`} />
          </g>

          {/* Ring 1 */}
          <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'su_ring1 5s linear infinite' }}>
            <ellipse cx={cx} cy={cy} rx={r1} ry={r1 * 0.31} fill="none" stroke="#f8717168" strokeWidth="1.5"
              transform={`rotate(-25, ${cx}, ${cy})`} />
            <circle cx={cx + r1} cy={cy} r="4" fill="#f87171bb"
              transform={`rotate(-25, ${cx}, ${cy})`} />
          </g>

          {/* Scan arc */}
          <circle cx={cx} cy={cy} r={r1} fill="none"
            stroke="url(#suScanGrad)" strokeWidth="3"
            strokeDasharray={`${scanArcLen} ${c1 - scanArcLen}`}
            strokeDashoffset={scanOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Corner brackets */}
          <path d="M 20 42 L 20 20 L 42 20" fill="none" stroke="#f87171" strokeWidth="1.5"
            style={{ animation: 'su_corner 2s ease-in-out infinite' }} />
          <path d="M 158 20 L 180 20 L 180 42" fill="none" stroke="#f87171" strokeWidth="1.5"
            style={{ animation: 'su_corner 2s ease-in-out infinite 0.5s' }} />
          <path d="M 20 158 L 20 180 L 42 180" fill="none" stroke="#f87171" strokeWidth="1.5"
            style={{ animation: 'su_corner 2s ease-in-out infinite 1s' }} />
          <path d="M 158 180 L 180 180 L 180 158" fill="none" stroke="#f87171" strokeWidth="1.5"
            style={{ animation: 'su_corner 2s ease-in-out infinite 1.5s' }} />

          {/* Cross-hairs */}
          <line x1="100" y1="14" x2="100" y2="26" stroke="#f8717144" strokeWidth="1" style={{ animation: 'su_hud 2.2s ease-in-out infinite' }} />
          <line x1="100" y1="174" x2="100" y2="186" stroke="#f8717144" strokeWidth="1" style={{ animation: 'su_hud 2.2s ease-in-out infinite 0.6s' }} />
          <line x1="14" y1="100" x2="26" y2="100" stroke="#f8717144" strokeWidth="1" style={{ animation: 'su_hud 2.2s ease-in-out infinite 1.1s' }} />
          <line x1="174" y1="100" x2="186" y2="100" stroke="#f8717144" strokeWidth="1" style={{ animation: 'su_hud 2.2s ease-in-out infinite 1.6s' }} />

          {/* Center glow */}
          <circle cx={cx} cy={cy} r={pulse ? 40 : 36} fill="none" stroke="#f8717140" strokeWidth={pulse ? 2 : 1}
            style={{ transition: 'all 0.3s ease' }} />

          <defs>
            <linearGradient id="suScanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0" />
              <stop offset="50%" stopColor="#fca5a5" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Logo */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 60, height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'su_glow 2.8s ease-in-out infinite',
          zIndex: 2,
        }}>
          {!logoErr ? (
            <img src="/images/logo.png" alt="AODS" onError={() => setLogoErr(true)}
              style={{
                width: 60, height: 60, objectFit: 'contain',
                animation: pulse ? 'su_pulse 0.35s ease-out' : 'none',
              }} />
          ) : (
            <div style={{
              width: 54, height: 54, borderRadius: 12,
              background: 'linear-gradient(135deg,#7f1d1d,#f87171)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontWeight: 900, fontSize: 26, color: '#fff',
              boxShadow: '0 0 20px #f87171aa',
            }}>A</div>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center', width: '100%', padding: '0 16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 8px #f87171', display: 'inline-block', animation: 'su_dot 1.3s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, color: '#f87171cc', textTransform: 'uppercase', animation: 'su_msg 2.6s ease-in-out infinite' }}>
            {CREATE_MESSAGES[msgIdx]}
          </span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 8px #f87171', display: 'inline-block', animation: 'su_dot 1.3s ease-in-out infinite 0.65s' }} />
        </div>

        <div style={{
          background: 'rgba(5,0,0,0.6)',
          border: '1px solid rgba(248,113,113,0.12)',
          borderRadius: 8, padding: '10px 14px', margin: '8px 0',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {[
            { label: 'IDENTITY TYPE',  value: 'NEURAL ENTITY' },
            { label: 'ENCRYPTION',     value: 'SHA-256 + SALT' },
            { label: 'BLOCKCHAIN',     value: 'WALLET READY' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10 }}>
              <span style={{ color: '#f8717155', letterSpacing: 2 }}>{label}</span>
              <span style={{ color: '#fca5a5aa', letterSpacing: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(252,165,165,0.3)', letterSpacing: 2, marginTop: 10, textTransform: 'uppercase', animation: 'su_hud 2.5s ease-in-out infinite' }}>
          ↕ hover to create identity ↕
        </p>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// INPUT FIELD (reuse same style)
// ══════════════════════════════════════════════════════════════════════════════

const InputField = ({ label, type, value, onChange, placeholder, icon: Icon, rightIcon, onRightIcon, autoComplete }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: any; rightIcon?: any; onRightIcon?: () => void; autoComplete?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, marginBottom: 5, letterSpacing: '0.2em', color: focused ? '#fca5a5' : 'rgba(252,165,165,0.4)', transition: 'color 0.2s' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: focused ? '#fca5a5' : 'rgba(252,165,165,0.28)', transition: 'color 0.2s' }} />
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '11px 38px 11px 38px',
            background: 'rgba(5,1,1,0.9)',
            border: `1px solid ${focused ? 'rgba(248,113,113,0.55)' : 'rgba(248,113,113,0.13)'}`,
            borderRadius: 10, outline: 'none',
            color: '#fff', fontSize: 13, fontFamily: "'Courier New',monospace", caretColor: '#f87171',
            boxShadow: focused ? '0 0 0 3px rgba(248,113,113,0.06)' : 'none',
            transition: 'all 0.2s', boxSizing: 'border-box',
          }}
        />
        {rightIcon && (
          <button type="button" onClick={onRightIcon} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,165,165,0.3)', display: 'flex' }}>
            {React.createElement(rightIcon, { style: { width: 14, height: 14 } })}
          </button>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SIGNUP FORM CONTENT
// ══════════════════════════════════════════════════════════════════════════════

const SignupFormContent = ({ onLeave, name, setName, email, setEmail, username, setUsername, password, setPassword, confirmPassword, setConfirmPassword, showPw, setShowPw, showCPw, setShowCPw, agreed, setAgreed, loading, error, success, handleSubmit }: any) => (
  <motion.div
    key="signup-form"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10, scale: 0.97 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    style={{ width: '100%', padding: '20px 0 16px' }}
    onMouseLeave={onLeave}
  >
    {/* Mini logo + title */}
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
      style={{ textAlign: 'center', marginBottom: 18 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <img src="/images/logo.png" alt="AODS" style={{ width: 26, height: 26, objectFit: 'contain', filter: 'drop-shadow(0 0 6px #f87171aa)' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <h1 style={{ margin: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: 19, background: 'linear-gradient(135deg,#fff,#fca5a5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Create Identity
        </h1>
      </div>
      <p style={{ margin: 0, fontSize: 10, fontFamily: 'monospace', color: 'rgba(252,165,165,0.38)', letterSpacing: 2 }}>
        JOIN THE AODS NEURAL CORE ECOSYSTEM
      </p>
    </motion.div>

    <AnimatePresence>
      {(error || success) && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', background: error ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${error ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, color: error ? '#fca5a5' : '#86efac' }}>
          {error ? <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} /> : <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />}
          {error || success}
        </motion.div>
      )}
    </AnimatePresence>

    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { label: 'DISPLAY NAME', type: 'text', value: name, setter: setName, icon: User, ph: 'Your Name', ac: 'name', delay: 0.07 },
        { label: 'USERNAME', type: 'text', value: username, setter: setUsername, icon: User, ph: 'unique_handle', ac: 'username', delay: 0.11 },
        { label: 'EMAIL ADDRESS', type: 'email', value: email, setter: setEmail, icon: Mail, ph: 'your@email.com', ac: 'email', delay: 0.15 },
      ].map(({ label, type, value, setter, icon, ph, ac, delay }) => (
        <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
          <InputField label={label} type={type} value={value} onChange={setter} placeholder={ph} icon={icon} autoComplete={ac} />
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.19 }}>
        <InputField label="PASSWORD" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" icon={Lock} rightIcon={showPw ? EyeOff : Eye} onRightIcon={() => setShowPw((v: boolean) => !v)} autoComplete="new-password" />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.23 }}>
        <InputField label="CONFIRM PASSWORD" type={showCPw ? 'text' : 'password'} value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" icon={Lock} rightIcon={showCPw ? EyeOff : Eye} onRightIcon={() => setShowCPw((v: boolean) => !v)} autoComplete="new-password" />
      </motion.div>

      {/* Terms */}
      <motion.label initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.27 }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 10, fontFamily: 'monospace', color: 'rgba(252,165,165,0.4)', lineHeight: 1.5 }}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          style={{ accentColor: '#f87171', marginTop: 2, width: 12, height: 12, flexShrink: 0 }} />
        <span>I agree to the <a href="#" style={{ color: '#f87171' }}>Terms of Service</a> and <a href="#" style={{ color: '#f87171' }}>Privacy Policy</a></span>
      </motion.label>

      {/* Submit */}
      <motion.button type="submit" disabled={loading}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.31 }}
        whileHover={{ scale: loading ? 1 : 1.015, boxShadow: '0 0 32px rgba(248,113,113,0.4)' }}
        whileTap={{ scale: 0.98 }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', borderRadius: 10, marginTop: 4, background: loading ? 'rgba(185,28,28,0.5)' : 'linear-gradient(135deg,#f87171,#ef4444,#dc2626)', border: 'none', color: '#fff', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(248,113,113,0.25)', transition: 'all 0.2s' }}>
        {loading
          ? <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'su_ring1 0.8s linear infinite' }} />
          : <><ArrowRight style={{ width: 14, height: 14 }} />CREATE IDENTITY</>}
      </motion.button>
    </form>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
      style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(248,113,113,0.08)', textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, fontFamily: 'monospace', color: 'rgba(252,165,165,0.35)' }}>
        Already have an identity?{' '}
        <Link to="/login" style={{ color: '#f87171', fontWeight: 700 }}>Sign in</Link>
      </p>
      <Link to="/" style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(252,165,165,0.22)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        ← Back to Homepage
      </Link>
    </motion.div>
  </motion.div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SIGNUP PAGE
// ══════════════════════════════════════════════════════════════════════════════

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormActive, setIsFormActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { if (isMobile) setIsFormActive(true); }, [isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setTilt({ x: dy * -7, y: dx * 7 }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Semua field wajib diisi'); return; }
    if (password !== confirmPassword) { setError('Password tidak cocok'); return; }
    if (password.length < 8) { setError('Password minimal 8 karakter'); return; }
    if (!agreed) { setError('Setujui Terms of Service terlebih dahulu'); return; }
    setLoading(true); setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || email.split('@')[0], email, password, display_name: name }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      if (data.status === 'success' && data.user) {
        localStorage.setItem('aods_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('aods_token', data.token);
        setSuccess('Identitas dibuat! Selamat datang di AODS Neural Core...');
        setTimeout(() => navigate('/'), 1200);
      } else {
        setError(data.detail || 'Registrasi gagal. Coba lagi.');
      }
    } catch {
      // Demo mode fallback
      const user = { email, username: username || email.split('@')[0], display_name: name, level: 1, xp: 0, id: email };
      localStorage.setItem('aods_user', JSON.stringify(user));
      setSuccess('Identitas dibuat (mode demo)!');
      setTimeout(() => navigate('/'), 1200);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 40%,#1a0505 0%,#0a0000 55%,#000 100%)',
      position: 'relative', overflow: 'hidden', padding: '20px 0',
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2, 14], fov: 60 }}>
          <ambientLight intensity={0.15} />
          <BgSceneSignup />
        </Canvas>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,rgba(0,0,0,0.2),rgba(0,0,0,0.65))' }} />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 400, margin: '0 16px',
          transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
          willChange: 'transform',
        }}
      >
        {/* Outer glow */}
        <div style={{ position: 'absolute', inset: -1, borderRadius: 22, background: 'linear-gradient(135deg,rgba(248,113,113,0.3),rgba(220,38,38,0.04),rgba(248,113,113,0.2))', pointerEvents: 'none' }} />

        {/* Glass card */}
        <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(6,1,1,0.88)', backdropFilter: 'blur(36px)', border: '1px solid rgba(248,113,113,0.18)', boxShadow: '0 28px 90px rgba(0,0,0,0.75)' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,rgba(248,113,113,0.9),rgba(252,165,165,0.6),transparent)' }} />

          <div style={{ padding: '0 28px' }}>
            <AnimatePresence mode="wait">
              {!isFormActive ? (
                <LogoCreateAnimation key="create-scan" onHover={() => setIsFormActive(true)} />
              ) : (
                <SignupFormContent key="signup-form"
                  onLeave={() => { if (!isMobile) setIsFormActive(false); }}
                  name={name} setName={setName} email={email} setEmail={setEmail}
                  username={username} setUsername={setUsername}
                  password={password} setPassword={setPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  showPw={showPw} setShowPw={setShowPw}
                  showCPw={showCPw} setShowCPw={setShowCPw}
                  agreed={agreed} setAgreed={setAgreed}
                  loading={loading} error={error} success={success}
                  handleSubmit={handleSubmit}
                />
              )}
            </AnimatePresence>
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(248,113,113,0.4),transparent)' }} />
        </div>

        {/* Corner HUD */}
        {[{ pos: { top: -6, left: -6 }, r: 0 }, { pos: { top: -6, right: -6 }, r: 90 }, { pos: { bottom: -6, left: -6 }, r: -90 }, { pos: { bottom: -6, right: -6 }, r: 180 }].map(({ pos, r }, i) => (
          <div key={i} style={{ position: 'absolute', ...pos, width: 18, height: 18, pointerEvents: 'none', opacity: 0.5 }}>
            <svg viewBox="0 0 18 18" fill="none" style={{ transform: `rotate(${r}deg)` }}>
              <path d="M2 9V2h7" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default SignupPage;
