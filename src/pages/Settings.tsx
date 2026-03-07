import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Bell, ChevronRight, Database, Palette, Download, Upload, RefreshCw, Settings as SettingsIcon, Save, RotateCcw, FileJson, CheckCircle2, Trash2 } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';

const SETTINGS_KEY = 'coding-tracker-settings';

interface AppSettings {
  notifications: {
    dailyUpdates: boolean;
    weeklyReports: boolean;
    achievementAlerts: boolean;
    systemNotifications: boolean;
  };
  refreshInterval: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    dailyUpdates: true,
    weeklyReports: true,
    achievementAlerts: false,
    systemNotifications: true
  },
  refreshInterval: '30'
};

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* fallback */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Partial<AppSettings>) {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    const existing = stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, ...settings }));
  } catch {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
  }
}

const Settings: React.FC = () => {
  const { addToast } = useToast();
  const { data, hierarchy, refreshData } = useData();
  const { theme: appTheme, setTheme: setAppTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const saved = loadSettings();
    const changed = JSON.stringify(saved) !== JSON.stringify(settings);
    setHasChanges(changed);
  }, [settings]);

  const handleNotificationChange = (key: keyof AppSettings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
    }));
  };

  // ── Export: download all app data as JSON ──
  const handleExportData = () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        version: 'v1.2.0',
        memberCount: data.length,
        hierarchyKeys: hierarchy ? Object.keys(hierarchy) : [],
        data,
        hierarchy,
        settings
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coding-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Export Complete', message: `Exported ${data.length} records and hierarchy data as JSON.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Export Failed', message: 'Could not export data. Check console for details.' });
      console.error(err);
    }
  };

  // ── Import: read a JSON file and show summary ──
  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const recordCount = imported.data?.length || 0;
        const deptCount = imported.hierarchyKeys?.length || (imported.hierarchy ? Object.keys(imported.hierarchy).length : 0);

        // If the import contains settings, apply them
        if (imported.settings) {
          const { theme, ...restSettings } = imported.settings;
          setSettings({ ...DEFAULT_SETTINGS, ...restSettings });
          saveSettings({ ...DEFAULT_SETTINGS, ...restSettings });
          if (theme) setAppTheme(theme);
        }

        addToast({
          type: 'success',
          title: 'Import Successful',
          message: `Imported file contains ${recordCount} member records across ${deptCount} departments. Settings applied.`
        });
      } catch {
        addToast({ type: 'error', title: 'Import Failed', message: 'The selected file is not a valid JSON export.' });
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-selected
    e.target.value = '';
  };

  // ── Clear Cache ──
  const handleClearCache = () => {
    const settingsBackup = localStorage.getItem(SETTINGS_KEY);
    localStorage.clear();
    sessionStorage.clear();
    // Preserve settings
    if (settingsBackup) localStorage.setItem(SETTINGS_KEY, settingsBackup);
    addToast({ type: 'success', title: 'Cache Cleared', message: 'Browser cache cleared. Settings preserved. Refreshing data...' });
    refreshData();
  };

  // ── Refresh Data ──
  const handleRefreshData = () => {
    addToast({ type: 'info', title: 'Refreshing', message: 'Fetching latest data from Firebase...' });
    refreshData();
    setTimeout(() => {
      addToast({ type: 'success', title: 'Data Refreshed', message: 'All data has been re-fetched from the database.' });
    }, 2000);
  };

  // ── Save All Settings ──
  const handleSaveSettings = () => {
    saveSettings(settings);
    setHasChanges(false);
    addToast({ type: 'success', title: 'Settings Saved', message: 'All your preferences have been saved successfully.' });
  };

  // ── Reset to Defaults ──
  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
    addToast({ type: 'info', title: 'Settings Reset', message: 'All preferences have been reset to their default values.' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
      <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Hidden file input for import */}
      <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept=".json" className="hidden" />

      <nav className="flex items-center space-x-2 text-sm text-textMuted bg-surface/50 w-fit px-4 py-2 rounded-full border border-border">
        <Link to="/" className="hover:text-brand-400 transition-colors">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-textMain flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-400"></div> Settings
        </span>
      </nav>

      <div className="glass-card rounded-2xl p-8 relative overflow-hidden group border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-brand-500/10 opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-500/20 shadow-inner border border-slate-500/30">
              <SettingsIcon className="h-6 w-6 text-slate-400" />
            </div>
            Application Settings
          </h1>
          <p className="text-textMuted text-lg max-w-xl ml-14">Configure your Multi-Team Coding Tracker preferences, appearance, and data management options.</p>
        </div>
      </div>

      {/* ── Notifications ── */}
      <Card hover className="bg-gradient-to-br from-surface to-surface/90 border-t-amber-500/30">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-display flex items-center">
            <div className="p-2 rounded-lg bg-amber-500/10 mr-3">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-surface/50 border border-border/50 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleNotificationChange(key as keyof AppSettings['notifications'])}>
                <div>
                  <h3 className="font-semibold text-white capitalize group-hover:text-amber-400 transition-colors">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</h3>
                  <p className="text-sm text-textMuted mt-1">
                    {key === 'dailyUpdates' && 'Receive daily performance summaries'}
                    {key === 'weeklyReports' && 'Get weekly team performance reports'}
                    {key === 'achievementAlerts' && 'Notifications for new achievements'}
                    {key === 'systemNotifications' && 'System maintenance and updates'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNotificationChange(key as keyof AppSettings['notifications']); }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-surface ${value ? 'bg-amber-500' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1 shadow-sm'}`} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance ── */}
      <Card hover className="bg-gradient-to-br from-surface to-surface/90 border-t-purple-500/30">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-display flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/10 mr-3">
              <Palette className="h-5 w-5 text-purple-500" />
            </div>
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">Theme Preference</label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'auto'] as const).map((themeOption) => (
                  <button key={themeOption} onClick={() => setAppTheme(themeOption)} className={`p-4 text-sm font-semibold rounded-xl border transition-all capitalize flex flex-col items-center justify-center gap-2 ${appTheme === themeOption ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-inner' : 'bg-surface/50 text-textMuted border-border/50 hover:bg-white/5 hover:text-white'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 ${appTheme === themeOption ? 'border-purple-400 bg-purple-400' : 'border-textMuted bg-transparent'}`}></div>
                    {themeOption}
                  </button>
                ))}
              </div>
              <p className="text-sm text-textMuted mt-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Currently using <span className="text-white font-medium capitalize">{appTheme}</span> theme
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Data Management ── */}
      <Card hover className="bg-gradient-to-br from-surface to-surface/90 border-t-blue-500/30">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-display flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/10 mr-3">
              <Database className="h-5 w-5 text-blue-500" />
            </div>
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">Auto-Refresh Interval</label>
              <div className="relative">
                <select value={settings.refreshInterval} onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: e.target.value }))} className="w-full appearance-none px-4 py-3 bg-white/5 border border-border rounded-xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/30 text-white transition-all cursor-pointer font-medium">
                  <option value="15" className="bg-surface text-white">15 minutes</option>
                  <option value="30" className="bg-surface text-white">30 minutes</option>
                  <option value="60" className="bg-surface text-white">1 hour</option>
                  <option value="180" className="bg-surface text-white">3 hours</option>
                  <option value="0" className="bg-surface text-white">Disabled</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-textMuted">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">Data Operations</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button onClick={handleExportData} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:text-green-300 transition-all font-semibold text-sm">
                  <Download className="h-4 w-4" />Export Data
                </button>
                <button onClick={handleImportData} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300 transition-all font-semibold text-sm">
                  <Upload className="h-4 w-4" />Import Data
                </button>
                <button onClick={handleRefreshData} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 hover:text-brand-300 transition-all font-semibold text-sm">
                  <RefreshCw className="h-4 w-4" />Refresh Data
                </button>
                <button onClick={handleClearCache} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all font-semibold text-sm">
                  <Trash2 className="h-4 w-4" />Clear Cache
                </button>
              </div>
            </div>

            {/* Data Stats */}
            <div className="bg-surface/50 border border-border/50 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-3 flex items-center gap-2"><FileJson className="h-3.5 w-3.5" /> Current Data Summary</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{data?.length?.toLocaleString() || 0}</div>
                  <div className="text-[10px] text-textMuted uppercase tracking-wider">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{hierarchy ? Object.keys(hierarchy).length : 0}</div>
                  <div className="text-[10px] text-textMuted uppercase tracking-wider">Departments</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{new Set((data || []).map(d => d?.memberId).filter(Boolean)).size}</div>
                  <div className="text-[10px] text-textMuted uppercase tracking-wider">Unique Members</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── System Information ── */}
      <Card hover className="bg-gradient-to-br from-surface to-surface/90 border-t-green-500/30">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-display flex items-center">
            <div className="p-2 rounded-lg bg-green-500/10 mr-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface/50 border border-border/50 rounded-xl p-5 relative overflow-hidden">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Application</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-textMuted uppercase tracking-wider text-xs font-semibold">Version</span><span className="font-medium text-white bg-white/5 px-2 py-0.5 rounded border border-border/50">v1.2.0</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50"><span className="text-textMuted uppercase tracking-wider text-xs font-semibold">Build</span><span className="font-medium text-white">React + TypeScript</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50"><span className="text-textMuted uppercase tracking-wider text-xs font-semibold">Last Updated</span><span className="font-medium text-white">{new Date().toLocaleDateString()}</span></div>
              </div>
            </div>
            <div className="bg-surface/50 border border-border/50 rounded-xl p-5 relative overflow-hidden">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div> Backend</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-textMuted uppercase tracking-wider text-xs font-semibold">Database</span><span className="font-medium text-white">Firebase Firestore</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50"><span className="text-textMuted uppercase tracking-wider text-xs font-semibold">Hosting</span><span className="font-medium text-white flex items-center gap-1"><svg viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#ffffff" /></svg> Vercel</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50"><span className="text-textMuted uppercase tracking-wider text-xs font-semibold">Status</span><span className="text-green-400 font-semibold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div> Connected</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Save / Reset Footer ── */}
      <div className="flex items-center justify-between pt-4 pb-8 border-t border-border/50">
        <div>
          {hasChanges && (
            <span className="text-sm text-amber-400 flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div> You have unsaved changes
            </span>
          )}
        </div>
        <div className="flex space-x-3">
          <button onClick={handleResetDefaults} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-textMuted border border-border/50 hover:bg-white/10 hover:text-white transition-all font-semibold text-sm">
            <RotateCcw className="h-4 w-4" />Reset Defaults
          </button>
          <button onClick={handleSaveSettings} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${hasChanges ? 'bg-gradient-hero text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40' : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'}`}>
            <Save className="h-4 w-4" />Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
