import React, { useState } from 'react';
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DailyTasksView: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [showDateRange, setShowDateRange] = useState(false);

  // Get the 7 days of the current week
  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get tasks for a specific date (including multi-day tasks that span this date)
  const getTasksForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return tasks.filter(task => {
      const taskStart = task.date;
      const taskEnd = task.endDate || task.date; // If no endDate, it's a single-day task
      
      // Check if the date falls within the task's date range
      return dateStr >= taskStart && dateStr <= taskEnd;
    });
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // Navigate to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Handle adding a new task
  const handleAddTask = async () => {
    if (!newTaskName.trim()) return;

    const targetDate = selectedDate || formatDate(new Date());
    const targetEndDate = showDateRange && selectedEndDate ? selectedEndDate : null;
    
    // Ensure end date is not before start date
    if (targetEndDate && targetEndDate < targetDate) {
      alert('End date cannot be before start date');
      return;
    }
    
    try {
      await addTask({
        name: newTaskName.trim(),
        date: targetDate,
        endDate: targetEndDate || undefined,
        category: 'General',
        priority: 'Normal',
        crew: '',
        notes: '',
        completed: false,
      });
      setNewTaskName('');
      setSelectedDate(null);
      setSelectedEndDate(null);
      setShowDateRange(false);
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  // Handle toggle complete
  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateTask(id, { completed: !completed });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Format day name
  const getDayName = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  // Format week range
  const getWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Planner</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Plan and organize your week</p>
        </div>
      </div>

      {/* Add Task Section */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Add a task..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple"
            />
            <button
              onClick={handleAddTask}
              className="bg-accent-purple text-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Calendar size={16} />
            <span>
              {showDateRange && selectedDate && selectedEndDate
                ? `${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(selectedEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : selectedDate
                ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : 'today'}
            </span>
            {(selectedDate || selectedEndDate) && (
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedEndDate(null);
                  setShowDateRange(false);
                }}
                className="ml-auto text-xs text-accent-purple hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Date Range Toggle */}
          <div className="mb-2">
            <button
              onClick={() => setShowDateRange(!showDateRange)}
              className="text-xs text-accent-purple hover:underline"
            >
              {showDateRange ? 'Single day task' : 'Multi-day task'}
            </button>
          </div>
          
          {!showDateRange ? (
            // Single day selection
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
              {weekDays.map((day) => {
                const dayDateStr = formatDate(day);
                const isSelected = selectedDate === dayDateStr;
                return (
                  <button
                    key={dayDateStr}
                    onClick={() => setSelectedDate(isSelected ? null : dayDateStr)}
                    className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-accent-purple text-white'
                        : isToday(day)
                        ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {getDayName(day).substring(0, 3)} {day.getDate()}
                  </button>
                );
              })}
            </div>
          ) : (
            // Date range selection
            <div className="mt-2 space-y-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={selectedDate || ''}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    // If end date is before new start date, clear it
                    if (selectedEndDate && e.target.value && selectedEndDate < e.target.value) {
                      setSelectedEndDate(null);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={selectedEndDate || ''}
                  onChange={(e) => {
                    const endDate = e.target.value;
                    // Ensure end date is not before start date
                    if (selectedDate && endDate && endDate < selectedDate) {
                      alert('End date cannot be before start date');
                      return;
                    }
                    setSelectedEndDate(endDate);
                  }}
                  min={selectedDate || undefined}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{getWeekRange()}</h2>
              <button
                onClick={goToCurrentWeek}
                className="text-xs text-accent-purple hover:underline mt-1"
              >
                Go to current week
              </button>
            </div>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly View */}
      <div className="px-4 mt-4 space-y-3">
        {weekDays.map((day) => {
          const dayTasks = getTasksForDate(day);
          const isTodayDate = isToday(day);
          
          return (
            <div key={formatDate(day)} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden">
              {/* Day Header */}
              <div 
                onClick={() => {
                  const dayDateStr = formatDate(day);
                  setSelectedDate(dayDateStr);
                  setShowDateRange(false);
                  setSelectedEndDate(null);
                  // Focus the input field
                  setTimeout(() => {
                    const input = document.querySelector('input[placeholder="Add a task..."]') as HTMLInputElement;
                    if (input) {
                      input.focus();
                    }
                  }, 100);
                }}
                className={`px-4 py-3 border-b cursor-pointer hover:bg-opacity-80 transition-colors ${
                  isTodayDate ? 'bg-accent-purple/10 dark:bg-accent-purple/20 border-accent-purple' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                }`}
                title="Click to add a task for this day"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${isTodayDate ? 'text-accent-purple' : 'text-gray-900 dark:text-white'}`}>
                      {getDayName(day)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {isTodayDate && <span className="ml-2 text-accent-purple font-medium">• Today</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                    <Plus size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div 
                className="p-4 space-y-2 min-h-[60px]"
                onClick={(e) => {
                  // Only trigger if clicking on empty space, not on tasks
                  if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('empty-day-clickable')) {
                    const dayDateStr = formatDate(day);
                    setSelectedDate(dayDateStr);
                    setShowDateRange(false);
                    setSelectedEndDate(null);
                    setTimeout(() => {
                      const input = document.querySelector('input[placeholder="Add a task..."]') as HTMLInputElement;
                      if (input) {
                        input.focus();
                      }
                    }, 100);
                  }
                }}
              >
                {dayTasks.length > 0 ? (
                  dayTasks.map((task) => {
                    const isMultiDay = task.endDate && task.endDate !== task.date;
                    const isStartDay = task.date === formatDate(day);
                    const isEndDay = task.endDate ? task.endDate === formatDate(day) : task.date === formatDate(day);
                    const isMiddleDay = isMultiDay && !isStartDay && !isEndDay;
                    
                    return (
                      <div
                        key={`${task.id}-${formatDate(day)}`}
                        className={`flex items-start gap-3 p-3 rounded-xl border-l-4 ${
                          task.completed ? 'opacity-60 bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-700/30'
                        } ${isMiddleDay ? 'border-l-2' : ''}`}
                        style={{ 
                          borderLeftColor: task.priority === 'High' ? '#ef4444' : '#3b82f6',
                          borderLeftStyle: isMiddleDay ? 'dashed' : 'solid'
                        }}
                      >
                      <button
                        onClick={() => handleToggleComplete(task.id, task.completed)}
                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          task.completed
                            ? 'bg-accent-purple border-accent-purple'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {task.completed && <Check size={14} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {task.name}
                            {isMultiDay && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                {isStartDay && '→'}
                                {isMiddleDay && '⋯'}
                                {isEndDay && !isStartDay && '←'}
                              </span>
                            )}
                          </h4>
                          {task.priority === 'High' && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                              High
                            </span>
                          )}
                        </div>
                        {task.category !== 'General' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{task.category}</p>
                        )}
                        {task.crew && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Crew: {task.crew}</p>
                        )}
                        {task.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{task.notes}</p>
                        )}
                        {isMultiDay && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {isStartDay && `Ends: ${new Date(task.endDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                            {isEndDay && !isStartDay && `Started: ${new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                            {isMiddleDay && 'Multi-day task'}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await deleteTask(task.id);
                          } catch (error) {
                            console.error('Error deleting task:', error);
                            alert('Failed to delete task. Please try again.');
                          }
                        }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-400 dark:text-gray-500 empty-day-clickable cursor-pointer hover:text-accent-purple transition-colors">
                    <p className="text-sm">Click to add a task</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyTasksView;
