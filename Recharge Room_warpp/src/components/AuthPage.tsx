import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { ThemeToggle } from './ThemeToggle';
import { User, Mail, Lock, Eye, EyeOff, Zap, Heart, Sparkles, Moon, Sun } from 'lucide-react';

export function AuthPage({ onLogin, currentTheme, onThemeChange }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    // Check if we're in demo/offline mode or server is unavailable
    const isDemoMode = localStorage.getItem('demo_mode') === 'true';
    const hasValidAuth = localStorage.getItem('recharge_auth') === 'true' && localStorage.getItem('recharge_user');
    
    if (isDemoMode || hasValidAuth) {
      setOfflineMode(true);
      console.log('🚀 Demo/Offline mode detected - Server calls disabled');
    }
    
    // Prevent any automatic server calls on component mount
    return () => {
      // Cleanup if needed
    };
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // OFFLINE AUTHENTICATION SYSTEM
      console.log('🔐 Processing offline login...');
      
      // Validate form data
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!isLogin && !formData.name) {
        throw new Error('Please enter your full name');
      }
      
      // Simulate login delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user session
      const userData = {
        name: isLogin ? formData.email.split('@')[0] : formData.name,
        email: formData.email,
        is_admin: formData.email === 'admin@rechargeroom.com',
        offline_mode: true,
        login_time: new Date().toISOString()
      };
      
      // Store authentication data
      const token = 'OFFLINE_TOKEN_' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('recharge_auth', 'true');
      localStorage.setItem('recharge_user', JSON.stringify(userData));
      localStorage.setItem('offline_mode', 'true');
      
      console.log('✅ Offline login successful:', userData.name);
      
      // Login successful
      onLogin(userData);
      
    } catch (error) {
      const errorMsg = error.message || (isLogin ? 'Login failed' : 'Registration failed');
      alert(errorMsg);
      console.error('Auth error:', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input change: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasInteracted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Sticky Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold text-lg">Recharge Room</span>
            </motion.div>

            {/* Theme Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ThemeToggle currentTheme={currentTheme} onThemeChange={onThemeChange} />
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="flex items-center justify-center min-h-screen p-4">

        {/* Main Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md sm:max-w-lg z-10 mt-8"
        >
        <Card className="bg-white/10 dark:bg-gray-900/20 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          {/* Header */}
          <CardHeader className="text-center pb-6 relative z-10 pt-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <CardTitle className="text-2xl font-bold text-white mb-3 leading-tight">
                {isLogin ? `Welcome Back! 😊` : `Join Our Wellness Family 🌸`}
              </CardTitle>
              
              <motion.p 
                className="text-white/70 text-sm leading-relaxed px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {isLogin 
                  ? "Ready to continue your wellness journey?" 
                  : "Start your journey to better mental health and productivity"
                }
              </motion.p>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6 relative z-10">
            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="name" className="text-white/80 text-sm font-medium block mb-2">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none z-10" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        autoComplete="name"
                        className="relative z-20 pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Enter your full name"
                        required={!isLogin}
                        style={{ position: 'relative', zIndex: 20 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative z-20">
                <Label htmlFor="email" className="text-white/80 text-sm font-medium block mb-2">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none z-10" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                    className="relative z-20 pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Enter your email"
                    required
                    style={{ position: 'relative', zIndex: 20 }}
                  />
                </div>
              </div>

              <div className="relative z-20">
                <Label htmlFor="password" className="text-white/80 text-sm font-medium block mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none z-10" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                    className="relative z-20 pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Enter your password"
                    required
                    style={{ position: 'relative', zIndex: 20 }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors z-30 pointer-events-auto"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'} 
                      <Heart className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Quick Demo Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="text-center"
            >
              <p className="text-white/60 text-sm mb-3">
                Want to try it first? 🚀
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    // INSTANT OFFLINE DEMO ACCESS - NO SERVER REQUIRED!
                    console.log('🚀 Quick Demo Access - OFFLINE MODE ACTIVATED');
                    
                    // Clear any existing auth to prevent conflicts
                    localStorage.clear();
                    
                    // Create demo session data
                    const demoUser = {
                      name: 'Demo User',
                      email: 'demo@rechargeroom.com',
                      is_admin: false,
                      demo_mode: true,
                      session_start: new Date().toISOString()
                    };
                    
                    // Set up demo authentication
                    const demoToken = 'DEMO_TOKEN_' + Date.now();
                    localStorage.setItem('token', demoToken);
                    localStorage.setItem('recharge_auth', 'true');
                    localStorage.setItem('recharge_user', JSON.stringify(demoUser));
                    localStorage.setItem('demo_mode', 'true');
                    
                    // Initialize demo data
                    localStorage.setItem('demo_initialized', 'true');
                    
                    // Login immediately - this will trigger App.tsx to show main interface
                    console.log('✅ Demo session created - Logging in...');
                    onLogin(demoUser);
                    
                    // Confirmation message
                    setTimeout(() => {
                      console.log('🎉 DEMO MODE ACTIVE - Full offline access granted!');
                    }, 200);
                  }}
                  className="w-full mb-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-300"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                  </motion.div>
                  Quick Demo Access ✨
                </Button>
              </motion.div>
              
              {/* Reset App Data for Testing */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('This will clear all app data. Are you sure?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Reset App Data
                </Button>
              </div>
            </motion.div>

            <Separator className="bg-white/20" />

            {/* Toggle Auth Mode */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <p className="text-sm text-white/70">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ name: '', email: '', password: '' });
                  }}
                  className="text-white hover:text-white/80 p-0 mt-1 underline-offset-4"
                >
                  {isLogin ? 'Create one here 🌱' : 'Sign in instead ✨'}
                </Button>
              </motion.div>
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-5 mt-6 border border-white/20"
            >
              <motion.h4 
                className="font-semibold text-white mb-3 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                What's waiting for you:
              </motion.h4>
              <motion.ul 
                className="text-sm text-white/80 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                {[
                  { icon: '📝', text: 'Personal journaling with beautiful themes' },
                  { icon: '😊', text: 'Mood tracking with insightful analytics' },
                  { icon: '✅', text: 'Task management with celebration rewards' },
                  { icon: '🎤', text: 'Voice notes with instant transcription' },
                  { icon: '🏆', text: 'Achievement badges & streak tracking' },
                  { icon: '🌙', text: 'Multiple themes & personalization' }
                ].map((feature, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.1 + (index * 0.1) }}
                    className="flex items-center"
                  >
                    <span className="mr-3">{feature.icon}</span>
                    {feature.text}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="text-center mt-8"
        >
          <motion.p
            className="text-white/60 text-sm leading-relaxed"
            animate={{ 
              textShadow: [
                "0 0 10px rgba(255,255,255,0.2)",
                "0 0 20px rgba(255,255,255,0.3)",
                "0 0 10px rgba(255,255,255,0.2)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Your personal space for growth, reflection, and achieving your goals
          </motion.p>
          <motion.p
            className="text-white/40 text-xs mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
          >
            Made with ❤️ for your mental health & productivity
          </motion.p>
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
}