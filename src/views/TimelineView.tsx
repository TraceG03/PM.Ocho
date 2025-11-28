import React, { useState } from 'react';
import { Calendar, List, Settings, Plus, Edit, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContextSupabase';
import { presetColors } from '../context/AppContext';

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
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
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
    return phases.find(p => p.id === phaseId)?.color || '#gray';
  };

  const getPhaseName = (phaseId: string) => {
    return phases.find(p => p.id === phaseId)?.name || 'Unknown';
  };

  // Calendar view calculations
  const allDates = milestones.flatMap(m => [m.startDate, m.endDate]);
  const minDate = allDates.length > 0 ? Math.min(...allDates.map(d => new Date(d).getTime())) : Date.now();
  const maxDate = allDates.length > 0 ? Math.max(...allDates.map(d => new Date(d).getTime())) : Date.now();
  const dateRange = maxDate - minDate;
  const daysRange = dateRange > 0 ? dateRange / (1000 * 60 * 60 * 24) : 30; // Default to 30 days if no milestones

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">Project phases and milestones</p>
        </div>

        {/* Top Controls */}
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1 flex-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <List size={18} />
                <span>List</span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar size={18} />
                <span>Calendar</span>
              </div>
            </button>
          </div>
          <button
            onClick={() => setShowManagePhases(true)}
            className="text-accent-purple font-medium px-3 py-2"
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
                placeholder="Title"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={milestoneForm.startDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, startDate: e.target.value })}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                />
                <input
                  type="date"
                  value={milestoneForm.endDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, endDate: e.target.value })}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                />
              </div>
              <select
                value={milestoneForm.phaseId}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, phaseId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
              >
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Notes"
                value={milestoneForm.notes}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent resize-none"
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

      {/* List View */}
      {viewMode === 'list' && (
        <div className="px-4 mt-4 space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="bg-white rounded-3xl shadow-sm p-4 border-l-4"
              style={{ borderLeftColor: getPhaseColor(milestone.phaseId) }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getPhaseColor(milestone.phaseId) }}
                    >
                      {getPhaseName(milestone.phaseId)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(milestone.startDate).toLocaleDateString()} -{' '}
                      {new Date(milestone.endDate).toLocaleDateString()}
                    </span>
                  </div>
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
          ))}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-3xl shadow-sm p-4">
            {/* Zoom Controls */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Zoom</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 font-medium"
                >
                  -
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 font-medium"
                >
                  Reset
                </button>
                <button
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                  className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 font-medium"
                >
                  +
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative" style={{ minHeight: `${daysRange * 40 * zoomLevel}px` }}>
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200 rounded-full" />

              {/* Milestones */}
              {milestones.map((milestone) => {
                const startTime = new Date(milestone.startDate).getTime();
                const position = dateRange > 0 ? ((startTime - minDate) / dateRange) * 100 : 0;
                const phaseColor = getPhaseColor(milestone.phaseId);

                return (
                  <div
                    key={milestone.id}
                    className="absolute left-0 right-0"
                    style={{
                      top: `${position * zoomLevel}%`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Milestone Card */}
                      <div
                        className="bg-white rounded-2xl shadow-sm p-3 border-l-4 flex-1 ml-12"
                        style={{ borderLeftColor: phaseColor }}
                      >
                        <h4 className="font-semibold text-gray-900 text-sm">{milestone.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(milestone.startDate).toLocaleDateString()} -{' '}
                          {new Date(milestone.endDate).toLocaleDateString()}
                        </p>
                        <span
                          className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: phaseColor }}
                        >
                          {getPhaseName(milestone.phaseId)}
                        </span>
                      </div>

                      {/* Node on Timeline */}
                      <div
                        className="absolute left-6 w-4 h-4 rounded-full border-2 border-white shadow-md"
                        style={{
                          backgroundColor: phaseColor,
                          transform: 'translateX(-50%)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Manage Phases Modal */}
      {showManagePhases && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Manage Phases</h2>
              <button
                onClick={() => setShowManagePhases(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Add/Edit Phase */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {editingPhase ? 'Edit Phase' : 'Add New Phase'}
                </h3>
                <input
                  type="text"
                  placeholder="Phase Name"
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-accent-purple"
                />
                <div className="flex gap-2 mb-3">
                  {presetColors.map((color) => (
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
                <div className="flex gap-2">
                  {editingPhase && (
                    <button
                      onClick={() => {
                        setEditingPhase(null);
                        setNewPhaseName('');
                        setNewPhaseColor(presetColors[0]);
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleAddPhase}
                    className={`${editingPhase ? 'flex-1' : 'w-full'} bg-accent-purple text-white py-3 rounded-xl font-medium`}
                  >
                    {editingPhase ? 'Update Phase' : 'Add Phase'}
                  </button>
                </div>
              </div>

              {/* Existing Phases */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Existing Phases</h3>
                <div className="space-y-2">
                  {phases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200"
                    >
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
        </div>
      )}
    </div>
  );
};

export default TimelineView;

