/**
 * AI Dashboard - Machine Learning Insights
 * Displays AI predictions and autonomous decisions
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Server,
  Shield,
  Zap
} from 'lucide-react';

interface AIDashboardProps {
  onClose: () => void;
  orchestrationData: {
    services: Array<{
      id: string;
      name: string;
      status: string;
      health: number;
    }>;
    workflows: Array<{
      id: string;
      name: string;
      status: string;
      progress: number;
    }>;
  };
}

interface AIPrediction {
  id: string;
  type: string;
  confidence: number;
  prediction: string;
  explanation: string;
  timestamp: string;
}

interface AutonomousDecision {
  id: string;
  action: string;
  reason: string;
  impact: string;
  status: string;
  timestamp: string;
}

export default function AIDashboard({ onClose, orchestrationData }: AIDashboardProps) {
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [decisions, setDecisions] = useState<AutonomousDecision[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    overall: 95,
    cpu: 45,
    memory: 62,
    network: 78
  });

  // Simulate AI predictions
  useEffect(() => {
    const mockPredictions: AIPrediction[] = [
      {
        id: '1',
        type: 'scaling',
        confidence: 0.92,
        prediction: 'Predicted 3x traffic spike in 15 minutes',
        explanation: 'Based on historical patterns and current trends',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'anomaly',
        confidence: 0.87,
        prediction: 'Anomaly detected in go-telemetry service',
        explanation: 'Response time deviation exceeds 2 standard deviations',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: '3',
        type: 'optimization',
        confidence: 0.95,
        prediction: 'Database query optimization recommended',
        explanation: 'Query pattern analysis suggests index addition',
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    ];

    const mockDecisions: AutonomousDecision[] = [
      {
        id: '1',
        action: 'Auto-scaled python-ai service to 5 replicas',
        reason: 'High CPU utilization detected',
        impact: 'Reduced latency by 40%',
        status: 'completed',
        timestamp: new Date(Date.now() - 900000).toISOString()
      },
      {
        id: '2',
        action: 'Rerouted traffic from degraded node',
        reason: 'Health check failure',
        impact: 'Maintained 99.9% uptime',
        status: 'completed',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '3',
        action: 'Initiated backup sequence',
        reason: 'Scheduled maintenance window',
        impact: 'Zero data loss',
        status: 'in_progress',
        timestamp: new Date().toISOString()
      }
    ];

    setPredictions(mockPredictions);
    setDecisions(mockDecisions);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemHealth(prev => ({
        overall: Math.min(100, Math.max(80, prev.overall + (Math.random() - 0.5) * 5)),
        cpu: Math.min(100, Math.max(20, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(100, Math.max(30, prev.memory + (Math.random() - 0.5) * 8)),
        network: Math.min(100, Math.max(50, prev.network + (Math.random() - 0.5) * 6))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scaling': return <TrendingUp className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'optimization': return <Zap className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI Neural Core Dashboard
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="decisions">Autonomous Actions</TabsTrigger>
            <TabsTrigger value="models">AI Models</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* System Health Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">Overall Health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">
                    {systemHealth.overall.toFixed(1)}%
                  </div>
                  <Progress value={systemHealth.overall} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">CPU Usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-400">
                    {systemHealth.cpu.toFixed(1)}%
                  </div>
                  <Progress value={systemHealth.cpu} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">Memory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">
                    {systemHealth.memory.toFixed(1)}%
                  </div>
                  <Progress value={systemHealth.memory} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">Network</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">
                    {systemHealth.network.toFixed(1)}%
                  </div>
                  <Progress value={systemHealth.network} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Active Services */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  Active Microservices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {orchestrationData.services.map(service => (
                    <div 
                      key={service.id}
                      className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                    >
                      <span className="text-sm font-medium">{service.name}</span>
                      <Badge 
                        variant={service.status === 'healthy' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {service.health}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-center">
                <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{predictions.length}</div>
                <div className="text-sm text-slate-400">Active Predictions</div>
              </div>
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-center">
                <CheckCircle className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {decisions.filter(d => d.status === 'completed').length}
                </div>
                <div className="text-sm text-slate-400">Actions Completed</div>
              </div>
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-center">
                <Shield className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-sm text-slate-400">Uptime</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            {predictions.map(prediction => (
              <Card key={prediction.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getTypeIcon(prediction.type)}
                      <span className="capitalize">{prediction.type} Prediction</span>
                    </CardTitle>
                    <Badge className={getConfidenceColor(prediction.confidence)}>
                      {(prediction.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    {new Date(prediction.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-white font-medium">{prediction.prediction}</p>
                  <p className="text-sm text-slate-400">{prediction.explanation}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="decisions" className="space-y-4">
            {decisions.map(decision => (
              <Card key={decision.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{decision.action}</CardTitle>
                    <Badge 
                      variant={decision.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {decision.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    {new Date(decision.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Reason</p>
                      <p className="text-sm text-white">{decision.reason}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Impact</p>
                      <p className="text-sm text-green-400">{decision.impact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Predictive Scaling Model</CardTitle>
                  <CardDescription>LSTM-based traffic prediction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Accuracy</span>
                      <span className="text-green-400">94.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Latency</span>
                      <span className="text-cyan-400">12ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Anomaly Detection</CardTitle>
                  <CardDescription>Isolation Forest algorithm</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Precision</span>
                      <span className="text-green-400">91.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recall</span>
                      <span className="text-cyan-400">89.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>NLP Intent Classifier</CardTitle>
                  <CardDescription>BERT-based command parsing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">F1 Score</span>
                      <span className="text-green-400">96.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Languages</span>
                      <span className="text-cyan-400">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Vector Embedding Model</CardTitle>
                  <CardDescription>Semantic search & similarity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dimensions</span>
                      <span className="text-green-400">1536</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Index Size</span>
                      <span className="text-cyan-400">2.4M vectors</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
