/**
 * useAODS Hook - Main system state management
 * Connects to backend orchestration API
 */

import { useState, useEffect, useCallback } from 'react';

interface Service {
  id: string;
  name: string;
  language: string;
  status: string;
  health: number;
}

interface Workflow {
  id: string;
  name: string;
  status: string;
  progress: number;
}

interface SystemStatus {
  database: string;
  ai: string;
  orchestration: string;
  blockchain: string;
  [key: string]: string;
}

interface OrchestrationData {
  services: Service[];
  workflows: Workflow[];
}

export function useAODS() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'online',
    ai: 'online',
    orchestration: 'online',
    blockchain: 'online'
  });

  const [orchestrationData, setOrchestrationData] = useState<OrchestrationData>({
    services: [
      { id: '1', name: 'python-ai', language: 'python', status: 'healthy', health: 98 },
      { id: '2', name: 'go-telemetry', language: 'go', status: 'healthy', health: 99 },
      { id: '3', name: 'cpp-hpc', language: 'cpp', status: 'healthy', health: 97 },
      { id: '4', name: 'csharp-enterprise', language: 'csharp', status: 'healthy', health: 95 },
      { id: '5', name: 'java-bridge', language: 'java', status: 'healthy', health: 96 },
      { id: '6', name: 'php-connector', language: 'php', status: 'healthy', health: 94 },
      { id: '7', name: 'ruby-automation', language: 'ruby', status: 'healthy', health: 93 }
    ],
    workflows: [
      { id: '1', name: 'Auto-Scaling', status: 'running', progress: 75 },
      { id: '2', name: 'Security Scan', status: 'running', progress: 45 },
      { id: '3', name: 'Data Backup', status: 'pending', progress: 0 },
      { id: '4', name: 'AI Training', status: 'running', progress: 82 },
      { id: '5', name: 'Compliance Check', status: 'completed', progress: 100 }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch system status from API
  const fetchSystemStatus = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';
      const response = await fetch(`${apiUrl}/api/health`);
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.status);
        setOrchestrationData(data.orchestration);
      }
    } catch (err) {
      // Fallback to mock data if API is unavailable
      console.log('API unavailable, using mock data');
    }
  }, []);

  // Trigger workflow
  const triggerWorkflow = useCallback(async (workflowId: string) => {
    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';
      const response = await fetch(`${apiUrl}/api/workflows/${workflowId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to trigger workflow');
      
      // Update local state
      setOrchestrationData(prev => ({
        ...prev,
        workflows: prev.workflows.map(w =>
          w.id === workflowId ? { ...w, status: 'running' } : w
        )
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Scale service
  const scaleService = useCallback(async (serviceId: string, replicas: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';
      await fetch(`${apiUrl}/api/services/${serviceId}/scale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replicas })
      });
    } catch (err) {
      console.error('Scale error:', err);
    }
  }, []);

  // Poll system status
  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  return {
    systemStatus,
    orchestrationData,
    isLoading,
    error,
    triggerWorkflow,
    scaleService,
    refreshStatus: fetchSystemStatus
  };
}
