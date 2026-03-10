// API endpoint to provide real-time metrics
export interface MetricsResponse {
  fps: number;
  latency: number;
  activeUsers: number;
  throughput: number;
}

export const fetchRealTimeMetrics = async (): Promise<MetricsResponse> => {
  // In a real implementation, this would connect to your backend
  // For now, we'll simulate realistic values from actual systems
  const response = await fetch('/api/system/metrics');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};