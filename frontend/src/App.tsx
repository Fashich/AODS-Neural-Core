/**
 * AODS - Autonomous Orchestration of Digital Systems
 * Main Application Component
 *
 * The Holographic Enterprise Metaverse
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, PerspectiveCamera } from '@react-three/drei';
import { ErrorBoundary } from 'react-error-boundary';

// Import components
import LoadingScreen from './components/LoadingScreen';
import ErrorFallback from './components/ErrorFallback';
import HUD from './components/HUD';
import Navigation from './components/Navigation';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';

// Lazy load heavy components for performance
const MetaverseScene = lazy(() => import('./components/three/MetaverseScene'));
const VRMode = lazy(() => import('./components/vr/VRMode'));
const GameOverlay = lazy(() => import('./components/game/GameOverlay'));
const AIDashboard = lazy(() => import('./components/ai/AIDashboard'));
const PaymentModal = lazy(() => import('./components/payment/PaymentModal'));
const ComplianceShield = lazy(() => import('./components/security/ComplianceShield'));
const BlockchainHub = lazy(() => import('./components/blockchain/BlockchainHub'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));

// Hooks
import { useAODS } from './hooks/useAODS';
import { useAuth } from './hooks/useAuth';
import { useTelemetry } from './hooks/useTelemetry';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'3d' | 'vr' | 'game'>('3d');
  const [showPayment, setShowPayment] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showBlockchain, setShowBlockchain] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { systemStatus, orchestrationData } = useAODS();
  const { user, isAuthenticated } = useAuth();
  const { sendTelemetry } = useTelemetry();

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      sendTelemetry('app_initialized', { mode: activeMode });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <MainAppContent
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                showPayment={showPayment}
                setShowPayment={setShowPayment}
                showAI={showAI}
                setShowAI={setShowAI}
                showCompliance={showCompliance}
                setShowCompliance={setShowCompliance}
                showBlockchain={showBlockchain}
                setShowBlockchain={setShowBlockchain}
                showProfile={showProfile}
                setShowProfile={setShowProfile}
                user={user}
                systemStatus={systemStatus}
                orchestrationData={orchestrationData}
                sendTelemetry={sendTelemetry}
              />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingScreen />}>
                <ProfilePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

// Separate functional component for the main app content
const MainAppContent = ({
  activeMode,
  setActiveMode,
  showPayment,
  setShowPayment,
  showAI,
  setShowAI,
  showCompliance,
  setShowCompliance,
  showBlockchain,
  setShowBlockchain,
  showProfile,
  setShowProfile,
  user,
  systemStatus,
  orchestrationData,
  sendTelemetry,
}: any) => {
  const { isAuthenticated, connectWallet } = useAuth();
  const { systemStatus: statusFromHook, orchestrationData: dataFromHook } = useAODS();

  const finalSystemStatus = systemStatus || statusFromHook;
  const finalOrchestrationData = orchestrationData || dataFromHook;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="aods-app">
        {/* Navigation Bar */}
        <Navigation
          user={user}
          isAuthenticated={isAuthenticated}
          onConnectWallet={connectWallet}
          onToggleMode={setActiveMode}
          activeMode={activeMode}
          onShowPayment={() => setShowPayment(true)}
          onShowAI={() => setShowAI(true)}
          onShowCompliance={() => setShowCompliance(true)}
          onShowBlockchain={() => setShowBlockchain(true)}
          onShowProfile={() => setShowProfile(true)}
        />

        {/* Main Content Area */}
        <main className="main-content">
          <Suspense fallback={<LoadingScreen mini />}>
            {activeMode === '3d' && (
              <div className="canvas-container">
                <Canvas
                  shadows
                  dpr={[1, 2]}
                  camera={{ position: [0, 5, 10], fov: 60 }}
                  gl={{ antialias: true, alpha: true }}
                >
                  <PerspectiveCamera makeDefault position={[0, 5, 10]} />
                  <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={3}
                    maxDistance={50}
                  />
                  <Stars
                    radius={100}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0.5}
                    fade
                  />
                  <Environment preset="city" />
                  <ambientLight intensity={0.5} />
                  <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                  />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} />

                  <MetaverseScene
                    orchestrationData={finalOrchestrationData}
                    systemStatus={finalSystemStatus}
                  />
                </Canvas>
              </div>
            )}

            {activeMode === 'vr' && (
              <VRMode
                orchestrationData={finalOrchestrationData}
                onExit={() => setActiveMode('3d')}
              />
            )}

            {activeMode === 'game' && (
              <GameOverlay
                user={user}
                onAchievement={(achievement: any) =>
                  sendTelemetry('achievement_unlocked', achievement)
                }
              />
            )}
          </Suspense>
        </main>

        {/* HUD Overlay */}
        <HUD
          systemStatus={finalSystemStatus}
          metrics={{ sessionDuration: 0, actionsCount: 0, errorsCount: 0 }}
          user={user}
        />

        {/* Modals */}
        <Suspense fallback={null}>
          {showPayment && (
            <PaymentModal
              onClose={() => setShowPayment(false)}
              user={user}
            />
          )}

          {showAI && (
            <AIDashboard
              onClose={() => setShowAI(false)}
              orchestrationData={finalOrchestrationData}
            />
          )}

          {showCompliance && (
            <ComplianceShield
              onClose={() => setShowCompliance(false)}
            />
          )}

          {showBlockchain && (
            <BlockchainHub
              onClose={() => setShowBlockchain(false)}
            />
          )}

          {showProfile && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <div className="relative min-h-screen bg-slate-950">
                <button
                  onClick={() => setShowProfile(false)}
                  className="fixed top-4 right-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
                >
                  ✕
                </button>
                <ProfilePage userId={user?.id} isOwnProfile={true} />
              </div>
            </div>
          )}
        </Suspense>

        {/* System Status Footer */}
        <footer className="system-footer">
          <div className="status-indicators">
            <span className={`status-dot ${finalSystemStatus.database}`}>
              Database: {finalSystemStatus.database}
            </span>
            <span className={`status-dot ${finalSystemStatus.ai}`}>
              AI Core: {finalSystemStatus.ai}
            </span>
            <span className={`status-dot ${finalSystemStatus.orchestration}`}>
              Orchestration: {finalSystemStatus.orchestration}
            </span>
            <span className={`status-dot ${finalSystemStatus.blockchain}`}>
              Blockchain: {finalSystemStatus.blockchain}
            </span>
          </div>
          <div className="version-info">AODS v1.0.0 | Ahmad Fashich Azzuhri Ramadhani | 2026</div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
