/**
 * Loading Screen - AODS Neural Core
 * Full MVP loading animation — tema merah, no Tailwind conflict
 */

import { useEffect, useState, useRef } from 'react';

interface LoadingScreenProps {
  mini?: boolean;
}

// Pre-computed shooting star data (random seed=42 at build time)
const SHOOTING_STARS = [
  { x:60.7, y:2.3,  dx:181, dy:-33, tail:148, delay:8.12,  dur:3.01, size:1, col:'#fca5a588' },
  { x:40.1, y:2.7,  dx:168, dy:1,   tail:63,  delay:2.39,  dur:2.57, size:2, col:'#ef4444cc' },
  { x:42.7, y:25.0, dx:311, dy:31,  tail:79,  delay:5.07,  dur:1.90, size:1, col:'#f87171aa' },
  { x:9.7,  y:34.2, dx:199, dy:-19, tail:92,  delay:0.52,  dur:2.23, size:1, col:'#f87171aa' },
  { x:7.5,  y:26.4, dx:258, dy:46,  tail:103, delay:2.31,  dur:1.53, size:1, col:'#f87171aa' },
  { x:63.7, y:63.2, dx:270, dy:-51, tail:136, delay:6.41,  dur:1.84, size:2, col:'#f87171aa' },
  { x:25.6, y:83.3, dx:271, dy:-34, tail:99,  delay:9.22,  dur:1.50, size:1, col:'#f87171aa' },
  { x:38.1, y:6.0,  dx:321, dy:8,   tail:146, delay:2.55,  dur:2.30, size:2, col:'#ef4444cc' },
  { x:25.2, y:22.2, dx:244, dy:-28, tail:130, delay:10.77, dur:2.12, size:1, col:'#ef4444cc' },
  { x:48.4, y:8.2,  dx:130, dy:-47, tail:135, delay:9.50,  dur:2.16, size:1, col:'#f87171aa' },
  { x:36.3, y:89.7, dx:236, dy:57,  tail:163, delay:0.14,  dur:2.70, size:1, col:'#fca5a588' },
  { x:32.3, y:26.4, dx:155, dy:-60, tail:147, delay:8.64,  dur:3.15, size:1, col:'#fca5a588' },
  { x:86.7, y:78.3, dx:186, dy:17,  tail:133, delay:1.83,  dur:2.77, size:1, col:'#fca5a588' },
  { x:30.8, y:1.8,  dx:324, dy:45,  tail:160, delay:3.69,  dur:1.50, size:1, col:'#ef4444cc' },
  { x:69.5, y:73.4, dx:335, dy:4,   tail:75,  delay:7.92,  dur:3.10, size:1, col:'#f87171aa' },
  { x:50.1, y:54.6, dx:332, dy:51,  tail:151, delay:8.28,  dur:2.68, size:2, col:'#fca5a588' },
  { x:61.7, y:39.4, dx:234, dy:-45, tail:87,  delay:4.06,  dur:2.46, size:1, col:'#fca5a588' },
  { x:20.9, y:6.4,  dx:259, dy:-33, tail:169, delay:10.32, dur:1.53, size:1, col:'#f87171aa' },
  { x:63.6, y:19.3, dx:149, dy:52,  tail:129, delay:5.67,  dur:2.81, size:2, col:'#ef4444cc' },
  { x:93.6, y:77.0, dx:311, dy:-14, tail:114, delay:10.01, dur:1.69, size:1, col:'#ef4444cc' },
];

const SPIN_STYLE = (size: number, bw: number, color: string, dur: number, rev = false, op = 1) => ({
  position: 'absolute' as const,
  width: size,
  height: size,
  borderRadius: '50%',
  borderWidth: bw,
  borderStyle: 'solid',
  borderColor: color,
  borderTopColor: 'transparent',
  borderRightColor: 'transparent',
  top: '50%',
  left: '50%',
  marginTop: -(size / 2),
  marginLeft: -(size / 2),
  animationName: 'aodspin',
  animationDuration: `${dur}s`,
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  animationDirection: rev ? 'reverse' : 'normal' as any,
  opacity: op,
});

export default function LoadingScreen({ mini = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Neural Core...');
  const [phase, setPhase] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logLines = [
    '[BOOT] Neural core module v1.0.0 loaded',
    '[NET]  Microservice mesh initialized — 7 nodes',
    '[GPU]  3D renderer WebGL2 context created',
    '[SEC]  Secure tunnel AES-256 established',
    '[AI]   Inference engine calibrating...',
    '[3D]   Holographic scene compiled',
    '[SYS]  AODS Metaverse online ✓',
  ];

  const loadingSteps = [
    { text: 'Initializing Neural Core...', at: 0 },
    { text: 'Connecting Microservices...', at: 14 },
    { text: 'Loading Holographic Assets...', at: 28 },
    { text: 'Establishing Secure Tunnel...', at: 42 },
    { text: 'Syncing Blockchain Identity...', at: 56 },
    { text: 'Calibrating AI Models...', at: 70 },
    { text: 'Rendering Metaverse Scene...', at: 84 },
    { text: 'System Online. Entering...', at: 96 },
  ];

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + Math.random() * 10 + 2, 100);
        const step = [...loadingSteps].reverse().find(s => next >= s.at);
        if (step) setLoadingText(step.text);
        setPhase(Math.floor(next / 25));

        // Add log line at milestones
        const logIdx = Math.floor((next / 100) * logLines.length);
        setLogs(l => {
          const deduped = Array.from(new Set([...l, logLines[logIdx]].filter(Boolean)));
          return deduped.slice(-5);
        });

        if (next >= 100 && timerRef.current) clearInterval(timerRef.current);
        return next;
      });
    }, 230);

    const glitchT = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 100);
    }, 3200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(glitchT);
    };
  }, []);

  const css = `
    @keyframes aodspin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes aodsflicker {
      0%,91%,93%,96%,100% { opacity: 1; }
      92%                  { opacity: 0.6; }
      94%,95%              { opacity: 0.8; }
    }
    @keyframes aodsglob {
      0%   { transform: translate(0,0) scale(1); }
      33%  { transform: translate(30px,-40px) scale(1.1); }
      66%  { transform: translate(-20px,20px) scale(0.9); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes aodsbar {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    @keyframes star-move {
      0%   { opacity: 0;   transform: translate(0, 0); }
      8%   { opacity: 1; }
      85%  { opacity: 0.85; }
      100% { opacity: 0;   transform: translate(var(--sdx, 110vw), var(--sdy, 0px)); }
    }
  `;

  if (mini) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <style>{css}</style>
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          <div style={SPIN_STYLE(48, 2, '#ef4444', 1.2)} />
          <div style={SPIN_STYLE(32, 2, '#f87171', 0.8, true, 0.7)} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 10px #ef4444',
              animationName: 'aodsflicker',
              animationDuration: '2s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 40% 40%, #1a0505 0%, #0d0000 40%, #000 100%)',
    }}>
      <style>{css}</style>

      {/* Shooting stars — each flies in from random position at random time */}
      {SHOOTING_STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          pointerEvents: 'none', zIndex: 0,
          opacity: 0,                          /* hidden until delay fires */
          animationName: 'star-move',
          animationDuration: `${s.dur}s`,
          animationDelay: `${s.delay}s`,
          animationTimingFunction: 'ease-in',
          animationIterationCount: 'infinite',
          animationFillMode: 'backwards',      /* keep opacity:0 during delay */
          '--sdx': `calc(100vw - ${s.x}%)`,   /* always travel to right edge */
          '--sdy': `${s.dy}px`,
        } as React.CSSProperties}>
          <div style={{
            width: s.size * 3, height: s.size * 3, borderRadius: '50%',
            background: s.col,
            boxShadow: `0 0 ${s.size * 6}px ${s.col}, 0 0 ${s.size * 12}px ${s.col}55`,
            position: 'absolute', top: 0, left: 0,
          }} />
          <div style={{
            position: 'absolute',
            top: '50%', right: s.size * 3,
            transform: 'translateY(-50%)',
            width: s.tail, height: s.size,
            background: `linear-gradient(to left, ${s.col}, transparent)`,
            borderRadius: 1,
            opacity: 0.85,
          }} />
        </div>
      ))}

      {/* Ambient glows */}
      <div style={{
        position: 'absolute', top: '20%', left: '20%',
        width: 320, height: 320, borderRadius: '50%',
        background: '#7f1d1d30', filter: 'blur(60px)',
        animationName: 'aodsglob', animationDuration: '8s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '20%',
        width: 280, height: 280, borderRadius: '50%',
        background: '#be123c20', filter: 'blur(60px)',
        animationName: 'aodsglob', animationDuration: '10s',
        animationDelay: '3s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite', pointerEvents: 'none',
      }} />



      {/* ── Main card ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', width: '100%', maxWidth: 480, padding: '0 24px',
        animationName: 'aodsflicker', animationDuration: '8s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}>

        {/* Spinner */}
        <div style={{ position: 'relative', width: 144, height: 144, margin: '0 auto 40px' }}>
          <div style={SPIN_STYLE(144, 2, '#ef4444', 3.2, false, 0.9)} />
          <div style={SPIN_STYLE(116, 2, '#dc2626', 2.1, true, 0.7)} />
          <div style={SPIN_STYLE(88, 2, '#f87171', 2.7, false, 0.5)} />
          <div style={SPIN_STYLE(60, 2, '#fca5a5', 1.6, true, 0.4)} />
          <div style={SPIN_STYLE(36, 1, '#ef444480', 1.1, false, 0.3)} />

          {/* Center icon */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 42, height: 42,
            background: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px #ef4444aa, 0 0 40px #ef444444',
          }}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            fontWeight: 900, letterSpacing: 2,
            fontFamily: 'monospace',
            color: '#fff',
            textShadow: '0 0 20px #ef4444cc, 0 0 50px #ef444466',
            margin: 0, lineHeight: 1.1,
            ...(glitch ? { transform: 'translateX(3px)', filter: 'hue-rotate(20deg) brightness(1.3)' } : {}),
            transition: 'all 0.05s',
          }}>
            AODS
          </h1>
          <p style={{
            fontSize: 'clamp(12px, 2vw, 15px)',
            color: '#fca5a5', fontWeight: 600,
            letterSpacing: 1, margin: '6px 0 2px',
          }}>
            Autonomous Orchestration of Digital Systems
          </p>
          <p style={{
            fontSize: 'clamp(10px, 1.5vw, 12px)',
            color: '#ef444499', letterSpacing: 3,
            textTransform: 'uppercase', margin: 0,
            textShadow: '0 0 10px #ef444466',
          }}>
            ✦ The Holographic Enterprise Metaverse ✦
          </p>
        </div>

        {/* Phase indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '20px 0' }}>
          {['DB', 'NET', 'AI', '3D'].map((label, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                border: `1px solid ${phase > i ? '#ef4444' : '#333'}`,
                background: phase > i ? '#ef444420' : '#0a0a0a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                color: phase > i ? '#fca5a5' : '#444',
                boxShadow: phase > i ? '0 0 10px #ef444440' : 'none',
                transition: 'all 0.5s',
              }}>
                {phase > i ? '✓' : label}
              </div>
              <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 4,
          background: '#1a0505', borderRadius: 2,
          border: '1px solid #3a0a0a',
          overflow: 'hidden', marginBottom: 8,
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7f1d1d, #ef4444, #fca5a5, #ef4444, #7f1d1d)',
            backgroundSize: '200% auto',
            boxShadow: '0 0 12px #ef4444cc',
            animationName: 'aodsbar',
            animationDuration: '2s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Status text */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{
            fontSize: 11, fontFamily: 'monospace',
            color: '#f87171aa', flex: 1, textAlign: 'left',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginRight: 12,
          }}>
            {'>'} {loadingText}
          </p>
          <p style={{
            fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
            color: '#ef4444', flexShrink: 0,
            textShadow: '0 0 8px #ef4444',
          }}>
            {Math.round(progress)}%
          </p>
        </div>

        {/* Terminal logs */}
        <div style={{
          background: '#05000a',
          border: '1px solid #3a0a0a',
          borderRadius: 8, padding: '10px 14px',
          fontFamily: 'monospace', fontSize: 11,
          textAlign: 'left', minHeight: 80,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {logs.map((line, i) => (
            <p key={i} style={{
              margin: 0,
              color: line.includes('✓') || line.includes('AODS') ? '#4ade80' : '#f8717188',
              opacity: 0.8 + i * 0.04,
            }}>
              {line}
            </p>
          ))}
          <span style={{ color: '#ef4444', animationName: 'aodsflicker', animationDuration: '1s', animationIterationCount: 'infinite' }}>█</span>
        </div>

        <p style={{
          marginTop: 20, fontSize: 10,
          color: '#3a1010', fontFamily: 'monospace',
        }}>
          Mayar Vibecoding Competition 2026 · v1.0.0
        </p>
      </div>
    </div>
  );
}
