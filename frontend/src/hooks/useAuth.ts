/**
 * useAuth Hook - Web4 Decentralized Identity
 * Manages wallet connection and user authentication
 */

import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  walletAddress: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isConnecting: false,
    error: null
  });

  // Check for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('aods_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true
        }));
      } catch {
        localStorage.removeItem('aods_user');
      }
    }
  }, []);

  // Connect wallet (Web4 identity)
  const connectWallet = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if MetaMask or other Web3 provider is available
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        if (accounts.length > 0) {
          const walletAddress = accounts[0];
          
          // Generate username from wallet address
          const username = `user_${walletAddress.slice(2, 8)}`;
          
          // Create user object
          const user: User = {
            id: walletAddress,
            walletAddress,
            username,
            level: 1,
            xp: 0,
            isVerified: false
          };

          // Store in localStorage for persistence
          localStorage.setItem('aods_user', JSON.stringify(user));

          setState({
            user,
            isAuthenticated: true,
            isConnecting: false,
            error: null
          });

          // Sync with backend
          await syncUserWithBackend(user);
        }
      } else {
        // Fallback: Create mock wallet for demo
        const mockAddress = '0x' + Array(40).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        const user: User = {
          id: mockAddress,
          walletAddress: mockAddress,
          username: `demo_${mockAddress.slice(2, 8)}`,
          level: 1,
          xp: 0,
          isVerified: false
        };

        localStorage.setItem('aods_user', JSON.stringify(user));

        setState({
          user,
          isAuthenticated: true,
          isConnecting: false,
          error: null
        });

        await syncUserWithBackend(user);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }));
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    localStorage.removeItem('aods_user');
    setState({
      user: null,
      isAuthenticated: false,
      isConnecting: false,
      error: null
    });
  }, []);

  // Sync user with backend
  const syncUserWithBackend = async (user: User) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';
      await fetch(`${apiUrl}/api/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: user.walletAddress,
          username: user.username
        })
      });
    } catch (err) {
      console.log('Backend sync failed, will retry later');
    }
  };

  // Update user XP
  const addXP = useCallback((amount: number) => {
    setState(prev => {
      if (!prev.user) return prev;
      
      const newXP = prev.user.xp + amount;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      const updatedUser = {
        ...prev.user,
        xp: newXP,
        level: newLevel
      };
      
      localStorage.setItem('aods_user', JSON.stringify(updatedUser));
      
      return {
        ...prev,
        user: updatedUser
      };
    });
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isConnecting: state.isConnecting,
    error: state.error,
    connectWallet,
    disconnect,
    addXP
  };
}

// Extend Window interface for Ethereum
// Note: LandingPage.tsx also declares this - kept compatible
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
