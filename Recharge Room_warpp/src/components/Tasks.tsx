import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Plus, Trash2, Target, Trophy, Flame, CheckCircle } from 'lucide-react';
import { showConfetti } from './Confetti';
import { userStorage } from '../utils/userStorage';

const taskBadges = [
  { id: 'bronze', name: 'Bronze Achiever', emoji: '🥉', threshold: 5 },
  { id: 'silver', name: 'Silver Achiever', emoji: '🥈', threshold: 15 },
  { id: 'gold', name: 'Gold Achiever', emoji: '🥇', threshold: 30 },
  { id: 'fire', name: 'On Fire!', emoji: '🔥', threshold: 50 }
];

export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // Load tasks from user-specific storage
    const savedTasks = userStorage.getItem('recharge_tasks') || [];
    setTasks(savedTasks);
    setCompletedCount(savedTasks.filter(task => task.completed).length);
  }, []);

  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);
    userStorage.setItem('recharge_tasks', updatedTasks);
    setCompletedCount(updatedTasks.filter(task => task.completed).length);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    const updatedTasks = [...tasks, task];
    saveTasks(updatedTasks);
    setNewTask('');
    
    // Check for first task badge
    checkTaskAchievements(updatedTasks);
  };

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, completed: !task.completed };
        
        // Show confetti if task is being completed
        if (!task.completed && updatedTask.completed) {
          console.log('Task completed! Triggering confetti...');
          setTimeout(() => showConfetti(), 100);
        }
        
        return updatedTask;
      }
      return task;
    });
    
    saveTasks(updatedTasks);
    checkTaskAchievements(updatedTasks);
  };

  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  const clearAllTasks = () => {
    saveTasks([]);
  };

  const checkTaskAchievements = (taskList) => {
    const completedTasks = taskList.filter(task => task.completed).length;
    const badges = userStorage.getItem('recharge_badges') || [];
    
    // Check for task completion badges
    taskBadges.forEach(badge => {
      if (completedTasks >= badge.threshold && !badges.find(b => b.id === badge.id)) {
        const newBadge = {
          id: badge.id,
          name: badge.name,
          description: `Completed ${badge.threshold} tasks`,
          emoji: badge.emoji,
          unlockedAt: new Date().toISOString()
        };
        badges.push(newBadge);
        userStorage.setItem('recharge_badges', badges);
        
        // Show celebration for new badge
        console.log('New badge earned! Triggering confetti...');
        setTimeout(() => showConfetti(), 100);
      }
    });
    
    // First task badge
    if (taskList.length === 1 && !badges.find(b => b.id === 'first_task')) {
      const newBadge = {
        id: 'first_task',
        name: 'Task Starter',
        description: 'Added your first task',
        emoji: '🌟',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
    }
  };

  const getNextBadge = () => {
    const badges = userStorage.getItem('recharge_badges') || [];
    return taskBadges.find(badge => 
      completedCount < badge.threshold && !badges.find(b => b.id === badge.id)
    );
  };

  const completionRate = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const nextBadge = getNextBadge();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Task Manager ✅
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Stay organized and achieve your goals with rewards!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Task & Task List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add New Task */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Add New Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="What would you like to accomplish?"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  className="flex-1"
                />
                <Button onClick={addTask} className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Your Tasks ({tasks.length})
              </CardTitle>
              {tasks.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllTasks}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {tasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks yet. Add your first goal above!</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                          task.completed
                            ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        
                        <span className={`flex-1 ${
                          task.completed 
                            ? 'line-through text-gray-500 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {task.text}
                        </span>
                        
                        {task.completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-green-500"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </motion.div>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Progress */}
        <div className="space-y-6">
          {/* Progress Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-500" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-500">{completedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">{tasks.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completion Rate</span>
                  <span>{Math.round(completionRate)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
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
                  <div className="text-4xl mb-2">{nextBadge.emoji}</div>
                  <h3 className="font-bold mb-1">{nextBadge.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Complete {nextBadge.threshold} tasks to unlock
                  </p>
                  <div className="mb-2">
                    <Progress 
                      value={(completedCount / nextBadge.threshold) * 100} 
                      className="h-2"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {completedCount} / {nextBadge.threshold} tasks
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Current Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Earned Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {taskBadges.map(badge => {
                  const earned = completedCount >= badge.threshold;
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 rounded-lg text-center transition-all duration-200 ${
                        earned
                          ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 border-2 border-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                      }`}
                    >
                      <div className={`text-2xl mb-1 ${earned ? '' : 'grayscale'}`}>
                        {badge.emoji}
                      </div>
                      <p className="text-xs font-medium">{badge.name}</p>
                      {earned && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Unlocked!
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}