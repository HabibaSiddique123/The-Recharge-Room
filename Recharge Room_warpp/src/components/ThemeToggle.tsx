import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Sun, Moon, Palette, Sunset, TreePine, Waves, Sparkles } from 'lucide-react';

const themes = [
  { 
    id: 'light', 
    name: 'Light', 
    icon: Sun, 
    gradient: 'from-yellow-400 to-orange-500',
    description: 'Clean and bright'
  },
  { 
    id: 'dark', 
    name: 'Dark', 
    icon: Moon, 
    gradient: 'from-indigo-600 to-purple-600',
    description: 'Easy on the eyes'
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    icon: Sunset, 
    gradient: 'from-orange-500 to-pink-500',
    description: 'Warm and cozy'
  },
  { 
    id: 'forest', 
    name: 'Forest', 
    icon: TreePine, 
    gradient: 'from-green-600 to-emerald-600',
    description: 'Natural and calm'
  },
  { 
    id: 'ocean', 
    name: 'Ocean', 
    icon: Waves, 
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Fresh and flowing'
  },
  { 
    id: 'cosmic', 
    name: 'Cosmic', 
    icon: Sparkles, 
    gradient: 'from-purple-600 to-pink-600',
    description: 'Magical and vibrant'
  }
];

export function ThemeToggle({ currentTheme, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentThemeData = themes.find(t => t.id === currentTheme) || themes[0];
  const IconComponent = currentThemeData.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative overflow-hidden"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <IconComponent className="w-4 h-4" />
            <Palette className="w-3 h-3" />
          </motion.div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Choose Theme</h3>
            <p className="text-sm text-muted-foreground">
              Select a theme that matches your mood
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const isActive = currentTheme === theme.id;
              
              return (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onThemeChange(theme.id);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    isActive 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${theme.gradient} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium text-sm">{theme.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {theme.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}