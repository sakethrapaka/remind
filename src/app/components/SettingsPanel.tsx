import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { X, User, Moon, Sun, Bell, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPanelProps {
  userEmail: string;
  onClose: () => void;
}

export function SettingsPanel({ userEmail, onClose }: SettingsPanelProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    // Check current theme
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    toast.success(`Theme changed to ${newDarkMode ? 'dark' : 'light'} mode`);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    toast.success(
      notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled'
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    window.location.reload();
  };

  const userInitials = userEmail
    .split('@')[0]
    .split(/[._]/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, x: 100 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.9, opacity: 0, x: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00AEEF] to-[#0A84FF] p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Settings</h2>
              <p className="opacity-90 text-sm">Manage your preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Profile Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 bg-gradient-to-br from-[#00AEEF] to-[#0A84FF]">
                  <AvatarFallback className="text-white text-xl font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {userEmail.split('@')[0]}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Appearance
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <Label className="font-medium text-gray-900 dark:text-white">
                      Dark Mode
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Toggle dark theme
                    </p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Notifications
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <Label className="font-medium text-gray-900 dark:text-white">
                      Push Notifications
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Get notified about upcoming tasks
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={toggleNotifications}
                />
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              About
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Version</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  1.0.0
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Last Updated
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Jan 2026
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
