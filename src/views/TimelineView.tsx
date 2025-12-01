import React, { useState } from 'react';
import { Calendar, List, Plus, Edit, Trash2, X } from 'lucide-react';
import { useApp, presetColors } from '../context/AppContext';

const TimelineView: React.FC = () => {
  const {
    phases,
    milestones,
    addPhase,
    updatePhase,
    deletePhase,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showManagePhases, setShowManagePhases] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseColor, setNewPhaseColor] = useState(presetColors[0]);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    phaseId: phases[0]?.id || '',
    notes: '',
  });

  const handleAddPhase = async () => {
    if (newPhaseName.trim()) {
      try {
        if (editingPhase) {
          await updatePhase(editingPhase, { name: newPhaseName, color: newPhaseColor });
          setEditingPhase(null);
        } else {
          await addPhase({ name: newPhaseName, color: newPhaseColor });
        }
        setNewPhaseName('');
        setNewPhaseColor(presetColors[0]);
      } catch (error) {
        console.error('Error saving phase:', error);
        alert('Failed to save phase. Please try again.');
      }
    }
  };

  const handleSaveMilestone = async () => {
    if (milestoneForm.title && milestoneForm.startDate && milestoneForm.endDate && milestoneForm.phaseId) {
      try {
        if (editingMilestoneId) {
          await updateMilestone(editingMilestoneId, milestoneForm);
          setEditingMilestoneId(null);
        } else {
          await addMilestone(milestoneForm);
        }
        setMilestoneForm({
          title: '',
          startDate: '',
          endDate: '',
          phaseId: phases[0]?.id || '',
          notes: '',
        });
        setShowAddMilestone(false);
      } catch (error) {
        console.error('Error saving milestone:', error);
        alert('Failed to save milestone. Please try again.');
      }
    }
  };

  const getPhaseColor = (phaseId: string) => {
    return phases.find(p => p.id === phaseId)?.color || '#3b82f6';
  };

  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Calendar view logic
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getMilestonesForDate = (date: Date | null) => {
    if (!date) return [];
    return milestones.filter(m => {
      const start = new Date(m.startDate);
      const end = new Date(m.endDate);
      return date >= start && date <= end;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">Project phases and milestones</p>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              <Calendar size={18} />
            </button>
          </div>
          <button
            onClick={() => setShowManagePhases(true)}
            className="text-accent-purple font-medium text-sm"
          >
            Manage Phases
          </button>
        </div>
      </div>

      {/* Add Milestone Section */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <button
            onClick={() => {
              setEditingMilestoneId(null);
              setShowAddMilestone(!showAddMilestone);
            }}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-semibold text-gray-900">Add Milestone</span>
            <Plus size={20} className="text-gray-400" />
          </button>

          {showAddMilestone && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Milestone Title"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={milestoneForm.startDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, startDate: e.target.value })}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                <input
                  type="date"
                  value={milestoneForm.endDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, endDate: e.target.value })}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
              </div>
              <select
                value={milestoneForm.phaseId}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, phaseId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
              >
                {phases.map(phase => (
                  <option key={phase.id} value={phase.id}>{phase.name}</option>
                ))}
              </select>
              <textarea
                placeholder="Notes (optional)"
                value={milestoneForm.notes}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple resize-none"
              />
              <button
                onClick={handleSaveMilestone}
                className="w-full bg-accent-purple text-white py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                Save Milestone
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'list' ? (
        /* Milestones List */
        <div className="px-4 mt-4 space-y-3">
          {sortedMilestones.map((milestone) => {
            const phase = phases.find(p => p.id === milestone.phaseId);
            return (
              <div
                key={milestone.id}
                className="bg-white rounded-3xl shadow-sm p-4 border-l-4"
                style={{ borderLeftColor: getPhaseColor(milestone.phaseId) }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getPhaseColor(milestone.phaseId) }}
                      >
                        {phase?.name || 'Unknown Phase'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{milestone.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(milestone.startDate).toLocaleDateString()} - {new Date(milestone.endDate).toLocaleDateString()}
                    </p>
                    {milestone.notes && (
                      <p className="text-sm text-gray-600 mt-2">{milestone.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => {
                        setMilestoneForm({
                          title: milestone.title,
                          startDate: milestone.startDate,
                          endDate: milestone.endDate,
                          phaseId: milestone.phaseId,
                          notes: milestone.notes,
                        });
                        setEditingMilestoneId(milestone.id);
                        setShowAddMilestone(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteMilestone(milestone.id);
                        } catch (error) {
                          console.error('Error deleting milestone:', error);
                          alert('Failed to delete milestone. Please try again.');
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar View */
        <div className="px-4 mt-4">
          <div className="bg-white rounded-3xl shadow-sm p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => {
                const dayMilestones = getMilestonesForDate(date);
                const isToday = date && date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-1 border border-gray-200 rounded-lg ${
                      date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-accent-purple' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-accent-purple' : 'text-gray-900'}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayMilestones.slice(0, 2).map(milestone => (
                            <div
                              key={milestone.id}
                              className="text-xs px-1 py-0.5 rounded text-white truncate"
                              style={{ backgroundColor: getPhaseColor(milestone.phaseId) }}
                              title={milestone.title}
                            >
                              {milestone.title}
                            </div>
                          ))}
                          {dayMilestones.length > 2 && (
                            <div className="text-xs text-gray-500 px-1">
                              +{dayMilestones.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            {phases.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Legend:</p>
                <div className="flex flex-wrap gap-2">
                  {phases.map(phase => (
                    <div key={phase.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: phase.color }}
                      />
                      <span className="text-xs text-gray-600">{phase.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Phases Modal */}
      {showManagePhases && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Manage Phases</h2>
              <button
                onClick={() => {
                  setShowManagePhases(false);
                  setEditingPhase(null);
                  setNewPhaseName('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Phase Name"
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                <div className="flex gap-2 flex-wrap">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewPhaseColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        newPhaseColor === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleAddPhase}
                  className="w-full bg-accent-purple text-white py-3 rounded-xl font-medium"
                >
                  {editingPhase ? 'Update Phase' : 'Add Phase'}
                </button>
              </div>
              <div className="space-y-2">
                {phases.map(phase => (
                  <div key={phase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: phase.color }}
                      />
                      <span className="font-medium text-gray-900">{phase.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPhase(phase.id);
                          setNewPhaseName(phase.name);
                          setNewPhaseColor(phase.color);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await deletePhase(phase.id);
                          } catch (error) {
                            console.error('Error deleting phase:', error);
                            alert('Failed to delete phase. Please try again.');
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
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
