/**
 * HUD - Heads Up Display overlay
 * Shows real-time system metrics
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Cpu, 
  Database, 
  Network,
  Zap,
  TrendingUp,
  Users
} from 'lucide-react';

interface HUDProps {
  systemStatus: Record<string, string>;
  metrics: {
    sessionDuration: number;
    actionsCount: number;
    errorsCount: number;
  };
  user: {
    id: string;
    username: string;
    level?: number;
    xp?: number;
  } | null;
}

interface RealTimeMetrics {
  fps: number;
  latency: number;
  activeUsers: number;
  throughput: number;
}

export default function HUD({ systemStatus, metrics, user }: HUDProps) {
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    fps: 0,
    latency: 0,
    activeUsers: 0,
    throughput: 0
  });

  // Fetch real-time metrics from API
  useEffect(() => {
    // Initial fetch
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        if (response.ok) {
          const data = await response.json();
          setRealTimeMetrics(data);
        } else {
          console.error('Failed to fetch metrics:', response.statusText);
          // Fallback to zeros if API fails
          setRealTimeMetrics({
            fps: 0,
            latency: 0,
            activeUsers: 0,
            throughput: 0
          });
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Fallback to zeros if API fails
        setRealTimeMetrics({
          fps: 0,
          latency: 0,
          activeUsers: 0,
          throughput: 0
        });
      }
    };

    // Fetch immediately
    fetchMetrics();

    // Then poll every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Top Left - User Info */}
      {user && (
        <div className="absolute top-20 left-4 hidden sm:block bg-slate-900/80 backdrop-blur-lg border border-red-900/30 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.username}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Lvl {user.level || 1}
                </Badge>
                {user.xp !== undefined && (
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 to-rose-400"
                      style={{ width: `${(user.xp % 1000) / 10}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Right - Performance Metrics */}
      <div className="absolute top-20 right-4 hidden sm:flex flex-col space-y-2">
        <div className="bg-slate-900/80 backdrop-blur-lg border border-red-900/30 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">FPS</span>
              <span className="text-sm font-mono text-white">{Math.round(realTimeMetrics.fps)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-rose-400" />
              <span className="text-xs text-slate-400">Latency</span>
              <span className="text-sm font-mono text-white">{Math.round(realTimeMetrics.latency)}ms</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-lg border border-red-900/30 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-400" />
              <span className="text-xs text-slate-400">Active</span>
              <span className="text-sm font-mono text-white">{realTimeMetrics.activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">TPS</span>
              <span className="text-sm font-mono text-white">{realTimeMetrics.throughput.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Left - System Status */}
      <div className="absolute bottom-20 left-4 hidden sm:block bg-slate-900/80 backdrop-blur-lg border border-red-900/30 rounded-lg p-3">
        <p className="text-xs text-slate-400 mb-2">System Status</p>
        <div className="space-y-1.5">
          {Object.entries(systemStatus).map(([key, status]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
              <span className="text-xs text-slate-300 capitalize">{key}</span>
              <span className={`text-xs ${status === 'online' ? 'text-green-400' : 'text-yellow-400'}`}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Right - Resource Usage */}
      <div className="absolute bottom-20 right-4 hidden sm:block bg-slate-900/80 backdrop-blur-lg border border-red-900/30 rounded-lg p-3">
        <p className="text-xs text-slate-400 mb-2">Resources</p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> CPU
              </span>
              <span className="text-red-400">45%</span>
            </div>
            <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 w-[45%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Database className="w-3 h-3" /> RAM
              </span>
              <span className="text-rose-400">62%</span>
            </div>
            <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-rose-400 w-[62%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Zap className="w-3 h-3" /> GPU
              </span>
              <span className="text-red-300">38%</span>
            </div>
            <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-300 w-[38%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4">
        <div className="bg-slate-900/80 backdrop-blur-lg border border-red-900/30 rounded-full px-3 sm:px-4 py-1.5">
          <span className="text-xs text-slate-400">Session: </span>
          <span className="text-xs text-red-400 font-mono">
            {Math.floor(metrics.sessionDuration / 60)}m {metrics.sessionDuration % 60}s
          </span>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-lg border border-red-900/30 rounded-full px-3 sm:px-4 py-1.5">
          <span className="text-xs text-slate-400">Actions: </span>
          <span className="text-xs text-rose-400 font-mono">{metrics.actionsCount}</span>
        </div>
      </div>
    </div>
  );
}