/**
 * LiveSystemStatus — Real-time section untuk LandingPage
 * AODS Neural Core
 *
 * CARA PENGGUNAAN:
 * 1. Copy seluruh konten file ini
 * 2. Buka: frontend/src/components/LandingPage.tsx
 * 3. Cari baris: "// ─── Section: Tech Stack ──"
 * 4. Paste komponen LiveSystemStatus SEBELUM baris tersebut
 * 5. Cari di bagian render: <StatsSection />
 * 6. Tambahkan <LiveSystemStatus /> SETELAH <StatsSection />
 *
 * Contoh:
 *   <StatsSection />
 *   <LiveSystemStatus />       ← tambahkan ini
 *   <TechStackSection />
 *
 * Data yang di-fetch secara real-time:
 *  - /health                         → gateway + service status
 *  - /api/orchestration              → semua microservice health
 *  - /api/compliance/status          → compliance score
 *  - github.com/Fashich/AODS-Neural-Core → repo stats
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'https://aods-api-gateway.onrender.com';

// ── Types ──────────────────────────────────────────────────────────

interface ServiceInfo {
  id: string; name: string; language: string; status: string; health: number;
}

interface SystemData {
  gateway: string;
  services: ServiceInfo[];
  compliance: number;
  activeNodes: number;
  dbStatus: string;
}

interface GithubData {
  stars: number;
  forks: number;
  openIssues: number;
  lastPush: string;
  contributors: number;
}

// ── Language color map ──────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  python:  '#3b82f6',
  go:      '#22d3ee',
  cpp:     '#8b5cf6',
  csharp:  '#a78bfa',
  java:    '#f59e0b',
  php:     '#6366f1',
  ruby:    '#ec4899',
};

// ── Animated counter ───────────────────────────────────────────────

function AnimCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const step = Math.ceil(to / 40);
    ref.current = setInterval(() => {
      setVal(v => {
        const next = Math.min(v + step, to);
        if (next >= to && ref.current) clearInterval(ref.current!);
        return next;
      });
    }, 35);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [to]);
  return <>{val}{suffix}</>;
}

// ── Live System Status Section ─────────────────────────────────────

export function LiveSystemStatus() {
  const [data, setData] = useState<SystemData | null>(null);
  const [github, setGithub] = useState<GithubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const fetchData = async () => {
    try {
      const [healthRes, orchRes, compRes] = await Promise.allSettled([
        fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(6000) }).then(r => r.json()),
        fetch(`${API_URL}/api/orchestration`, { signal: AbortSignal.timeout(6000) }).then(r => r.json()),
        fetch(`${API_URL}/api/compliance/status`, { signal: AbortSignal.timeout(6000) }).then(r => r.json()),
      ]);

      const health = healthRes.status === 'fulfilled' ? healthRes.value : null;
      const orch   = orchRes.status   === 'fulfilled' ? orchRes.value   : null;
      const comp   = compRes.status   === 'fulfilled' ? compRes.value   : null;

      setData({
        gateway:     health?.status     ?? 'unknown',
        services:    orch?.services     ?? [],
        compliance:  comp?.overallScore ?? 0,
        activeNodes: (orch?.services ?? []).filter((s: ServiceInfo) => s.status === 'healthy').length,
        dbStatus:    health?.services?.database ?? 'unknown',
      });
      setLastFetch(new Date());
    } catch {
      // silently fail — keep showing stale data
    } finally {
      setLoading(false);
    }
  };

  const fetchGithub = async () => {
    try {
      const res = await fetch('https://api.github.com/repos/Fashich/AODS-Neural-Core', {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return;
      const json = await res.json();

      // contributors
      let contributors = 1;
      try {
        const cRes = await fetch('https://api.github.com/repos/Fashich/AODS-Neural-Core/contributors?per_page=1&anon=true', { signal: AbortSignal.timeout(5000) });
        const link = cRes.headers.get('link') ?? '';
        const match = link.match(/page=(\d+)>; rel="last"/);
        contributors = match ? parseInt(match[1], 10) : 1;
      } catch { /* ok */ }

      setGithub({
        stars:        json.stargazers_count ?? 0,
        forks:        json.forks_count      ?? 0,
        openIssues:   json.open_issues_count ?? 0,
        lastPush:     json.pushed_at        ?? '',
        contributors,
      });
    } catch { /* silently ignore */ }
  };

  useEffect(() => {
    fetchData();
    fetchGithub();
    const interval = setInterval(fetchData, 30_000);
    const tickInterval = setInterval(() => setTick(t => t + 1), 1000);
    return () => { clearInterval(interval); clearInterval(tickInterval); };
  }, []);

  const timeAgo = lastFetch
    ? `${Math.floor((Date.now() - lastFetch.getTime()) / 1000)}s ago`
    : '—';

  return (
    <section style={{ position: 'relative', padding: '96px 16px', pointerEvents: 'auto' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.78) 0%,rgba(15,2,2,0.92) 100%)', backdropFilter: 'blur(12px)' }} />

      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#ef4444', letterSpacing: 4, marginBottom: 10, textTransform: 'uppercase' }}>
            // LIVE SYSTEM STATUS
          </p>
          <h2 style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: '#fff', margin: 0, fontFamily: "'Courier New',monospace" }}>
            Real-Time <span style={{ color: '#f87171' }}>Infrastructure</span>
          </h2>
          <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg,transparent,#ef4444,transparent)', margin: '16px auto 0' }} />

          {/* Last updated */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
              background: loading ? '#f59e0b' : '#22c55e',
              boxShadow: loading ? '0 0 6px #f59e0b' : '0 0 6px #22c55e',
              animation: 'lspulse 2s ease-in-out infinite',
            }} />
            <style>{`@keyframes lspulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(252,165,165,0.4)', letterSpacing: 2 }}>
              {loading ? 'FETCHING DATA...' : `UPDATED ${timeAgo.toUpperCase()} · AUTO-REFRESH 30s`}
            </span>
          </div>
        </motion.div>

        {/* ── Top row: summary cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 32 }}>
          {[
            {
              label: 'Gateway',
              value: data ? (data.gateway === 'online' ? 'ONLINE' : data.gateway.toUpperCase()) : '—',
              color: data?.gateway === 'online' ? '#22c55e' : '#f59e0b',
              icon: '⬡',
              sub: 'API Gateway · Port 9000',
            },
            {
              label: 'Active Services',
              value: data ? `${data.activeNodes} / ${data.services.length || 7}` : '—',
              color: '#3b82f6',
              icon: '⊞',
              sub: 'Microservice Mesh',
            },
            {
              label: 'Database',
              value: data ? (data.dbStatus === 'online' ? 'ONLINE' : data.dbStatus?.toUpperCase() ?? '—') : '—',
              color: data?.dbStatus === 'online' ? '#22c55e' : '#f59e0b',
              icon: '⬡',
              sub: 'Neon PostgreSQL',
            },
            {
              label: 'Compliance Score',
              value: data ? `${data.compliance}%` : '—',
              color: '#a78bfa',
              icon: '✓',
              sub: 'ISO 27001 · COBIT',
            },
          ].map((card, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3, scale: 1.02 }}
              style={{
                padding: '18px 20px', borderRadius: 14,
                background: 'rgba(15,3,3,0.88)',
                border: `1px solid ${card.color}22`,
                backdropFilter: 'blur(8px)',
                boxShadow: `0 0 20px ${card.color}10`,
                position: 'relative', overflow: 'hidden',
              }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${card.color}80,transparent)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, color: 'rgba(252,165,165,0.4)', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>{card.label}</p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color: card.color, textShadow: `0 0 12px ${card.color}88` }}>
                    {loading ? <span style={{ opacity: 0.4 }}>···</span> : card.value}
                  </p>
                </div>
                <span style={{ fontSize: 22, color: `${card.color}66` }}>{card.icon}</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 10, fontFamily: 'monospace', color: 'rgba(252,165,165,0.25)' }}>{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Service grid ── */}
        {data && data.services.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: 'rgba(10,2,2,0.8)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 16, padding: '24px', marginBottom: 32 }}>
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#ef4444aa', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 18 }}>
              // MICROSERVICE MESH — {data.services.length} NODES
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
              {data.services.map((svc, i) => {
                const color = LANG_COLORS[svc.language] ?? '#ef4444';
                const isHealthy = svc.status === 'healthy';
                return (
                  <motion.div key={svc.id}
                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.04 }}
                    style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(5,1,1,0.9)', border: `1px solid ${color}22`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}60,transparent)` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#fff' }}>{svc.name.split('-')[0]}</span>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: isHealthy ? '#22c55e' : '#f59e0b',
                        boxShadow: isHealthy ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
                        display: 'inline-block',
                      }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 9, color: color, letterSpacing: 1, textTransform: 'uppercase' }}>{svc.language}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(252,165,165,0.4)' }}>{svc.health}%</span>
                    </div>
                    {/* Health bar */}
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${svc.health}%`, background: `linear-gradient(90deg,${color}60,${color})`, transition: 'width 0.8s ease', borderRadius: 1 }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── GitHub stats ── */}
        {github && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: 'rgba(10,2,2,0.8)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 16, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#ef4444aa', letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>
                // GITHUB · Fashich/AODS-Neural-Core
              </p>
              <a href="https://github.com/Fashich/AODS-Neural-Core" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: 'monospace', fontSize: 10, color: '#f87171', letterSpacing: 1, textDecoration: 'none', border: '1px solid rgba(239,68,68,0.2)', padding: '4px 12px', borderRadius: 6 }}>
                VIEW REPO →
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 14, marginTop: 18 }}>
              {[
                { label: 'Stars',        value: github.stars,        icon: '★', color: '#f59e0b' },
                { label: 'Forks',        value: github.forks,        icon: '⑂', color: '#22d3ee' },
                { label: 'Open Issues',  value: github.openIssues,   icon: '!', color: '#f87171' },
                { label: 'Contributors', value: github.contributors, icon: '⊕', color: '#a78bfa' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '14px 8px', background: 'rgba(5,1,1,0.7)', borderRadius: 10, border: `1px solid ${color}18` }}>
                  <div style={{ fontSize: 18, color: `${color}99`, marginBottom: 4 }}>{icon}</div>
                  <p style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 22, margin: '0 0 4px', color }}>
                    <AnimCounter to={value} />
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(252,165,165,0.35)', margin: 0, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</p>
                </div>
              ))}
            </div>
            {github.lastPush && (
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(252,165,165,0.2)', marginTop: 14, textAlign: 'right', letterSpacing: 1 }}>
                LAST PUSH: {new Date(github.lastPush).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default LiveSystemStatus;

/*
── INSTRUKSI PENAMBAHAN KE LandingPage.tsx ──────────────────────────────────

1. Import di bagian atas LandingPage.tsx:
   import { LiveSystemStatus } from './LiveSystemStatus';
   // atau jika dijadikan named export, atau bisa juga inline

2. Di render LandingPage, tambahkan setelah <StatsSection />:
   <StatsSection />
   <LiveSystemStatus />     ← ini
   <TechStackSection />

──────────────────────────────────────────────────────────────────────────────
ALTERNATIF: Copy-paste langsung ke LandingPage.tsx sebagai komponen internal
sebelum baris "// ─── Section: Tech Stack ──"
*/
