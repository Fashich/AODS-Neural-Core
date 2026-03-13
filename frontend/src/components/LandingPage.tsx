/**
 * LandingPage — AODS Neural Core
 * Full scroll-driven 3D experience
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, MeshDistortMaterial } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';
import { LiveSystemStatus } from './LiveSystemStatus';

// ── CSS injected once ─────────────────────────────────────

const GLOBAL_CSS = `
@keyframes lp-spin    { to { transform: rotate(360deg); } }
@keyframes lp-rspin   { to { transform: rotate(-360deg); } }
@keyframes lp-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes lp-beam    { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes lp-ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes lp-shimmer { 0%{background-position:-300% center} 100%{background-position:300% center} }
@keyframes lp-scanline { 0%,100%{top:0%} 100%{top:100%} }
@keyframes lp-glyph   { 0%,100%{opacity:.2} 50%{opacity:.7} }
@keyframes lp-orb     {
  0%  { box-shadow: 0 0 30px #ef444440, inset 0 0 30px #ef444415; }
  50% { box-shadow: 0 0 80px #ef444480, inset 0 0 60px #ef444430; }
  100%{ box-shadow: 0 0 30px #ef444440, inset 0 0 30px #ef444415; }
}
.lp-shimmer-text {
  background: linear-gradient(90deg,#fff 0%,#fca5a5 25%,#ef4444 50%,#fca5a5 75%,#fff 100%);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: lp-shimmer 6s linear infinite;
}
.lp-card-hover {
  transition: border-color .25s, box-shadow .25s, transform .15s;
}
.lp-card-hover:hover {
  border-color: rgba(239,68,68,.4) !important;
  box-shadow: 0 8px 40px rgba(239,68,68,.12), 0 0 0 1px rgba(239,68,68,.1) !important;
  transform: translateY(-3px);
}
`;

// ── Three.js: OrbDot ──────────────────────────────────────

const OrbDot = ({ angle, radius, speed }: { angle: number; radius: number; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + angle;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 0.7) * 0.6, Math.sin(t) * radius);
  });
  return <mesh ref={ref}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#fca5a5" /></mesh>;
};

// ── Three.js: NeuralOrb (scroll-reactive) ─────────────────

const NeuralOrb = ({ scrollY = 0 }: { scrollY?: number }) => {
  const coreRef   = useRef<THREE.Mesh>(null);
  const ringRef   = useRef<THREE.Group>(null);
  const groupRef  = useRef<THREE.Group>(null);
  const scrollRef = useRef(scrollY);
  scrollRef.current = scrollY;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const sy = scrollRef.current;
    if (coreRef.current) {
      coreRef.current.rotation.x = t * 0.14;
      coreRef.current.rotation.y = t * 0.19;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.28;
      ringRef.current.rotation.z = t * 0.09;
    }
    if (groupRef.current) {
      // scroll: move up + shrink + rotate
      groupRef.current.position.y = -sy * 0.006;
      groupRef.current.rotation.y = sy * 0.0015;
      const s = Math.max(1 - sy * 0.0004, 0.3);
      groupRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
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
        {([
          [3.4, 0.04, Math.PI / 2, 0,           '#ef4444', 0.7],
          [3.9, 0.03, Math.PI / 3, Math.PI / 4, '#f87171', 0.5],
          [4.4, 0.02, Math.PI / 6, Math.PI / 2, '#fca5a5', 0.3],
        ] as [number,number,number,number,string,number][]).map(([r,t,rx,ry,col,op], i) => (
          <mesh key={i} rotation={[rx, ry, 0]}>
            <torusGeometry args={[r, t, 16, 100]} />
            <meshBasicMaterial color={col} transparent opacity={op} />
          </mesh>
        ))}
      </group>
      {Array.from({ length: 8 }).map((_, i) => (
        <OrbDot key={i} angle={(i / 8) * Math.PI * 2} radius={3.4} speed={0.4 + i * 0.04} />
      ))}
      <pointLight position={[0,0,0]} intensity={3} color="#ef4444" distance={12} decay={2} />
    </group>
  );
};

// ── Hacker Text Cloud ────────────────────────────────────

const HACKER_PHRASES = [
  'NEURAL_CORE::ONLINE','BLOCKCHAIN::SYNCED','AI_MODEL::CALIBRATED',
  'SECURE_CHANNEL::OK','ORCHESTRATION::ACTIVE','QUANTUM_ENCRYPT::ON',
  'ISO_27001::COMPLIANT','ACCESS::GRANTED','THREAT_LEVEL::ZERO',
  '> INIT METAVERSE...','DOCKER MESH::7 NODES','HPC::7 MICROSERVICES',
  '01001111 01010010','01000011 01001000','TCP/IP::HANDSHAKE OK',
];
const SPAWN_COLORS = ['#f87171','#ef4444','#dc2626','#fca5a5'];
const buildScrambled = (t: string, p: number) =>
  t.split('').map((c,i) => c===' '?' ': p>=(i+1)/t.length ? c : Math.random()>.5 ? '1' : '0').join('');
const makeTextCanvas = (text: string, hex: string, a: number): HTMLCanvasElement => {
  const cv = document.createElement('canvas'); cv.width=1024; cv.height=72;
  const ctx = cv.getContext('2d')!; ctx.clearRect(0,0,1024,72);
  if(a<=0) return cv;
  const [r,g,b]=[1,3,5].map(off=>parseInt(hex.slice(off,off+2),16));
  ctx.font='bold 32px "Courier New",monospace'; ctx.textBaseline='middle';
  ctx.shadowColor=`rgba(${r},${g},${b},${a*.8})`; ctx.shadowBlur=18;
  ctx.fillStyle=`rgba(${r},${g},${b},${a})`; ctx.fillText(text,8,36); return cv;
};

const HackerNode = ({ position, phraseIndex, color }: { position:[number,number,number]; phraseIndex:number; color:string }) => {
  const groupRef=useRef<THREE.Group>(null); const meshRef=useRef<THREE.Mesh>(null);
  const tex=useRef<THREE.CanvasTexture|null>(null); const mat=useRef<THREE.MeshBasicMaterial|null>(null);
  const t=useRef(Math.random()*100); const timer=useRef(Math.random()*2);
  const phase=useRef<'wait'|'in'|'show'|'out'>('wait');
  const prog=useRef(0); const opac=useRef(0);
  const phrase=useRef(HACKER_PHRASES[phraseIndex%HACKER_PHRASES.length]);
  useEffect(()=>{
    const cv=makeTextCanvas('',color,0);
    const tx=new THREE.CanvasTexture(cv); tx.minFilter=THREE.LinearFilter;
    tex.current=tx;
    const m=new THREE.MeshBasicMaterial({map:tx,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
    mat.current=m;
    if(meshRef.current)(meshRef.current as any).material=m;
    return()=>{tx.dispose();m.dispose();};
  },[]);
  useEffect(()=>{if(meshRef.current&&mat.current)(meshRef.current as any).material=mat.current;});
  useFrame((_,delta)=>{
    if(!groupRef.current||!tex.current||!mat.current)return;
    t.current+=delta; timer.current+=delta;
    groupRef.current.position.y=position[1]+Math.sin(t.current*.4)*.4;
    const tg=phrase.current;
    if(phase.current==='wait'){if(timer.current>.8){phase.current='in';prog.current=0;timer.current=0;}}
    else if(phase.current==='in'){prog.current=Math.min(prog.current+delta*.68,1);opac.current=Math.min(opac.current+delta*3.5,.72);tex.current.image=makeTextCanvas(buildScrambled(tg,prog.current),color,opac.current);tex.current.needsUpdate=true;mat.current.opacity=opac.current;if(prog.current>=1){phase.current='show';timer.current=0;}}
    else if(phase.current==='show'){if(timer.current>3.5){phase.current='out';prog.current=1;timer.current=0;}}
    else if(phase.current==='out'){prog.current=Math.max(prog.current-delta*.65,0);opac.current=Math.max(opac.current-delta*2.2,0);tex.current.image=makeTextCanvas(buildScrambled(tg,prog.current),color,opac.current);tex.current.needsUpdate=true;mat.current.opacity=opac.current;if(opac.current<=0){phrase.current=HACKER_PHRASES[Math.floor(Math.random()*HACKER_PHRASES.length)];phase.current='wait';timer.current=0;}}
  });
  return(<group ref={groupRef} position={position}><mesh ref={meshRef} rotation={[0,Math.PI*.18,0]}><planeGeometry args={[5.5,.55]}/></mesh></group>);
};

const CLOUD_POSITIONS:[number,number,number][]=[[-9,3,-8],[-7,-2,-7],[8,4,-9],[6,-3,-7],[-5,5,-6],[-3,-5,-8],[4,6,-6],[2,1,-9],[-8,0,-5],[7,2,-5]];
const HackerCloud = () => {
  const [slots,setSlots]=useState<{pos:[number,number,number];idx:number;col:string;key:number}[]>([]);
  const keyRef=useRef(0);
  useEffect(()=>{
    const schedule=()=>setTimeout(()=>{
      setSlots(prev=>{
        if(prev.length>=3)return prev;
        const pos=CLOUD_POSITIONS[Math.floor(Math.random()*CLOUD_POSITIONS.length)];
        return[...prev,{pos,idx:Math.floor(Math.random()*HACKER_PHRASES.length),col:SPAWN_COLORS[Math.floor(Math.random()*4)],key:keyRef.current++}];
      });schedule();
    },1400+Math.random()*800);
    const tid={current:schedule()};
    const cl=setInterval(()=>setSlots(p=>p.length>1?p.slice(1):p),9000);
    return()=>{clearTimeout(tid.current);clearInterval(cl);};
  },[]);
  return<>{slots.map(s=><HackerNode key={s.key} position={s.pos} phraseIndex={s.idx} color={s.col}/>)}</>;
};

// ── Animated Counter ──────────────────────────────────────

const AnimCounter = ({ to, suffix='' }: { to:number; suffix?:string }) => {
  const [val,setVal]=useState(0);
  const ref=useRef<HTMLSpanElement>(null);
  const inView=useInView(ref,{once:true,margin:'-60px'});
  useEffect(()=>{
    if(!inView)return;
    let n=0; const step=Math.ceil(to/55);
    const t=setInterval(()=>{n=Math.min(n+step,to);setVal(n);if(n>=to)clearInterval(t);},28);
    return()=>clearInterval(t);
  },[inView,to]);
  return <span ref={ref}>{val}{suffix}</span>;
};

// ── 3D Tilt Card ──────────────────────────────────────────

const TiltCard = ({ children, style, intensity=10 }: {
  children:React.ReactNode; style?:React.CSSProperties; intensity?:number;
}) => {
  const ref=useRef<HTMLDivElement>(null);
  const [tilt,setTilt]=useState({x:0,y:0,gx:50,gy:50});
  const [hov,setHov]=useState(false);
  const onMove=useCallback((e:React.MouseEvent)=>{
    if(!ref.current)return;
    const r=ref.current.getBoundingClientRect();
    const dx=(e.clientX-r.left)/r.width-.5, dy=(e.clientY-r.top)/r.height-.5;
    setTilt({x:-dy*intensity,y:dx*intensity,gx:(dx+.5)*100,gy:(dy+.5)*100});
  },[intensity]);
  return (
    <div ref={ref} onMouseMove={onMove}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>{setHov(false);setTilt({x:0,y:0,gx:50,gy:50});}}
      style={{
        ...style, position:'relative', overflow:'hidden',
        transform:hov?`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px)`:'perspective(900px) rotateX(0) rotateY(0)',
        transition:hov?'transform .06s ease-out':'transform .5s ease',
        willChange:'transform',
      }}>
      {hov&&<div style={{position:'absolute',inset:0,borderRadius:'inherit',pointerEvents:'none',zIndex:1,background:`radial-gradient(140px at ${tilt.gx}% ${tilt.gy}%,rgba(239,68,68,.14),transparent)`,transition:'background .06s'}}/>}
      {children}
    </div>
  );
};

// ── Section Label ─────────────────────────────────────────

const SectionLabel = ({children}:{children:React.ReactNode}) => (
  <motion.p initial={{opacity:0,y:8}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.6}}
    style={{fontFamily:"'Courier New',monospace",fontSize:11,color:'#ef4444',letterSpacing:'0.35em',textTransform:'uppercase',
      marginBottom:14,display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
    <span style={{width:32,height:1,background:'linear-gradient(90deg,transparent,#ef4444)',display:'inline-block'}}/>
    {children}
    <span style={{width:32,height:1,background:'linear-gradient(90deg,#ef4444,transparent)',display:'inline-block'}}/>
  </motion.p>
);

// ── 3D Button ─────────────────────────────────────────────

const Btn3D = ({ onClick,children,primary=false,icon }: {
  onClick?:()=>void; children:React.ReactNode; primary?:boolean; icon?:React.ReactNode;
}) => {
  const [pressed,setPressed]=useState(false);
  const [hov,setHov]=useState(false);
  const depth=pressed?1:hov?6:4;
  const faceGrad=primary
    ?'linear-gradient(160deg,#ff6b6b 0%,#ef4444 40%,#b91c1c 100%)'
    :'linear-gradient(160deg,#2d0a0a 0%,#1a0505 60%,#0d0000 100%)';
  return (
    <motion.button onClick={onClick}
      onHoverStart={()=>setHov(true)} onHoverEnd={()=>setHov(false)}
      onTapStart={()=>setPressed(true)} onTap={()=>setPressed(false)} onTapCancel={()=>setPressed(false)}
      animate={{scale:pressed?.96:hov?1.05:1,rotateX:hov&&!pressed?-6:0,y:pressed?depth-1:0}}
      transition={{type:'spring',stiffness:380,damping:22}}
      style={{perspective:600,display:'inline-block',cursor:'pointer',position:'relative',border:'none',background:'none',pointerEvents:'auto'}}>
      <div style={{position:'absolute',bottom:-depth,left:4,right:4,height:depth,background:primary?'#7f1d1d':'#050000',borderRadius:'0 0 12px 12px',boxShadow:`0 ${depth+4}px ${depth*3}px ${primary?'#ef444488':'#ef444422'}`}}/>
      <div style={{position:'relative',padding:'15px 36px',borderRadius:12,fontFamily:"'Courier New',monospace",fontWeight:800,fontSize:13,letterSpacing:2,textTransform:'uppercase',color:primary?'#fff':'#f87171',background:faceGrad,border:`1px solid ${primary?'#ff6b6b':'#5a1a1a'}`,display:'flex',alignItems:'center',gap:10,minWidth:188,justifyContent:'center',overflow:'hidden'}}>
        <AnimatePresence>
          {hov&&<motion.div key="s" initial={{x:'-110%'}} animate={{x:'210%'}} exit={{opacity:0}} transition={{duration:.55}} style={{position:'absolute',top:0,bottom:0,left:0,width:'50%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)',pointerEvents:'none'}}/>}
        </AnimatePresence>
        {icon&&<span style={{fontSize:16}}>{icon}</span>}
        {children}
      </div>
    </motion.button>
  );
};

// ── Trailer Modal ─────────────────────────────────────────

const TrailerModal = ({onClose}:{onClose:()=>void}) => {
  const [err,setErr]=useState(false); const [loading,setLoading]=useState(true);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      style={{background:'rgba(0,0,0,.93)',backdropFilter:'blur(12px)'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:.88,y:40,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:.88,y:40,opacity:0}}
        transition={{type:'spring',stiffness:280,damping:28}}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{border:'1px solid rgba(239,68,68,.35)',background:'#060000',boxShadow:'0 0 80px rgba(239,68,68,.12)'}}>
        <div className="flex items-center justify-between px-8 py-5" style={{borderBottom:'1px solid rgba(239,68,68,.15)',background:'rgba(10,2,2,.9)'}}>
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"/>
            <span className="font-mono text-sm font-bold tracking-widest" style={{color:'#f87171'}}>AODS — TRAILER</span>
          </div>
          <motion.button onClick={onClose} whileHover={{scale:1.1,rotate:90}} whileTap={{scale:.9}}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{color:'#f87171',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)'}}>✕</motion.button>
        </div>
        <div style={{aspectRatio:'16/9',background:'#000',position:'relative'}}>
          {!err?(
            <>{loading&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{background:'#000'}}><div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/><span className="font-mono text-xs tracking-widest" style={{color:'#f87171'}}>LOADING...</span></div>}
            <video controls autoPlay className="w-full h-full" onError={()=>{setErr(true);setLoading(false);}} onCanPlay={()=>setLoading(false)} style={{display:loading?'none':'block',objectFit:'cover'}}><source src="/videos/trailer.mp4" type="video/mp4"/></video></>
          ):(
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{background:'radial-gradient(ellipse,#1a0505,#000)'}}>
              <motion.div animate={{opacity:[.5,1,.5]}} transition={{duration:2,repeat:Infinity}} className="font-mono text-xs tracking-widest mb-4" style={{color:'#ef4444'}}>//FILE NOT FOUND</motion.div>
              <h2 className="font-black tracking-tight mb-2" style={{fontSize:'clamp(32px,6vw,56px)',fontFamily:"'Courier New',monospace",background:'linear-gradient(135deg,#fca5a5,#ef4444,#dc2626)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>COMING SOON</h2>
              <p className="font-mono text-sm" style={{color:'rgba(252,165,165,.6)'}}>Trailer sedang dalam produksi</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Ticker ────────────────────────────────────────────────

const TICKER_ITEMS=['NEURAL CORE','BLOCKCHAIN','AI AGENT','METAVERSE','3D HOLOGRAPHIC','MICROSERVICES','SMART CONTRACTS','ISO 27001','ZERO TRUST','PLAY-TO-EARN','WEB4','POLYGLOT'];
const Ticker = () => (
  <div style={{overflow:'hidden',borderTop:'1px solid rgba(239,68,68,.12)',borderBottom:'1px solid rgba(239,68,68,.12)',padding:'10px 0',background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}}>
    <div style={{display:'flex',width:'max-content',animation:'lp-ticker 30s linear infinite'}}>
      {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>(
        <span key={i} style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'rgba(239,68,68,.45)',letterSpacing:4,textTransform:'uppercase',padding:'0 32px',display:'flex',alignItems:'center',gap:24,whiteSpace:'nowrap'}}>
          <span style={{width:4,height:4,borderRadius:'50%',background:'#ef444450',display:'inline-block',flexShrink:0}}/>
          {item}
        </span>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────

const HeroSection = ({ onTrailer, scrollY }: { onTrailer:()=>void; scrollY:number }) => {
  const navigate=useNavigate();
  const [glitch,setGlitch]=useState(false);
  useEffect(()=>{const t=setInterval(()=>{setGlitch(true);setTimeout(()=>setGlitch(false),100);},4200);return()=>clearInterval(t);},[]);

  const parallaxY  = Math.min(scrollY * 0.3, 100);
  const opacity    = Math.max(1 - scrollY / 550, 0);
  const scale      = Math.max(1 - scrollY * 0.00025, 0.9);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{pointerEvents:'none',overflow:'hidden'}}>
      {/* Decorative rings */}
      {[320,460,580].map((sz,i)=>(
        <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:sz,height:sz,marginLeft:-sz/2,marginTop:-sz/2,borderRadius:'50%',border:`1px solid rgba(239,68,68,${.1-.025*i})`,animation:`${i%2===0?'lp-spin':'lp-rspin'} ${22+i*8}s linear infinite`,pointerEvents:'none'}}/>
      ))}
      {/* Scanline */}
      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        <div style={{position:'absolute',left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(239,68,68,.25),transparent)',animation:'lp-scanline 8s linear infinite'}}/>
      </div>

      <motion.div style={{transform:`translateY(${parallaxY}px) scale(${scale})`,opacity,pointerEvents:'auto'}}>
        {/* Status badge */}
        <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 22px',borderRadius:999,marginBottom:28,background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.22)',backdropFilter:'blur(8px)'}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#ef4444',animation:'lp-pulse 1.4s ease-in-out infinite'}}/>
          <span style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'#fca5a5',letterSpacing:4}}>A COMPREHENSIVE ENTERPRISE METAVERSE PLATFORM</span>
        </motion.div>

        {/* AODS title with glitch */}
        <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.9}}>
          <h1 style={{
            fontFamily:"'Courier New',monospace",fontWeight:900,lineHeight:.88,
            fontSize:'clamp(80px,15vw,140px)',margin:'0 0 14px',letterSpacing:-3,
            background:'linear-gradient(160deg,#fff 0%,#fca5a5 35%,#ef4444 70%,#dc2626 100%)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
            filter:`drop-shadow(0 0 40px #ef444466)`,
            transform:glitch?'translateX(4px) skewX(-2deg)':'translateX(0) skewX(0)',
            transition:'transform .05s,filter .05s',
          }}>AODS</h1>
        </motion.div>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}}
          style={{fontFamily:"'Courier New',monospace",fontSize:'clamp(12px,1.7vw,16px)',color:'rgba(255,210,210,.7)',letterSpacing:'0.3em',marginBottom:8}}>
          Autonomous Orchestration of Digital Systems
        </motion.p>

        <motion.p animate={{opacity:[.5,1,.5]}} transition={{duration:2.5,repeat:Infinity}}
          style={{fontFamily:"'Courier New',monospace",fontSize:'clamp(9px,1vw,11px)',color:'rgba(239,68,68,.55)',letterSpacing:'0.5em',marginBottom:44,textTransform:'uppercase'}}>
          ✦ The Holographic Enterprise Metaverse ✦
        </motion.p>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.45}}
          style={{color:'rgba(252,165,165,.5)',maxWidth:500,margin:'0 auto 48px',fontSize:'clamp(13px,1.3vw,16px)',lineHeight:1.85}}>
          Platform enterprise generasi berikutnya - AI Agent, blockchain, dan visualisasi 3D holografik dalam satu ekosistem terintegrasi.
        </motion.p>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.6}}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <Btn3D onClick={onTrailer} primary icon="▶">Watch Trailer</Btn3D>
          <Btn3D onClick={()=>navigate('/signup')} icon="◈">Explore Universe</Btn3D>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.6}}
        style={{position:'absolute',bottom:36,left:'50%',transform:'translateX(-50%)',pointerEvents:'none',opacity:Math.max(1-scrollY/180,0)}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
          <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:'rgba(239,68,68,.35)',letterSpacing:'0.5em'}}>SCROLL</span>
          <div style={{width:1,height:52,background:'linear-gradient(to bottom,#ef4444,transparent)',animation:'lp-pulse 1.8s ease-in-out infinite'}}/>
        </div>
      </motion.div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────────────────────

const STATS = [
  {value:9,   suffix:'',   label:'Languages',          sub:'Polyglot Architecture', icon:'⬡'},
  {value:8,   suffix:'',   label:'Microservices',       sub:'Docker Containers',     icon:'⊞'},
  {value:9,   suffix:'',   label:'Blockchain Modules',  sub:'Smart Contracts',       icon:'◈'},
  {value:50,  suffix:'+',  label:'API Endpoints',       sub:'REST + WebSocket',      icon:'⊕'},
  {value:12,  suffix:'K+', label:'Lines of Code',       sub:'65+ Files',             icon:'◇'},
  {value:60,  suffix:' FPS',label:'3D Performance',     sub:'GPU Accelerated',       icon:'▷'},
];

const StatsSection = () => (
  <section className="relative px-4 sm:px-6 py-24">
    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.8)',backdropFilter:'blur(16px)'}}/>
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>System Metrics</SectionLabel>
        <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(24px,4vw,40px)',color:'#fff',margin:0}}>
          Platform <span style={{background:'linear-gradient(90deg,#f87171,#ef4444)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Statistics</span>
        </motion.h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {STATS.map((s,i)=>(
          <motion.div key={i} initial={{opacity:0,y:28,rotateX:-12}} whileInView={{opacity:1,y:0,rotateX:0}} viewport={{once:true,margin:'-40px'}} transition={{delay:i*.06,duration:.55,ease:[.22,1,.36,1]}}>
            <TiltCard style={{padding:'24px 20px',borderRadius:16,textAlign:'center',cursor:'default',background:'linear-gradient(135deg,rgba(22,4,4,.92),rgba(8,1,1,.96))',border:'1px solid rgba(239,68,68,.15)',backdropFilter:'blur(12px)',boxShadow:'0 4px 24px rgba(0,0,0,.45)'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(239,68,68,.7),transparent)',animation:'lp-beam 3.5s linear infinite',backgroundSize:'200% auto'}}/>
              <p style={{fontFamily:"'Courier New',monospace",fontSize:11,color:'rgba(239,68,68,.4)',marginBottom:8}}>{s.icon}</p>
              <p style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(30px,4vw,50px)',margin:'0 0 6px',background:'linear-gradient(135deg,#fff,#fca5a5 50%,#ef4444)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1}}>
                <AnimCounter to={s.value} suffix={s.suffix}/>
              </p>
              <p style={{fontWeight:700,color:'rgba(255,255,255,.85)',fontSize:'clamp(11px,1.2vw,14px)',marginBottom:4}}>{s.label}</p>
              <p style={{fontSize:10,color:'rgba(252,165,165,.4)',fontFamily:"'Courier New',monospace",letterSpacing:1}}>{s.sub}</p>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────
// TECH STACK
// ─────────────────────────────────────────────────────────

const TECH_STACK = [
  {name:'React + TypeScript', role:'Frontend Framework',        color:'#61DAFB', port:null},
  {name:'Python FastAPI',      role:'API Gateway',               color:'#3776AB', port:9000},
  {name:'Python AI/ML',        role:'Neural Core',               color:'#FFD43B', port:9001},
  {name:'Go Telemetry',        role:'High-Performance Monitor',  color:'#00ADD8', port:9002},
  {name:'C++ HPC',             role:'Physics & Compute',         color:'#00589C', port:9003},
  {name:'C# Enterprise',       role:'SAP/Salesforce Bridge',     color:'#512BD4', port:9004},
  {name:'Java Bridge',         role:'Legacy Connectivity',       color:'#E76F00', port:9005},
  {name:'PHP Connector',       role:'Third-Party APIs',          color:'#777BB4', port:9006},
  {name:'Ruby Automation',     role:'Task Scheduling',           color:'#CC342D', port:9007},
];

const TechStackSection = () => (
  <section className="relative px-4 sm:px-6 py-24">
    <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.65),rgba(10,1,1,.93))',backdropFilter:'blur(10px)'}}/>
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Polyglot Architecture</SectionLabel>
        <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(22px,3.5vw,38px)',color:'#fff',margin:0}}>
          9 <span style={{color:'#f87171'}}>Languages</span>, 1 Ecosystem
        </motion.h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TECH_STACK.map((t,i)=>(
          <motion.div key={i} initial={{opacity:0,x:i%2===0?-20:20}} whileInView={{opacity:1,x:0}} viewport={{once:true,margin:'-20px'}} transition={{delay:i*.045}}>
            <TiltCard intensity={8} style={{padding:'14px 18px',borderRadius:13,background:'rgba(10,2,2,.9)',border:`1px solid ${t.color}1e`,backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:14,cursor:'default'}}>
              <div style={{position:'absolute',left:0,top:8,bottom:8,width:3,background:`linear-gradient(to bottom,${t.color},${t.color}44)`,borderRadius:3,flexShrink:0}}/>
              <div style={{width:34,height:34,borderRadius:9,background:`${t.color}14`,border:`1px solid ${t.color}2a`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:6}}>
                <div style={{width:9,height:9,borderRadius:'50%',background:t.color,boxShadow:`0 0 10px ${t.color}`}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:700,color:'rgba(255,255,255,.9)',fontSize:13,marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.name}</p>
                <p style={{fontSize:11,color:'rgba(252,165,165,.45)',fontFamily:"'Courier New',monospace"}}>{t.role}</p>
              </div>
              {t.port&&<span style={{fontFamily:"'Courier New',monospace",fontSize:10,padding:'2px 7px',borderRadius:5,background:`${t.color}12`,color:t.color,border:`1px solid ${t.color}25`,flexShrink:0}}>:{t.port}</span>}
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────
// BLOCKCHAIN SECTION
// ─────────────────────────────────────────────────────────

const BC_MODULES = [
  {icon:'₿',  name:'Crypto & Payments', tech:'ERC-20',       status:'Live', col:'#f59e0b'},
  {icon:'📦', name:'Supply Chain',       tech:'Hyperledger',  status:'Live', col:'#22d3ee'},
  {icon:'🏥', name:'Healthcare',         tech:'ZK Proofs',    status:'Beta', col:'#a78bfa'},
  {icon:'🪪', name:'Digital Identity',   tech:'DID Protocol', status:'Live', col:'#34d399'},
  {icon:'🏢', name:'Asset Tokenization', tech:'ERC-1400',     status:'Live', col:'#fb923c'},
  {icon:'🚀', name:'ICO / IEO',          tech:'Escrow',       status:'Live', col:'#f87171'},
  {icon:'🎮', name:'Gaming & Esports',   tech:'Play-to-Earn', status:'Beta', col:'#c084fc'},
  {icon:'🗳️', name:'e-Voting',           tech:'DAO',          status:'Beta', col:'#60a5fa'},
  {icon:'🏦', name:'P2P Lending',        tech:'DeFi',         status:'Live', col:'#4ade80'},
];

const BlockchainSection = () => (
  <section className="relative px-4 sm:px-6 py-24">
    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.84)',backdropFilter:'blur(14px)'}}/>
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Web4 Blockchain Hub</SectionLabel>
        <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(22px,3.5vw,38px)',color:'#fff',margin:'0 0 6px'}}>
          9 Integrated <span style={{color:'#f87171'}}>Blockchain</span> Modules
        </motion.h2>
        <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
          style={{fontSize:11,color:'rgba(252,165,165,.4)',fontFamily:"'Courier New',monospace",letterSpacing:2}}>
          Smart Contracts · Solidity · Hyperledger Fabric · OpenZeppelin
        </motion.p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BC_MODULES.map((m,i)=>(
          <motion.div key={i} initial={{opacity:0,y:18,scale:.96}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true,margin:'-20px'}} transition={{delay:i*.04}}>
            <TiltCard intensity={10} style={{padding:'16px 18px',borderRadius:13,background:'rgba(7,1,1,.92)',border:`1px solid ${m.col}18`,cursor:'default'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${m.col}55,transparent)`}}/>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,borderRadius:11,background:`${m.col}12`,border:`1px solid ${m.col}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>{m.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:700,color:'rgba(255,255,255,.9)',fontSize:13,marginBottom:2}}>{m.name}</p>
                  <p style={{fontSize:10,color:'rgba(252,165,165,.45)',fontFamily:"'Courier New',monospace"}}>{m.tech}</p>
                </div>
                <span style={{fontSize:10,padding:'2px 9px',borderRadius:99,fontFamily:"'Courier New',monospace",fontWeight:700,flexShrink:0,background:m.status==='Live'?'rgba(34,197,94,.1)':'rgba(234,179,8,.1)',color:m.status==='Live'?'#86efac':'#fde047',border:`1px solid ${m.status==='Live'?'rgba(34,197,94,.28)':'rgba(234,179,8,.28)'}`}}>
                  {m.status==='Live'?'● Live':'◐ Beta'}
                </span>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────
// FEATURES SECTION
// ─────────────────────────────────────────────────────────

const FEATURES = [
  {icon:'🧠', title:'AI Neural Core',      color:'#a78bfa', desc:'LSTM predictions, Isolation Forest anomaly detection, BERT NLP, dan 1536-dim vector embeddings untuk orkestrasi cerdas.'},
  {icon:'🔗', title:'Blockchain Security', color:'#22d3ee', desc:'Protokol keamanan terdesentralisasi Web4 dengan identitas DID, ZK Proofs, dan enkripsi end-to-end.'},
  {icon:'🌐', title:'3D Holographic UI',   color:'#f87171', desc:'Antarmuka imersif berbasis Three.js + AFrame VR dengan visualisasi metaverse enterprise real-time.'},
  {icon:'⚡', title:'Multi-Language HPC',  color:'#fbbf24', desc:'8 microservice (Python, Go, C++, C#, Java, PHP, Ruby) dengan Docker orchestration performa tinggi.'},
  {icon:'🎮', title:'Gamification Layer',  color:'#4ade80', desc:'Sistem XP, level, achievement, dan tournament esports dengan Play-to-Earn AODS token rewards.'},
  {icon:'🛡️', title:'ISO 27001 / COBIT',  color:'#fb923c', desc:'Compliance otomatis, audit logging, Row-Level Security database, dan report governance real-time.'},
];

const FeaturesSection = () => (
  <section className="relative px-4 sm:px-6 py-24">
    <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.88),rgba(14,1,1,.96))',backdropFilter:'blur(10px)'}}/>
    <div className="relative max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <SectionLabel>Core Capabilities</SectionLabel>
        <motion.h2 initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          style={{fontFamily:"'Courier New',monospace",fontWeight:900,fontSize:'clamp(22px,3.5vw,38px)',color:'#fff',margin:'0 0 6px'}}>
          Platform <span style={{color:'#f87171'}}>Next-Gen</span>
        </motion.h2>
        <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
          style={{fontSize:10,color:'rgba(252,165,165,.38)',fontFamily:"'Courier New',monospace",letterSpacing:'0.3em'}}>
          TEKNOLOGI TERDEPAN DALAM SATU EKOSISTEM HOLOGRAFIK
        </motion.p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f,i)=>(
          <motion.div key={i} initial={{opacity:0,y:32,scale:.94}} whileInView={{opacity:1,y:0,scale:1}} viewport={{once:true,margin:'-40px'}} transition={{delay:i*.07,duration:.6,ease:[.22,1,.36,1]}}>
            <TiltCard intensity={13} style={{padding:'26px 22px',borderRadius:18,cursor:'default',background:'linear-gradient(135deg,rgba(18,3,3,.94),rgba(6,1,1,.97))',border:`1px solid ${f.color}1c`,boxShadow:`0 8px 32px rgba(0,0,0,.42),inset 0 1px 0 ${f.color}14`}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${f.color}75,transparent)`}}/>
              <div style={{width:50,height:50,borderRadius:13,background:`${f.color}10`,border:`1px solid ${f.color}24`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:14,boxShadow:`0 0 20px ${f.color}14`}}>{f.icon}</div>
              <h3 style={{fontFamily:"'Courier New',monospace",fontWeight:700,fontSize:15,color:f.color,marginBottom:10}}>{f.title}</h3>
              <p style={{fontSize:13,lineHeight:1.78,color:'rgba(252,165,165,.52)'}}>{f.desc}</p>
              <div style={{position:'absolute',bottom:10,right:13,fontFamily:"'Courier New',monospace",fontSize:9,color:`${f.color}28`,letterSpacing:1}}>{String(i+1).padStart(2,'0')}</div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────
// CTA SECTION
// ─────────────────────────────────────────────────────────

const CTASection = () => {
  const navigate=useNavigate();
  const ref=useRef<HTMLElement>(null);
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
  const y=useTransform(scrollYProgress,[0,1],[36,-36]);
  return (
    <section ref={ref} className="relative px-4 py-36 overflow-hidden">
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 50%,rgba(120,28,28,.22),rgba(0,0,0,.94))',backdropFilter:'blur(20px)'}}/>
      {[260,370,480].map((sz,i)=>(
        <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:sz,height:sz,marginLeft:-sz/2,marginTop:-sz/2,borderRadius:'50%',border:`1px solid rgba(239,68,68,${.07-.015*i})`,animation:`${i%2===0?'lp-spin':'lp-rspin'} ${28+i*10}s linear infinite`,pointerEvents:'none'}}/>
      ))}
      <motion.div style={{y}} className="relative max-w-3xl mx-auto text-center">
        <motion.div initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
          <SectionLabel>Join AODS</SectionLabel>
          <h2 style={{fontFamily:"'Courier New',monospace",fontWeight:900,color:'#fff',fontSize:'clamp(26px,5vw,50px)',lineHeight:1.15,margin:'0 0 18px'}}>
            Siap Memasuki<br/>
            <span className="lp-shimmer-text">Holographic Metaverse?</span>
          </h2>
          <p style={{color:'rgba(252,165,165,.52)',fontSize:'clamp(13px,1.3vw,16px)',lineHeight:1.85,maxWidth:500,margin:'0 auto 44px'}}>
            Bergabunglah dengan AODS Neural Core — platform enterprise terdepan yang menggabungkan AI, blockchain, dan visualisasi 3D.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-14">
            <Btn3D onClick={()=>navigate('/signup')} primary icon="◈">Create Account</Btn3D>
            <Btn3D onClick={()=>navigate('/login')} icon="→">Sign In</Btn3D>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
            {['Free tier available','MetaMask supported','ISO 27001','9 Languages','Open Source'].map((pill,i)=>(
              <motion.span key={i} initial={{opacity:0,scale:.8}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:.08*i}}
                style={{fontFamily:"'Courier New',monospace",fontSize:10,color:'rgba(252,165,165,.5)',padding:'4px 13px',borderRadius:99,background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.13)',letterSpacing:1}}>
                ✓ {pill}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
      <p style={{position:'absolute',bottom:20,left:0,right:0,textAlign:'center',fontFamily:"'Courier New',monospace",fontSize:10,color:'rgba(127,29,29,.4)',letterSpacing:2}}>
        AODS · Ahmad Fashich Azzuhri Ramadhani · 2026
      </p>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showContent, setShowContent] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(()=>{
    const onScroll=()=>setScrollY(window.scrollY);
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>window.removeEventListener('scroll',onScroll);
  },[]);

  return (
    <div style={{background:'radial-gradient(ellipse at 30% 20%,#1a0505 0%,#0a0000 55%,#000 100%)',overflowX:'hidden'}}>
      <style>{GLOBAL_CSS}</style>

      {/* Fixed 3D background */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}>
        <Canvas shadows dpr={[1,1.5]} camera={{position:[0,2,13],fov:60}}>
          <ambientLight intensity={0.2}/>
          <pointLight position={[10,10,10]} intensity={2} color="#ef4444"/>
          <pointLight position={[-10,-10,-10]} intensity={1} color="#f87171"/>
          <pointLight position={[0,-8,5]} intensity={0.5} color="#dc2626"/>
          <Stars radius={120} depth={60} count={5500} factor={5} saturation={0.2} fade speed={0.8}/>
          <NeuralOrb scrollY={scrollY}/>
          <HackerCloud/>
          <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
            <mesh position={[-7,2.5,-3]}>
              <octahedronGeometry args={[0.9,0]}/>
              <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} metalness={0.8} roughness={0.2}/>
            </mesh>
          </Float>
          <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1}>
            <mesh position={[7,-2,-2]}>
              <dodecahedronGeometry args={[0.8,0]}/>
              <meshStandardMaterial color="#f87171" metalness={0.9} roughness={0.1}/>
            </mesh>
          </Float>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3}/>
        </Canvas>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,.5) 100%)'}}/>
      </div>

      {/* Eye toggle */}
      <motion.button whileHover={{scale:1.12}} whileTap={{scale:.88}} onClick={()=>setShowContent(v=>!v)}
        style={{position:'fixed',bottom:24,right:24,zIndex:50,width:44,height:44,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.82)',border:`1px solid ${showContent?'rgba(239,68,68,.55)':'rgba(100,20,20,.35)'}`,backdropFilter:'blur(8px)',cursor:'pointer'}}>
        {showContent
          ?<svg style={{width:18,height:18,color:'#f87171'}} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          :<svg style={{width:18,height:18,color:'#555'}} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>}
      </motion.button>

      <AnimatePresence>{showTrailer&&<TrailerModal onClose={()=>setShowTrailer(false)}/>}</AnimatePresence>

      <AnimatePresence>
        {showContent&&(
          <motion.div key="content" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.5}} style={{position:'relative',zIndex:10}}>
            <HeroSection onTrailer={()=>setShowTrailer(true)} scrollY={scrollY}/>
            <Ticker/>
            <StatsSection/>
            <LiveSystemStatus/>
            <TechStackSection/>
            <BlockchainSection/>
            <FeaturesSection/>
            <CTASection/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
