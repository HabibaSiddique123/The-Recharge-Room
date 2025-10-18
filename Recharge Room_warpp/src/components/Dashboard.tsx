import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  Target, 
  BookOpen, 
  Mic, 
  TrendingUp, 
  Award,
  CheckCircle,
  Heart,
  Zap,
  Settings,
  Plus,
  Sparkles
} from 'lucide-react';

export function Dashboard({ user, onNavigate }) {
  const [greeting, setGreeting] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    journalEntries: 0,
    moodEntries: 0,
    voiceNotes: 0,
    currentStreak: 0,
    badges: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [customQuickActions, setCustomQuickActions] = useState([]);
  const [showCustomizeActions, setShowCustomizeActions] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    // Set personalized greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
      setTimeOfDay('morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
      setTimeOfDay('afternoon');
    } else if (hour < 21) {
      setGreeting('Good evening');
      setTimeOfDay('evening');
    } else {
      setGreeting('Good night');
      setTimeOfDay('night');
    }

    // Set motivational quote based on time
    const quotes = {
      morning: "Every sunrise is a new opportunity to recharge your soul ✨",
      afternoon: "Take a moment to breathe and appreciate how far you've come 🌸",
      evening: "Winding down is just as important as starting up 🌙",
      night: "Rest is not a reward for work completed, but a gift you give yourself 💫"
    };
    setMotivationalQuote(quotes[timeOfDay]);
  }, [timeOfDay]);

  useEffect(() => {
    // Set personalized greeting based on time and user
    const hour = new Date().getHours();
    const lastVisit = localStorage.getItem('recharge_last_visit');
    const today = new Date().toDateString();
    
    if (lastVisit && lastVisit !== today) {
      setIsReturningUser(true);
    }
    
    localStorage.setItem('recharge_last_visit', today);
    
    if (hour < 12) {
      setGreeting('Good morning');
      setTimeOfDay('morning');
      setWelcomeMessage(isReturningUser ? 'Ready to make today amazing?' : 'Let\'s start the day with positive energy!');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
      setTimeOfDay('afternoon');
      setWelcomeMessage(isReturningUser ? 'Hope your day is going well!' : 'Making great progress today!');
    } else if (hour < 21) {
      setGreeting('Good evening');
      setTimeOfDay('evening');
      setWelcomeMessage(isReturningUser ? 'Time to unwind and reflect' : 'Perfect time for some self-care');
    } else {
      setGreeting('Good night');
      setTimeOfDay('night');
      setWelcomeMessage(isReturningUser ? 'Winding down for the night?' : 'Late night reflection time');
    }
    
    // Load stats from localStorage (temporary fix)
    const tasks = JSON.parse(localStorage.getItem('recharge_tasks') || '[]');
    const journal = JSON.parse(localStorage.getItem('recharge_journal') || '[]');
    const moods = JSON.parse(localStorage.getItem('recharge_moods') || '[]');
    const voices = JSON.parse(localStorage.getItem('recharge_voices') || '[]');
    const badges = JSON.parse(localStorage.getItem('recharge_badges') || '[]');

    const completedTasks = tasks.filter(task => task.completed).length;
    
    setStats({
      totalTasks: tasks.length,
      completedTasks,
      journalEntries: journal.length,
      moodEntries: moods.length,
      voiceNotes: voices.length,
      currentStreak: calculateStreak(tasks),
      badges: badges.length
    });

    // Set recent activity
    const activity = [
      ...tasks.slice(-3).map(task => ({
        type: 'task',
        title: task.text,
        time: task.createdAt,
        icon: '✓',
        completed: task.completed
      })),
      ...moods.slice(-2).map(mood => ({
        type: 'mood',
        title: `Mood: ${mood.emoji}`,
        time: mood.date,
        icon: mood.emoji
      })),
      ...journal.slice(-2).map(entry => ({
        type: 'journal',
        title: entry.title || 'Journal Entry',
        time: entry.createdAt,
        icon: '📝'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
    
    setRecentActivity(activity);
    
    // Load custom quick actions
    const savedActions = JSON.parse(localStorage.getItem('recharge_quick_actions') || '[]');
    if (savedActions.length > 0) {
      setCustomQuickActions(savedActions);
    } else {
      // Set default quick actions
      setCustomQuickActions(['tasks', 'mood', 'journal', 'voice']);
    }
  }, []);

  const calculateStreak = (tasks) => {
    // Simple streak calculation based on consecutive days with completed tasks
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const todayTasks = tasks.filter(task => 
      new Date(task.createdAt).toDateString() === today && task.completed
    );
    const yesterdayTasks = tasks.filter(task => 
      new Date(task.createdAt).toDateString() === yesterday && task.completed
    );
    
    return (todayTasks.length > 0 ? 1 : 0) + (yesterdayTasks.length > 0 ? 1 : 0);
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  const quickActions = [
    { name: 'Add Task', icon: Target, color: 'bg-blue-500', page: 'tasks' },
    { name: 'Log Mood', icon: Heart, color: 'bg-pink-500', page: 'mood' },
    { name: 'Write Journal', icon: BookOpen, color: 'bg-green-500', page: 'journal' },
    { name: 'Voice Note', icon: Mic, color: 'bg-purple-500', page: 'voice' }
  ];

  return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Enhanced Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 relative overflow-hidden"
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-50 to-indigo-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 rounded-3xl -mx-4 -my-4" />
        
        {/* Floating Elements */}
        <div className="absolute top-0 right-0 opacity-20">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-6 h-6 text-purple-400"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 180, 360],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5
              }}
              style={{
                top: `${Math.random() * 100}px`,
                right: `${Math.random() * 200}px`
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
        
        <div className="relative z-10 p-6">
          <motion.div
            className="flex items-center gap-4 mb-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl"
              animate={{
                boxShadow: [
                  "0 10px 40px rgba(147, 51, 234, 0.3)",
                  "0 20px 60px rgba(147, 51, 234, 0.5)",
                  "0 10px 40px rgba(147, 51, 234, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {timeOfDay === 'morning' ? '🌅' : timeOfDay === 'afternoon' ? '☀️' : timeOfDay === 'evening' ? '🌆' : '🌙'}
              </motion.span>
            </motion.div>
            
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-indigo-700 dark:from-white dark:via-purple-200 dark:to-indigo-200 bg-clip-text text-transparent mb-2">
                  {greeting}, {user?.name || 'beautiful soul'}!
                  <motion.span
                    animate={{ rotate: [0, 20, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block ml-2"
                  >
                    👋
                  </motion.span>
                </h2>
                
                <motion.p
                  className="text-lg text-gray-600 dark:text-gray-300 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {greeting}! {welcomeMessage} ✨
                </motion.p>
                <motion.p
                  className="text-sm text-gray-500 dark:text-gray-400 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {motivationalQuote}
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Returning User Special Message */}
          {isReturningUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-200 dark:border-purple-700"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl"
                >
                  💜
                </motion.div>
                <p className="text-purple-700 dark:text-purple-300 font-medium">
                  Welcome back! We missed you. Ready to continue your wellness journey?
                </p>
              </div>
            </motion.div>
          )}
          
          {/* Quick Achievement Highlight */}
          {stats.currentStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-5 h-5" />
              </motion.div>
              <span className="font-semibold">
                Amazing! You're on a {stats.currentStreak}-day streak! 🔥
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                </div>
                <Target className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Completion Rate</p>
                  <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Current Streak</p>
                  <p className="text-2xl font-bold">{stats.currentStreak} days</p>
                </div>
                <Zap className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Badges Earned</p>
                  <p className="text-2xl font-bold">{stats.badges}</p>
                </div>
                <Award className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Quick Actions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomizeActions(!showCustomizeActions)}
                  className="text-purple-500 hover:text-purple-600"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.filter(action => customQuickActions.includes(action.page)).map((action, index) => (
                  <motion.div
                    key={action.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      className="h-16 sm:h-20 w-full flex flex-col items-center justify-center space-y-1 sm:space-y-2 hover:scale-105 transition-transform duration-200 p-2 sm:p-4"
                      onClick={() => onNavigate && onNavigate(action.page)}
                    >
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                        <action.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{action.name}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No activity yet. Start your wellness journey!
                </p>
              ) : (
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-lg">{activity.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.time).toLocaleDateString()}
                      </p>
                    </div>
                    {activity.completed && (
                      <Badge variant="secondary" className="text-xs">
                        Done
                      </Badge>
                    )}
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Your Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Task Completion</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-500">{stats.journalEntries}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Journal Entries</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-500">{stats.moodEntries}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mood Logs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-500">{stats.voiceNotes}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Voice Notes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{stats.badges}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}