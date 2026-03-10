import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text3D } from '@react-three/drei';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

// Custom 3D Scene for Signup Page
const SignupScene = () => {
  return (
    <>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 0, 0]}>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[1.5, 1, 0]}>
          <torusGeometry args={[0.6, 0.2, 16, 100]} />
          <meshStandardMaterial color="#f87171" emissive="#f87171" />
        </mesh>
      </Float>
      <Float speed={1.7} rotationIntensity={0.8} floatIntensity={0.8}>
        <mesh position={[-1.5, -1, 0]}>
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#fca5a5" metalness={0.7} roughness={0.3} />
        </mesh>
      </Float>
    </>
  );
};

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (!agreedToTerms) {
      alert("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    // In a real app, you would handle registration here
    console.log({ name, email, password });
    // Navigate to dashboard after successful signup
    navigate('/dashboard'); // This assumes dashboard is the authenticated route
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-red-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* 3D Canvas Background */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 70 }}
        className="absolute inset-0 z-0"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ef4444" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f87171" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0.5} fade speed={2} />
        <SignupScene />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Signup Form Container */}
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/70 backdrop-blur-lg rounded-2xl border border-red-900/50 p-8 shadow-2xl shadow-red-900/20"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-200">
              Create Account
            </h1>
            <p className="text-red-200/70 mt-2">Join the AODS Neural Core ecosystem</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="name" className="block text-red-200 mb-2">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-red-900/20 border border-red-800/30 rounded-lg text-white placeholder-red-300/50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="block text-red-200 mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-red-900/20 border border-red-800/30 rounded-lg text-white placeholder-red-300/50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block text-red-200 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-red-900/20 border border-red-800/30 rounded-lg text-white placeholder-red-300/50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-300 hover:text-red-100"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-red-200 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-red-900/20 border border-red-800/30 rounded-lg text-white placeholder-red-300/50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-300 hover:text-red-100"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-red-900/20 border-red-800/30 rounded focus:ring-red-500 focus:ring-2 mt-0.5"
                  required
                />
                <label htmlFor="terms" className="ml-2 text-sm text-red-200">
                  I agree to the <a href="#" className="text-red-400 hover:text-red-300 underline">Terms of Service</a> and <a href="#" className="text-red-400 hover:text-red-300 underline">Privacy Policy</a>
                </label>
              </div>
            </div>

            <motion.button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 rounded-lg text-white font-bold shadow-lg shadow-red-900/30"
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(239, 68, 68, 0.5)" }}
              whileTap={{ scale: 0.98 }}
            >
              Create Account
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-red-300/70">
              Already have an account?{' '}
              <Link to="/login" className="text-red-400 hover:text-red-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-red-400 hover:text-red-300 text-sm inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Homepage
          </Link>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-red-500/10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 15 + 5}px`,
              height: `${Math.random() * 15 + 5}px`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 80 - 40, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SignupPage;