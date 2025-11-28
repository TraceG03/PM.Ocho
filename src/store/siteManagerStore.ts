import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  phase: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'Normal' | 'High' | 'Critical';
  completed: boolean;
  dueDate?: string;
  milestoneId?: string;
  documentId?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  documentId?: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  uri: string;
  caption?: string;
  date: string;
  createdAt: string;
}

export interface Report {
  id: string;
  type: 'daily' | 'weekly';
  content: string;
  photos: string[];
  date: string;
  createdAt: string;
}

export interface Phase {
  id: string;
  name: string;
  color: string;
}

export interface Document {
  id: string;
  name: string;
  uri: string;
  type: 'pdf' | 'image';
  extractedText?: string;
  createdAt: string;
}

interface SiteManagerState {
  milestones: Milestone[];
  tasks: Task[];
  notes: Note[];
  photos: Photo[];
  reports: Report[];
  documents: Document[];
  phases: Phase[];
  
  // Actions
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt'>) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  addPhoto: (photo: Omit<Photo, 'id' | 'createdAt'>) => void;
  deletePhoto: (id: string) => void;
  
  addReport: (report: Omit<Report, 'id' | 'createdAt'>) => void;
  deleteReport: (id: string) => void;
  
  addDocument: (document: Omit<Document, 'id' | 'createdAt'>) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  
  addPhase: (phase: Omit<Phase, 'id'>) => void;
  deletePhase: (id: string) => void;
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
    (set) => ({
      milestones: [],
      tasks: [],
      notes: [],
      photos: [],
      reports: [],
      documents: [],
      phases: defaultPhases,
      
      addMilestone: (milestone) => set((state) => ({
        milestones: [...state.milestones, {
          ...milestone,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }],
      })),
      
      updateMilestone: (id, updates) => set((state) => ({
        milestones: state.milestones.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      })),
      
      deleteMilestone: (id) => set((state) => ({
        milestones: state.milestones.filter((m) => m.id !== id),
      })),
      
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
          ...task,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }],
      })),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
      
      addNote: (note) => set((state) => ({
        notes: [...state.notes, {
          ...note,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }],
      })),
      
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((n) =>
          n.id === id ? { ...n, ...updates } : n
        ),
      })),
      
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      })),
      
      addPhoto: (photo) => set((state) => ({
        photos: [...state.photos, {
          ...photo,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }],
      })),
      
      deletePhoto: (id) => set((state) => ({
        photos: state.photos.filter((p) => p.id !== id),
      })),
      
      addReport: (report) => set((state) => ({
        reports: [...state.reports, {
          ...report,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }],
      })),
      
      deleteReport: (id) => set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
      })),
      
      addDocument: (document) => set((state) => ({
        documents: [...state.documents, {
          ...document,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }],
      })),
      
      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, ...updates } : d
        ),
      })),
      
      deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      })),
      
      addPhase: (phase) => set((state) => ({
        phases: [...state.phases, {
          ...phase,
          id: Date.now().toString(),
        }],
      })),
      
      deletePhase: (id) => set((state) => ({
        phases: state.phases.filter((p) => p.id !== id),
      })),
    }),
    {
      name: 'site-manager-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

