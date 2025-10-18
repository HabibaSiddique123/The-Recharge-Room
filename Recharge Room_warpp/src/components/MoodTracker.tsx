import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar, TrendingUp, Quote } from 'lucide-react';
import { userStorage } from '../utils/userStorage';

const moodEmojis = [
  { emoji: '😢', label: 'Very Sad', value: 1, color: 'text-red-500' },
  { emoji: '😔', label: 'Sad', value: 2, color: 'text-orange-500' },
  { emoji: '😠', label: 'Angry', value: 3, color: 'text-red-600' },
  { emoji: '😐', label: 'Neutral', value: 4, color: 'text-yellow-500' },
  { emoji: '😊', label: 'Happy', value: 5, color: 'text-green-500' },
  { emoji: '😄', label: 'Very Happy', value: 6, color: 'text-blue-500' }
];

const moodSpecificQuotes = {
  1: [ // Very Sad
    "It's okay to not be okay. This feeling is temporary, and you will get through this.",
    "Even the darkest nights will end and the sun will rise again. You are not alone.",
    "Your pain is valid, but it doesn't define you. Tomorrow brings new possibilities.",
    "Be gentle with yourself. Healing takes time, and you're stronger than you know.",
    "This too shall pass. You've overcome challenges before, and you will again."
  ],
  2: [ // Sad
    "It's okay to have difficult days. Allow yourself to feel, then take one small step forward.",
    "You are not your thoughts or your current situation. Better days are coming.",
    "Sometimes we need to sit with sadness to appreciate joy. You're doing great.",
    "Every storm runs out of rain. This feeling will pass, and you will smile again.",
    "Be patient with yourself. Growth often happens in the quiet, difficult moments."
  ],
  3: [ // Angry
    "Your anger is valid, but don't let it control you. Take deep breaths and find your center.",
    "Channel this fire into positive action. Your passion can be your greatest strength.",
    "It's okay to feel angry. Acknowledge it, then choose how to respond with wisdom.",
    "Strong emotions show you care deeply. Use this energy to create positive change.",
    "You have the power to transform anger into motivation. You're stronger than this moment."
  ],
  4: [ // Neutral
    "Balance is not something you find, it's something you create. You're on the right track.",
    "Neutral is okay too. Not every day needs to be extraordinary to be valuable.",
    "You're doing well. Sometimes steady progress is the most important kind.",
    "Today is a clean slate. What small thing can you do to nurture yourself?",
    "Consistency beats perfection. You're building something beautiful, one day at a time."
  ],
  5: [ // Happy
    "Your happiness is contagious! Keep spreading that positive energy to the world.",
    "Celebrate this moment! You deserve all the joy you're feeling right now.",
    "Happiness looks good on you. Remember this feeling and carry it forward.",
    "You're glowing from the inside out. Your positive energy is making a difference.",
    "Joy is your natural state. You're exactly where you need to be right now."
  ],
  6: [ // Very Happy
    "You're absolutely radiant! This energy is your superpower - use it wisely.",
    "Your happiness is a gift to everyone around you. Keep shining bright!",
    "You're living proof that beautiful things happen to beautiful people. Stay amazing!",
    "This is your moment to soar! Your joy is inspiring and infectious.",
    "You're creating magic just by being yourself. Keep being wonderfully you!"
  ]
};

// Mood-based activities and boosters
const moodBoosters = {
  1: [ // Very Sad
    { activity: "Listen to calming music", emoji: "🎵", description: "Gentle melodies to soothe your mind" },
    { activity: "Practice deep breathing", emoji: "🫁", description: "5 minutes of mindful breathing" },
    { activity: "Reach out to a friend", emoji: "📞", description: "Connect with someone who cares" },
    { activity: "Write in your journal", emoji: "📝", description: "Express your feelings safely" }
  ],
  2: [ // Sad
    { activity: "Take a gentle walk", emoji: "🚶‍♀️", description: "Fresh air and movement" },
    { activity: "Watch something uplifting", emoji: "📺", description: "A funny video or inspiring content" },
    { activity: "Practice gratitude", emoji: "🙏", description: "List 3 things you're thankful for" },
    { activity: "Enjoy a warm drink", emoji: "☕", description: "Tea, coffee, or hot chocolate" }
  ],
  3: [ // Angry
    { activity: "Physical exercise", emoji: "🏃‍♂️", description: "Channel energy into movement" },
    { activity: "Progressive muscle relaxation", emoji: "💪", description: "Tense and release each muscle group" },
    { activity: "Creative expression", emoji: "🎨", description: "Draw, paint, or create something" },
    { activity: "Mindful meditation", emoji: "🧘", description: "10 minutes of guided meditation" }
  ],
  4: [ // Neutral
    { activity: "Set a small goal", emoji: "🎯", description: "Accomplish something meaningful" },
    { activity: "Learn something new", emoji: "📚", description: "Read an article or watch a tutorial" },
    { activity: "Organize your space", emoji: "🏠", description: "Tidy up for mental clarity" },
    { activity: "Practice a hobby", emoji: "🎲", description: "Engage in something you enjoy" }
  ],
  5: [ // Happy
    { activity: "Share your joy", emoji: "📤", description: "Tell someone about your good mood" },
    { activity: "Do something kind", emoji: "❤️", description: "Spread positivity to others" },
    { activity: "Capture the moment", emoji: "📸", description: "Journal or photo to remember this feeling" },
    { activity: "Plan something fun", emoji: "🎉", description: "Schedule an activity you love" }
  ],
  6: [ // Very Happy
    { activity: "Celebrate your success", emoji: "🎊", description: "Acknowledge what led to this joy" },
    { activity: "Express gratitude", emoji: "✨", description: "Thank someone who helped you today" },
    { activity: "Set a positive intention", emoji: "🌟", description: "Channel this energy toward goals" },
    { activity: "Inspire others", emoji: "🌈", description: "Share your positive energy" }
  ]
};

export function MoodTracker() {
  const [moods, setMoods] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [currentQuote, setCurrentQuote] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const [ambientMood, setAmbientMood] = useState(null);
  const [showMoodBooster, setShowMoodBooster] = useState(false);

  useEffect(() => {
    // Load moods from user-specific storage
    const savedMoods = userStorage.getItem('recharge_moods') || [];
    setMoods(savedMoods);
    
    // Set initial random quote from neutral mood
    const neutralQuotes = moodSpecificQuotes[4];
    const randomQuote = neutralQuotes[Math.floor(Math.random() * neutralQuotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  const saveMood = (moodData) => {
    const newMood = {
      ...moodData,
      date: new Date().toISOString(),
      id: Date.now()
    };
    
    const updatedMoods = [...moods, newMood];
    setMoods(updatedMoods);
    userStorage.setItem('recharge_moods', updatedMoods);
    
    // Check for achievement
    checkMoodAchievements(updatedMoods);
  };

  const checkMoodAchievements = (moodList) => {
    const badges = userStorage.getItem('recharge_badges') || [];
    
    // First mood badge
    if (moodList.length === 1 && !badges.find(b => b.id === 'first_mood')) {
      const newBadge = {
        id: 'first_mood',
        name: 'Mood Explorer',
        description: 'Logged your first mood',
        emoji: '🌟',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
      
      // Show celebration
      try {
        import('./Confetti').then(({ showConfetti }) => {
          showConfetti();
        });
      } catch (error) {
        console.error('Error loading confetti:', error);
      }
    }
    
    // Mood streak badge
    if (moodList.length >= 7 && !badges.find(b => b.id === 'mood_week')) {
      const newBadge = {
        id: 'mood_week',
        name: 'Mood Master',
        description: 'Logged moods for 7 days',
        emoji: '📈',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
    }
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    saveMood(mood);
    setAmbientMood(mood);
    
    // Update quote based on selected mood
    const moodQuotes = moodSpecificQuotes[mood.value];
    const randomQuote = moodQuotes[Math.floor(Math.random() * moodQuotes.length)];
    setCurrentQuote(randomQuote);
    
    // Show mood boosters for lower moods (1-3)
    if (mood.value <= 3) {
      setShowMoodBooster(true);
    }
    
    // Reset selection after animation but keep ambient effects
    setTimeout(() => {
      setSelectedMood(null);
      if (mood.value <= 3) {
        setTimeout(() => setShowMoodBooster(false), 10000); // Hide boosters after 10 seconds
      }
    }, 1000);
  };

  const exportToCSV = () => {
    const csvContent = [
      'Date,Mood,Value,Label',
      ...moods.map(mood => 
        `${new Date(mood.date).toLocaleDateString()},${mood.emoji},${mood.value},${mood.label}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mood-tracker-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    return moods
      .slice(-30) // Last 30 entries
      .map(mood => ({
        date: new Date(mood.date).toLocaleDateString(),
        mood: mood.value
      }));
  };

  const getAverageMood = () => {
    if (moods.length === 0) return 0;
    const sum = moods.reduce((acc, mood) => acc + mood.value, 0);
    return (sum / moods.length).toFixed(1);
  };

  const getMoodStreak = () => {
    // Calculate consecutive days with mood entries
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const hasMoodForDay = moods.some(mood => 
        new Date(mood.date).toDateString() === dateString
      );
      
      if (hasMoodForDay) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const getAmbientBackground = () => {
    if (!ambientMood) return '';
    switch (ambientMood.value) {
      case 1: return 'bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900';
      case 2: return 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900';
      case 3: return 'bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900 dark:to-orange-900';
      case 4: return 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-slate-800';
      case 5: return 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-900';
      case 6: return 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900 dark:to-orange-900';
      default: return '';
    }
  };

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 transition-all duration-1000 ${getAmbientBackground()}`}>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mood Tracker 😊
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          How are you feeling today? Track your emotional journey.
        </p>
      </div>

      {/* Motivational Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Quote className="w-8 h-8 text-purple-200 flex-shrink-0 mt-1" />
              <p className="text-lg italic">{currentQuote}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mood Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>How are you feeling right now?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-6">
                {moodEmojis.map((mood, index) => (
                  <motion.button
                    key={mood.value}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedMood?.value === mood.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">{mood.emoji}</div>
                    <div className={`text-sm font-medium ${mood.color}`}>
                      {mood.label}
                    </div>
                  </motion.button>
                ))}
              </div>
              
              <AnimatePresence>
                {selectedMood && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700"
                  >
                    <p className="text-green-700 dark:text-green-300">
                      Great! Your mood has been logged. Keep taking care of yourself! 🌟
                    </p>
                  </motion.div>
                )}
                
                {showMoodBooster && ambientMood && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 shadow-lg"
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        💝 Mood Boosters for You
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Here are some gentle activities that might help you feel better:
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {moodBoosters[ambientMood.value]?.slice(0, 4).map((booster, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors duration-200"
                        >
                          <div className="text-2xl">{booster.emoji}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {booster.activity}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {booster.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="text-center mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMoodBooster(false)}
                        className="text-purple-500 hover:text-purple-600"
                      >
                        Thanks, I'll try these! ✨
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-500">{moods.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Entries</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">{getAverageMood()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Mood</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{getMoodStreak()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                onClick={() => setShowGraph(!showGraph)}
                variant="outline"
                className="w-full"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {showGraph ? 'Hide' : 'Show'} Graph
              </Button>
              
              {moods.length > 0 && (
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mood History Graph */}
      <AnimatePresence>
        {showGraph && moods.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Mood History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[1, 6]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Moods */}
      {moods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Moods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moods
                  .slice(-6)
                  .reverse()
                  .map((mood, index) => (
                    <motion.div
                      key={mood.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{mood.emoji}</span>
                        <Badge variant="secondary" className="text-xs">
                          {mood.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(mood.date).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}