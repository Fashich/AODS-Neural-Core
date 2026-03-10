/**
 * Error Fallback - 3D themed error boundary
 */

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full">
        {/* Background Effects */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />

        {/* Error Card */}
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
          {/* Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
            <div className="relative w-full h-full bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            System Anomaly Detected
          </h1>
          <p className="text-slate-400 mb-6">
            The AODS Neural Core has encountered an unexpected error.
          </p>

          {/* Error Details */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-slate-500 mb-1">Error Code:</p>
            <p className="text-sm text-red-400 font-mono break-all">
              {error.message || 'Unknown Error'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetErrorBoundary}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1 border-slate-600 hover:bg-slate-800"
            >
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-slate-600">
            If this error persists, please contact AODS Support
          </p>
        </div>
      </div>
    </div>
  );
}
