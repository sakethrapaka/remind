import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Calendar, Clock, Mic, Tag } from 'lucide-react';
import { Task } from '@/app/types';
import { detectCategory } from '@/app/utils/mockData';
import { toast } from 'sonner';


interface CreateReminderProps {
  onCreateTask: (task: Task) => void;
}

export function CreateReminder({ onCreateTask }: CreateReminderProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [isListening, setIsListening] = useState(false);
  // 🔔 Reminder repeat & notification settings
const [repeatInterval, setRepeatInterval] = useState("once");

const [continuousNotify, setContinuousNotify] = useState(false);

const [notifyBefore, setNotifyBefore] = useState<number>(0);

  const handleVoiceInput = () => {
    // Mock voice input - in real app, would use Web Speech API
    setIsListening(true);
    toast.info('Voice input not available in this demo');
    setTimeout(() => setIsListening(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const detectedCategory = category || detectCategory(title + ' ' + description);
    const taskDateTime = new Date(`${date}T${time}`);

// example: notifyBefore = 5
const notifyBeforeMinutes = notifyBefore ?? 0;

const notifyAt = new Date(
  taskDateTime.getTime() - notifyBeforeMinutes * 60 * 1000
).toISOString();

    const newTask: Task = {

      id: Date.now().toString(),
      title,
      description,
      date,
      time,
      completed: false,
      category: detectedCategory,
      createdAt: new Date().toISOString(),
       notifyAt, 
       notifyBefore: notifyBeforeMinutes,
    };

    onCreateTask(newTask);
    
    // Show success toast with animation
    toast.success('Reminder created successfully! 🎉', {
      description: `${title} scheduled for ${date} at ${time}`,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setCategory('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Create New Reminder
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div>
            <Label htmlFor="title" className="text-base">
              Task Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Buy medicine"
              className="mt-2"
              required
            />
          </div>

          {/* Task Description with Voice Input */}
          <div>
            <Label htmlFor="description" className="text-base">
              Description
            </Label>
            <div className="relative mt-2">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about your task..."
                className="min-h-24 pr-12"
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Click the microphone icon for voice input
            </p>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="time" className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          {/* Category Detection */}
          <div>
            <Label htmlFor="category" className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </Label>
            <div className="mt-2">
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., medicine, groceries, medical (auto-detected if empty)"
              />
              {!category && (title || description) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1"
                >
                  <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  Auto-detected: {detectCategory(title + ' ' + description)}
                </motion.p>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for automatic detection based on task description
            </p>
          </div>

          {/* Quick Category Buttons */}
          <div>
            <Label className="text-base mb-2 block">Quick Categories</Label>
            <div className="flex flex-wrap gap-2">
              {['medicine', 'groceries', 'medical', 'fitness', 'general'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    category === cat
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>


{/* 🔁 Repeat Reminder */}
<div className="space-y-2">
  <Label>Repeat Reminder</Label>
  <select
    className="w-full border rounded-md p-2 bg-transparent"
    value={repeatInterval}
    onChange={(e) => setRepeatInterval(e.target.value)}
  >
    <option value="once">Once</option>
    <option value="daily">Daily</option>
    <option value="2days">Every 2 Days</option>
    <option value="weekly">Weekly</option>
  </select>
</div>

{/* ⏰ Notify Before */}
<div className="space-y-2">
  <Label>Notify Before</Label>
  <select
    className="w-full border rounded-md p-2 bg-transparent"
    value={notifyBefore}
    onChange={(e) => setNotifyBefore(e.target.value)}
  >
    <option value="5">5 minutes before</option>
    <option value="10">10 minutes before</option>
    <option value="30">30 minutes before</option>
    <option value="60">1 hour before</option>
  </select>
</div>

{/* 🔔 Continuous Notification */}
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={continuousNotify}
    onChange={(e) => setContinuousNotify(e.target.checked)}
  />
  <Label>Continuous notification until completed</Label>
</div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#00AEEF] to-[#0A84FF] hover:from-[#0099D6] hover:to-[#006EDC] text-white font-semibold"
          >
            Create Reminder
          </Button>
        </form>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800"
      >
        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
          💡 Smart Features
        </h3>
        <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
          <li>• Automatic category detection based on your task description</li>
          <li>• Find nearby locations for medicine, groceries, and more</li>
          <li>• Get notified before your task is due</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
