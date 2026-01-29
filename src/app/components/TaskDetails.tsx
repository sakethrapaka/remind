import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { X, Calendar, Clock, Tag, MapPin, Navigation } from 'lucide-react';
import { Task } from '@/app/types';
import { getNearbyLocations } from '@/app/utils/mockData';
import { useState } from 'react';
import { toast } from 'sonner';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (task: Task) => void; // ✅ ADD THIS
}



export function TaskDetails({
  task,
  onClose,
  onToggleComplete,
  onDeleteTask,
  onUpdateTask,
}: TaskDetailsProps) {

  // ✅ ADD HERE (JUST BELOW FUNCTION START)
  const [isEditing, setIsEditing] = useState(false);

  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description ? task.description.replace(/<!-- metadata: .+ -->/, '').trim() : '',
    date: task.date,
    time: task.time,
  });

  const nearbyLocations = getNearbyLocations(task.category);

  // Helper to parse metadata
  const parsedMetadata = (() => {
    const desc = task.description || '';
    const match = desc.match(/<!-- metadata: (.+) -->/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        return null;
      }
    }
    return null;
  })();

  // Clean description without metadata
  const cleanDescription = task.description ? task.description.replace(/<!-- metadata: .+ -->/, '').trim() : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.3)] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden bg-gradient-to-b from-white/40 to-white/10 dark:from-white/5 dark:to-transparent ring-1 ring-white/50 dark:ring-white/10"
      >
        {/* Header - Professional Team Style */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-[#333]">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`
                  ${task.category === 'Work' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  task.category === 'Personal' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'} border-none px-2 py-0.5
                `}>
                {task.category}
              </Badge>
              {parsedMetadata?.priority && (
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">{parsedMetadata.priority} Priority</span>
              )}
            </div>

            {isEditing ? (
              <input
                autoFocus
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="text-2xl font-bold bg-transparent border-b border-[#e0b596] text-gray-900 dark:text-white w-full focus:outline-none placeholder-gray-400"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{task.title}</h2>
            )}

            <div className="mt-2 text-gray-600 dark:text-gray-300">
              {isEditing ? (
                <textarea
                  value={editedTask.description} // Correctly bind to local state
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#292929] rounded p-2 text-sm focus:outline-none resize-none h-20"
                  placeholder="Description"
                />
              ) : (
                <p className="whitespace-pre-wrap">{cleanDescription || "No description provided."}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#292929] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-[#25252b] rounded-lg border border-gray-100 dark:border-[#333]">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Date</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={editedTask.date}
                  onChange={e => setEditedTask({ ...editedTask, date: e.target.value })}
                  className="bg-transparent text-sm font-semibold w-full text-gray-900 dark:text-white"
                />
              ) : (
                <div className="font-semibold text-gray-900 dark:text-white">{task.date}</div>
              )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-[#25252b] rounded-lg border border-gray-100 dark:border-[#333]">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Time</span>
              </div>
              {isEditing ? (
                <input
                  type="time"
                  value={editedTask.time}
                  onChange={e => setEditedTask({ ...editedTask, time: e.target.value })}
                  className="bg-transparent text-sm font-semibold w-full text-gray-900 dark:text-white"
                />
              ) : (
                <div className="font-semibold text-gray-900 dark:text-white">{task.time}</div>
              )}
            </div>

            {parsedMetadata?.duration && (
              <div className="p-3 bg-gray-50 dark:bg-[#25252b] rounded-lg border border-gray-100 dark:border-[#333]">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Duration</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">{parsedMetadata.duration}m</div>
              </div>
            )}

            {parsedMetadata?.location && (
              <div className="p-3 bg-gray-50 dark:bg-[#25252b] rounded-lg border border-gray-100 dark:border-[#333]">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Location</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white truncate" title={parsedMetadata.location}>
                  {parsedMetadata.location}
                </div>
              </div>
            )}
          </div>

          {/* Nearby Locations */}
          {nearbyLocations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-[#333]">
                <MapPin className="w-5 h-5 text-[#e0b596]" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                  Nearby Recommendations
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {nearbyLocations.map((location) => (
                  <motion.div
                    key={location.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-white dark:bg-[#292929] rounded-xl border border-gray-200 dark:border-[#333] hover:border-[#e0b596] dark:hover:border-[#e0b596] transition-all group"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{location.name}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${location.isOpen ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900'}`}>
                          {location.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {location.distance}</span>
                        <span className="flex items-center gap-1 text-orange-400">★ {location.rating}</span>
                        <span className="truncate max-w-[200px]">{location.address}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-200 dark:border-[#444] bg-gradient-to-b from-[#e0b596]/90 to-[#c69472]/90 text-[#1f1f1f] shadow-[0_10px_20px_rgba(224,181,150,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/20 border-t-white/60 hover:brightness-110 hover:scale-[1.05] backdrop-blur-xl transition-all duration-300 rounded-xl"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps/search/${encodeURIComponent(location.name + ' ' + location.address)}`,
                          '_blank'
                        );
                      }}
                    >
                      <Navigation className="w-3.5 h-3.5 mr-2" />
                      Navigate
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-[#333] flex justify-end gap-3 bg-gray-50 dark:bg-[#1f1f1f]">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)} className="border-gray-300 dark:border-[#444] hover:bg-white dark:hover:bg-[#292929]">
                Edit Task
              </Button>
              <Button onClick={onClose} className="bg-gradient-to-b from-[#e0b596]/90 to-[#c69472]/90 text-[#1f1f1f] shadow-[0_10px_20px_rgba(224,181,150,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/20 border-t-white/60 hover:brightness-110 hover:scale-[1.05] backdrop-blur-xl transition-all duration-300 rounded-xl">
                Close
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={() => {
                const metaString = parsedMetadata ? `<!-- metadata: ${JSON.stringify(parsedMetadata)} -->` : '';
                const finalDesc = `${editedTask.description} ${metaString}`;

                onUpdateTask({
                  ...task,
                  title: editedTask.title,
                  description: finalDesc,
                  date: editedTask.date,
                  time: editedTask.time
                });
                toast.success('Task updated');
                setIsEditing(false);
                onClose();
              }} className="bg-gradient-to-b from-[#e0b596]/90 to-[#c69472]/90 text-[#1f1f1f] shadow-[0_10px_20px_rgba(224,181,150,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/20 border-t-white/60 hover:brightness-110 hover:scale-[1.05] backdrop-blur-xl transition-all duration-300 rounded-xl">
                Save Changes
              </Button>
            </>
          )}
        </div>

      </motion.div>
    </motion.div>
  );
}


