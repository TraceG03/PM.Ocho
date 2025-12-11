import React, { useState, useRef, useEffect } from 'react';
import { Calendar, List, Plus, Edit, Trash2, X, ZoomIn, ZoomOut, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(phases.map(p => p.id))); // All phases expanded by default

  // Update expanded phases when phases change
  useEffect(() => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      // Add any new phases
      phases.forEach(phase => {
        if (!newSet.has(phase.id)) {
          newSet.add(phase.id);
        }
      });
      // Remove phases that no longer exist
      const phaseIds = new Set(phases.map(p => p.id));
      Array.from(newSet).forEach(id => {
        if (!phaseIds.has(id)) {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  }, [phases]);
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


  // Helper function to parse YYYY-MM-DD date strings as local dates (not UTC)
  // This prevents timezone shifts that cause milestones to appear on wrong dates
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Sort milestones by start date (needed for both list and calendar views)
  const sortedMilestones = [...milestones].sort((a, b) => {
    try {
      const dateA = parseLocalDate(a.startDate);
      const dateB = parseLocalDate(b.startDate);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
      return dateA.getTime() - dateB.getTime();
    } catch (error) {
      console.error('Error sorting milestones:', error, a, b);
      return 0;
    }
  });

  // Multi-select handlers (moved after sortedMilestones to avoid reference errors)
  const toggleMilestoneSelection = (milestoneId: string) => {
    setSelectedMilestoneIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId);
      } else {
        newSet.add(milestoneId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedMilestoneIds.size === sortedMilestones.length) {
      setSelectedMilestoneIds(new Set());
    } else {
      setSelectedMilestoneIds(new Set(sortedMilestones.map(m => m.id)));
    }
  };

  const handleBulkPhaseChange = async (newPhaseId: string) => {
    if (selectedMilestoneIds.size === 0) return;
    
    try {
      // Update all selected milestones
      const updatePromises = Array.from(selectedMilestoneIds).map(id =>
        updateMilestone(id, { phaseId: newPhaseId })
      );
      
      await Promise.all(updatePromises);
      
      // Clear selection
      setSelectedMilestoneIds(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error updating milestones:', error);
      alert('Failed to update milestones. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMilestoneIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedMilestoneIds.size} milestone(s)?`)) {
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedMilestoneIds).map(id =>
        deleteMilestone(id)
      );
      
      await Promise.all(deletePromises);
      
      // Clear selection
      setSelectedMilestoneIds(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error deleting milestones:', error);
      alert('Failed to delete milestones. Please try again.');
    }
  };

  const getPhaseColor = (phaseId: string) => {
    return phases.find(p => p.id === phaseId)?.color || '#3b82f6';
  };

  // Asana-style Timeline view logic
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = days, 2 = weeks, 3 = months
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate timeline range based on milestones
  const getTimelineRange = () => {
    if (milestones.length === 0) {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setFullYear(end.getFullYear() + 2); // Default to 2 years ahead
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    try {
      const dates = milestones.flatMap(m => {
        try {
          return [parseLocalDate(m.startDate), parseLocalDate(m.endDate)];
        } catch (e) {
          console.error('Error parsing milestone date:', m, e);
          return [];
        }
      }).filter(d => d && !isNaN(d.getTime()));
      
      if (dates.length === 0) {
        // Fallback if all dates are invalid
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setFullYear(end.getFullYear() + 2);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      
      const start = new Date(Math.min(...dates.map(d => d.getTime())));
      let end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Normalize to start/end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    // Add padding (at least 30 days, or extend to 2 years from latest milestone)
    start.setDate(start.getDate() - 30);
    
    // Ensure timeline extends at least 2 years from the latest milestone
    const twoYearsFromLatest = new Date(end);
    twoYearsFromLatest.setFullYear(twoYearsFromLatest.getFullYear() + 2);
    
    // Also ensure it goes at least 1 year from today
    const oneYearFromToday = new Date();
    oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1);
    
    // Use the latest of: milestone end + 2 years, or today + 1 year
    end = new Date(Math.max(
      twoYearsFromLatest.getTime(),
      oneYearFromToday.getTime(),
      end.getTime() + (30 * 24 * 60 * 60 * 1000) // At least 30 days padding
    ));
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
    } catch (error) {
      console.error('Error calculating timeline range:', error);
      // Fallback to default range
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setFullYear(end.getFullYear() + 2);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineRange();

  // Generate date headers based on zoom level
  const getDateHeaders = () => {
    try {
      const headers: Date[] = [];
      // Normalize to start of day for consistent alignment
      let current = new Date(timelineStart);
      if (isNaN(current.getTime())) {
        console.error('Invalid timelineStart:', timelineStart);
        return [];
      }
      current.setHours(0, 0, 0, 0);
      const end = new Date(timelineEnd);
      if (isNaN(end.getTime())) {
        console.error('Invalid timelineEnd:', timelineEnd);
        return [];
      }
      end.setHours(23, 59, 59, 999);
    
    if (zoomLevel === 1) {
      // Daily view - start from exact timeline start
      while (current <= end) {
        headers.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (zoomLevel === 2) {
      // Weekly view - start from the Monday of the week containing timeline start
      const dayOfWeek = current.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Days to subtract to get to Monday
      current.setDate(current.getDate() + daysToMonday);
      while (current <= end) {
        headers.push(new Date(current));
        const nextWeek = new Date(current);
        nextWeek.setDate(nextWeek.getDate() + 7);
        current = nextWeek;
      }
    } else {
      // Monthly view - start from the first day of the month containing timeline start
      current.setDate(1); // First day of the month
      while (current <= end) {
        headers.push(new Date(current));
        const nextMonth = new Date(current);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1); // Ensure we stay on the 1st of each month
        current = nextMonth;
      }
    }
    
    return headers;
    } catch (error) {
      console.error('Error generating date headers:', error);
      return [];
    }
  };

  // Calculate position in pixels for milestones (matching date header grid)
  const getMilestonePosition = (milestone: typeof milestones[0]) => {
    try {
      const start = parseLocalDate(milestone.startDate);
      const end = parseLocalDate(milestone.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid milestone dates:', milestone);
        return { left: '0px', width: '60px' };
      }
      
      // Get the date headers to find which header index the milestone falls into
      const dateHeaders = getDateHeaders();
      if (dateHeaders.length === 0) {
        return { left: '0px', width: '60px' };
      }
    
    // Normalize dates to start of day for consistent calculation
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    
    let dayWidth: number;
    let startIndex: number;
    let endIndex: number;
    
    if (zoomLevel === 1) {
      // Daily view - find the exact day header index
      dayWidth = 80;
      startIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        return headerDate.getTime() === startDate.getTime();
      });
      endIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        return headerDate.getTime() === endDate.getTime();
      });
      
      // If exact match not found, find the closest header
      if (startIndex === -1) {
        startIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate.getTime() >= startDate.getTime();
        });
        if (startIndex === -1) startIndex = 0;
      }
      if (endIndex === -1) {
        endIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate.getTime() >= endDate.getTime();
        });
        if (endIndex === -1) endIndex = dateHeaders.length - 1;
      }
    } else if (zoomLevel === 2) {
      // Weekly view - find which week header the date falls into
      dayWidth = 120;
      startIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        const weekEnd = new Date(headerDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return startDate >= headerDate && startDate <= weekEnd;
      });
      endIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        const weekEnd = new Date(headerDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return endDate >= headerDate && endDate <= weekEnd;
      });
      
      // If not found, find the closest week
      if (startIndex === -1) {
        startIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate >= startDate;
        });
        if (startIndex === -1) startIndex = 0;
      }
      if (endIndex === -1) {
        endIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate >= endDate;
        });
        if (endIndex === -1) endIndex = dateHeaders.length - 1;
      }
    } else {
      // Monthly view - find which month header the date falls into
      dayWidth = 150;
      startIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        return headerDate.getFullYear() === startDate.getFullYear() && 
               headerDate.getMonth() === startDate.getMonth();
      });
      endIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        return headerDate.getFullYear() === endDate.getFullYear() && 
               headerDate.getMonth() === endDate.getMonth();
      });
      
      // If not found, find the closest month
      if (startIndex === -1) {
        startIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate >= startDate;
        });
        if (startIndex === -1) startIndex = 0;
      }
      if (endIndex === -1) {
        endIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate >= endDate;
        });
        if (endIndex === -1) endIndex = dateHeaders.length - 1;
      }
    }
    
    // Ensure valid indices
    startIndex = Math.max(0, Math.min(startIndex, dateHeaders.length - 1));
    endIndex = Math.max(0, Math.min(endIndex, dateHeaders.length - 1));
    
    const duration = Math.max(1, endIndex - startIndex + 1);
    
      // Calculate position in pixels based on header index
      const left = startIndex * dayWidth;
      const width = duration * dayWidth;
      
      return { left: `${left}px`, width: `${Math.max(width, 60)}px` };
    } catch (error) {
      console.error('Error calculating milestone position:', error, milestone);
      return { left: '0px', width: '60px' };
    }
  };

  // Get today's position in pixels
  const getTodayPosition = () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(today.getTime()) || isNaN(timelineStart.getTime()) || isNaN(timelineEnd.getTime())) {
        return null;
      }
      if (today < timelineStart || today > timelineEnd) return null;
      
      // Get the date headers to find which header index today falls into
      const dateHeaders = getDateHeaders();
      if (dateHeaders.length === 0) return null;
    
    let dayWidth: number;
    let todayIndex: number;
    
    if (zoomLevel === 1) {
      // Daily view - find exact day
      dayWidth = 80;
      todayIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        return headerDate.getTime() === today.getTime();
      });
      if (todayIndex === -1) {
        todayIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate >= today;
        });
        if (todayIndex === -1) return null;
      }
    } else if (zoomLevel === 2) {
      // Weekly view - find which week today falls into
      dayWidth = 120;
      todayIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        const weekEnd = new Date(headerDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return today >= headerDate && today <= weekEnd;
      });
      if (todayIndex === -1) {
        todayIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate >= today;
        });
        if (todayIndex === -1) return null;
      }
    } else {
      // Monthly view - find which month today falls into
      dayWidth = 150;
      todayIndex = dateHeaders.findIndex(header => {
        const headerDate = new Date(header);
        headerDate.setHours(0, 0, 0, 0);
        return headerDate.getFullYear() === today.getFullYear() && 
               headerDate.getMonth() === today.getMonth();
      });
      if (todayIndex === -1) {
        todayIndex = dateHeaders.findIndex(header => {
          const headerDate = new Date(header);
          headerDate.setHours(0, 0, 0, 0);
          return headerDate >= today;
        });
        if (todayIndex === -1) return null;
      }
    }
    
      if (todayIndex === -1 || todayIndex < 0 || todayIndex >= dateHeaders.length) return null;
      
      const position = todayIndex * dayWidth;
      return `${position}px`;
    } catch (error) {
      console.error('Error calculating today position:', error);
      return null;
    }
  };

  const dateHeaders = getDateHeaders() || [];
  const todayPosition = getTodayPosition();

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${selectedMilestoneIds.size > 0 ? 'pb-24' : 'pb-20'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Project phases and milestones</p>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedMilestoneIds(new Set());
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => {
                setViewMode('calendar');
                setSelectedMilestoneIds(new Set());
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-600 text-accent-purple shadow-sm font-medium'
                  : 'text-gray-600 dark:text-gray-300'
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
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4">
          <button
            onClick={() => {
              setEditingMilestoneId(null);
              setShowAddMilestone(!showAddMilestone);
            }}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-semibold text-gray-900 dark:text-white">Add Milestone</span>
            <Plus size={20} className="text-gray-400 dark:text-gray-500" />
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

      {/* Bulk Actions Bar */}
      {selectedMilestoneIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-accent-purple text-white shadow-lg z-[60] px-4 py-3 pb-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-medium">
                {selectedMilestoneIds.size} milestone{selectedMilestoneIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              {phases.length > 0 ? (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkPhaseChange(e.target.value);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-white text-gray-900 border-0 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Change Phase...</option>
                  {phases.map(phase => (
                    <option key={phase.id} value={phase.id}>{phase.name}</option>
                  ))}
                </select>
              ) : (
                <span className="px-4 py-2 text-sm text-white text-opacity-80">
                  No phases available
                </span>
              )}
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => {
                  setSelectedMilestoneIds(new Set());
                  setShowBulkActions(false);
                }}
                className="px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Content */}
      {viewMode === 'list' ? (
        /* Milestones List - Grouped by Phase */
        <div className="px-4 mt-4 space-y-3">
          {/* Select All Header */}
          {sortedMilestones.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4 mb-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {selectedMilestoneIds.size === sortedMilestones.length ? (
                    <CheckSquare size={20} className="text-accent-purple" />
                  ) : (
                    <Square size={20} />
                  )}
                  <span className="font-medium text-sm">
                    {selectedMilestoneIds.size === sortedMilestones.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </button>
                {phases.length > 0 && (
                  <button
                    onClick={toggleExpandAll}
                    className="text-sm text-accent-purple hover:underline"
                  >
                    {expandedPhases.size === phases.length ? 'Collapse All' : 'Expand All'}
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Milestones grouped by phase */}
          {phases.map((phase) => {
            const phaseMilestones = milestonesByPhase[phase.id] || [];
            if (phaseMilestones.length === 0) return null;
            
            const isExpanded = expandedPhases.has(phase.id);
            const phaseSelectedCount = phaseMilestones.filter(m => selectedMilestoneIds.has(m.id)).length;
            
            return (
              <div key={phase.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden">
                {/* Phase Header */}
                <button
                  onClick={() => togglePhaseExpansion(phase.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />
                    )}
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: phase.color }}
                    />
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {phase.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {phaseMilestones.length} milestone{phaseMilestones.length !== 1 ? 's' : ''}
                        {phaseSelectedCount > 0 && ` • ${phaseSelectedCount} selected`}
                      </p>
                    </div>
                  </div>
                </button>
                
                {/* Phase Milestones */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {phaseMilestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`border-l-4 p-4 transition-all ${
                          selectedMilestoneIds.has(milestone.id) ? 'ring-2 ring-accent-purple ring-offset-2 bg-accent-purple/5 dark:bg-accent-purple/10' : ''
                        }`}
                        style={{ borderLeftColor: phase.color }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMilestoneSelection(milestone.id);
                            }}
                            className="mt-1 flex-shrink-0"
                          >
                            {selectedMilestoneIds.has(milestone.id) ? (
                              <CheckSquare size={20} className="text-accent-purple" />
                            ) : (
                              <Square size={20} className="text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{milestone.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(milestone.startDate).toLocaleDateString()} - {new Date(milestone.endDate).toLocaleDateString()}
                            </p>
                            {milestone.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{milestone.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMilestoneForm({
                                  title: milestone.title,
                                  startDate: milestone.startDate,
                                  endDate: milestone.endDate,
                                  phaseId: milestone.phaseId,
                                  notes: milestone.notes,
                                });
                                setEditingMilestoneId(milestone.id);
                                setShowAddMilestone(true);
                                setSelectedMilestoneIds(new Set());
                              }}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                (async () => {
                                  try {
                                    await deleteMilestone(milestone.id);
                                    setSelectedMilestoneIds(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(milestone.id);
                                      return newSet;
                                    });
                                  } catch (error) {
                                    console.error('Error deleting milestone:', error);
                                    alert('Failed to delete milestone. Please try again.');
                                  }
                                })();
                              }}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Unassigned milestones */}
          {unassignedMilestones.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Unassigned Milestones
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unassignedMilestones.length} milestone{unassignedMilestones.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                {unassignedMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`border-l-4 p-4 transition-all ${
                      selectedMilestoneIds.has(milestone.id) ? 'ring-2 ring-accent-purple ring-offset-2 bg-accent-purple/5 dark:bg-accent-purple/10' : ''
                    }`}
                    style={{ borderLeftColor: '#9ca3af' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMilestoneSelection(milestone.id);
                        }}
                        className="mt-1 flex-shrink-0"
                      >
                        {selectedMilestoneIds.has(milestone.id) ? (
                          <CheckSquare size={20} className="text-accent-purple" />
                        ) : (
                          <Square size={20} className="text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{milestone.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(milestone.startDate).toLocaleDateString()} - {new Date(milestone.endDate).toLocaleDateString()}
                        </p>
                        {milestone.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{milestone.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMilestoneForm({
                              title: milestone.title,
                              startDate: milestone.startDate,
                              endDate: milestone.endDate,
                              phaseId: milestone.phaseId,
                              notes: milestone.notes,
                            });
                            setEditingMilestoneId(milestone.id);
                            setShowAddMilestone(true);
                            setSelectedMilestoneIds(new Set());
                          }}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            (async () => {
                              try {
                                await deleteMilestone(milestone.id);
                                setSelectedMilestoneIds(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(milestone.id);
                                  return newSet;
                                });
                              } catch (error) {
                                console.error('Error deleting milestone:', error);
                                alert('Failed to delete milestone. Please try again.');
                              }
                            })();
                          }}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {sortedMilestones.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No milestones yet. Add milestones to see them organized by phase.</p>
            </div>
          )}
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
            </div>

            {/* Timeline Container */}
            <div className="overflow-x-auto" ref={timelineRef}>
              {(() => {
                const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                const dayWidth = zoomLevel === 1 ? 80 : zoomLevel === 2 ? 120 : 150;
                const timelineWidth = totalDays * dayWidth;
                
                return (
                  <div style={{ width: `${timelineWidth}px`, minWidth: '100%' }}>
                    {/* Date Headers */}
                    <div className="sticky top-0 bg-white border-b-2 border-gray-300 z-20">
                      <div className="flex">
                        {/* Label column to match milestone rows */}
                        <div className="w-32 border-r border-gray-200 bg-white flex-shrink-0"></div>
                        <div className="flex flex-1">
                          {dateHeaders && dateHeaders.length > 0 ? dateHeaders.map((date, index) => {
                            if (!date || isNaN(date.getTime())) return null;
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                              <div
                                key={index}
                                className={`border-r border-gray-200 dark:border-gray-700 p-2 text-center flex-shrink-0 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                style={{ width: `${dayWidth}px` }}
                              >
                                {zoomLevel === 1 ? (
                                  <>
                                    <div className={`text-base font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                      {date.getDate()}
                                    </div>
                                    <div className={`text-xs ${isToday ? 'text-blue-500' : 'text-gray-600'} mt-0.5`}>
                                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {date.toLocaleDateString('en-US', { month: 'short' })}
                                    </div>
                                  </>
                                ) : zoomLevel === 2 ? (
                                  <>
                                    <div className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className={`text-xs ${isToday ? 'text-blue-500' : 'text-gray-600'} mt-0.5`}>
                                      {date.getFullYear()}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                      {date.toLocaleDateString('en-US', { month: 'short' })}
                                    </div>
                                    <div className={`text-xs ${isToday ? 'text-blue-500' : 'text-gray-600'} mt-0.5`}>
                                      {date.getFullYear()}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          }).filter(Boolean) : (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                              No date headers available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Rows */}
                    <div className="relative" style={{ minHeight: `${sortedMilestones.length * 60 + 20}px` }}>
                      {/* Today Indicator Line */}
                      {todayPosition && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                          style={{ left: `calc(${todayPosition} + 8rem)` }}
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
                            <div className="ml-32 relative h-full" style={{ width: `calc(100% - 8rem)` }}>
                              <div
                                onClick={() => setSelectedMilestone(milestone.id)}
                                className="absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg flex items-center px-2 text-white text-xs font-medium shadow-sm cursor-pointer hover:opacity-90 hover:shadow-md transition-all"
                                style={{
                                  backgroundColor: getPhaseColor(milestone.phaseId),
                                  left: position.left,
                                  width: position.width,
                                  minWidth: '60px'
                                }}
                                title={`${milestone.title} (${new Date(milestone.startDate).toLocaleDateString()} - ${new Date(milestone.endDate).toLocaleDateString()})`}
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
                );
              })()}
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
                      // Clear selection when editing
                      setSelectedMilestoneIds(new Set());
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
