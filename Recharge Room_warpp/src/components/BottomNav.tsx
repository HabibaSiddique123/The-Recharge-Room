import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';

export function BottomNav({ currentPage, onPageChange }) {
  // Get current user from localStorage to check admin status
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const userData = localStorage.getItem('recharge_user');
    if (userData) {
      const user = JSON.parse(userData);
      setIsAdmin(user.is_admin || false);
    }
  }, []);

  const navItems = [
    { id: 'dashboard', emoji: '🏠', label: 'Home' },
    { id: 'mood', emoji: '😊', label: 'Mood' },
    { id: 'journal', emoji: '📝', label: 'Journal' },
    { id: 'tasks', emoji: '✅', label: 'Tasks' },
    { id: 'voice', emoji: '🎤', label: 'Voice' },
    { id: 'rewards', emoji: '🏆', label: 'Rewards' }
  ];

  const adminItems = [
    ...navItems,
    ...(isAdmin ? [{ id: 'admin', emoji: '🛡️', label: 'Admin' }] : [])
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div className="w-full max-w-screen-sm mx-auto px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex justify-around items-center">
          {/* Safe area indicator for mobile */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-30" />
          {adminItems.map((item) => (
            <motion.div
              key={item.id}
              whileTap={{ 
                scale: 0.85,
                transition: { duration: 0.1 }
              }}
              whileHover={{ 
                scale: currentPage === item.id ? 1 : 1.05,
                transition: { duration: 0.2 }
              }}
              className="relative"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Add haptic-like feedback for modern browsers
                  if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                  }
                  onPageChange(item.id);
                }}
                className={`flex flex-col items-center space-y-1 p-2 sm:p-3 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px] ${
                  currentPage === item.id
                    ? item.id === 'admin'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg transform scale-105'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg transform scale-105'
                    : item.id === 'admin'
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
              >
                <motion.span 
                  className="text-lg sm:text-xl"
                  animate={{
                    scale: currentPage === item.id ? [1, 1.2, 1] : 1
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: currentPage === item.id ? 1 : 0
                  }}
                >
                  {item.emoji}
                </motion.span>
                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
              </Button>
              
              {currentPage === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full shadow-lg"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}