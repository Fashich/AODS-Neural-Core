/**
 * Compliance Shield - ISO 27001 & COBIT Visualization
 * Security and governance dashboard
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Server,
  Key,
  Fingerprint
} from 'lucide-react';

interface ComplianceShieldProps {
  onClose: () => void;
}

interface ComplianceRule {
  id: string;
  standard: string;
  controlId: string;
  title: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'in_progress';
  lastChecked: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityIncident {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  status: 'open' | 'mitigated' | 'resolved';
  detectedAt: string;
}

export default function ComplianceShield({ onClose }: ComplianceShieldProps) {
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [_overallScore, _setOverallScore] = useState(94);

  useEffect(() => {
    // Mock compliance data
    const mockRules: ComplianceRule[] = [
      {
        id: '1',
        standard: 'ISO 27001',
        controlId: 'A.9.1.1',
        title: 'Access Control Policy',
        description: 'User access restricted based on roles',
        status: 'compliant',
        lastChecked: new Date().toISOString(),
        severity: 'high'
      },
      {
        id: '2',
        standard: 'ISO 27001',
        controlId: 'A.9.4.1',
        title: 'Information Access Restriction',
        description: 'Sensitive data access logging enabled',
        status: 'compliant',
        lastChecked: new Date().toISOString(),
        severity: 'high'
      },
      {
        id: '3',
        standard: 'ISO 27001',
        controlId: 'A.10.1.1',
        title: 'Cryptographic Controls',
        description: 'End-to-end encryption implemented',
        status: 'compliant',
        lastChecked: new Date().toISOString(),
        severity: 'critical'
      },
      {
        id: '4',
        standard: 'ISO 27001',
        controlId: 'A.12.4.1',
        title: 'Event Logging',
        description: 'Audit trails for all system events',
        status: 'compliant',
        lastChecked: new Date().toISOString(),
        severity: 'medium'
      },
      {
        id: '5',
        standard: 'COBIT',
        controlId: 'APO01.05',
        title: 'IT Governance Framework',
        description: 'IT processes aligned with business goals',
        status: 'in_progress',
        lastChecked: new Date().toISOString(),
        severity: 'medium'
      },
      {
        id: '6',
        standard: 'COBIT',
        controlId: 'DSS05.04',
        title: 'Data Security',
        description: 'End-to-end encryption for sensitive data',
        status: 'compliant',
        lastChecked: new Date().toISOString(),
        severity: 'high'
      },
      {
        id: '7',
        standard: 'COBIT',
        controlId: 'DSS06.01',
        title: 'Identity Management',
        description: 'Decentralized identity verification',
        status: 'compliant',
        lastChecked: new Date().toISOString(),
        severity: 'critical'
      }
    ];

    const mockIncidents: SecurityIncident[] = [
      {
        id: '1',
        severity: 'medium',
        type: 'Failed Login Attempt',
        description: 'Multiple failed login attempts detected from IP 192.168.1.100',
        status: 'mitigated',
        detectedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        severity: 'low',
        type: 'Unusual API Usage',
        description: 'API rate limit approached by user_id: 12345',
        status: 'resolved',
        detectedAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    setComplianceRules(mockRules);
    setIncidents(mockIncidents);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in_progress':
      case 'mitigated':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'non_compliant':
      case 'open':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const compliantCount = complianceRules.filter(r => r.status === 'compliant').length;
  const totalRules = complianceRules.length;
  const complianceRate = totalRules > 0 ? (compliantCount / totalRules) * 100 : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-400" />
            <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Compliance & Security Shield
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="iso27001">ISO 27001</TabsTrigger>
            <TabsTrigger value="cobit">COBIT</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overall Compliance Score */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-green-400" />
                  Overall Compliance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#1e293b"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(complianceRate / 100) * 351.86} 351.86`}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{complianceRate.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compliant Controls</span>
                      <span className="text-green-400 font-semibold">{compliantCount}/{totalRules}</span>
                    </div>
                    <Progress value={complianceRate} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Last Audit</span>
                      <span className="text-cyan-400">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <Lock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">256-bit</div>
                  <div className="text-sm text-slate-400">Encryption</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <Key className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">JWT</div>
                  <div className="text-sm text-slate-400">Auth Tokens</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <Eye className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-slate-400">Monitoring</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <Fingerprint className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">Web4</div>
                  <div className="text-sm text-slate-400">Identity</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  Security Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incidents.map(incident => (
                    <div 
                      key={incident.id}
                      className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(incident.status)}
                        <div>
                          <p className="text-sm font-medium">{incident.type}</p>
                          <p className="text-xs text-slate-400">{incident.description}</p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iso27001" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">ISO 27001 Controls</h3>
              <Badge className="bg-green-500">
                {complianceRules.filter(r => r.standard === 'ISO 27001' && r.status === 'compliant').length}/
                {complianceRules.filter(r => r.standard === 'ISO 27001').length} Compliant
              </Badge>
            </div>
            
            {complianceRules
              .filter(rule => rule.standard === 'ISO 27001')
              .map(rule => (
                <Card key={rule.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(rule.status)}
                        <div>
                          <CardTitle className="text-base">{rule.controlId}</CardTitle>
                          <CardDescription className="text-slate-400">
                            {rule.title}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-300">{rule.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Last checked: {new Date(rule.lastChecked).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="cobit" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">COBIT Controls</h3>
              <Badge className="bg-cyan-500">
                {complianceRules.filter(r => r.standard === 'COBIT' && r.status === 'compliant').length}/
                {complianceRules.filter(r => r.standard === 'COBIT').length} Compliant
              </Badge>
            </div>
            
            {complianceRules
              .filter(rule => rule.standard === 'COBIT')
              .map(rule => (
                <Card key={rule.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(rule.status)}
                        <div>
                          <CardTitle className="text-base">{rule.controlId}</CardTitle>
                          <CardDescription className="text-slate-400">
                            {rule.title}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-300">{rule.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Last checked: {new Date(rule.lastChecked).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Security Incidents</h3>
              <Badge className="bg-green-500">
                {incidents.filter(i => i.status === 'resolved').length}/
                {incidents.length} Resolved
              </Badge>
            </div>
            
            {incidents.map(incident => (
              <Card key={incident.id} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(incident.status)}
                      <div>
                        <CardTitle className="text-base">{incident.type}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {incident.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status: 
                      <span className={`ml-1 ${
                        incident.status === 'resolved' ? 'text-green-400' :
                        incident.status === 'mitigated' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {incident.status}
                      </span>
                    </span>
                    <span className="text-slate-500">
                      {new Date(incident.detectedAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {incidents.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p>No security incidents detected</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
