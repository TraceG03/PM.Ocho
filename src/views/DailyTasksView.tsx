import React, { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContextSupabase';

interface QuickTodo {
  id: string;
  text: string;
  completed: boolean;
}

const DailyTasksView: React.FC = () => {
  const { tasks, milestones, notes, addTask, updateTask, deleteTask } = useApp();
  const [quickTodos, setQuickTodos] = useState<QuickTodo[]>([]);
  const [quickTodoInput, setQuickTodoInput] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
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

  const categories = ['General', 'Plumbing', 'Electrical', 'HVAC', 'Framing', 'Finishing'];

  const handleAddQuickTodo = () => {
    if (quickTodoInput.trim()) {
      setQuickTodos([
        ...quickTodos,
        { id: Date.now().toString(), text: quickTodoInput, completed: false },
      ]);
      setQuickTodoInput('');
    }
  };

  const toggleQuickTodo = (id: string) => {
    setQuickTodos(quickTodos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteQuickTodo = (id: string) => {
    setQuickTodos(quickTodos.filter(t => t.id !== id));
  };

  const handleSaveTask = () => {
    if (taskForm.name && taskForm.date) {
      addTask({
        ...taskForm,
        relatedMilestoneId: taskForm.relatedMilestoneId || undefined,
        relatedDocumentId: taskForm.relatedDocumentId || undefined,
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
    }
  };

  const toggleTaskComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  };

  // Group tasks by date
  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
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

      {/* Quick To-Do List */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Quick To-Do List</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Add quick to-do item..."
              value={quickTodoInput}
              onChange={(e) => setQuickTodoInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddQuickTodo()}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
            />
            <button
              onClick={handleAddQuickTodo}
              className="bg-accent-purple text-white p-2 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {quickTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50"
              >
                <button
                  onClick={() => toggleQuickTodo(todo.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                    todo.completed
                      ? 'bg-accent-purple border-accent-purple'
                      : 'border-gray-300'
                  }`}
                >
                  {todo.completed && <Check size={14} className="text-white" />}
                </button>
                <span
                  className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteQuickTodo(todo.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
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
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={taskForm.date}
                  onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                <select
                  value={taskForm.category}
                  onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'Normal' | 'High' })}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
                <input
                  type="text"
                  placeholder="Crew/Person"
                  value={taskForm.crew}
                  onChange={(e) => setTaskForm({ ...taskForm, crew: e.target.value })}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>
              <select
                value={taskForm.relatedMilestoneId}
                onChange={(e) => setTaskForm({ ...taskForm, relatedMilestoneId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="">Related Milestone (Optional)</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <select
                value={taskForm.relatedDocumentId}
                onChange={(e) => setTaskForm({ ...taskForm, relatedDocumentId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                <option value="">Related Document (Optional)</option>
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Notes"
                value={taskForm.notes}
                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
              />
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

      {/* Task List */}
      <div className="px-4 mt-4 space-y-4">
        {Object.entries(groupedTasks)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([date, dateTasks]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">{formatDate(date)}</h3>
              <div className="space-y-2">
                {dateTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white rounded-3xl shadow-sm p-4 ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskComplete(task.id)}
                        className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                          task.completed
                            ? 'bg-accent-purple border-accent-purple'
                            : 'border-gray-300'
                        }`}
                      >
                        {task.completed && <Check size={14} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <h4
                          className={`font-semibold text-gray-900 ${
                            task.completed ? 'line-through' : ''
                          }`}
                        >
                          {task.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {task.priority === 'High' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              High Priority
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {task.category}
                          </span>
                          {task.crew && (
                            <span className="text-sm text-gray-600">👤 {task.crew}</span>
                          )}
                        </div>
                        {task.notes && (
                          <p className="text-sm text-gray-600 mt-2">{task.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DailyTasksView;

