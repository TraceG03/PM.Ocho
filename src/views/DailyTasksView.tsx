import React, { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DailyTasksView: React.FC = () => {
  const { tasks, milestones, documents, addTask, updateTask, deleteTask } = useApp();
  const [showAddTask, setShowAddTask] = useState(false);
  const [quickTodo, setQuickTodo] = useState('');
  const [taskForm, setTaskForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    category: 'General',
    priority: 'Normal' as 'Normal' | 'High',
    crew: '',
    notes: '',
    relatedMilestoneId: '',
    relatedDocumentId: '',
  });

  const handleAddQuickTodo = async () => {
    if (quickTodo.trim()) {
      try {
        await addTask({
          name: quickTodo,
          date: new Date().toISOString().split('T')[0],
          category: 'Quick',
          priority: 'Normal',
          crew: '',
          notes: '',
          completed: false,
        });
        setQuickTodo('');
      } catch (error) {
        console.error('Error adding quick todo:', error);
      }
    }
  };

  const handleSaveTask = async () => {
    if (taskForm.name.trim()) {
      try {
        await addTask({
          ...taskForm,
          completed: false,
        });
        setTaskForm({
          name: '',
          date: new Date().toISOString().split('T')[0],
          category: 'General',
          priority: 'Normal',
          crew: '',
          notes: '',
          relatedMilestoneId: '',
          relatedDocumentId: '',
        });
        setShowAddTask(false);
      } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task. Please try again.');
      }
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateTask(id, { completed: !completed });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) return 'Today';
    if (taskDate.getTime() === today.getTime() - 86400000) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Daily Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Plan and track daily work activities</p>
        </div>
      </div>

      {/* Quick To-Do */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add quick to-do item..."
              value={quickTodo}
              onChange={(e) => setQuickTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddQuickTodo()}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
            />
            <button
              onClick={handleAddQuickTodo}
              className="bg-accent-purple text-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-semibold text-gray-900">Add Task</span>
            <Plus size={20} className="text-gray-400" />
          </button>

          {showAddTask && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Task Name"
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
              <input
                type="date"
                value={taskForm.date}
                onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
              <select
                value={taskForm.category}
                onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="General">General</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Framing">Framing</option>
                <option value="Concrete">Concrete</option>
                <option value="Roofing">Roofing</option>
              </select>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'Normal' | 'High' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
              <input
                type="text"
                placeholder="Crew/Person"
                value={taskForm.crew}
                onChange={(e) => setTaskForm({ ...taskForm, crew: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
              <textarea
                placeholder="Notes"
                value={taskForm.notes}
                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
              />
              <select
                value={taskForm.relatedMilestoneId}
                onChange={(e) => setTaskForm({ ...taskForm, relatedMilestoneId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="">Related Milestone (optional)</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
              <select
                value={taskForm.relatedDocumentId}
                onChange={(e) => setTaskForm({ ...taskForm, relatedDocumentId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="">Related Document (optional)</option>
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
              <button
                onClick={handleSaveTask}
                className="w-full bg-accent-purple text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                Save Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="px-4 mt-4 space-y-4">
        {sortedDates.map(date => (
          <div key={date}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{formatDate(date)}</h2>
            <div className="space-y-3">
              {groupedTasks[date].map(task => (
                <div
                  key={task.id}
                  className={`bg-white rounded-3xl shadow-sm p-4 border-l-4 ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                  style={{ borderLeftColor: task.priority === 'High' ? '#ef4444' : '#3b82f6' }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        task.completed
                          ? 'bg-accent-purple border-accent-purple'
                          : 'border-gray-300'
                      }`}
                    >
                      {task.completed && <Check size={14} className="text-white" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.name}
                        </h3>
                        {task.priority === 'High' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            High
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>{task.category}</span>
                        {task.crew && <span>• {task.crew}</span>}
                      </div>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-2">{task.notes}</p>
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
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <p className="text-gray-500">No tasks yet. Add your first task above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTasksView;
