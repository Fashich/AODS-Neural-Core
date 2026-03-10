/**
 * useTelemetry Hook - Real-time metrics collection
 * Sends usage data to Go telemetry service
 */

import { useCallback, useEffect, useRef } from 'react';

interface TelemetryEvent {
  eventType: string;
  data: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface Metrics {
  sessionDuration: number;
  actionsCount: number;
  errorsCount: number;
  lastActivity: number;
}

export function useTelemetry() {
  const sessionId = useRef(generateSessionId());
  const metricsRef = useRef<Metrics>({
    sessionDuration: 0,
    actionsCount: 0,
    errorsCount: 0,
    lastActivity: Date.now()
  });
  const bufferRef = useRef<TelemetryEvent[]>([]);

  // Generate unique session ID
  function generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
  }

  // Send telemetry event
  const sendTelemetry = useCallback((eventType: string, data: Record<string, any> = {}) => {
    const event: TelemetryEvent = {
      eventType,
      data,
      timestamp: Date.now(),
      sessionId: sessionId.current,
      userId: localStorage.getItem('aods_user_id') || undefined
    };

    // Add to buffer
    bufferRef.current.push(event);
    
    // Update metrics
    metricsRef.current.actionsCount++;
    metricsRef.current.lastActivity = Date.now();

    // Flush if buffer is large enough
    if (bufferRef.current.length >= 10) {
      flushBuffer();
    }
  }, []);

  // Flush telemetry buffer to backend
  const flushBuffer = useCallback(async () => {
    if (bufferRef.current.length === 0) return;

    const events = [...bufferRef.current];
    bufferRef.current = [];

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';
      await fetch(`${apiUrl}/api/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true
      });
    } catch (err) {
      // Restore events to buffer on failure
      bufferRef.current.unshift(...events);
      console.log('Telemetry flush failed, will retry');
    }
  }, []);

  // Track page performance
  useEffect(() => {
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            sendTelemetry('page_load', {
              loadTime: entry.duration,
              domContentLoaded: (entry as PerformanceNavigationTiming).domContentLoadedEventEnd
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] as any });
      
      return () => observer.disconnect();
    }
  }, [sendTelemetry]);

  // Track errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      metricsRef.current.errorsCount++;
      sendTelemetry('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [sendTelemetry]);

  // Periodic flush and session tracking
  useEffect(() => {
    const interval = setInterval(() => {
      // Update session duration
      metricsRef.current.sessionDuration += 5;
      
      // Send heartbeat
      sendTelemetry('heartbeat', {
        sessionDuration: metricsRef.current.sessionDuration,
        actionsCount: metricsRef.current.actionsCount
      });
      
      // Flush buffer
      flushBuffer();
    }, 5000);

    return () => {
      clearInterval(interval);
      flushBuffer(); // Final flush on unmount
    };
  }, [sendTelemetry, flushBuffer]);

  // Track before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendTelemetry('session_end', {
        totalDuration: metricsRef.current.sessionDuration,
        totalActions: metricsRef.current.actionsCount,
        totalErrors: metricsRef.current.errorsCount
      });
      flushBuffer();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sendTelemetry, flushBuffer]);

  return {
    sendTelemetry,
    metrics: metricsRef.current,
    sessionId: sessionId.current
  };
}
