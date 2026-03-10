/**
 * Navigation - Top navigation bar
 * Updated: Added Blockchain Hub & Profile panel triggers
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Cpu,
  Wallet,
  User,
  Settings,
  LogOut,
  Glasses,
  Gamepad2,
  Box,
  CreditCard,
  Brain,
  Shield,
  ChevronDown,
  Menu,
  X,
  Globe,     // Blockchain Hub icon
  UserCircle // Profile icon
} from 'lucide-react';

interface NavigationProps {
  user: {
    id: string;
    walletAddress: string;
    username: string;
    level?: number;
  } | null;
  isAuthenticated: boolean;
  onConnectWallet: () => void;
  onToggleMode: (mode: '3d' | 'vr' | 'game') => void;
  activeMode: '3d' | 'vr' | 'game';
  onShowPayment: () => void;
  onShowAI: () => void;
  onShowCompliance: () => void;
  onShowBlockchain: () => void;
  onShowProfile: () => void;
}

export default function Navigation({
  user,
  isAuthenticated,
  onConnectWallet,
  onToggleMode,
  activeMode,
  onShowPayment,
  onShowAI,
  onShowCompliance,
  onShowBlockchain,
  onShowProfile,
}: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-red-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <img
                src="/images/logo.png"
                alt="AODS Logo"
                className="w-10 h-10 object-contain rounded-lg"
                onError={(e) => {
                  // Fallback to icon if logo not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-500 rounded-lg animate-pulse items-center justify-center" style={{ display: 'none' }}>
                <Cpu className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent">
                Autonomous Orchestration of Digital Systems
              </h1>
              <p className="text-xs text-slate-500">The Holographic Enterprise Metaverse v1.0</p>
            </div>
          </div>

          {/* Mode Switcher - desktop only */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <Button
              variant={activeMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToggleMode('3d')}
              className={activeMode === '3d' ? 'bg-red-500/20 text-red-400' : 'text-slate-400'}
            >
              <Box className="w-4 h-4 mr-1" />
              3D
            </Button>
            <Button
              variant={activeMode === 'vr' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToggleMode('vr')}
              className={activeMode === 'vr' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'}
            >
              <Glasses className="w-4 h-4 mr-1" />
              VR
            </Button>
            <Button
              variant={activeMode === 'game' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToggleMode('game')}
              className={activeMode === 'game' ? 'bg-green-500/20 text-green-400' : 'text-slate-400'}
            >
              <Gamepad2 className="w-4 h-4 mr-1" />
              Game
            </Button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* AI Dashboard Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowAI}
              className="hidden md:flex text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            >
              <Brain className="w-4 h-4 mr-1" />
              AI
            </Button>

            {/* Blockchain Hub Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowBlockchain}
              className="hidden md:flex text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              <Globe className="w-4 h-4 mr-1" />
              Blockchain
            </Button>

            {/* Compliance Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowCompliance}
              className="hidden md:flex text-green-400 hover:text-green-300 hover:bg-green-500/10"
            >
              <Shield className="w-4 h-4 mr-1" />
              Security
            </Button>

            {/* Payment Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowPayment}
              className="hidden md:flex text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Upgrade
            </Button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-slate-500">
                        Lvl {user.level || 1}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{user.username}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  {/* Profile link now opens the ProfilePage */}
                  <DropdownMenuItem
                    className="text-slate-300 focus:bg-slate-700 cursor-pointer"
                    onClick={onShowProfile}
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-indigo-400 focus:bg-slate-700 cursor-pointer"
                    onClick={onShowBlockchain}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Blockchain Hub
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 focus:bg-slate-700">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem className="text-red-400 focus:bg-slate-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={onConnectWallet}
                className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-red-900/30 px-4 py-4 space-y-3">
          {/* Mode Switcher Mobile */}
          <div className="flex gap-2">
            <Button
              variant={activeMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { onToggleMode('3d'); setMobileOpen(false); }}
              className={`flex-1 ${activeMode === '3d' ? 'bg-red-500/20 text-red-400' : 'text-slate-400'}`}
            >
              <Box className="w-4 h-4 mr-1" /> 3D
            </Button>
            <Button
              variant={activeMode === 'vr' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { onToggleMode('vr'); setMobileOpen(false); }}
              className={`flex-1 ${activeMode === 'vr' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'}`}
            >
              <Glasses className="w-4 h-4 mr-1" /> VR
            </Button>
            <Button
              variant={activeMode === 'game' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { onToggleMode('game'); setMobileOpen(false); }}
              className={`flex-1 ${activeMode === 'game' ? 'bg-green-500/20 text-green-400' : 'text-slate-400'}`}
            >
              <Gamepad2 className="w-4 h-4 mr-1" /> Game
            </Button>
          </div>

          {/* Action Buttons Mobile */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onShowAI(); setMobileOpen(false); }}
              className="text-rose-400 hover:bg-rose-500/10 w-full"
            >
              <Brain className="w-4 h-4 mr-1" /> AI
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onShowBlockchain(); setMobileOpen(false); }}
              className="text-indigo-400 hover:bg-indigo-500/10 w-full"
            >
              <Globe className="w-4 h-4 mr-1" /> Chain
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onShowCompliance(); setMobileOpen(false); }}
              className="text-green-400 hover:bg-green-500/10 w-full"
            >
              <Shield className="w-4 h-4 mr-1" /> Security
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onShowPayment(); setMobileOpen(false); }}
              className="text-red-400 hover:bg-red-500/10 w-full"
            >
              <CreditCard className="w-4 h-4 mr-1" /> Upgrade
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onShowProfile(); setMobileOpen(false); }}
              className="text-slate-300 hover:bg-slate-700/50 w-full col-span-2"
            >
              <UserCircle className="w-4 h-4 mr-1" /> My Profile
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
