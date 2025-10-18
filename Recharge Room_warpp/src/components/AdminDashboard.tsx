import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, BarChart3, Settings, Shield, Trash2, Edit, UserX, Activity, TrendingUp, Calendar, Heart, Mic, Target, Award, Plus, Search, Filter, ChevronLeft, ChevronRight, PieChart, UserMinus, RefreshCw, Eye, EyeOff, CheckCircle, XCircle, Clock, Star, BookOpen, Music, Trophy, ArrowLeft, Download, Upload, UserCheck, UserCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import AdminSettings from './AdminSettings';
import { userStorage } from '../utils/userStorage';

interface User {
  id: number;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  name?: string;
  stats?: {
    total_tasks: number;
    completed_tasks: number;
    total_moods: number;
    total_journal_entries: number;
    total_voice_notes: number;
    unlocked_badges: number;
  };
}

interface Task {
  id: number;
  title: string;
  description: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  completed_at: string | null;
  created_at: string;
  user_id: number;
}

interface Mood {
  id: number;
  emoji: string;
  label: string;
  note: string;
  created_at: string;
  user_id: number;
}

interface Journal {
  id: number;
  title: string;
  content: string;
  theme: string;
  created_at: string;
  user_id: number;
}

interface VoiceNote {
  id: number;
  title: string;
  duration: number;
  transcript: string;
  file_path: string;
  created_at: string;
  user_id: number;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  earned_at?: string;
}

interface AdminStats {
  users: {
    total: number;
    admins: number;
    active: number;
  };
  tasks: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  content: {
    moods: number;
    journal_entries: number;
    voice_notes: number;
  };
  badges: {
    total: number;
    unlocked: number;
    unlock_rate: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'data' | 'export'>('overview');
  const [viewMode, setViewMode] = useState<'dashboard' | 'user_detail'>('dashboard');
  const [showUserData, setShowUserData] = useState(false);
  
  // User data states
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [userMoods, setUserMoods] = useState<Mood[]>([]);
  const [userJournals, setUserJournals] = useState<Journal[]>([]);
  const [userVoiceNotes, setUserVoiceNotes] = useState<VoiceNote[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // Calculate admin stats from local storage
  const fetchStats = () => {
    try {
      const allUsers = userStorage.getAllUsers();
      const currentUser = JSON.parse(localStorage.getItem('recharge_user') || '{}');
      
      // Calculate totals across all users
      let totalTasks = 0;
      let completedTasks = 0;
      let totalMoods = 0;
      let totalJournalEntries = 0;
      let totalVoiceNotes = 0;
      let totalBadges = 0;
      let unlockedBadges = 0;
      let adminCount = 0;
      
      allUsers.forEach(email => {
        // Temporarily get data for each user (this is a simplified approach)
        const userKey = (key: string) => `${key}_${email}`;
        
        try {
          const tasks = JSON.parse(localStorage.getItem(userKey('recharge_tasks')) || '[]');
          const moods = JSON.parse(localStorage.getItem(userKey('recharge_moods')) || '[]');
          const journals = JSON.parse(localStorage.getItem(userKey('recharge_journal')) || '[]');
          const voices = JSON.parse(localStorage.getItem(userKey('recharge_voices')) || '[]');
          const badges = JSON.parse(localStorage.getItem(userKey('recharge_badges')) || '[]');
          
          totalTasks += tasks.length;
          completedTasks += tasks.filter((t: any) => t.completed).length;
          totalMoods += moods.length;
          totalJournalEntries += journals.length;
          totalVoiceNotes += voices.length;
          unlockedBadges += badges.length;
          
          // Check if user is admin (simplified check)
          if (email === currentUser.email && currentUser.is_admin) {
            adminCount++;
          }
        } catch (e) {
          console.warn(`Could not load data for user: ${email}`);
        }
      });
      
      const stats: AdminStats = {
        users: {
          total: allUsers.length,
          admins: adminCount,
          active: allUsers.length // Assume all are active
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completion_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        },
        content: {
          moods: totalMoods,
          journal_entries: totalJournalEntries,
          voice_notes: totalVoiceNotes
        },
        badges: {
          total: 36, // Based on the allBadges array from Rewards component
          unlocked: unlockedBadges,
          unlock_rate: unlockedBadges > 0 ? (unlockedBadges / 36) * 100 : 0
        }
      };
      
      setStats(stats);
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  // Fetch user detailed data from local storage
  const fetchUserData = (user: User) => {
    setUserDataLoading(true);
    try {
      const userKey = (key: string) => `${key}_${user.email}`;
      
      // Get user data from localStorage with user-specific keys
      const tasks = JSON.parse(localStorage.getItem(userKey('recharge_tasks')) || '[]');
      const moods = JSON.parse(localStorage.getItem(userKey('recharge_moods')) || '[]');
      const journals = JSON.parse(localStorage.getItem(userKey('recharge_journal')) || '[]');
      const voices = JSON.parse(localStorage.getItem(userKey('recharge_voices')) || '[]');
      const badges = JSON.parse(localStorage.getItem(userKey('recharge_badges')) || '[]');
      
      console.log('Loading data for user:', user.email);
      console.log('Tasks found:', tasks.length);
      console.log('Moods found:', moods.length);
      console.log('Journals found:', journals.length);
      console.log('Voices found:', voices.length);
      console.log('Badges found:', badges.length);
      
      // Transform data to match expected format
      const transformedTasks = tasks.map((task: any, index: number) => ({
        id: task.id || index,
        title: task.text || task.title || 'Untitled Task',
        description: task.description || '',
        is_completed: task.completed || false,
        priority: 'medium' as 'medium',
        due_date: task.createdAt || new Date().toISOString(),
        completed_at: task.completed ? task.createdAt : null,
        created_at: task.createdAt || new Date().toISOString(),
        user_id: user.id
      }));
      
      const transformedMoods = moods.map((mood: any, index: number) => ({
        id: mood.id || index,
        emoji: mood.emoji || '😊',
        label: mood.label || 'Happy',
        note: mood.note || '',
        created_at: mood.date || mood.createdAt || new Date().toISOString(),
        user_id: user.id
      }));
      
      const transformedJournals = journals.map((journal: any, index: number) => ({
        id: journal.id || index,
        title: journal.title || 'Untitled Entry',
        content: journal.content || '',
        theme: journal.theme || 'plain',
        created_at: journal.createdAt || new Date().toISOString(),
        user_id: user.id
      }));
      
      const transformedVoices = voices.map((voice: any, index: number) => ({
        id: voice.id || index,
        title: voice.title || 'Untitled Voice Note',
        duration: voice.duration || 0,
        transcript: voice.transcript || '',
        file_path: voice.file_path || '',
        created_at: voice.createdAt || new Date().toISOString(),
        user_id: user.id
      }));
      
      const transformedBadges = badges.map((badge: any, index: number) => ({
        id: badge.id || index,
        name: badge.name || 'Unknown Badge',
        description: badge.description || '',
        icon: badge.emoji || badge.icon || '🏆',
        points: badge.points || 10,
        category: badge.category || 'General',
        earned_at: badge.unlockedAt || badge.earned_at || new Date().toISOString()
      }));
      
      setUserTasks(transformedTasks);
      setUserMoods(transformedMoods);
      setUserJournals(transformedJournals);
      setUserVoiceNotes(transformedVoices);
      setUserBadges(transformedBadges);
      
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setUserDataLoading(false);
    }
  };

  // These functions are now handled by fetchUserData

  // Fetch users from localStorage
  const fetchUsers = () => {
    try {
      const allUsers = userStorage.getAllUsers();
      const usersWithData = allUsers.map((email, index) => {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('recharge_user') || '{}');
        const isCurrentUser = userData.email === email;
        
        // Get user-specific data for stats calculation
        const userKey = (key: string) => `${key}_${email}`;
        const userTasks = JSON.parse(localStorage.getItem(userKey('recharge_tasks')) || '[]');
        const userMoods = JSON.parse(localStorage.getItem(userKey('recharge_moods')) || '[]');
        const userJournals = JSON.parse(localStorage.getItem(userKey('recharge_journal')) || '[]');
        const userVoices = JSON.parse(localStorage.getItem(userKey('recharge_voices')) || '[]');
        const userBadges = JSON.parse(localStorage.getItem(userKey('recharge_badges')) || '[]');
        
        return {
          id: index + 1,
          email: email,
          name: isCurrentUser ? userData.name || email.split('@')[0] : email.split('@')[0],
          is_admin: isCurrentUser ? userData.is_admin || false : false,
          is_active: true,
          created_at: new Date().toISOString(),
          stats: {
            total_tasks: userTasks.length,
            completed_tasks: userTasks.filter((t: any) => t.completed).length,
            total_moods: userMoods.length,
            total_journal_entries: userJournals.length,
            total_voice_notes: userVoices.length,
            unlocked_badges: userBadges.length,
          }
        };
      });
      
      // Filter users based on search term
      const filteredUsers = searchTerm 
        ? usersWithData.filter(user => 
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : usersWithData;
      
      setUsers(filteredUsers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [searchTerm]);

  // Working admin functions
  const clearUserData = (userEmail: string) => {
    const confirmClear = confirm(`Are you sure you want to clear all data for ${userEmail}? This action cannot be undone.`);
    if (!confirmClear) return;

    try {
      // Clear all user-specific data
      const dataKeys = [
        'recharge_tasks',
        'recharge_journal',
        'recharge_moods', 
        'recharge_voices',
        'recharge_badges',
        'recharge_voice_drafts'
      ];

      dataKeys.forEach(key => {
        localStorage.removeItem(`${key}_${userEmail}`);
      });

      alert(`Successfully cleared all data for ${userEmail}`);
      fetchUsers(); // Refresh user list
      fetchStats(); // Refresh stats
    } catch (error) {
      alert('Error clearing user data. Please try again.');
    }
  };

  const exportUserData = (user: User) => {
    try {
      const userKey = (key: string) => `${key}_${user.email}`;
      
      const userData = {
        user: {
          email: user.email,
          name: user.name,
          stats: user.stats
        },
        tasks: JSON.parse(localStorage.getItem(userKey('recharge_tasks')) || '[]'),
        moods: JSON.parse(localStorage.getItem(userKey('recharge_moods')) || '[]'),
        journal: JSON.parse(localStorage.getItem(userKey('recharge_journal')) || '[]'),
        voices: JSON.parse(localStorage.getItem(userKey('recharge_voices')) || '[]'),
        badges: JSON.parse(localStorage.getItem(userKey('recharge_badges')) || '[]')
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${user.email}_data_export.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert(`Data exported successfully for ${user.email}`);
    } catch (error) {
      alert('Error exporting user data. Please try again.');
    }
  };

  const exportAllData = () => {
    try {
      const allData = {
        users: users.map(user => ({
          email: user.email,
          name: user.name,
          is_admin: user.is_admin,
          stats: user.stats,
          created_at: user.created_at
        })),
        stats: stats,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recharge_room_admin_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert('Admin data exported successfully!');
    } catch (error) {
      alert('Error exporting admin data. Please try again.');
    }
  };

  const resetApplicationData = () => {
    const confirmReset = confirm('⚠️ WARNING: This will delete ALL application data for ALL users. This action cannot be undone. Are you absolutely sure?');
    if (!confirmReset) return;

    const doubleConfirm = confirm('This is your final warning. All user data, tasks, journals, moods, and voice notes will be permanently deleted. Continue?');
    if (!doubleConfirm) return;

    try {
      // Clear all localStorage data
      const allKeys = Object.keys(localStorage);
      const rechargeKeys = allKeys.filter(key => key.startsWith('recharge_'));
      
      rechargeKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      alert('All application data has been reset successfully. The page will refresh.');
      window.location.reload();
    } catch (error) {
      alert('Error resetting application data. Please try again.');
    }
  };

  // User detail view functions
  const openUserDetail = (user: User) => {
    setSelectedUser(user);
    setViewMode('user_detail');
    fetchUserData(user);
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      name: user.name || '',
      is_admin: user.is_admin,
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // User Detail Navigation Functions

  const closeUserDetail = () => {
    setSelectedUser(null);
    setViewMode('dashboard');
    setUserTasks([]);
    setUserMoods([]);
    setUserJournals([]);
    setUserVoiceNotes([]);
    setUserBadges([]);
  };


  // User Detail View Component
  const UserDetailView = () => {
    if (!selectedUser) return null;

    return (
      <div className="space-y-6">
        {/* User Detail Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={closeUserDetail}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedUser.name || selectedUser.email}</h1>
              <p className="text-muted-foreground">User ID: {selectedUser.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportUserData(selectedUser)}
              title="Export User Data"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => clearUserData(selectedUser.email)}
              title="Clear User Data"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </div>

        {/* User Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedUser.stats?.total_tasks || 0}</div>
              <p className="text-xs text-muted-foreground">
                {selectedUser.stats?.completed_tasks || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moods</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedUser.stats?.total_moods || 0}</div>
              <p className="text-xs text-muted-foreground">Entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Journals</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedUser.stats?.total_journal_entries || 0}</div>
              <p className="text-xs text-muted-foreground">Entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voice Notes</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedUser.stats?.total_voice_notes || 0}</div>
              <p className="text-xs text-muted-foreground">Recordings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedUser.stats?.unlocked_badges || 0}</div>
              <p className="text-xs text-muted-foreground">Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* User Data Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="moods">Moods</TabsTrigger>
            <TabsTrigger value="journals">Journals</TabsTrigger>
            <TabsTrigger value="voice">Voice Notes</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Tasks ({userTasks.length})</h3>
              <div className="grid gap-4">
                {userTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-4 h-4 rounded-full mt-1 ${task.is_completed ? 'bg-green-500' : 'border-2 border-gray-300'}`}></div>
                          <div className="flex-1">
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant={task.is_completed ? 'success' : 'secondary'}>
                                {task.is_completed ? 'Completed' : 'Pending'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Created: {new Date(task.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {userTasks.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No tasks found for this user</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="moods" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Moods ({userMoods.length})</h3>
              <div className="grid gap-4">
                {userMoods.map((mood) => (
                <Card key={mood.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{mood.emoji}</span>
                        <div className="flex-1">
                          <h4 className="font-medium">{mood.label}</h4>
                          <p className="text-sm text-muted-foreground">{mood.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(mood.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {userMoods.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No mood entries found for this user</p>
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="journals" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Journals ({userJournals.length})</h3>
              <div className="grid gap-4">
                {userJournals.map((journal) => (
                <Card key={journal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-2">{journal.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{journal.content}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{journal.theme}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(journal.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {userJournals.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No journal entries found for this user</p>
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Voice Notes ({userVoiceNotes.length})</h3>
              <div className="grid gap-4">
                {userVoiceNotes.map((voice) => (
                <Card key={voice.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{voice.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Duration: {Math.floor(voice.duration / 60)}:{(voice.duration % 60).toString().padStart(2, '0')}
                        </p>
                        {voice.transcript && (
                          <p className="text-sm mt-1">{voice.transcript}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(voice.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {userVoiceNotes.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No voice notes found for this user</p>
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Badges ({userBadges.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userBadges.map((badge) => (
                <Card key={badge.id} className={badge.earned_at ? 'border-green-500' : 'opacity-60'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <h4 className="font-medium">{badge.name}</h4>
                          <p className="text-sm text-muted-foreground">{badge.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{badge.category}</Badge>
                            <Badge variant="secondary">{badge.points} pts</Badge>
                          </div>
                          {badge.earned_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Earned: {new Date(badge.earned_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {userBadges.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No badges found for this user</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Show User Detail View if a user is selected */}
      {viewMode === 'user_detail' && <UserDetailView />}
      
      {/* Show Main Dashboard if no user is selected */}
      {viewMode === 'dashboard' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users and view system statistics</p>
            </div>
          </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-2"
        >
          <Activity className="h-4 w-4" />
          <span>Overview</span>
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
          className="flex items-center space-x-2"
        >
          <Users className="h-4 w-4" />
          <span>Users</span>
        </Button>
        <Button
          variant={activeTab === 'data' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('data')}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Data Management</span>
        </Button>
        <Button
          variant={activeTab === 'export' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('export')}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.users.admins} admins, {stats.users.active} active
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.tasks.completed} completed ({stats.tasks.completion_rate}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.content.moods + stats.content.journal_entries + stats.content.voice_notes}
                </div>
                <p className="text-xs text-muted-foreground">
                  Moods, journals, voice notes
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Badges</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.badges.unlocked}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.badges.unlock_rate}% unlock rate
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Overview</CardTitle>
                <CardDescription>View all registered users and their activity</CardDescription>
              </div>
              <Input
                type="search"
                placeholder="Search users..."
                className="w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.name || user.email}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                              {user.is_admin ? 'Admin' : 'User'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-blue-600">{user.stats?.total_tasks || 0}</div>
                              <div className="text-xs text-muted-foreground">Tasks</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-pink-600">{user.stats?.total_moods || 0}</div>
                              <div className="text-xs text-muted-foreground">Moods</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600">{user.stats?.total_journal_entries || 0}</div>
                              <div className="text-xs text-muted-foreground">Journals</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-purple-600">{user.stats?.total_voice_notes || 0}</div>
                              <div className="text-xs text-muted-foreground">Voice</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUserDetail(user)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportUserData(user)}
                            title="Export Data"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => clearUserData(user.email)}
                            title="Clear Data"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                  <p className="text-muted-foreground">No users have registered yet or match your search.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage application data and user information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Total Data Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Registered Users:</span>
                        <Badge>{users.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Tasks:</span>
                        <Badge variant="secondary">{stats?.tasks.total || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Journal Entries:</span>
                        <Badge variant="secondary">{stats?.content.journal_entries || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Mood Entries:</span>
                        <Badge variant="secondary">{stats?.content.moods || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Voice Notes:</span>
                        <Badge variant="secondary">{stats?.content.voice_notes || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Storage Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Storage Type:</span>
                        <Badge variant="outline">LocalStorage</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Format:</span>
                        <Badge variant="outline">JSON</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>User Isolation:</span>
                        <Badge variant="default">✓ Enabled</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mt-2">
                        Each user's data is stored separately and securely isolated.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                ⚠️ These actions cannot be undone. Please be very careful.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border-2 border-destructive/20 rounded-lg bg-destructive/5">
                  <h3 className="font-semibold text-destructive mb-2">Reset All Application Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete ALL user data, including tasks, journals, moods, voice notes, and user accounts. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={resetApplicationData}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Data (PERMANENT)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Export user data and administrative information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Data Export
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export individual user data including their tasks, journals, moods, and voice notes.
                    </p>
                    <div className="text-sm mb-4">
                      <strong>Available for:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {users.map((user) => (
                          <li key={user.id} className="flex justify-between items-center">
                            <span>{user.email}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => exportUserData(user)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Admin Data Export
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export administrative data including user statistics and system overview.
                    </p>
                    <div className="space-y-3">
                      <Button 
                        onClick={exportAllData}
                        className="w-full"
                        variant="default"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Admin Dashboard Data
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Includes: User list, statistics, and system information
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Export Information</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Exported files are in JSON format</p>
                    <p>• User data exports include all personal data for that specific user</p>
                    <p>• Admin exports include system-wide statistics and user overviews</p>
                    <p>• All exports are timestamped for your records</p>
                    <p>• Data is exported as-is from localStorage</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;