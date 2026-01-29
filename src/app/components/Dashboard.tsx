import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isToday,
  differenceInMinutes,
  addMinutes,
  startOfDay,
  setHours,
  setMinutes,
  isSameDay,
  parseISO
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import {
  Home,
  MapPin,
  Plus,
  Settings,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Briefcase,
  User,
  Activity,
  Clock,
  Video,
  ChevronDown,
  Keyboard,
  Sun,
  Moon,
  CheckCircle
} from 'lucide-react';

import { Task } from '@/app/types';
import { TaskDetails } from '@/app/components/TaskDetails';
import { SettingsPanel } from '@/app/components/SettingsPanel';
import { CreateReminder } from '@/app/components/CreateReminder';
import { ProfileMenu } from '@/app/components/ProfileMenu';
import { NearbyLocations } from '@/app/components/NearbyLocations';
import { toast } from 'sonner';

interface DashboardProps {
  userEmail: string;
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onUpdateTask: (task: Task) => void;
}

type View = 'home' | 'locations' | 'settings' | 'pending' | 'completed';
type DragMode = 'none' | 'create' | 'move' | 'resize';

// Constants
const HOUR_HEIGHT = 60;
const GRID_START_HOUR = 0;
const COL_WIDTH_PERCENT = 100 / 7;
const SNAP_MINUTES = 15;

export function Dashboard({
  userEmail,
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleComplete,
  onUpdateTask,
}: DashboardProps) {
  const [activeView, setActiveView] = useState<View>('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);

  // Teams-like Interaction State
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<{ x: number, y: number, time: number, dayIndex: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number, time: number, dayIndex: number } | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null); // For move/resize

  // Create Modal State
  const [createModal, setCreateModal] = useState<{ isOpen: boolean; date?: string; time?: string; duration?: number }>({
    isOpen: false
  });

  // Derived Dates
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(startDate, i)), [startDate]);

  // --- Helpers ---

  const getMinutesFromY = (y: number) => {
    return Math.floor((y / HOUR_HEIGHT) * 60);
  };

  const getDayIndexFromX = (x: number, width: number) => {
    return Math.min(6, Math.max(0, Math.floor(x / (width / 7))));
  };

  const snapToGrid = (minutes: number) => {
    return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
  };

  // --- Interaction Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeView !== 'home' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60; // Offset for time column
    const y = e.clientY - rect.top + containerRef.current.scrollTop; // Adjust for scroll

    if (x < 0) return; // Clicked on time column

    const dayIndex = getDayIndexFromX(x, rect.width - 60);
    const time = getMinutesFromY(y);

    setDragStart({ x, y, time: snapToGrid(time), dayIndex });
    setDragCurrent({ x, y, time: snapToGrid(time), dayIndex });
    setDragMode('create');
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragMode === 'none' || !containerRef.current || !dragStart) return;

    // Auto scroll if near edges (simplified)
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    const x = e.clientX - rect.left - 60;

    const time = getMinutesFromY(y);
    const dayIndex = getDayIndexFromX(x, rect.width - 60);

    setDragCurrent({ x, y, time: snapToGrid(time), dayIndex });
  }, [dragMode, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (dragMode === 'create' && dragStart && dragCurrent) {
      // Calculate created range
      const startMin = Math.min(dragStart.time, dragCurrent.time);
      const endMin = Math.max(dragStart.time, dragCurrent.time);
      const duration = Math.max(SNAP_MINUTES, endMin - startMin + (dragStart.time === dragCurrent.time ? 30 : 0));

      const dayDate = addDays(startDate, dragStart.dayIndex);
      const dateStr = format(dayDate, 'yyyy-MM-dd');

      const hours = Math.floor(startMin / 60);
      const mins = startMin % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      setCreateModal({
        isOpen: true,
        date: dateStr,
        time: timeStr,
        duration: duration
      });
    } else if (dragMode === 'move' && activeTaskId && dragCurrent && dragStart) {
      // Finalize move
      const task = tasks.find(t => t.id === activeTaskId);
      if (task) {
        const timeDiff = dragCurrent.time - dragStart.time;
        const dayDiff = dragCurrent.dayIndex - dragStart.dayIndex;

        // Helper to parse "HH:mm"
        const [h, m] = task.time!.split(':').map(Number);
        const originalMins = h * 60 + m;
        let newMins = originalMins + timeDiff;
        // Clamp to 0-24h
        newMins = Math.max(0, Math.min(1440 - (task.duration || 60), newMins));

        // Calculate new date
        const originalDate = new Date(task.date);
        const newDate = addDays(originalDate, dayDiff);

        // Format
        const newH = Math.floor(newMins / 60);
        const newM = newMins % 60;
        const newTimeStr = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;

        if (task.date !== format(newDate, 'yyyy-MM-dd') || task.time !== newTimeStr) {
          onUpdateTask({ ...task, date: format(newDate, 'yyyy-MM-dd'), time: newTimeStr });
          toast.success('Event moved');
        }
      }
    } else if (dragMode === 'resize' && activeTaskId && dragCurrent && dragStart) {
      // Finalize resize
      const task = tasks.find(t => t.id === activeTaskId);
      if (task) {
        const endMins = dragCurrent.time;
        const [h, m] = task.time!.split(':').map(Number);
        const startMins = h * 60 + m;
        const newDuration = Math.max(15, endMins - startMins);

        if (task.duration !== newDuration) {
          onUpdateTask({ ...task, duration: newDuration });
          toast.success('Event resized');
        }
      }
    }

    setDragMode('none');
    setDragStart(null);
    setDragCurrent(null);
    setActiveTaskId(null);
  }, [dragMode, dragStart, dragCurrent, startDate, tasks, onUpdateTask]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    // Initialize theme on mount
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);


  // --- Event Layout Logic (Overlaps) ---
  const eventsForGrid = useMemo(() => {
    // 1. Filter only this week's events
    const weekStartStr = format(startDate, 'yyyy-MM-dd');
    const weekEndStr = format(addDays(startDate, 6), 'yyyy-MM-dd');

    // We need to group by Day first to handle day-local overlaps
    const eventsByDay: { [key: string]: any[] } = {};
    weekDays.forEach(d => eventsByDay[format(d, 'yyyy-MM-dd')] = []);

    tasks.forEach(task => {
      if (!task.completed && eventsByDay[task.date]) {
        eventsByDay[task.date].push(task);
      }
    });

    // 2. Process each day for visual attributes (top, height, left, width)
    const processedEvents: any[] = [];

    Object.keys(eventsByDay).forEach(dateKey => {
      const dayEvents = eventsByDay[dateKey];
      // Sort by start time
      dayEvents.sort((a, b) => {
        return a.time!.localeCompare(b.time!);
      });

      // Simple overlap algorithm:
      // Group colliding events
      // Map [start, end] in minutes
      const slots: any[] = dayEvents.map(e => {
        const [h, m] = e.time!.split(':').map(Number);
        const start = h * 60 + m;
        let duration = e.duration || 60;
        // Parse duration from description if missing in prop (legacy support)
        if (!e.duration && e.description?.includes('Duration:')) {
          // Try parse
          try {
            const match = e.description.match(/Duration: (\d+)/);
            if (match) duration = parseInt(match[1]);
          } catch (e) { }
        }

        return {
          ...e,
          start,
          end: start + duration,
          duration
        };
      });

      // Layout calc (Pack events)
      const columns: any[][] = [];
      slots.forEach(event => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          const lastEvent = col[col.length - 1];
          if (lastEvent.end <= event.start) {
            col.push(event);
            event.colIndex = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([event]);
          event.colIndex = columns.length - 1;
        }
      });

      const totalCols = columns.length;

      slots.forEach(event => {
        processedEvents.push({
          ...event,
          style: {
            top: (event.start / 60) * HOUR_HEIGHT,
            height: (event.duration / 60) * HOUR_HEIGHT,
            left: `${(event.colIndex / totalCols) * 100}%`,
            width: `${(1 / totalCols) * 100}%`,
            position: 'absolute'
          }
        });
      });
    });

    return processedEvents;
  }, [tasks, startDate, weekDays]);


  // User Name
  const [userName, setUserName] = useState(() => {
    const savedName = localStorage.getItem('userName');
    return savedName || userEmail.split('@')[0];
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 overflow-hidden font-sans selection:bg-[#e0b596]/30">

      {/* Sidebar - Teams Style */}
      <div className={`hidden lg:flex flex-col w-[68px] bg-white dark:bg-[#1b1b1b] border-r border-gray-200 dark:border-[#292929] items-center py-4 z-20`}>
        <div className="mb-6">
          <button
            onClick={() => setActiveView('home')}
            className="h-10 w-10 bg-gradient-to-b from-[#e0b596]/90 to-[#c69472]/90 text-[#1f1f1f] shadow-[0_10px_20px_rgba(224,181,150,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/20 border-t-white/60 hover:brightness-110 hover:scale-[1.05] backdrop-blur-xl transition-all duration-300 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <CalendarIcon className="w-5 h-5 text-[#1f1f1f]" />
          </button>
        </div>

        <nav className="flex-1 w-full flex flex-col items-center gap-4">
          <button onClick={() => setActiveView('home')} className={`group relative p-3 rounded-xl transition-all ${activeView === 'home' ? 'bg-gray-100 dark:bg-[#292929] text-[#e0b596]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#292929]/50'}`}>
            <Home className="w-6 h-6" />
            <span className="absolute left-14 bg-white dark:bg-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-200 dark:border-[#333] shadow-md z-50 text-gray-900 dark:text-gray-100">Calendar</span>
          </button>
          <button onClick={() => setCreateModal({ isOpen: true })} className="group relative p-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#292929]/50 transition-all">
            <Plus className="w-6 h-6" />
            <span className="absolute left-14 bg-white dark:bg-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 border border-gray-200 dark:border-[#333] shadow-md z-50 text-gray-900 dark:text-gray-100">New</span>
          </button>
          <button onClick={() => setActiveView('pending')} className={`group relative p-3 rounded-xl transition-all ${activeView === 'pending' ? 'bg-gray-100 dark:bg-[#292929] text-[#e0b596]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#292929]/50'}`}>
            <Clock className="w-6 h-6" />
            <span className="absolute left-14 bg-white dark:bg-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-200 dark:border-[#333] shadow-md z-50 text-gray-900 dark:text-gray-100">Pending</span>
          </button>

          <button onClick={() => setActiveView('completed')} className={`group relative p-3 rounded-xl transition-all ${activeView === 'completed' ? 'bg-gray-100 dark:bg-[#292929] text-[#e0b596]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#292929]/50'}`}>
            <CheckCircle className="w-6 h-6" />
            <span className="absolute left-14 bg-white dark:bg-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-200 dark:border-[#333] shadow-md z-50 text-gray-900 dark:text-gray-100">Completed</span>
          </button>

          <button onClick={() => setActiveView('locations')} className={`group relative p-3 rounded-xl transition-all ${activeView === 'locations' ? 'bg-gray-100 dark:bg-[#292929] text-[#e0b596]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#292929]/50'}`}>
            <MapPin className="w-6 h-6" />
          </button>

          <div className="w-8 h-[1px] bg-gray-200 dark:bg-[#292929] my-2"></div>

          <button onClick={toggleTheme} className="group relative p-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#292929]/50 transition-all">
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </nav>

        <div className="mt-auto">
          <button onClick={() => setShowSettings(true)} className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#1f1f1f]">

        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-[#292929] flex items-center justify-between px-6 bg-white dark:bg-[#1f1f1f]">
          <div className="flex items-center gap-6">
            <button className="lg:hidden text-gray-500 dark:text-gray-400" onClick={() => setShowSidebar(true)}>
              <Menu className="w-6 h-6" />
            </button>

            {/* Today Navigation Group */}
            <div className="flex items-center gap-4">
              {/* Today Button & Chevrons */}
              <div className="flex items-center bg-transparent">
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#292929] rounded-md transition-colors mr-2">
                  Today
                </button>
                <div className="flex items-center">
                  <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#292929] rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#292929] rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Month/Year Label with Popover Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowMiniCalendar(!showMiniCalendar)}
                  className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#292929] px-2 py-1 rounded transition-colors"
                >
                  {format(currentDate, 'MMMM yyyy')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMiniCalendar ? 'rotate-180' : ''}`} />
                </button>

                {/* Mini Calendar Popover */}
                {showMiniCalendar && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-[#292929] border border-gray-200 dark:border-[#333] rounded-lg shadow-2xl z-50">
                    <DayPicker
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => {
                        if (date) {
                          setCurrentDate(date);
                          setShowMiniCalendar(false);
                        }
                      }}
                      modifiers={{
                        today: new Date()
                      }}
                      modifiersStyles={{
                        today: { color: '#e0b596', fontWeight: 'bold' },
                        selected: { backgroundColor: '#e0b596', color: 'white' }
                      }}
                      styles={{
                        root: { color: theme === 'dark' ? '#f5f5f5' : '#1f2937', backgroundColor: theme === 'dark' ? '#292929' : '#ffffff' },
                        day: { color: theme === 'dark' ? '#e0e0e0' : '#374151' },
                        caption: { color: theme === 'dark' ? '#f5f5f5' : '#111827' }
                      }}
                      showOutsideDays
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Dropdown Placeholder */}
            <div className="hidden md:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#292929] px-3 py-1.5 rounded cursor-pointer">
              <span>Work week</span>
              <ChevronDown className="w-4 h-4" />
            </div>

            <div className="h-6 w-[1px] bg-gray-200 dark:bg-[#333] mx-2 hidden md:block"></div>

            {/* Meet Actions */}
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-b from-[#e0b596]/90 to-[#c69472]/90 text-[#1f1f1f] shadow-[0_10px_20px_rgba(224,181,150,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/20 border-t-white/60 hover:brightness-110 hover:scale-[1.05] backdrop-blur-xl transition-all duration-300 rounded-xl text-sm font-semibold"
                onClick={() => setCreateModal({ isOpen: true, duration: 30 })}
              >
                <Plus className="w-4 h-4" />
                <span>Add reminder</span>
              </button>
            </div>

            {/* Profile Button */}
            <button
              onClick={() => setShowProfileMenu(true)}
              className="h-10 w-10 rounded-full bg-gradient-to-br from-[#e0b596] to-[#dcb49a] flex items-center justify-center text-xs font-bold text-[#1f1f1f] border-2 border-white/50 dark:border-[#333] ml-2 shadow-lg hover:shadow-xl hover:scale-110 transition-all cursor-pointer ring-2 ring-transparent hover:ring-[#e0b596]/50"
            >
              {userName[0].toUpperCase()}
            </button>
          </div>
        </header>

        {/* Profile Menu Overlay */}
        <AnimatePresence>
          {showProfileMenu && (
            <ProfileMenu
              userEmail={userEmail}
              userName={userName}
              onClose={() => setShowProfileMenu(false)}
              onLogout={() => {
                localStorage.removeItem('user');
                window.location.reload();
              }}
            />
          )}
        </AnimatePresence>

        {/* Calendar Grid Area */}
        {activeView === 'home' ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Days Header */}
            <div className="grid grid-cols-[60px_1fr] border-b border-gray-200 dark:border-[#292929] bg-white dark:bg-[#1f1f1f]">
              <div className="border-r border-gray-200 dark:border-[#292929]"></div>
              <div className="grid grid-cols-7">
                {weekDays.map((date, i) => (
                  <div key={i} className={`py-2 text-center border-r border-gray-200 dark:border-[#292929] ${isToday(date) ? 'bg-indigo-50 dark:bg-[#25252b]' : ''}`}>
                    <p className={`text-[11px] font-medium uppercase tracking-wider mb-0.5 ${isToday(date) ? 'text-[#e0b596] dark:text-[#e0b596]' : 'text-gray-500'}`}>
                      {format(date, 'EEE')}
                    </p>
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full mx-auto ${isToday(date) ? 'bg-[#e0b596] text-[#1f1f1f]' : 'text-gray-500 dark:text-gray-300'}`}>
                      <span className="text-sm font-bold">{format(date, 'd')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Grid */}
            <div ref={containerRef} className="flex-1 bg-white dark:bg-[#1f1f1f] relative overflow-y-auto custom-scrollbar">
              <div
                className="grid grid-cols-[60px_1fr] h-[1440px] relative select-none"
                onMouseDown={handleMouseDown}
              >
                {/* Time Labels */}
                <div className="border-r border-gray-200 dark:border-[#292929] bg-white dark:bg-[#1f1f1f] z-10 sticky left-0 h-full w-[60px] pointer-events-none relative">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div
                      key={hour}
                      className="absolute w-full text-right pr-2 -translate-y-1/2"
                      style={{ top: hour * 60 }}
                    >
                      <span className="text-[11px] text-gray-500 block pt-1">
                        {format(setHours(startOfDay(new Date()), hour), 'h a')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day Columns BG */}
                <div className="grid grid-cols-7 relative h-full">
                  {/* Horizontal Grid lines */}
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <div key={`line-${hour}`} className="absolute w-full border-b border-gray-100 dark:border-[#292929] h-[60px]" style={{ top: hour * 60 }} />
                  ))}

                  {/* Vertical separators */}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={`col-${i}`} className="border-r border-gray-200 dark:border-[#292929] h-full pointer-events-none" />
                  ))}

                  {/* Current Time Indicator */}
                  {isSameDay(new Date(), currentDate) && (() => { // Simple check if current week roughly
                    // Actually need to check if today is in weekDays
                    const todayIndex = weekDays.findIndex(d => isSameDay(d, new Date()));
                    if (todayIndex !== -1) {
                      const now = new Date();
                      const minutes = now.getHours() * 60 + now.getMinutes();
                      const top = (minutes / 60) * HOUR_HEIGHT;
                      return (
                        <div
                          style={{ top }}
                          className="absolute w-full flex items-center z-40 pointer-events-none"
                        >
                          <div className="w-full h-[2px] bg-[#f06a6a] relative">
                            <div className="absolute -left-[60px] text-[10px] font-bold text-[#f06a6a] bg-white dark:bg-[#1f1f1f] px-1 -top-2">
                              {format(now, 'h:mm a')}
                            </div>
                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-[#f06a6a]" />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* --- EVENTS LAYOUT --- */}
                  <div className="absolute inset-0 pointer-events-none">
                    {weekDays.map((dayDate, dayIdx) => {
                      // Filter processed events for this day
                      // The processedEvents array has everything, we need to locate them
                      // We can just iterate processedEvents directly and render if matches date
                      return null;
                    })}
                  </div>

                  {/* Render All Events (absolute to grid container relative to cols not needed if we calculate left %) */}
                  <AnimatePresence>
                    {eventsForGrid.map((event) => {
                      // We need to shift 'left' based on Day Index
                      // event.style.left is relative to Day Column.
                      // Total width is 100%. Day width is 100/7 %.
                      // Absolute Left = (DayIndex * (100/7)) + (LocalLeft * (100/7))
                      const dayObj = parseISO(event.date); // or use differenceInDays
                      // Find which day column (0-6)
                      const colIdx = weekDays.findIndex(d => isSameDay(d, parseISO(event.date)));
                      if (colIdx === -1) return null; // Event not in this week view

                      const colWidth = 100 / 7;
                      const leftOffset = colIdx * colWidth;
                      const localLeft = parseFloat(event.style.left); // Percentage string
                      const localWidth = parseFloat(event.style.width);

                      const finalLeft = leftOffset + (localLeft * (colWidth / 100));
                      const finalWidth = localWidth * (colWidth / 100);

                      // Check if this event is being dragged (Ghost)
                      if (activeTaskId === event.id && (dragMode === 'move' || dragMode === 'resize')) return null;

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{
                            top: event.style.top,
                            height: event.style.height,
                            left: `${finalLeft}%`,
                            width: `${finalWidth}%`,
                            position: 'absolute'
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const [h, m] = event.time.split(':').map(Number);
                            const startMins = h * 60 + m;
                            setDragStart({ x: e.clientX, y: e.clientY, time: startMins, dayIndex: colIdx });
                            setDragCurrent({ x: e.clientX, y: e.clientY, time: startMins, dayIndex: colIdx });
                            setActiveTaskId(event.id);
                            setDragMode('move');
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (dragMode === 'none') setSelectedTask(event);
                          }}
                          className="pointer-events-auto z-10 group absolute rounded-[4px] px-2 py-1 cursor-pointer 
                                                       bg-[#e0b596]/20 dark:bg-[#e0b596]/30 border-l-[3px] border-[#e0b596] hover:bg-[#e0b596]/30 dark:hover:bg-[#e0b596]/40 hover:z-20
                                                       text-gray-700 dark:text-[#f0dccc] text-xs transition-colors overflow-hidden"
                        >
                          <div className="font-semibold leading-tight truncate">{event.title}</div>
                          <div className="text-[10px] opacity-80 truncate">
                            {event.time} - {format(addMinutes(parseISO(`${event.date}T${event.time}`), event.duration), 'HH:mm')}
                          </div>

                          {/* Resize Handle */}
                          <div
                            className="absolute bottom-0 left-0 w-full h-1.5 cursor-s-resize opacity-0 group-hover:opacity-100 bg-[#e0b596]/50"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const [h, m] = event.time.split(':').map(Number);
                              const startMins = h * 60 + m;
                              const endMins = startMins + event.duration;

                              setDragStart({ x: e.clientX, y: e.clientY, time: startMins, dayIndex: colIdx });
                              setDragCurrent({ x: e.clientX, y: e.clientY, time: endMins, dayIndex: colIdx }); // Dragging END time
                              setActiveTaskId(event.id);
                              setDragMode('resize');
                            }}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* --- DRAFT / GHOST EVENTS --- */}
                  {dragMode === 'create' && dragStart && dragCurrent && (
                    <div
                      className="absolute bg-[#e0b596]/30 border-2 border-[#e0b596] rounded z-20 pointer-events-none"
                      style={{
                        left: `${(dragStart.dayIndex / 7) * 100}%`,
                        width: `${100 / 7}%`,
                        top: Math.min(dragStart.y, dragCurrent.y) - 5, // Simple visual fix, roughly
                        // Better: calculate directly from time
                        // We have dragStart.time and dragCurrent.time in minutes
                      }}
                    >
                      {(() => {
                        const startMin = Math.min(dragStart.time, dragCurrent.time);
                        const endMin = Math.max(dragStart.time, dragCurrent.time);
                        // Ensure min height
                        const dur = Math.max(SNAP_MINUTES, endMin - startMin + (dragStart.time === dragCurrent.time ? 30 : 0));

                        return (
                          <div
                            style={{
                              position: 'absolute',
                              top: (startMin / 60) * HOUR_HEIGHT,
                              height: (dur / 60) * HOUR_HEIGHT,
                              left: 0,
                              right: 0
                            }}
                            className="bg-[#e0b596] opacity-50 rounded pl-2 pt-1 text-xs text-white"
                          >
                            {format(setMinutes(setHours(new Date(), 0), startMin), 'HH:mm')} - {format(setMinutes(setHours(new Date(), 0), startMin + dur), 'HH:mm')}
                            <div className="font-bold">(No title)</div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* --- DRAGGING GHOST (MOVE) --- */}
                  {(dragMode === 'move') && activeTaskId && dragCurrent && dragStart && (
                    <div
                      className="absolute bg-[#e0b596] opacity-80 rounded z-30 pointer-events-none shadow-xl pl-2 pt-1 text-xs text-white"
                      style={{
                        left: `${(dragCurrent.dayIndex / 7) * 100}%`,
                        width: `${100 / 7}%`,
                        top: (((dragCurrent.time - (dragStart.time % 60 ? 0 : 0)) / 60) * HOUR_HEIGHT), // simplified, really should use offset
                        // Let's rely on relative movement
                        // New Top = Original Top + (CurrentY - StartY)
                        // But we want snapping.
                        // Best is to use the Snap Calculation: 
                        // Start Time of dragged event = Original Start + (CurrentTime - StartDragTime)
                        // Wait, dragCurrent.time IS the current snapped time under cursor.
                        // So we need to calculate 'Offset from cursor to event start'
                        // Assume cursor grabbed middle? No, we handle top-left usually for simplicity or keep offset.
                      }}
                    >
                      {(() => {
                        const task = tasks.find(t => t.id === activeTaskId);
                        if (!task) return null;
                        const duration = task.duration || 60;
                        // Delta Time
                        const deltaMinutes = dragCurrent.time - dragStart.time;
                        const [h, m] = task.time!.split(':').map(Number);
                        const oldStart = h * 60 + m;
                        const newStart = oldStart + deltaMinutes;

                        return (
                          <div style={{
                            position: 'absolute',
                            top: (newStart / 60) * HOUR_HEIGHT,
                            height: (duration / 60) * HOUR_HEIGHT,
                            left: 0,
                            right: 0,
                            background: '#e0b596',
                            borderRadius: 4
                          }}>
                            <span className="font-bold p-1 block">{task.title}</span>
                            <span className="p-1">{format(setMinutes(setHours(new Date(), 0), newStart), 'HH:mm')}</span>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#1f1f1f]">
            {activeView === 'locations' && <NearbyLocations tasks={tasks.filter(t => !t.completed)} />}

            {(activeView === 'pending' || activeView === 'completed') && (
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3">
                  {activeView === 'pending' ? <Clock className="w-8 h-8 text-[#e0b596]" /> : <CheckCircle className="w-8 h-8 text-green-500" />}
                  {activeView} Tasks
                </h2>
                <div className="grid gap-4">
                  {tasks
                    .filter(t => activeView === 'pending' ? !t.completed : t.completed)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(task => (
                      <motion.div
                        layout
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-[#292929] p-4 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm flex items-center justify-between group"
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => onToggleComplete(task.id)}
                            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-400 hover:border-[#e0b596]'}`}
                          >
                            {task.completed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </button>
                          <div>
                            <h3 className={`font-semibold text-lg ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{task.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                              <CalendarIcon className="w-3.5 h-3.5" /> {task.date} at {task.time}
                              {task.duration && <span className="text-xs bg-gray-100 dark:bg-black/30 px-2 py-0.5 rounded ml-2">{task.duration}m</span>}
                            </p>
                            {task.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{task.description.replace(/<!-- metadata: .*? -->/g, '').trim()}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedTask(task)} className="p-2 text-gray-400 hover:text-[#e0b596] hover:bg-gray-100 dark:hover:bg-[#333] rounded-lg">
                            <Settings className="w-4 h-4" /> {/* Edit Icon placeholder really */}
                          </button>
                          <button onClick={() => onDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  {tasks.filter(t => activeView === 'pending' ? !t.completed : t.completed).length === 0 && (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                      <p className="text-lg">No {activeView} tasks found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Render Modals */}
      <AnimatePresence>
        {createModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl h-[80vh]">
              <CreateReminder
                onCreateTask={(t) => {
                  onAddTask(t);
                  setCreateModal({ isOpen: false });
                }}
                initialDate={createModal.date}
                initialTime={createModal.time}
                initialDuration={createModal.duration}
                onClose={() => setCreateModal({ isOpen: false })}
              />
            </motion.div>
          </div>
        )}

        {selectedTask && (
          <TaskDetails
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            // Pass handlers...
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
          />
        )}

        {showSettings && (
          <SettingsPanel
            userEmail={userEmail}
            onClose={() => setShowSettings(false)}
            onNameChange={setUserName}
            onNotificationChange={() => { }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
