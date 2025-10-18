import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Trophy, Award, Star, Target, Calendar, Zap } from 'lucide-react';
import { userStorage } from '../utils/userStorage';

const allBadges = [
  // Task badges
  { id: 'first_task', name: 'Task Starter', description: 'Added your first task', emoji: '🌟', category: 'Tasks' },
  { id: 'bronze', name: 'Bronze Achiever', description: 'Completed 5 tasks', emoji: '🥉', category: 'Tasks' },
  { id: 'silver', name: 'Silver Achiever', description: 'Completed 15 tasks', emoji: '🥈', category: 'Tasks' },
  { id: 'gold', name: 'Gold Achiever', description: 'Completed 30 tasks', emoji: '🥇', category: 'Tasks' },
  { id: 'fire', name: 'On Fire!', description: 'Completed 50 tasks', emoji: '🔥', category: 'Tasks' },
  
  // Mood badges
  { id: 'first_mood', name: 'Mood Explorer', description: 'Logged your first mood', emoji: '🌟', category: 'Mood' },
  { id: 'mood_week', name: 'Mood Master', description: 'Logged moods for 7 days', emoji: '📈', category: 'Mood' },
  { id: 'mood_streak', name: 'Consistency King', description: 'Logged moods for 30 days', emoji: '👑', category: 'Mood' },
  
  // Journal badges
  { id: 'first_journal', name: 'Journal Beginner', description: 'Wrote your first journal entry', emoji: '📖', category: 'Journal' },
  { id: 'weekly_writer', name: 'Weekly Writer', description: 'Wrote 7 journal entries', emoji: '✍️', category: 'Journal' },
  { id: 'storyteller', name: 'Storyteller', description: 'Wrote 20 journal entries', emoji: '📚', category: 'Journal' },
  
  // Voice badges
  { id: 'first_voice', name: 'Voice Explorer', description: 'Recorded your first voice note', emoji: '🎤', category: 'Voice' },
  { id: 'voice_enthusiast', name: 'Voice Enthusiast', description: 'Recorded 10 voice notes', emoji: '🗣️', category: 'Voice' },
  { id: 'podcaster', name: 'Podcaster', description: 'Recorded 25 voice notes', emoji: '🎙️', category: 'Voice' },
  
  // Special badges
  { id: 'early_bird', name: 'Early Bird', description: 'Used the app before 8 AM', emoji: '🌅', category: 'Special' },
  { id: 'night_owl', name: 'Night Owl', description: 'Used the app after 10 PM', emoji: '🦉', category: 'Special' },
  { id: 'wellness_warrior', name: 'Wellness Warrior', description: 'Used all features in one day', emoji: '⚔️', category: 'Special' }
];

const categoryColors = {
  'Tasks': 'bg-blue-500',
  'Mood': 'bg-pink-500',
  'Journal': 'bg-green-500',
  'Voice': 'bg-purple-500',
  'Special': 'bg-orange-500'
};

export function Rewards() {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [totalProgress, setTotalProgress] = useState(0);

  useEffect(() => {
    // Load earned badges from user-specific storage
    const badges = userStorage.getItem('recharge_badges') || [];
    setEarnedBadges(badges);
    
    // Calculate total progress
    const progress = (badges.length / allBadges.length) * 100;
    setTotalProgress(progress);
    
    // Check for time-based achievements
    checkTimeBasedAchievements();
    checkWellnessWarriorAchievement();
  }, []);

  const checkTimeBasedAchievements = () => {
    const badges = userStorage.getItem('recharge_badges') || [];
    const currentHour = new Date().getHours();
    
    // Early bird badge (before 8 AM)
    if (currentHour < 8 && !badges.find(b => b.id === 'early_bird')) {
      const newBadge = {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Used the app before 8 AM',
        emoji: '🌅',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
      setEarnedBadges(badges);
    }
    
    // Night owl badge (after 10 PM)
    if (currentHour >= 22 && !badges.find(b => b.id === 'night_owl')) {
      const newBadge = {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Used the app after 10 PM',
        emoji: '🦉',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
      setEarnedBadges(badges);
    }
  };

  const checkWellnessWarriorAchievement = () => {
    const badges = userStorage.getItem('recharge_badges') || [];
    if (badges.find(b => b.id === 'wellness_warrior')) return;
    
    const today = new Date().toDateString();
    
    // Check if user used all features today
    const tasks = userStorage.getItem('recharge_tasks') || [];
    const moods = userStorage.getItem('recharge_moods') || [];
    const journal = userStorage.getItem('recharge_journal') || [];
    const voices = userStorage.getItem('recharge_voices') || [];
    
    const usedTasksToday = tasks.some(task => new Date(task.createdAt).toDateString() === today);
    const usedMoodsToday = moods.some(mood => new Date(mood.date).toDateString() === today);
    const usedJournalToday = journal.some(entry => new Date(entry.createdAt).toDateString() === today);
    const usedVoicestoday = voices.some(voice => new Date(voice.createdAt).toDateString() === today);
    
    if (usedTasksToday && usedMoodsToday && usedJournalToday && usedVoicestoday) {
      const newBadge = {
        id: 'wellness_warrior',
        name: 'Wellness Warrior',
        description: 'Used all features in one day',
        emoji: '⚔️',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
      setEarnedBadges(badges);
      
      // Show celebration
      import('./Confetti').then(({ showConfetti }) => {
        showConfetti();
      });
    }
  };

  const categories = ['All', ...new Set(allBadges.map(badge => badge.category))];
  
  const filteredBadges = selectedCategory === 'All' 
    ? allBadges 
    : allBadges.filter(badge => badge.category === selectedCategory);

  const getProgressForNextBadge = () => {
    const unearned = allBadges.filter(badge => 
      !earnedBadges.find(earned => earned.id === badge.id)
    );
    
    if (unearned.length === 0) return null;
    
    // Return the first unearned badge
    return unearned[0];
  };

  const nextBadge = getProgressForNextBadge();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Rewards & Achievements 🏆
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Track your progress and unlock badges as you build healthy habits.
        </p>
      </div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">Your Journey Progress</h3>
                <p className="text-purple-100">
                  {earnedBadges.length} of {allBadges.length} badges earned
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold mb-2">{Math.round(totalProgress)}%</div>
                <Trophy className="w-8 h-8 text-yellow-300 mx-auto" />
              </div>
            </div>
            <Progress 
              value={totalProgress} 
              className="h-3 bg-purple-400"
            />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats & Next Badge */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-500">{earnedBadges.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Badges Earned</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">{allBadges.length - earnedBadges.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Badges Left</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{Math.round(totalProgress)}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
              </div>
            </CardContent>
          </Card>

          {/* Next Badge */}
          {nextBadge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{nextBadge.emoji}</div>
                  <h3 className="font-bold mb-2">{nextBadge.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {nextBadge.description}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={`${categoryColors[nextBadge.category]} text-white text-xs`}
                  >
                    {nextBadge.category}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Category Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Badges Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedCategory === 'All' ? 'All Badges' : `${selectedCategory} Badges`}
            </h3>
            <Badge variant="outline">
              {filteredBadges.filter(badge => earnedBadges.find(earned => earned.id === badge.id)).length} / {filteredBadges.length}
            </Badge>
          </div>

          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBadges.map((badge, index) => {
                const isEarned = earnedBadges.find(earned => earned.id === badge.id);
                
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className={`h-full transition-all duration-300 ${
                      isEarned 
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 border-2 border-yellow-300 dark:border-yellow-600 shadow-lg' 
                        : 'opacity-60 hover:opacity-80 border-dashed'
                    }`}>
                      <CardContent className="p-6 text-center">
                        <div className={`text-6xl mb-4 ${isEarned ? '' : 'grayscale filter'}`}>
                          {badge.emoji}
                        </div>
                        
                        <div className="mb-3">
                          <Badge 
                            variant="secondary" 
                            className={`${categoryColors[badge.category]} text-white text-xs mb-2`}
                          >
                            {badge.category}
                          </Badge>
                        </div>
                        
                        <h3 className={`font-bold text-lg mb-2 ${isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                          {badge.name}
                        </h3>
                        
                        <p className={`text-sm mb-4 ${isEarned ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                          {badge.description}
                        </p>
                        
                        {isEarned ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center justify-center space-x-2"
                          >
                            <Award className="w-5 h-5 text-yellow-500" />
                            <Badge className="bg-green-500 text-white">
                              Unlocked!
                            </Badge>
                          </motion.div>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-300">
                            Locked
                          </Badge>
                        )}
                        
                        {isEarned && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(isEarned.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      </div>

      {/* Achievement Timeline */}
      {earnedBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnedBadges
                  .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
                  .slice(0, 5)
                  .map((badge, index) => {
                    const badgeInfo = allBadges.find(b => b.id === badge.id);
                    if (!badgeInfo) return null;
                    
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <span className="text-2xl">{badgeInfo.emoji}</span>
                        <div className="flex-1">
                          <p className="font-medium">{badgeInfo.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {badgeInfo.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="secondary" 
                            className={`${categoryColors[badgeInfo.category]} text-white text-xs mb-1`}
                          >
                            {badgeInfo.category}
                          </Badge>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(badge.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}