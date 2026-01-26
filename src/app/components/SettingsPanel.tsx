import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { X, User, Moon, Sun,Pencil,Check, Bell,Mail ,LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPanelProps {
  userEmail: string;
  onClose: () => void;
   onNameChange: (name: string) => void; 
    onNotificationChange: (value: boolean) => void; 
}

export function SettingsPanel({
  userEmail,
  onClose,
  onNameChange,
  onNotificationChange, 
}: SettingsPanelProps) {

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
  return localStorage.getItem('notifications') !== 'false';
});

 useEffect(() => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark');
    setIsDarkMode(true);
  }
}, []);


const [name, setName] = useState(
  localStorage.getItem('userName') || userEmail.split('@')[0]
);
const [editingName, setEditingName] = useState(false);
const [showSaveTick, setShowSaveTick] = useState(false);


const toggleTheme = () => {
  const newMode = !isDarkMode;
  setIsDarkMode(newMode);

  if (newMode) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
  toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} mode`);
};


const toggleNotifications = () => {
  const newValue = !notificationsEnabled;
  setNotificationsEnabled(newValue);
  localStorage.setItem('notifications', String(newValue));

  onNotificationChange(newValue); // 🔥 THIS IS THE KEY LINE

  toast.success(
    newValue ? 'Notifications enabled' : 'Notifications disabled'
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
      {/* Avatar */}
      <Avatar className="w-14 h-14 bg-gradient-to-br from-[#00AEEF] to-[#0A84FF]">
        <AvatarFallback className="text-white text-lg font-bold">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name + Email */}
      <div className="flex-1">
        <Label className="text-xs text-gray-500 dark:text-gray-400">
          Display Name
        </Label>

        {/* VIEW MODE */}
        {!editingName ? (
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-white">
              {name}
            </p>
            <button
              onClick={() => {
                setEditingName(true);
                setShowSaveTick(false);
              }}
              className="text-[#0A84FF] hover:opacity-80"
              title="Edit name"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* EDIT MODE */
          <div className="relative mt-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSaveTick(true);
              }}
              className="w-full rounded-lg border px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
            />

            {/* SAVE TICK */}
            {showSaveTick && (
              <button
                onClick={() => {
                  localStorage.setItem('userName', name);
                  onNameChange(name);
                  setEditingName(false);
                  setShowSaveTick(false);
                  toast.success('Name saved');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                title="Save"
              >
                <Check className="w-4 h-4 text-green-500 hover:text-green-600" />
              </button>
            )}
          </div>
        )}

        {/* Email below name */}
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Mail className="w-3.5 h-3.5" />
          <span>{userEmail}</span>
        </div>
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
                <Switch
  checked={isDarkMode}
  onCheckedChange={toggleTheme}
  className="bg-gray-300 data-[state=checked]:bg-[#0A84FF]"
/>


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
  className="bg-gray-300 data-[state=checked]:bg-[#0A84FF]"
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
