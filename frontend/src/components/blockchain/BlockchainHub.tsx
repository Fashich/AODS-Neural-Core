/**
 * BlockchainHub - 9 Module Blockchain Integration Dashboard
 * AODS - Autonomous Orchestration of Digital Systems
 * Mayar Vibecoding Competition 2026
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Package, Heart, Fingerprint, Building2, Rocket,
  Gamepad2, Vote, Landmark, X, ExternalLink, Copy, Check,
  TrendingUp, Shield, Zap, Globe, Clock, ChevronRight,
  Activity, BarChart3, Lock, AlertCircle, CheckCircle2,
  ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BlockchainHubProps {
  onClose: () => void;
}

// ─── Module Definitions ────────────────────────────────────────────────────

const MODULES = [
  {
    id: 'crypto',
    label: 'Crypto & Payments',
    icon: Coins,
    color: 'from-yellow-500 to-orange-500',
    status: 'live' as const,
    tech: 'ERC-20 · Multi-chain',
    description: 'Decentralized payments using AODS token across multiple chains.',
  },
  {
    id: 'supply',
    label: 'Supply Chain',
    icon: Package,
    color: 'from-blue-500 to-cyan-500',
    status: 'live' as const,
    tech: 'Hyperledger Fabric',
    description: 'Transparent end-to-end supply chain tracking on-chain.',
  },
  {
    id: 'health',
    label: 'Healthcare & Medical',
    icon: Heart,
    color: 'from-red-500 to-pink-500',
    status: 'beta' as const,
    tech: 'ZK Proofs · On-chain',
    description: 'Zero-knowledge medical records with privacy guarantees.',
  },
  {
    id: 'did',
    label: 'Digital Identity',
    icon: Fingerprint,
    color: 'from-purple-500 to-violet-500',
    status: 'live' as const,
    tech: 'SSI · DID Protocol',
    description: 'Self-sovereign identity management with W3C DID standard.',
  },
  {
    id: 'rwa',
    label: 'Asset Tokenization',
    icon: Building2,
    color: 'from-emerald-500 to-teal-500',
    status: 'live' as const,
    tech: 'ERC-1400 · NFT',
    description: 'Real-world asset tokenization with fractional ownership.',
  },
  {
    id: 'ico',
    label: 'ICO / IEO',
    icon: Rocket,
    color: 'from-indigo-500 to-blue-500',
    status: 'live' as const,
    tech: 'Smart Contract Escrow',
    description: 'Crowdfunding & token sale with automated smart contract escrow.',
  },
  {
    id: 'gaming',
    label: 'Gaming & Esports',
    icon: Gamepad2,
    color: 'from-fuchsia-500 to-pink-500',
    status: 'beta' as const,
    tech: 'Play-to-Earn · Escrow',
    description: 'Play-to-earn mechanics and tournament escrow for esports.',
  },
  {
    id: 'voting',
    label: 'e-Voting & Governance',
    icon: Vote,
    color: 'from-amber-500 to-yellow-500',
    status: 'beta' as const,
    tech: 'DAO · On-chain Voting',
    description: 'DAO governance with transparent on-chain voting mechanisms.',
  },
  {
    id: 'lending',
    label: 'P2P Lending',
    icon: Landmark,
    color: 'from-lime-500 to-green-500',
    status: 'live' as const,
    tech: 'DeFi Lending Protocol',
    description: 'Decentralized peer-to-peer lending with collateral management.',
  },
];

// ─── Mock Data ─────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS = [
  { hash: '0xabc123...def456', type: 'send', amount: '250 AODS', to: '0x1234...5678', time: '2 min ago', status: 'confirmed' },
  { hash: '0xbcd234...efa567', type: 'receive', amount: '1,000 AODS', from: '0x9abc...def0', time: '15 min ago', status: 'confirmed' },
  { hash: '0xcde345...fab678', type: 'stake', amount: '500 AODS', to: 'Staking Pool', time: '1 hr ago', status: 'confirmed' },
  { hash: '0xdef456...0bc789', type: 'send', amount: '75 AODS', to: '0x5678...90ab', time: '3 hr ago', status: 'pending' },
];

const MOCK_SUPPLY_ITEMS = [
  { id: 'SC-001', product: 'Enterprise Server Unit', stage: 'Manufacturing', location: 'Jakarta, ID', progress: 65, verified: true },
  { id: 'SC-002', product: 'Network Switch Array', stage: 'Shipping', location: 'Singapore Port', progress: 82, verified: true },
  { id: 'SC-003', product: 'GPU Cluster Module', stage: 'Customs', location: 'Hong Kong', progress: 45, verified: false },
];

const MOCK_PROPOSALS = [
  { id: 'PROP-128', title: 'Treasury Allocation Q2', votes: { yes: 4200, no: 890 }, status: 'active', ends: '3 days' },
  { id: 'PROP-127', title: 'Protocol Upgrade v2.1', votes: { yes: 7800, no: 320 }, status: 'passed', ends: 'Closed' },
  { id: 'PROP-126', title: 'Fee Reduction Proposal', votes: { yes: 2100, no: 3400 }, status: 'failed', ends: 'Closed' },
];

const MOCK_LOANS = [
  { id: 'LOAN-042', borrower: '0xabc...123', amount: '5,000 AODS', collateral: '0.5 ETH', apy: '8.5%', status: 'active', due: '30 days' },
  { id: 'LOAN-041', borrower: '0xdef...456', amount: '2,500 AODS', collateral: '1.2 ETH', apy: '6.2%', status: 'active', due: '15 days' },
  { id: 'LOAN-040', borrower: '0xghi...789', amount: '10,000 AODS', collateral: '3.0 ETH', apy: '9.1%', status: 'repaid', due: 'Done' },
];

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'live' | 'beta' }) {
  return (
    <span className={cn(
      'text-xs font-semibold px-2 py-0.5 rounded-full',
      status === 'live'
        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    )}>
      {status === 'live' ? '● Live' : '◐ Beta'}
    </span>
  );
}

// ─── Module Panels ─────────────────────────────────────────────────────────

function CryptoPanel() {
  const [copied, setCopied] = useState(false);
  const address = '0x1A2B3C4D5E6F7890...abCD';

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600/20 via-orange-600/10 to-transparent border border-yellow-500/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-sm text-slate-400 mb-1">Wallet Balance</p>
        <p className="text-4xl font-bold text-white">12,500 <span className="text-yellow-400">AODS</span></p>
        <p className="text-sm text-slate-400 mt-1">≈ $3,750 USD</p>
        <div className="flex items-center gap-2 mt-4">
          <code className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg truncate max-w-xs">{address}</code>
          <button onClick={copyAddress} className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
        <div className="flex gap-3 mt-5">
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold gap-2">
            <ArrowUpRight className="w-4 h-4" /> Send
          </Button>
          <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 gap-2">
            <ArrowDownLeft className="w-4 h-4" /> Receive
          </Button>
          <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 gap-2">
            <RefreshCw className="w-4 h-4" /> Swap
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {MOCK_TRANSACTIONS.map((tx) => (
            <div key={tx.hash} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                tx.type === 'receive' ? 'bg-green-500/20' : tx.type === 'stake' ? 'bg-purple-500/20' : 'bg-red-500/20'
              )}>
                {tx.type === 'receive'
                  ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
                  : tx.type === 'stake'
                  ? <Zap className="w-4 h-4 text-purple-400" />
                  : <ArrowUpRight className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                <p className="text-xs text-slate-500 truncate">{tx.hash}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{tx.amount}</p>
                <p className="text-xs text-slate-500">{tx.time}</p>
              </div>
              <span className={cn('text-xs px-2 py-0.5 rounded-full ml-2',
                tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              )}>{tx.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-chain Status */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Multi-chain Support</h3>
        <div className="grid grid-cols-3 gap-3">
          {['Ethereum', 'Polygon', 'BNB Chain'].map((chain) => (
            <div key={chain} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full mx-auto mb-2 flex items-center justify-center">
                <Globe className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xs font-medium text-white">{chain}</p>
              <p className="text-xs text-green-400 mt-0.5">● Connected</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SupplyChainPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Shipments', value: '24', color: 'text-blue-400' },
          { label: 'Verified Items', value: '1,847', color: 'text-green-400' },
          { label: 'Avg. Transit', value: '4.2 days', color: 'text-cyan-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 text-center">
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Active Shipments</h3>
        <div className="space-y-3">
          {MOCK_SUPPLY_ITEMS.map((item) => (
            <div key={item.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-400">{item.id}</span>
                    {item.verified
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      : <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                  <p className="text-sm font-medium text-white mt-0.5">{item.product}</p>
                </div>
                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {item.stage}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-400">{item.location}</span>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-slate-300">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30">
        <Package className="w-4 h-4 mr-2" /> Register New Shipment
      </Button>
    </div>
  );
}

function HealthcarePanel() {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Zero-Knowledge Privacy Active</p>
          <p className="text-xs text-slate-400 mt-1">All medical records are encrypted with ZK proofs. Only you control access to your health data.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Records On-chain', value: '12', icon: Lock, color: 'text-red-400' },
          { label: 'ZK Proofs Generated', value: '47', icon: Shield, color: 'text-pink-400' },
          { label: 'Authorized Providers', value: '3', icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Data Requests', value: '8', icon: Activity, color: 'text-yellow-400' },
        ].map((item) => (
          <div key={item.label} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
            <item.icon className={cn('w-5 h-5 mb-2', item.color)} />
            <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Access Control</h3>
        {['Dr. Sarah Chen - Cardiologist', 'City Hospital Lab', 'Insurance Provider A'].map((provider, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-sm text-white">{provider}</span>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600 text-slate-400">Revoke</Button>
          </div>
        ))}
      </div>

      <Button className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
        <Heart className="w-4 h-4 mr-2" /> Add Medical Record
      </Button>
    </div>
  );
}

function DIDPanel() {
  const [copied, setCopied] = useState(false);
  const did = 'did:aods:0x7f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c';

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-violet-600/10 border border-purple-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Fingerprint className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Verified Identity</p>
            <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> DID Confirmed</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-2">Your Decentralized Identifier (DID)</p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-purple-300 bg-slate-800/60 px-3 py-2 rounded-lg flex-1 truncate">{did}</code>
          <button onClick={() => { navigator.clipboard.writeText(did); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Verified Credentials</h3>
        {[
          { name: 'Email Verification', issuer: 'AODS System', date: 'Jan 2024', icon: '✉️' },
          { name: 'KYC Level 2', issuer: 'Mayar Verify', date: 'Feb 2024', icon: '🪪' },
          { name: 'Developer Certification', issuer: 'AODS DAO', date: 'Mar 2024', icon: '💻' },
        ].map((cred, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 mb-2">
            <span className="text-2xl">{cred.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{cred.name}</p>
              <p className="text-xs text-slate-400">Issued by {cred.issuer} · {cred.date}</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
        ))}
      </div>

      <Button className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30">
        <Fingerprint className="w-4 h-4 mr-2" /> Request New Credential
      </Button>
    </div>
  );
}

function RWAPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tokenized', value: '$2.4M', color: 'text-emerald-400' },
          { label: 'Active NFTs', value: '47', color: 'text-teal-400' },
          { label: 'Avg. Yield', value: '11.2%', color: 'text-green-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 text-center">
            <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Tokenized Assets</h3>
        {[
          { name: 'Jakarta Office Tower', type: 'Real Estate', tokens: '10,000', price: '$120', yield: '8.5%', image: '🏢' },
          { name: 'Solar Farm Array #7', type: 'Infrastructure', tokens: '5,000', price: '$85', yield: '12.1%', image: '☀️' },
          { name: 'Artisan Collection #3', type: 'Fine Art', tokens: '1,000', price: '$500', yield: '5.8%', image: '🎨' },
        ].map((asset, i) => (
          <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 mb-3 hover:border-emerald-500/30 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{asset.image}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{asset.name}</p>
                  <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{asset.type}</Badge>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  <span>{asset.tokens} tokens · ${asset.price}/token</span>
                  <span className="text-emerald-400 font-medium">↑ {asset.yield} yield</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30">
        <Building2 className="w-4 h-4 mr-2" /> Tokenize New Asset
      </Button>
    </div>
  );
}

function ICOPanel() {
  const [amount, setAmount] = useState('');
  const raised = 3_250_000;
  const goal = 5_000_000;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 to-blue-600/10 border border-indigo-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">AODS Token Sale</h3>
            <p className="text-xs text-slate-400">Phase 2 · Seed Round</p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">● Active</Badge>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Raised</span>
            <span className="text-white font-semibold">${(raised / 1e6).toFixed(2)}M / ${(goal / 1e6).toFixed(1)}M</span>
          </div>
          <Progress value={(raised / goal) * 100} className="h-3" />
          <p className="text-xs text-indigo-400 mt-1">{Math.round((raised / goal) * 100)}% funded</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-sm font-bold text-white">$0.03</p>
            <p className="text-xs text-slate-400">Token Price</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">1B</p>
            <p className="text-xs text-slate-400">Total Supply</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">14 days</p>
            <p className="text-xs text-slate-400">Remaining</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-slate-300 text-sm">Participate in Token Sale</Label>
        <div className="flex gap-2">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in USDT"
            className="bg-slate-800/60 border-slate-600 text-white"
          />
          <Button className="bg-indigo-500 hover:bg-indigo-400 text-white px-6">Buy</Button>
        </div>
        {amount && !isNaN(Number(amount)) && (
          <p className="text-xs text-slate-400">
            ≈ {Math.floor(Number(amount) / 0.03).toLocaleString()} AODS tokens
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Participants</h3>
        {['0xabc...123 → $5,000', '0xdef...456 → $12,500', '0xghi...789 → $2,100'].map((tx, i) => (
          <div key={i} className="flex items-center gap-2 p-2 text-xs text-slate-400 border-b border-slate-700/30 last:border-0">
            <Rocket className="w-3.5 h-3.5 text-indigo-400" />
            <span>{tx}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GamingPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'AODS Earned', value: '3,250', icon: Coins, color: 'text-fuchsia-400' },
          { label: 'Tournaments Won', value: '7', icon: Trophy as any, color: 'text-yellow-400' },
          { label: 'Player Rank', value: '#142', icon: TrendingUp, color: 'text-pink-400' },
          { label: 'NFT Items', value: '23', icon: Gamepad2, color: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
            <stat.icon className={cn('w-5 h-5 mb-2', stat.color)} />
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Active Tournaments</h3>
        {[
          { name: 'AODS Grand Prix', prize: '50,000 AODS', players: 256, ends: '5 days', entry: '100 AODS' },
          { name: 'Weekend Blitz', prize: '10,000 AODS', players: 64, ends: '2 days', entry: '50 AODS' },
        ].map((t, i) => (
          <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-fuchsia-500/20 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-400">{t.players} players · Entry: {t.entry}</p>
              </div>
              <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30">{t.ends} left</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400 font-semibold">🏆 {t.prize}</span>
              <Button size="sm" className="h-7 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 border border-fuchsia-500/30 text-xs">
                Join
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button className="w-full bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 border border-fuchsia-500/30">
        <Gamepad2 className="w-4 h-4 mr-2" /> Enter Game Arena
      </Button>
    </div>
  );
}

function VotingPanel() {
  const [voted, setVoted] = useState<Record<string, 'yes' | 'no'>>({});

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
        <Vote className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">DAO Governance</p>
          <p className="text-xs text-slate-400 mt-1">Voting power: 1,250 AODS · 1 token = 1 vote</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Active Proposals</h3>
        {MOCK_PROPOSALS.map((prop) => {
          const total = prop.votes.yes + prop.votes.no;
          const yesPercent = Math.round((prop.votes.yes / total) * 100);
          return (
            <div key={prop.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-amber-400">{prop.id}</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{prop.title}</p>
                </div>
                <Badge className={cn('text-xs', prop.status === 'active' ? 'bg-green-500/20 text-green-400' : prop.status === 'passed' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400')}>
                  {prop.status}
                </Badge>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-green-400">Yes: {prop.votes.yes.toLocaleString()}</span>
                  <span className="text-red-400">No: {prop.votes.no.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${yesPercent}%` }} />
                </div>
              </div>
              {prop.status === 'active' && !voted[prop.id] && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setVoted(v => ({ ...v, [prop.id]: 'yes' }))}
                    className="flex-1 h-8 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30">
                    ✓ Vote Yes
                  </Button>
                  <Button size="sm" onClick={() => setVoted(v => ({ ...v, [prop.id]: 'no' }))}
                    className="flex-1 h-8 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
                    ✗ Vote No
                  </Button>
                </div>
              )}
              {voted[prop.id] && (
                <p className="text-xs text-center text-slate-400">
                  You voted <span className={voted[prop.id] === 'yes' ? 'text-green-400' : 'text-red-400'}>{voted[prop.id]}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LendingPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Lent', value: '25,000 AODS', color: 'text-lime-400' },
          { label: 'Active Loans', value: '2', color: 'text-green-400' },
          { label: 'Avg. APY', value: '8.2%', color: 'text-teal-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 text-center">
            <p className={cn('text-lg font-bold', stat.color)}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Loan Portfolio</h3>
        {MOCK_LOANS.map((loan) => (
          <div key={loan.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 mb-3">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-mono text-lime-400">{loan.id}</span>
                <p className="text-sm font-medium text-white mt-0.5">{loan.borrower}</p>
              </div>
              <Badge className={cn('text-xs', loan.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400')}>
                {loan.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Amount:</span> <span className="text-white">{loan.amount}</span></div>
              <div><span className="text-slate-500">Collateral:</span> <span className="text-white">{loan.collateral}</span></div>
              <div><span className="text-slate-500">APY:</span> <span className="text-lime-400">{loan.apy}</span></div>
              <div><span className="text-slate-500">Due:</span> <span className="text-white">{loan.due}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button className="flex-1 bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 border border-lime-500/30">
          <Landmark className="w-4 h-4 mr-2" /> Lend AODS
        </Button>
        <Button className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30">
          <Wallet className="w-4 h-4 mr-2" /> Borrow
        </Button>
      </div>
    </div>
  );
}

// ─── Panel Map ─────────────────────────────────────────────────────────────

const PANEL_MAP: Record<string, React.FC> = {
  crypto: CryptoPanel,
  supply: SupplyChainPanel,
  health: HealthcarePanel,
  did: DIDPanel,
  rwa: RWAPanel,
  ico: ICOPanel,
  gaming: GamingPanel,
  voting: VotingPanel,
  lending: LendingPanel,
};

// ─── Main BlockchainHub Component ──────────────────────────────────────────

export default function BlockchainHub({ onClose }: BlockchainHubProps) {
  const [activeModule, setActiveModule] = useState('crypto');

  const selectedModule = MODULES.find(m => m.id === activeModule)!;
  const ActivePanel = PANEL_MAP[activeModule];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-5xl h-[85vh] flex flex-col bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Blockchain Hub</h2>
              <p className="text-xs text-slate-400">9 Integrated Modules · Web4 Ready</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Network: Sepolia Testnet
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: Module List */}
          <div className="w-60 flex-shrink-0 border-r border-slate-700/50 overflow-y-auto bg-slate-900/50 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">Modules</p>
            <div className="space-y-1">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                      isActive
                        ? 'bg-slate-700/60 border border-slate-600/50'
                        : 'hover:bg-slate-800/50 border border-transparent'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0', mod.color, 'bg-opacity-20')}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-medium leading-tight', isActive ? 'text-white' : 'text-slate-400')}>{mod.label}</p>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Module Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', selectedModule.color)}>
                  <selectedModule.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedModule.label}</h3>
                    <StatusBadge status={selectedModule.status} />
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{selectedModule.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedModule.tech}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 hover:text-white gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Docs
              </Button>
            </div>

            {/* Module Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
              >
                <ActivePanel />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-900/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Gas: 21 Gwei</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Block: #19,234,567</span>
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-green-400" /> Contracts Verified</span>
          </div>
          <p className="text-xs text-slate-600">AODS Blockchain Hub v1.0 · OpenZeppelin · Hardhat</p>
        </div>
      </motion.div>
    </div>
  );
}
