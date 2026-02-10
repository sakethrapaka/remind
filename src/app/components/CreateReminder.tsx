import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { format, addMinutes, differenceInMinutes, parseISO, parse, isValid } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlignLeft,
  Repeat,
  User,
  X,
  Check,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Task } from '@/app/types';
import { toast } from 'sonner';

interface CreateReminderProps {
  onCreateTask: (task: Task) => void;
  initialDate?: string;
  initialTime?: string; // Expects "HH:mm" from grid
  initialDuration?: number; // minutes
  onClose?: () => void;
  existingTask?: Task | null; // For editing mode if we merge content
}

// Generate 15-minute intervals for 24 hours in 12-hour format
const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const date = new Date();
      date.setHours(h);
      date.setMinutes(m);
      const value = format(date, 'HH:mm'); // Internal value
      const label = format(date, 'h:mm a'); // Display value
      options.push({ value, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function CreateReminder({
  onCreateTask,
  initialDate,
  initialTime,
  initialDuration = 30,
  onClose
}: CreateReminderProps) {

  // State
  const [title, setTitle] = useState('');

  // Date/Time Logic
  const [startDate, setStartDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(initialTime || format(new Date(), 'HH:00')); // Internal HH:mm

  const [endDate, setEndDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [endTime, setEndTime] = useState(() => {
    if (initialTime) {
      const start = new Date(`${initialDate || format(new Date(), 'yyyy-MM-dd')}T${initialTime}`);
      return format(addMinutes(start, initialDuration), 'HH:mm');
    }
    return format(addMinutes(new Date(), 30), 'HH:mm');
  });

  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [repeat, setRepeat] = useState('never');
  const [priority, setPriority] = useState('normal');
  const [isSpecial, setIsSpecial] = useState(false);

  // Calculate Duration to store
  const getDuration = () => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    return Math.max(0, differenceInMinutes(end, start));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Title is required');
      return;
    }

    // Metadata packing into description for persistence without backend changes
    // Format: "Real description... \n\n[Meta] Location: X | Duration: Y | AllDay: Z"
    const duration = getDuration();
    const metaData = JSON.stringify({
      location,
      duration,
      isAllDay,
      repeat,
      priority,
      isSpecial,
      specialType: isSpecial ? 'other' : undefined
    });

    // We append a hidden-ish string or just purely textual
    const finalDescription = `${description.trim()}\n\n<!-- metadata: ${metaData} -->`;

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description: finalDescription,
      date: startDate,
      time: startTime,
      category: 'work', // Default to work or simulate detection
      completed: false,
      createdAt: new Date().toISOString(),
      duration: duration,
      location: location,
      isAllDay: isAllDay
    };

    onCreateTask(newTask);
    toast.success('Event scheduled');
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white/60 dark:bg-black/60 backdrop-blur-3xl text-gray-900 dark:text-[#f5f5f5] rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-white/40 dark:border-white/10 bg-gradient-to-b from-white/40 to-white/10 dark:from-white/5 dark:to-transparent ring-1 ring-white/50 dark:ring-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-[#333]">
        <h2 className="text-xl font-semibold tracking-tight">New event</h2>
        <button onClick={onClose} className="p-1 hover:bg-[#333] rounded-md transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

        {/* Title Section */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Add title"
            className="w-full bg-transparent text-3xl font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none border-b border-transparent focus:border-[#e0b596] transition-colors pb-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Attendees (Simulated) */}
        <div className="flex items-center gap-3 text-gray-400">
          <User className="w-5 h-5" />
          <input
            type="text"
            placeholder="Add required attendees"
            className="bg-transparent w-full focus:outline-none text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
          />
        </div>

        {/* Date/Time Grid */}
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1 space-y-3">
              {/* Start */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-10">Start</span>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#292929] rounded px-3 py-1.5 border border-transparent hover:border-gray-300 dark:hover:border-[#444] transition-colors">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-sm focus:outline-none invert-calendar"
                  />
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-transparent text-sm focus:outline-none appearance-none ml-2 cursor-pointer w-[80px]"
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={`start-${opt.value}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-10">End</span>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#292929] rounded px-3 py-1.5 border border-transparent hover:border-gray-300 dark:hover:border-[#444] transition-colors">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-sm focus:outline-none invert-calendar"
                  />
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-transparent text-sm focus:outline-none appearance-none ml-2 cursor-pointer w-[80px]"
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={`end-${opt.value}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-[#292929] text-[#e0b596] focus:ring-[#e0b596]"
                />
                <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">All day</label>
              </div>

              {/* Add to Specials Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSpecial"
                  checked={isSpecial}
                  onChange={(e) => setIsSpecial(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-[#292929] text-[#e0b596] focus:ring-[#e0b596]"
                />
                <label htmlFor="isSpecial" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Add to Specials
                </label>
              </div>
            </div>
          </div>

          {/* Repeat */}
          <div className="flex items-center gap-4">
            <Repeat className="w-5 h-5 text-gray-400" />
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className="bg-transparent text-sm text-gray-900 dark:text-gray-200 focus:outline-none w-full border-b border-transparent focus:border-[#e0b596] py-1"
            >
              <option value="never">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Location */}
          <div className="flex items-center gap-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-transparent text-sm text-gray-900 dark:text-gray-200 focus:outline-none w-full border-b border-transparent focus:border-[#e0b596] py-1 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Description */}
          <div className="flex items-start gap-4 pt-2">
            <AlignLeft className="w-5 h-5 text-gray-400 mt-1" />
            <textarea
              placeholder="Type details for this new event"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-200 focus:outline-none min-h-[120px] resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/50 dark:border-[#333] flex justify-end gap-3 bg-gray-50/50 dark:bg-[#1f1f1f]">
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-[#333]"
        >
          Close
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-gradient-to-b from-[#e0b596]/90 to-[#c69472]/90 text-[#1f1f1f] px-8 py-2 rounded-xl shadow-[0_10px_20px_rgba(224,181,150,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_15px_30px_rgb(224,181,150,0.4)] hover:brightness-110 backdrop-blur-xl transition-all duration-300 ease-out border border-white/20 border-t-white/60 hover:scale-[1.05]"
        >
          Save
        </Button>
      </div>

      {/* Styles for inverted calendar icon in date input if needed */}
      <style>{`
        .invert-calendar::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.5;
            cursor: pointer;
        }
        .invert-calendar::-webkit-calendar-picker-indicator:hover {
            opacity: 1;
        }
        .dark .invert-calendar::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
