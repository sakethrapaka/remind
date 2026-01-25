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
    description: task.description,
    date: task.date,
    time: task.time,
  });

  const nearbyLocations = getNearbyLocations(task.category);

  return (
  
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00AEEF] to-[#0A84FF] p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className="bg-white/20 text-white mb-3">
                {task.category}
              </Badge>
              <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
              <p className="opacity-90">{task.description}</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Date and Time Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Date</span>
              </div>
              {isEditing ? (
  <div className="space-y-3">
    <input
      type="date"
      value={editedTask.date}
      onChange={(e) =>
        setEditedTask({ ...editedTask, date: e.target.value })
      }
      className="w-full p-2 border rounded-lg"
    />

    <input
      type="time"
      value={editedTask.time}
      onChange={(e) =>
        setEditedTask({ ...editedTask, time: e.target.value })
      }
      className="w-full p-2 border rounded-lg"
    />
  </div>
) : (
  <p className="text-sm text-gray-500">
    {task.date} at {task.time}
  </p>
)}

            </div>

           
          </div>

          {/* Nearby Locations */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nearby Locations
              </h3>
            </div>

            <div className="space-y-3">
              {nearbyLocations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {location.name}
                        </h4>
                        {location.isOpen ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Open
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Closed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {location.category}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {location.address}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                          {location.distance}
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < Math.floor(location.rating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {location.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-4"
                      onClick={() => {
                        // In a real app, this would open maps
                        window.open(
                          `https://www.google.com/maps/search/${encodeURIComponent(
                            location.name + ' ' + location.address
                          )}`,
                          '_blank'
                        );
                      }}
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Navigate
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

       {/* Footer */}
<div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">


  {/* Edit */}
  {!isEditing && (
    <Button onClick={() => setIsEditing(true)}>
      Edit
    </Button>
  )}

 {/* Save */}
{isEditing && (
  <Button
    onClick={() => {
      onUpdateTask({
        ...task,
        date: editedTask.date,
        time: editedTask.time,
      });
 toast.success('Task updated successfully'); 
      setIsEditing(false);                        // exit edit mode
      onClose();                                  // close task details
    }}
  >
    Save
  </Button>
)}


  {/* Delete */}
  <Button
    variant="destructive"
    onClick={() => onDeleteTask(task.id)}
  >
    Delete
  </Button>

  {/* Close */}
  <Button
    variant="secondary"
    onClick={onClose}
    className="ml-auto"
  >
    Close
  </Button>
</div>

      </motion.div>
    </motion.div>
  );
}


