import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  FileText,
  Palette
} from 'lucide-react';
import { userStorage } from '../utils/userStorage';

const journalThemes = [
  { id: 'plain', name: 'Plain', bgClass: 'bg-white dark:bg-gray-800', borderClass: 'border-gray-200 dark:border-gray-700', textClass: 'text-gray-900 dark:text-white' },
  { id: 'lined', name: 'Lined', bgClass: 'bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-gray-900', borderClass: 'border-blue-200 dark:border-blue-800', textClass: 'text-gray-900 dark:text-white' },
  { id: 'dark', name: 'Dark Mode', bgClass: 'bg-gray-900 text-white', borderClass: 'border-gray-600', textClass: 'text-white placeholder:text-gray-300' }
];

const templates = [
  {
    id: 'gratitude',
    name: 'Gratitude',
    emoji: '🙏',
    prompt: 'What are you grateful for today?',
    template: 'Today I am grateful for:\n1. \n2. \n3. \n\nHow these made me feel:'
  },
  {
    id: 'daily_wins',
    name: 'Daily Wins',
    emoji: '🎉',
    prompt: 'What did you accomplish today?',
    template: 'Today\'s accomplishments:\n• \n• \n• \n\nWhat I learned:\n\nTomorrow I will:'
  },
  {
    id: 'reflection',
    name: 'Daily Reflection',
    emoji: '🤔',
    prompt: 'How was your day?',
    template: 'Today was:\n\nHighlight of the day:\n\nChallenge I faced:\n\nHow I grew:\n\nTomorrow I hope to:'
  },
  {
    id: 'freeform',
    name: 'Free Writing',
    emoji: '✍️',
    prompt: 'Write freely about anything',
    template: ''
  }
];

export function Journal() {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('plain');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rechargeMode, setRechargeMode] = useState(false);

  useEffect(() => {
    // Load entries from user-specific storage
    const savedEntries = userStorage.getItem('recharge_journal') || [];
    setEntries(savedEntries);
  }, []);

  const saveEntry = (entry) => {
    let updatedEntries;
    
    if (entry.id) {
      // Update existing entry
      updatedEntries = entries.map(e => 
        e.id === entry.id ? { ...entry, updatedAt: new Date().toISOString() } : e
      );
    } else {
      // Create new entry
      const newEntry = {
        ...entry,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        theme: selectedTheme
      };
      updatedEntries = [...entries, newEntry];
    }
    
    setEntries(updatedEntries);
    userStorage.setItem('recharge_journal', updatedEntries);
    
    // Check for achievements
    checkJournalAchievements(updatedEntries);
    
    setCurrentEntry(null);
    setShowEditor(false);
  };

  const checkJournalAchievements = (entriesList) => {
    const badges = userStorage.getItem('recharge_badges') || [];
    
    // First journal entry badge
    if (entriesList.length === 1 && !badges.find(b => b.id === 'first_journal')) {
      const newBadge = {
        id: 'first_journal',
        name: 'Journal Beginner',
        description: 'Wrote your first journal entry',
        emoji: '📖',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
      
      // Show celebration
      import('./Confetti').then(({ showConfetti }) => {
        showConfetti();
      });
    }
    
    // Weekly writer badge
    if (entriesList.length >= 7 && !badges.find(b => b.id === 'weekly_writer')) {
      const newBadge = {
        id: 'weekly_writer',
        name: 'Weekly Writer',
        description: 'Wrote 7 journal entries',
        emoji: '✍️',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
    }
  };

  const deleteEntry = (entryId) => {
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    setEntries(updatedEntries);
    userStorage.setItem('recharge_journal', updatedEntries);
  };

  const startNewEntry = (template = null) => {
    setCurrentEntry({
      title: '',
      content: template ? template.template : '',
      template: template?.id || 'freeform'
    });
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const editEntry = (entry) => {
    setCurrentEntry(entry);
    setShowEditor(true);
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getThemeClasses = (theme) => {
    const themeObj = journalThemes.find(t => t.id === theme) || journalThemes[0];
    return `${themeObj.bgClass} ${themeObj.borderClass} ${themeObj.textClass || ''}`;
  };

  if (showEditor) {
    return <JournalEditor 
      entry={currentEntry}
      onSave={saveEntry}
      onCancel={() => {
        setShowEditor(false);
        setCurrentEntry(null);
        setSelectedTemplate(null);
      }}
      theme={selectedTheme}
      onThemeChange={setSelectedTheme}
      template={selectedTemplate}
    />;
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${
      rechargeMode ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 rounded-3xl my-4 shadow-2xl' : ''
    }`}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Journal 📝
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Capture your thoughts, reflect on your journey, and track your growth.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={rechargeMode ? "default" : "outline"}
            size="sm"
            onClick={() => setRechargeMode(!rechargeMode)}
            className={`${rechargeMode ? 'bg-purple-500 hover:bg-purple-600' : ''} transition-all duration-300`}
          >
            <Palette className="w-4 h-4 mr-2" />
            Recharge Mode
          </Button>
        </div>
      </div>

      {/* Templates Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-500" />
              Start Writing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((template, index) => (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startNewEntry(template)}
                  className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 transition-all duration-200 text-left"
                >
                  <div className="text-3xl mb-2">{template.emoji}</div>
                  <h3 className="font-medium mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {template.prompt}
                  </p>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search your journal entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => startNewEntry()}
          className="bg-purple-500 hover:bg-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Journal Entries */}
      <AnimatePresence>
        {filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
              {searchTerm ? 'No entries found' : 'Your journal is empty'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Start writing to capture your thoughts and experiences'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => startNewEntry()}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Write Your First Entry
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <Card className={`h-full ${getThemeClasses(entry.theme)} hover:shadow-lg transition-all duration-200`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg mb-1 line-clamp-1">
                            {entry.title || 'Untitled Entry'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {templates.find(t => t.id === entry.template)?.name || 'Free Writing'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-4 mb-4">
                        {entry.content || 'No content'}
                      </p>
                      
                      <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editEntry(entry)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function JournalEditor({ entry, onSave, onCancel, theme, onThemeChange, template }) {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    
    onSave({
      ...entry,
      title: title.trim() || `Entry - ${new Date().toLocaleDateString()}`,
      content: content.trim(),
      template: template?.id || entry?.template || 'freeform'
    });
  };

  const themeClasses = journalThemes.find(t => t.id === theme) || journalThemes[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {entry?.id ? 'Edit Entry' : 'New Journal Entry'}
            </h2>
            {template && (
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {template.emoji} {template.name} - {template.prompt}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={theme} onValueChange={onThemeChange}>
              <SelectTrigger className="w-32">
                <Palette className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {journalThemes.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Editor */}
        <Card className={`${themeClasses.bgClass} ${themeClasses.borderClass} border-2`}>
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Entry title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`text-lg font-medium border-0 bg-transparent focus:ring-0 px-0 ${
                theme === 'dark' ? 'text-white placeholder:text-gray-300' : 'text-gray-900 dark:text-white placeholder:text-muted-foreground'
              }`}
            />
            
            <Textarea
              placeholder="Start writing your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`min-h-96 border-0 bg-transparent focus:ring-0 resize-none px-0 ${
                theme === 'lined' ? 'bg-[linear-gradient(transparent_24px,#e5e7eb_24px)] bg-[length:100%_25px] dark:bg-[linear-gradient(transparent_24px,#374151_24px)]' : ''
              } ${
                theme === 'dark' ? 'text-white placeholder:text-gray-300' : 'text-gray-900 dark:text-white placeholder:text-muted-foreground'
              }`}
              style={theme === 'lined' ? { lineHeight: '25px', paddingTop: '1px' } : {}}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!title.trim() && !content.trim()}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <FileText className="w-4 h-4 mr-2" />
              {entry?.id ? 'Update Entry' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}