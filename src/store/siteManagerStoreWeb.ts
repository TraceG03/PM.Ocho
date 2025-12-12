import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as sync from '../lib/supabaseSync';
import type { Milestone, Task, Phase, Note, Photo, Report, Document } from './siteManagerStore';

// Re-export types
export type { Milestone, Task, Phase, Note, Photo, Report, Document };

interface SiteManagerState {
  milestones: Milestone[];
  tasks: Task[];
  notes: Note[];
  photos: Photo[];
  reports: Report[];
  documents: Document[];
  phases: Phase[];
  isLoading: boolean;
  isSyncing: boolean;
  
  // Load data from Supabase
  loadAllData: () => Promise<void>;
  
  // Milestone actions
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt'>) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Note actions
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  
  // Photo actions
  addPhoto: (photo: Omit<Photo, 'id' | 'createdAt'>) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  
  // Report actions
  addReport: (report: Omit<Report, 'id' | 'createdAt'>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  
  // Document actions
  addDocument: (document: Omit<Document, 'id' | 'createdAt'>) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  
  // Phase actions
  addPhase: (phase: Omit<Phase, 'id'>) => Promise<void>;
  deletePhase: (id: string) => Promise<void>;
}

const defaultPhases: Phase[] = [
  { id: '1', name: 'Site Prep', color: '#ef4444' },
  { id: '2', name: 'Foundation', color: '#f97316' },
  { id: '3', name: 'Masonry', color: '#f59e0b' },
  { id: '4', name: 'Roof', color: '#eab308' },
  { id: '5', name: 'Electrical', color: '#84cc16' },
  { id: '6', name: 'Plumbing/PTAR', color: '#22c55e' },
  { id: '7', name: 'Finishes', color: '#10b981' },
  { id: '8', name: 'Inspection', color: '#ec4899' },
];

export const useSiteManagerStore = create<SiteManagerState>()(
  persist(
    (set, get) => ({
      milestones: [],
      tasks: [],
      notes: [],
      photos: [],
      reports: [],
      documents: [],
      phases: defaultPhases,
      isLoading: false,
      isSyncing: false,

      loadAllData: async () => {
        set({ isLoading: true });
        try {
          const [milestones, tasks, phases, notes, reports, documents] = await Promise.all([
            sync.syncMilestones.load(),
            sync.syncTasks.load(),
            sync.syncPhases.load(),
            sync.syncNotes.load(),
            sync.syncReports.load(),
            sync.syncDocuments.load(),
          ]);

          const photos = await sync.syncPhotos.load();

          set({
            milestones,
            tasks,
            phases: phases.length > 0 ? phases : defaultPhases,
            notes,
            reports,
            documents,
            photos,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error loading data:', error);
          set({ isLoading: false });
        }
      },

      // Milestone actions with Supabase sync
      addMilestone: async (milestone) => {
        set({ isSyncing: true });
        try {
          const id = await sync.syncMilestones.add(milestone);
          if (id) {
            set((state) => ({
              milestones: [
                ...state.milestones,
                {
                  ...milestone,
                  id,
                  createdAt: new Date().toISOString(),
                },
              ],
              isSyncing: false,
            }));
          } else {
            // Fallback to local if Supabase fails
            set((state) => ({
              milestones: [
                ...state.milestones,
                {
                  ...milestone,
                  id: Date.now().toString(),
                  createdAt: new Date().toISOString(),
                },
              ],
              isSyncing: false,
            }));
          }
        } catch (error) {
          console.error('Error adding milestone:', error);
          set({ isSyncing: false });
        }
      },

      updateMilestone: async (id, updates) => {
        set({ isSyncing: true });
        try {
          const success = await sync.syncMilestones.update(id, updates);
          if (success) {
            set((state) => ({
              milestones: state.milestones.map((m) =>
                m.id === id ? { ...m, ...updates } : m
              ),
              isSyncing: false,
            }));
          } else {
            // Fallback to local update
            set((state) => ({
              milestones: state.milestones.map((m) =>
                m.id === id ? { ...m, ...updates } : m
              ),
              isSyncing: false,
            }));
          }
        } catch (error) {
          console.error('Error updating milestone:', error);
          set({ isSyncing: false });
        }
      },

      deleteMilestone: async (id) => {
        set({ isSyncing: true });
        try {
          const success = await sync.syncMilestones.delete(id);
          set((state) => ({
            milestones: state.milestones.filter((m) => m.id !== id),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error deleting milestone:', error);
          set({ isSyncing: false });
        }
      },

      // Task actions with Supabase sync
      addTask: async (task) => {
        set({ isSyncing: true });
        try {
          const id = await sync.syncTasks.add(task);
          if (id) {
            set((state) => ({
              tasks: [
                ...state.tasks,
                {
                  ...task,
                  id,
                  createdAt: new Date().toISOString(),
                },
              ],
              isSyncing: false,
            }));
          } else {
            set((state) => ({
              tasks: [
                ...state.tasks,
                {
                  ...task,
                  id: Date.now().toString(),
                  createdAt: new Date().toISOString(),
                },
              ],
              isSyncing: false,
            }));
          }
        } catch (error) {
          console.error('Error adding task:', error);
          set({ isSyncing: false });
        }
      },

      updateTask: async (id, updates) => {
        set({ isSyncing: true });
        try {
          const success = await sync.syncTasks.update(id, updates);
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error updating task:', error);
          set({ isSyncing: false });
        }
      },

      deleteTask: async (id) => {
        set({ isSyncing: true });
        try {
          await sync.syncTasks.delete(id);
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error deleting task:', error);
          set({ isSyncing: false });
        }
      },

      // Note actions
      addNote: async (note) => {
        set({ isSyncing: true });
        try {
          const id = await sync.syncNotes.add(note);
          if (id) {
            set((state) => ({
              notes: [
                ...state.notes,
                {
                  ...note,
                  id,
                  createdAt: new Date().toISOString(),
                },
              ],
              isSyncing: false,
            }));
          }
        } catch (error) {
          console.error('Error adding note:', error);
          set({ isSyncing: false });
        }
      },

      updateNote: async (id, updates) => {
        set({ isSyncing: true });
        try {
          await sync.syncNotes.update(id, updates);
          set((state) => ({
            notes: state.notes.map((n) =>
              n.id === id ? { ...n, ...updates } : n
            ),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error updating note:', error);
          set({ isSyncing: false });
        }
      },

      deleteNote: async (id) => {
        set({ isSyncing: true });
        try {
          await sync.syncNotes.delete(id);
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error deleting note:', error);
          set({ isSyncing: false });
        }
      },

      // Photo actions
      addPhoto: async (photo) => {
        set((state) => ({
          photos: [
            ...state.photos,
            {
              ...photo,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      deletePhoto: async (id) => {
        set((state) => ({
          photos: state.photos.filter((p) => p.id !== id),
        }));
      },

      // Report actions
      addReport: async (report) => {
        set({ isSyncing: true });
        try {
          const id = await sync.syncReports.add(report);
          if (id) {
            set((state) => ({
              reports: [
                ...state.reports,
                {
                  ...report,
                  id,
                  createdAt: new Date().toISOString(),
                },
              ],
              isSyncing: false,
            }));
          }
        } catch (error) {
          console.error('Error adding report:', error);
          set({ isSyncing: false });
        }
      },

      deleteReport: async (id) => {
        set({ isSyncing: true });
        try {
          await sync.syncReports.delete(id);
          set((state) => ({
            reports: state.reports.filter((r) => r.id !== id),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error deleting report:', error);
          set({ isSyncing: false });
        }
      },

      // Document actions
      addDocument: async (document) => {
        set({ isSyncing: true });
        try {
          const id = await sync.syncDocuments.add(document);
          if (id) {
            set((state) => ({
              documents: [
                ...state.documents,
                {
                  ...document,
                  id,
                  createdAt: new Date().toISOString(),
                },
              ],
              isSyncing: false,
            }));
          }
        } catch (error) {
          console.error('Error adding document:', error);
          set({ isSyncing: false });
        }
      },

      updateDocument: async (id, updates) => {
        set({ isSyncing: true });
        try {
          await sync.syncDocuments.update(id, updates);
          set((state) => ({
            documents: state.documents.map((d) =>
              d.id === id ? { ...d, ...updates } : d
            ),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error updating document:', error);
          set({ isSyncing: false });
        }
      },

      deleteDocument: async (id) => {
        set({ isSyncing: true });
        try {
          await sync.syncDocuments.delete(id);
          set((state) => ({
            documents: state.documents.filter((d) => d.id !== id),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error deleting document:', error);
          set({ isSyncing: false });
        }
      },

      // Phase actions
      addPhase: async (phase) => {
        set({ isSyncing: true });
        try {
          const id = await sync.syncPhases.add(phase);
          if (id) {
            set((state) => ({
              phases: [
                ...state.phases,
                {
                  ...phase,
                  id,
                },
              ],
              isSyncing: false,
            }));
          }
        } catch (error) {
          console.error('Error adding phase:', error);
          set({ isSyncing: false });
        }
      },

      deletePhase: async (id) => {
        set({ isSyncing: true });
        try {
          await sync.syncPhases.delete(id);
          set((state) => ({
            phases: state.phases.filter((p) => p.id !== id),
            isSyncing: false,
          }));
        } catch (error) {
          console.error('Error deleting phase:', error);
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'site-manager-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

