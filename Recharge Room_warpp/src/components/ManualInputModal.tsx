import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { X, Heart, Edit3, Sparkles, Save, Lightbulb } from 'lucide-react';

interface ManualInputModalProps {
  onSave: (transcript: string) => void;
  onClose: () => void;
  draftTitle: string;
  setDraftTitle: (title: string) => void;
}

export function ManualInputModal({ onSave, onClose, draftTitle, setDraftTitle }: ManualInputModalProps) {
  const [manualText, setManualText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  const writingPrompts = [
    "What's on your mind right now? 💭",
    "How are you feeling in this moment? 😊",
    "What happened today that you'd like to remember? 📝",
    "What are you grateful for? 🙏",
    "What challenges are you facing? 💪",
    "What would you tell a friend in your situation? 🤗",
    "What's one thing that went well today? ⭐",
    "What would make tomorrow better? 🌅"
  ];

  useEffect(() => {
    const words = manualText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [manualText]);

  const handleSave = () => {
    if (manualText.trim()) {
      onSave(manualText.trim());
      onClose();
    }
  };

  const insertPrompt = (prompt: string) => {
    const cleanPrompt = prompt.replace(/[^\w\s?!.,]/g, '').trim();
    setManualText(prev => prev + (prev ? '\n\n' : '') + cleanPrompt + '\n\n');
  };

  return (
    <div className="recharge-modal-overlay bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="recharge-modal-content bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative pb-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Edit3 className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    Write Your Thoughts ✨
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Sometimes writing is the best way to express ourselves
                  </p>
                </div>
              </div>
              
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {/* Empathetic Message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-700"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart className="w-5 h-5 text-purple-500" />
                </motion.div>
                <p className="text-purple-700 dark:text-purple-300 font-medium">
                  No worries about voice recording! Writing can be just as powerful for self-reflection.
                </p>
              </div>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Title Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title (Optional)
              </label>
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Give your note a title..."
                className="recharge-input"
              />
            </motion.div>

            {/* Writing Prompts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Writing Prompts
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTips(!showTips)}
                  className="text-xs"
                >
                  {showTips ? 'Hide' : 'Show'} Ideas
                </Button>
              </div>
              
              <AnimatePresence>
                {showTips && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700"
                  >
                    {writingPrompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => insertPrompt(prompt)}
                        className="text-left p-2 text-xs rounded-md bg-white dark:bg-gray-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-gray-700 dark:text-gray-300 transition-colors border border-yellow-200 dark:border-yellow-700 hover:border-yellow-300 dark:hover:border-yellow-600"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Text Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Thoughts
              </label>
              <div className="relative">
                <Textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Start writing... Let your thoughts flow freely. There's no wrong way to express yourself here. 💭"
                  className="recharge-input min-h-[200px] text-base leading-relaxed"
                  rows={8}
                />
                
                {/* Floating word count */}
                <AnimatePresence>
                  {manualText && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-3 right-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 shadow-lg"
                    >
                      {wordCount} words
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Encouragement Message */}
            {manualText.length > 50 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                Great job expressing yourself! Keep writing... 📝
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-between items-center gap-4 pt-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-6"
                >
                  Cancel
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={manualText.trim() ? {
                  boxShadow: [
                    "0 4px 20px rgba(34, 197, 94, 0.2)",
                    "0 8px 30px rgba(34, 197, 94, 0.4)",
                    "0 4px 20px rgba(34, 197, 94, 0.2)"
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Button
                  onClick={handleSave}
                  disabled={!manualText.trim()}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  <motion.div
                    animate={manualText.trim() ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                  </motion.div>
                  Save Note ✨
                  
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </Button>
              </motion.div>
            </motion.div>

            {/* Footer Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-xs text-gray-500 dark:text-gray-400 italic"
            >
              Remember: Every thought shared is a step toward self-understanding 💜
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}