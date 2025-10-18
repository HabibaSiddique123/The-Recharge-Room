import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Settings, Database, Users, Shield, AlertTriangle, Save, RefreshCw } from 'lucide-react';

interface AdminSettings {
  app_name: string;
  app_description: string;
  allow_registration: boolean;
  require_email_verification: boolean;
  session_timeout: number;
  max_login_attempts: number;
  enable_mood_tracking: boolean;
  enable_journal: boolean;
  enable_voice_notes: boolean;
  enable_rewards: boolean;
  enable_task_management: boolean;
  backup_enabled: boolean;
  backup_frequency: string;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    app_name: 'Recharge Room',
    app_description: 'Your wellness companion for better mental health and productivity',
    allow_registration: true,
    require_email_verification: false,
    session_timeout: 30,
    max_login_attempts: 5,
    enable_mood_tracking: true,
    enable_journal: true,
    enable_voice_notes: true,
    enable_rewards: true,
    enable_task_management: true,
    backup_enabled: true,
    backup_frequency: 'daily'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleDatabaseBackup = async () => {
    setMessage({ type: 'info', text: 'Creating database backup...' });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Backup failed');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: `Backup created: ${data.backup_file}` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Database backup failed' });
    }
  };

  const handleClearCache = async () => {
    setMessage({ type: 'info', text: 'Clearing cache...' });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Cache clear failed');
      }

      setMessage({ type: 'success', text: 'Cache cleared successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear cache' });
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('This will reset all demo data. Are you sure?')) {
      return;
    }

    setMessage({ type: 'info', text: 'Resetting demo data...' });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reset-demo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Reset failed');
      }

      setMessage({ type: 'success', text: 'Demo data reset successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset demo data' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">Configure application settings and preferences</p>
        </div>
        <Button onClick={fetchSettings} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : message.type === 'success' ? 'default' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Application Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Application Settings
            </CardTitle>
            <CardDescription>Configure general application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="app_name">Application Name</Label>
              <Input
                id="app_name"
                value={settings.app_name}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="app_description">Application Description</Label>
              <Input
                id="app_description"
                value={settings.app_description}
                onChange={(e) => setSettings({ ...settings, app_description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow_registration">Allow User Registration</Label>
              <Switch
                id="allow_registration"
                checked={settings.allow_registration}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_registration: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="require_email_verification">Require Email Verification</Label>
              <Switch
                id="require_email_verification"
                checked={settings.require_email_verification}
                onCheckedChange={(checked) => setSettings({ ...settings, require_email_verification: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                value={settings.session_timeout}
                onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="max_login_attempts">Maximum Login Attempts</Label>
              <Input
                id="max_login_attempts"
                type="number"
                value={settings.max_login_attempts}
                onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Feature Settings
            </CardTitle>
            <CardDescription>Enable or disable application features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable_mood_tracking">Enable Mood Tracking</Label>
              <Switch
                id="enable_mood_tracking"
                checked={settings.enable_mood_tracking}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_mood_tracking: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable_journal">Enable Journal</Label>
              <Switch
                id="enable_journal"
                checked={settings.enable_journal}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_journal: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable_voice_notes">Enable Voice Notes</Label>
              <Switch
                id="enable_voice_notes"
                checked={settings.enable_voice_notes}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_voice_notes: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable_rewards">Enable Rewards System</Label>
              <Switch
                id="enable_rewards"
                checked={settings.enable_rewards}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_rewards: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable_task_management">Enable Task Management</Label>
              <Switch
                id="enable_task_management"
                checked={settings.enable_task_management}
                onCheckedChange={(checked) => setSettings({ ...settings, enable_task_management: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Maintenance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Maintenance
            </CardTitle>
            <CardDescription>Database and system maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Database Backup</Label>
                <p className="text-sm text-muted-foreground">Create a backup of the database</p>
              </div>
              <Button onClick={handleDatabaseBackup} variant="outline" size="sm">
                Create Backup
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Clear Cache</Label>
                <p className="text-sm text-muted-foreground">Clear application cache</p>
              </div>
              <Button onClick={handleClearCache} variant="outline" size="sm">
                Clear Cache
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-red-600">Reset Demo Data</Label>
                <p className="text-sm text-muted-foreground">Reset all demo data to default state</p>
              </div>
              <Button onClick={handleResetDemoData} variant="destructive" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reset Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;