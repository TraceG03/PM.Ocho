import React, { useState, useRef } from 'react';
import { Calendar, List, Plus, Edit, Trash2, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
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

  // Asana-style Timeline view logic
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = days, 2 = weeks, 3 = months
  const [scrollPosition, setScrollPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate timeline range based on milestones
  const getTimelineRange = () => {
    if (milestones.length === 0) {
      const start = new Date();
      start.setDate(1);
      const end = new Date();
      end.setMonth(end.getMonth() + 3);
      return { start, end };
    }

    const dates = milestones.flatMap(m => [
      new Date(m.startDate),
      new Date(m.endDate)
    ]);
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    
    return { start, end };
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineRange();

  // Generate date headers based on zoom level
  const getDateHeaders = () => {
    const headers: Date[] = [];
    const current = new Date(timelineStart);
    
    if (zoomLevel === 1) {
      // Daily view
      while (current <= timelineEnd) {
        headers.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (zoomLevel === 2) {
      // Weekly view
      while (current <= timelineEnd) {
        headers.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }
    } else {
      // Monthly view
      while (current <= timelineEnd) {
        headers.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return headers;
  };

  // Calculate total timeline width in days
  const getTotalDays = () => {
    return Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calculate position percentage for a given date
  const getDatePosition = (date: Date): number => {
    const totalDays = getTotalDays();
    const daysFromStart = Math.ceil((date.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    return (daysFromStart / totalDays) * 100;
  };

  // Calculate position and width of milestone bar
  const getMilestonePosition = (milestone: typeof milestones[0]) => {
    const start = new Date(milestone.startDate);
    const end = new Date(milestone.endDate);
    const totalDays = getTotalDays();
    const milestoneStart = Math.ceil((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const milestoneDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const left = (milestoneStart / totalDays) * 100;
    const width = (milestoneDuration / totalDays) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  // Get today's position
  const getTodayPosition = () => {
    const today = new Date();
    if (today < timelineStart || today > timelineEnd) return null;
    
    const position = getDatePosition(today);
    return `${position}%`;
  };

  const todayPosition = getTodayPosition();
  const dateHeaders = getDateHeaders();

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
        /* Asana-style Timeline View */
        <div className="px-4 mt-4">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {/* Timeline Controls */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(1, prev - 1))}
                  disabled={zoomLevel === 1}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ZoomOut size={18} className="text-gray-600" />
                </button>
                <span className="text-sm text-gray-600 min-w-[80px] text-center">
                  {zoomLevel === 1 ? 'Days' : zoomLevel === 2 ? 'Weeks' : 'Months'}
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 1))}
                  disabled={zoomLevel === 3}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ZoomIn size={18} className="text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScrollPosition(prev => Math.max(0, prev - 200))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={() => setScrollPosition(prev => prev + 200)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={18} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Timeline Container */}
            <div className="overflow-x-auto" ref={timelineRef}>
              <div className="relative" style={{ transform: `translateX(-${scrollPosition}px)` }}>
                {/* Date Headers - Positioned to align with milestones */}
                <div className="sticky top-0 bg-white border-b-2 border-gray-300 z-20">
                  <div className="relative" style={{ width: '100%', minHeight: '80px' }}>
                    {dateHeaders.map((date, index) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      const position = getDatePosition(date);
                      const nextDate = dateHeaders[index + 1];
                      const nextPosition = nextDate ? getDatePosition(nextDate) : 100;
                      const width = nextPosition - position;
                      
                      return (
                        <div
                          key={index}
                          className={`absolute border-r border-gray-200 p-3 text-center ${isToday ? 'bg-blue-50' : ''}`}
                          style={{
                            left: `${position}%`,
                            width: `${width}%`,
                            minWidth: zoomLevel === 1 ? '60px' : zoomLevel === 2 ? '80px' : '100px'
                          }}
                        >
                          {zoomLevel === 1 ? (
                            <>
                              <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                {date.getDate()}
                              </div>
                              <div className={`text-xs font-medium ${isToday ? 'text-blue-500' : 'text-gray-600'} mt-1`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {date.toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                            </>
                          ) : zoomLevel === 2 ? (
                            <>
                              <div className={`text-base font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                Week {Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 0).getDate()) / 7)}
                              </div>
                              <div className={`text-sm font-medium ${isToday ? 'text-blue-500' : 'text-gray-600'} mt-1`}>
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={`text-base font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                {date.toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                              <div className={`text-sm font-medium ${isToday ? 'text-blue-500' : 'text-gray-600'} mt-1`}>
                                {date.getFullYear()}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline Rows */}
                <div className="relative" style={{ minHeight: `${sortedMilestones.length * 60 + 20}px`, width: '100%' }}>
                  {/* Today Indicator Line */}
                  {todayPosition && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                      style={{ left: todayPosition }}
                    >
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                        Today
                      </div>
                    </div>
                  )}

                  {/* Milestone Bars */}
                  {sortedMilestones.map((milestone) => {
                    const position = getMilestonePosition(milestone);
                    
                    return (
                      <div
                        key={milestone.id}
                        className="relative border-b border-gray-100"
                        style={{ height: '60px' }}
                      >
                        {/* Milestone Label */}
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-white border-r border-gray-200 flex items-center px-3 z-10">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-3 h-3 rounded flex-shrink-0"
                              style={{ backgroundColor: getPhaseColor(milestone.phaseId) }}
                            />
                            <span className="text-sm font-medium text-gray-900 truncate" title={milestone.title}>
                              {milestone.title}
                            </span>
                          </div>
                        </div>

                        {/* Milestone Bar */}
                        <div className="ml-32 relative h-full">
                          <div
                            onClick={() => setSelectedMilestone(milestone.id)}
                            className="absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg flex items-center px-2 text-white text-xs font-medium shadow-sm cursor-pointer hover:opacity-90 hover:shadow-md transition-all"
                            style={{
                              backgroundColor: getPhaseColor(milestone.phaseId),
                              left: position.left,
                              width: position.width,
                              minWidth: '60px'
                            }}
                            title={`Click to view details: ${milestone.title} (${new Date(milestone.startDate).toLocaleDateString()} - ${new Date(milestone.endDate).toLocaleDateString()})`}
                          >
                            <span className="truncate">{milestone.title}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty State */}
                  {sortedMilestones.length === 0 && (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      <p>No milestones yet. Add milestones to see them on the timeline.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legend */}
            {phases.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Legend:</p>
                <div className="flex flex-wrap gap-3">
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

      {/* Milestone Details Modal */}
      {selectedMilestone && (() => {
        const milestone = milestones.find(m => m.id === selectedMilestone);
        const phase = milestone ? phases.find(p => p.id === milestone.phaseId) : null;
        if (!milestone) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Milestone Details</h2>
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</label>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{milestone.title}</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getPhaseColor(milestone.phaseId) }}
                  />
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phase</label>
                    <p className="text-sm font-medium text-gray-900">{phase?.name || 'Unknown Phase'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(milestone.startDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Date</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(milestone.endDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                
                {milestone.notes && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{milestone.notes}</p>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t border-gray-200">
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
                      setSelectedMilestone(null);
                      setShowAddMilestone(true);
                    }}
                    className="flex-1 bg-accent-purple text-white py-2 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this milestone?')) {
                        try {
                          await deleteMilestone(milestone.id);
                          setSelectedMilestone(null);
                        } catch (error) {
                          console.error('Error deleting milestone:', error);
                          alert('Failed to delete milestone. Please try again.');
                        }
                      }
                    }}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
