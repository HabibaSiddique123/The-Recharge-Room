import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { MoodTracker } from './components/MoodTracker';
import { Journal } from './components/Journal';
import { Tasks } from './components/Tasks';
import { VoiceNotes } from './components/VoiceNotes';
import { Rewards } from './components/Rewards';
import { AuthPage } from './components/AuthPage';
import { BottomNav } from './components/BottomNav';
import { ThemeToggle } from './components/ThemeToggle';
import AdminDashboard from './components/AdminDashboard';
import { Button } from './components/ui/button';
import { LogOut, Shield } from 'lucide-react';
import { migrateToUserSpecificStorage, userStorage } from './utils/userStorage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check for stored auth state and theme
    const authState = localStorage.getItem('recharge_auth');
    const userData = localStorage.getItem('recharge_user');
    const themeState = localStorage.getItem('recharge_theme') || 'light';
    
    // Enable persistent authentication - check if user is already logged in
    if (authState === 'true' && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setIsAuthenticated(true);
        setCurrentUser(parsedUser);
        
        // Migrate existing data to user-specific storage on auto-login
        migrateToUserSpecificStorage();
        
        // Role-based routing for auto-login
        if (parsedUser.is_admin) {
          console.log('✅ Admin auto-login successful - showing Admin Panel');
          setCurrentPage('admin');
        } else {
          console.log('✅ User auto-login successful - showing Dashboard');
          setCurrentPage('dashboard');
        }
      } catch (error) {
        console.error('Error parsing user data, clearing auth:', error);
        localStorage.removeItem('recharge_auth');
        localStorage.removeItem('recharge_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } else {
      // No valid auth state found
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
    
    setCurrentTheme(themeState);
    applyTheme(themeState);

    // PWA Install Prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Show install button or banner
      console.log('PWA install prompt available');
    });

    // Handle PWA installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
    });

    // Handle online/offline status
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        console.log('App is online');
        // Sync any offline data
      } else {
        console.log('App is offline');
        // Show offline indicator
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
    localStorage.setItem('recharge_auth', 'true');
    localStorage.setItem('recharge_user', JSON.stringify(userData));
    
    // Migrate existing data to user-specific storage
    migrateToUserSpecificStorage();
    console.log('💾 Data migration completed for user:', userData.email);
    
    // Role-based routing after login
    if (userData.is_admin) {
      console.log('🛡️ Admin logged in - redirecting to Admin Panel');
      setCurrentPage('admin');
    } else {
      console.log('👤 User logged in - redirecting to Dashboard');
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = (clearUserData = false) => {
    console.log('🚪 Starting logout process...');
    
    try {
      // If user wants to clear their data
      if (clearUserData) {
        userStorage.clearUserData();
        console.log('💮 User data cleared successfully');
      } else {
        console.log('💾 User data preserved - will be available on next login');
      }
    } catch (error) {
      console.error('Error handling user data on logout:', error);
    }
    
    // Clear authentication state
    setIsAuthenticated(false);
    setCurrentUser(null);
    
    // Clear authentication tokens
    localStorage.removeItem('recharge_auth');
    localStorage.removeItem('recharge_user');
    localStorage.removeItem('token');
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('offline_mode');
    
    // Reset to dashboard
    setCurrentPage('dashboard');
    
    console.log('✅ Logout successful - returning to login page');
  };

  const applyTheme = (theme) => {
    // Remove all theme classes
    document.documentElement.classList.remove('dark', 'sunset', 'forest', 'ocean', 'cosmic');
    
    // Apply new theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme !== 'light') {
      // For themed variants, add both the theme and check if it should be dark
      document.documentElement.classList.add(theme);
      // You could add logic here to determine if the theme should be in dark mode
      // For now, we'll let the theme CSS handle light/dark variants
    }
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem('recharge_theme', theme);
  };

  const getThemeBackground = () => {
    switch (currentTheme) {
      case 'dark':
        return 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900';
      case 'sunset':
        return 'bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 dark:from-orange-900 dark:via-pink-900 dark:to-red-900';
      case 'forest':
        return 'bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 dark:from-green-900 dark:via-emerald-900 dark:to-teal-900';
      case 'ocean':
        return 'bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 dark:from-blue-900 dark:via-cyan-900 dark:to-sky-900';
      case 'cosmic':
        return 'bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 dark:from-purple-900 dark:via-pink-900 dark:to-indigo-900';
      default:
        return 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={currentUser} onNavigate={setCurrentPage} />;
      case 'mood':
        return <MoodTracker />;
      case 'journal':
        return <Journal />;
      case 'tasks':
        return <Tasks />;
      case 'voice':
        return <VoiceNotes />;
      case 'rewards':
        return <Rewards />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Dashboard user={currentUser} onNavigate={setCurrentPage} />;
    }
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} currentTheme={currentTheme} onThemeChange={handleThemeChange} />;
  }

  return (
    <div className={`min-h-screen ${getThemeBackground()} transition-all duration-500`}>
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center space-x-3 lg:space-x-4"
            >
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <span className="text-white font-bold text-lg lg:text-xl">⚡</span>
              </motion.div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  The Recharge Room
                </h1>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  Your wellness companion
                </p>
              </div>
            </motion.div>
            
            {/* Desktop Navigation Pills */}
            <div className="hidden lg:flex items-center space-x-2">
              {[
                { id: 'dashboard', emoji: '🏠', label: 'Dashboard' },
                { id: 'mood', emoji: '😊', label: 'Mood' },
                { id: 'journal', emoji: '📝', label: 'Journal' },
                { id: 'tasks', emoji: '✅', label: 'Tasks' },
                { id: 'voice', emoji: '🎤', label: 'Voice' },
                { id: 'rewards', emoji: '🏆', label: 'Rewards' }
              ].map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span className="hidden xl:block">{item.label}</span>
                </motion.button>
              ))}
              {currentUser?.is_admin && (
                <motion.button
                  onClick={() => setCurrentPage('admin')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    currentPage === 'admin'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden xl:block">Admin</span>
                </motion.button>
              )}
            </div>
            
            <div className="flex items-center space-x-3 lg:space-x-4">
              {currentUser && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </motion.div>
              )}
              
              <ThemeToggle currentTheme={currentTheme} onThemeChange={handleThemeChange} />
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    console.log('🔴 LOGOUT BUTTON CLICKED');
                    handleLogout();
                  }}
                  className="text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center gap-2"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Logout</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Navigation Progress Bar */}
        <motion.div 
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </header>

      {/* Main Content */}
      <main className="pb-20 sm:pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation - Hidden on Desktop */}
      <div className="lg:hidden">
        <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}