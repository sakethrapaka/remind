import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { AlertTriangle } from 'lucide-react';



import {
  Bell,
  Home,
  MapPin,
  PlusCircle,
  Clock,
  CheckCircle,
  Pencil,
  ListTodo,
  Sparkles,
  Settings,
  X,
  Trash2,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { Task } from '@/app/types';
import { TaskDetails } from '@/app/components/TaskDetails';
import { SettingsPanel } from '@/app/components/SettingsPanel';
import { CreateReminder } from '@/app/components/CreateReminder';
import { NearbyLocations } from '@/app/components/NearbyLocations';
import { quickAddSuggestions } from '@/app/utils/mockData';
import { toast } from 'sonner';

interface DashboardProps {
  userEmail: string;
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onUpdateTask: (task: Task) => void; // ✅ ADD
}

type View = 'home' | 'create' | 'locations' | 'settings';
type SidebarView = 'pending' | 'completed' | 'quick-add';

export function Dashboard({
  userEmail,
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleComplete,
  onUpdateTask,
}: DashboardProps) {
  const [activeView, setActiveView] = useState<View>('home');
  const [sidebarView, setSidebarView] = useState<SidebarView>('pending');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [notifications, setNotifications] = useState<Task[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [quickAdds, setQuickAdds] = useState(quickAddSuggestions);




  const userName = userEmail.split('@')[0];
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good Morning'
      : currentHour < 18
      ? 'Good Afternoon'
      : 'Good Evening';

  // Sort tasks by date and time (earliest first)
  const sortTasksByTime = (tasksList: Task[]) => {
    return [...tasksList].sort((a, b) => {
      const timeA = new Date(a.date + ' ' + a.time).getTime();
      const timeB = new Date(b.date + ' ' + b.time).getTime();
      return timeA - timeB;
    });
  };


const getTaskDateTime = (task: Task) => {
  return new Date(`${task.date}T${task.time}`);
};
const now = new Date();

const upcomingTasks = sortTasksByTime(
  tasks.filter(task => {
    if (task.completed) return false;
    return getTaskDateTime(task) > now;
  })
);

const pendingTasks = sortTasksByTime(
  tasks.filter(task => {
    if (task.completed) return false;
    return getTaskDateTime(task) <= now;
  })
);

const completedTasks = sortTasksByTime(
  tasks.filter(task => task.completed)
);

const computeNotifications = () => {
  const now = new Date();

  return tasks.filter(task => {
    if (task.completed) return false;

    const taskTime = new Date(`${task.date}T${task.time}`);
    const notifyTime = task.notifyAt ? new Date(task.notifyAt) : null;

    return (
      (notifyTime && now >= notifyTime) ||
      now >= taskTime
    );
  });
};

useEffect(() => {
  const interval = setInterval(() => {
    const now = new Date();

    const dueNotifications = tasks.filter(task => {
      if (task.completed) return false;
      if (!task.notifyAt) return false;

      const notifyTime = new Date(task.notifyAt);

      // notify when time reached OR passed
      return notifyTime <= now;
    });

    setNotifications(dueNotifications);
  }, 60000); // every 1 min

  return () => clearInterval(interval);
}, [tasks]);



const handleQuickAdd = (suggestion: Task) => {
  // ✅ check ONLY upcoming reminders using sourceId
  const alreadyInUpcoming = pendingTasks.some(
    (task) => task.sourceId === suggestion.id
  );

  if (alreadyInUpcoming) {
    toast.error('Task already exists in upcoming reminders');
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  const newTask: Task = {
    ...suggestion,
    id: Date.now().toString(),   // unique instance id
    sourceId: suggestion.id,     // stable identity
    date: today,
    createdAt: new Date().toISOString(),
  };

  onAddTask(newTask);
  toast.success('Task added to upcoming reminders');
};
  const getSidebarTasks = () => {
    if (sidebarView === 'pending') return pendingTasks;
    if (sidebarView === 'completed') return completedTasks;
    return [];
  };

  const handleBack = () => {
    setActiveView('home');
  };

  const handleCreateTask = (task: Task) => {
    onAddTask(task);
    setActiveView('home');
  };


  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
        }}
        className={`
          fixed lg:relative
          w-72 h-full
          bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700 
          flex flex-col
          z-50
          transition-transform duration-300
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#00AEEF] to-[#0A84FF] hover:from-[#0099D6] hover:to-[#006EDC] rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">RemindMe</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                setSidebarView('pending');
                setShowSidebar(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                sidebarView === 'pending'
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-[#1159ea] dark:text-[#00A6C8]-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">Pending</span>
              <Badge variant="secondary" className="ml-auto">
                {pendingTasks.length}
              </Badge>
            </button>

            <button
              onClick={() => {
                setSidebarView('completed');
                setShowSidebar(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                sidebarView === 'completed'
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-[#1159ea] dark:text-[#00A6C8]-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Completed</span>
              <Badge variant="secondary" className="ml-auto">
                {completedTasks.length}
              </Badge>
            </button>
          </div>

          {/* Task List in Sidebar */}
          {sidebarView !== 'quick-add' && (
            <div className="p-4 pt-0 space-y-2">
              <AnimatePresence>
                {getSidebarTasks().map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`rounded-lg p-3 cursor-pointer hover:shadow border-l-4
  ${
    getTaskDateTime(task) <= now && !task.completed
      ? 'bg-orange-50 border-orange-500 dark:bg-orange-900/20'
      : 'bg-gray-50 border-transparent dark:bg-gray-700'
  }
`}

                   onClick={() => {
  if (!task.completed) {
    setSelectedTask(task);
    setShowSidebar(false);
  }
}}

                  >
  <div className="flex items-start gap-2">
  {/* ✅ MARK AS COMPLETED — ONLY FOR PENDING TASKS */}
{!task.completed && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onToggleComplete(task.id);
      toast.success('Task marked as completed');
    }}
    className="mt-0.5"
  >
    <CheckCircle className="w-5 h-5 text-green-500" />
  </button>
)}


  {/* Title & Date */}
  <div className="flex-1 min-w-0">
    <p
      className={`text-sm font-medium ${
        task.completed
          ? 'line-through text-gray-400'
          : 'text-gray-900 dark:text-white'
      }`}
    >
      {task.title}
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      {task.date} at {task.time}
    </p>
  </div>
{/* 🗑 DELETE ICON — FOR PENDING TASK */}
{!task.completed && (
  <button
    onClick={(e) => {
      e.stopPropagation();      // ⭐ prevents opening TaskDetails
      onDeleteTask(task.id);
      toast.success('Task deleted');
    }}
    className="ml-auto"
  >
    <Trash2 className="w-4 h-4 text-orange-500 hover:text-orange-600" />
  </button>
)}

  {/* 🗑 DELETE ICON — ONLY FOR COMPLETED */}
  {task.completed && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDeleteTask(task.id);
        toast.success('Completed task deleted');
      }}
      className="ml-auto"
    >
      <Trash2 className="w-4 h-4 text-grey-500" />
    </button>
  )}
</div>

                  </motion.div>
                ))}
              </AnimatePresence>
              {sidebarView === 'completed' && completedTasks.length > 0 && (
  <div className="p-4">
    <Button
      variant="destructive"
      className="w-full"
      onClick={() => {
        completedTasks.forEach((task) => onDeleteTask(task.id));
        toast.success('All completed tasks deleted');
      }}
    >
      Delete All Completed
    </Button>
  </div>
)}

              {getSidebarTasks().length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks here</p>
                </div>
              )}
            </div>
          )}

         

        </ScrollArea>

        {/* Settings Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setShowSettings(true);
              setShowSidebar(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu for Mobile */}
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Back Button */}
              {activeView !== 'home' && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              )}

              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {activeView === 'home' && 'Dashboard'}
                {activeView === 'create' && 'Create Reminder'}
                {activeView === 'locations' && 'Nearby Locations'}
                {activeView === 'settings' && 'Settings'}
              </h1>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="space-y-2">
  {notifications.map((task) => (
  <div
    key={task.id}
    className="
      p-3 rounded-lg flex justify-between items-center gap-3
      bg-red-50 dark:bg-red-900/20
      border-l-4 border-red-500
    "
  >
    {/* LEFT SIDE */}
    <div className="flex items-start gap-2">
      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />

      <div>
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          {task.title}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Due on {task.date} at {task.time}
        </p>
      </div>
    </div>

    {/* RIGHT SIDE ACTION */}
    <button
      onClick={() => {
        onToggleComplete(task.id);
        toast.success('Task marked as completed');
        setNotifications(prev =>
          prev.filter(t => t.id !== task.id)
        );
      }}
      className="shrink-0"
    >
      <CheckCircle className="w-6 h-6 text-green-500" />
    </button>
  </div>
))}

</div>

                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No new notifications
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 lg:p-6">
            {activeView === 'home' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Greeting */}
                <div className="bg-gradient-to-r from-[#00AEEF] to-[#0A84FF] hover:from-[#0099D6] hover:to-[#006EDC] rounded-2xl p-6 text-white">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                    {greeting}, {userName}! 👋
                  </h2>
                  <p className="opacity-90">
                    You have {pendingTasks.length} pending tasks
                  </p>
                </div>

             {/* Upcoming Reminders */}
<div>
  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
    Upcoming Reminders
  </h3>

  <div className="grid gap-4">
    {upcomingTasks.length > 0 ? (
      upcomingTasks.map((task) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border flex items-center justify-between gap-4"
          onClick={() => setSelectedTask(task)}
        >
          {/* LEFT CONTENT */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                variant="secondary"
                className="bg-[#E6F9FC] text-[#00A6C8]"
              >
                {task.category}
              </Badge>
              <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                {task.date} at {task.time}
              </span>
            </div>

            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {task.title}
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            {/* Mark as Read */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(task.id);
                toast.success('Task marked as completed');
              }}
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
            </button>

          

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
                toast.success('Task deleted');
              }}
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </motion.div>
      ))
    ) : (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <Clock className="w-16 h-16 mx-auto mb-3 opacity-50" />
        <p>No upcoming tasks</p>
        <p className="text-sm mt-2">
          Create a new reminder to get started
        </p>
      </div>
    )}
  </div>
</div>

              </motion.div>
            )}

            {activeView === 'create' && <CreateReminder onCreateTask={handleCreateTask} />}
            {activeView === 'locations' && <NearbyLocations tasks={upcomingTasks} />}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <button
              onClick={() => setActiveView('home')}
              className={`flex flex-col items-center gap-1 px-3 lg:px-4 py-2 rounded-xl transition-all ${
                activeView === 'home'
                  ? 'text-[#1159ea] dark:text-[#00A6C8]-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Home className="w-5 h-5 lg:w-6 lg:h-6" />
              <span className="text-xs font-medium">Home</span>
            </button>

            <button
              onClick={() => setActiveView('create')}
              className="relative -mt-6"
            >
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#00AEEF] to-[#0A84FF] hover:from-[#0099D6] hover:to-[#006EDC] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <PlusCircle className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
            </button>

            <button
              onClick={() => setActiveView('locations')}
              className={`flex flex-col items-center gap-1 px-3 lg:px-4 py-2 rounded-xl transition-all ${
                activeView === 'locations'
                  ? 'text-[#1159ea] dark:text-[#00A6C8]-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <MapPin className="w-5 h-5 lg:w-6 lg:h-6" />
              <span className="text-xs font-medium">Nearby</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
     <AnimatePresence>
  {selectedTask && (
    <TaskDetails
      task={selectedTask}
      onClose={() => setSelectedTask(null)}
      onToggleComplete={onToggleComplete}
      onDeleteTask={onDeleteTask}
      onUpdateTask={onUpdateTask}   // ✅ FIXED
    />
  )}
</AnimatePresence>



      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            userEmail={userEmail}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
