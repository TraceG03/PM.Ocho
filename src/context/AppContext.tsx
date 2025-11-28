import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Phase {
  id: string;
  name: string;
  color: string;
}

export interface Milestone {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  phaseId: string;
  notes: string;
}

export interface Task {
  id: string;
  name: string;
  date: string;
  category: string;
  priority: 'Normal' | 'High';
  crew: string;
  notes: string;
  completed: boolean;
  relatedMilestoneId?: string;
  relatedDocumentId?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 data URL for preview
  uploadedAt: string;
}

export interface Note {
  id: string;
  type: 'Plan Detail' | 'Spec';
  refNumber: string;
  title: string;
  details: string;
  fileId?: string; // Reference to uploaded file
}

export interface Photo {
  id: string;
  caption: string;
  date: string;
  source: 'camera' | 'library';
  fileId?: string; // Reference to uploaded file
  imageUrl?: string; // Data URL for image preview
}

interface AppContextType {
  phases: Phase[];
  milestones: Milestone[];
  tasks: Task[];
  notes: Note[];
  photos: Photo[];
  files: UploadedFile[];
  addPhase: (phase: Omit<Phase, 'id'>) => void;
  updatePhase: (id: string, phase: Partial<Phase>) => void;
  deletePhase: (id: string) => void;
  addMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  updateMilestone: (id: string, milestone: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addNote: (note: Omit<Note, 'id'>) => void;
  deleteNote: (id: string) => void;
  addPhoto: (photo: Omit<Photo, 'id'>) => void;
  uploadFile: (file: File) => Promise<string>; // Returns file ID
  getFile: (fileId: string) => UploadedFile | undefined;
  deleteFile: (fileId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const presetColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

// Dummy data
const initialPhases: Phase[] = [
  { id: '1', name: 'Foundation Work', color: '#3b82f6' },
  { id: '2', name: 'Wall Construction', color: '#10b981' },
  { id: '3', name: 'Roofing', color: '#f59e0b' },
];

const initialMilestones: Milestone[] = [
  {
    id: '1',
    title: 'Foundation Complete',
    startDate: '2024-11-01',
    endDate: '2024-11-15',
    phaseId: '1',
    notes: 'Concrete foundation and footings',
  },
  {
    id: '2',
    title: 'Frame Walls',
    startDate: '2024-11-16',
    endDate: '2024-11-30',
    phaseId: '2',
    notes: 'Structural framing and sheathing',
  },
];

const initialTasks: Task[] = [
  {
    id: '1',
    name: 'Inspect foundation',
    date: new Date().toISOString().split('T')[0],
    category: 'General',
    priority: 'High',
    crew: 'John Smith',
    notes: 'Check for cracks',
    completed: false,
    relatedMilestoneId: '1',
  },
  {
    id: '2',
    name: 'Order materials',
    date: new Date().toISOString().split('T')[0],
    category: 'General',
    priority: 'Normal',
    crew: 'Jane Doe',
    notes: 'Lumber and hardware',
    completed: false,
  },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phases, setPhases] = useState<Phase[]>(initialPhases);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [notes, setNotes] = useState<Note[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const addPhase = (phase: Omit<Phase, 'id'>) => {
    setPhases([...phases, { ...phase, id: Date.now().toString() }]);
  };

  const updatePhase = (id: string, updatedPhase: Partial<Phase>) => {
    setPhases(phases.map(p => p.id === id ? { ...p, ...updatedPhase } : p));
  };

  const deletePhase = (id: string) => {
    setPhases(phases.filter(p => p.id !== id));
  };

  const addMilestone = (milestone: Omit<Milestone, 'id'>) => {
    setMilestones([...milestones, { ...milestone, id: Date.now().toString() }]);
  };

  const updateMilestone = (id: string, updatedMilestone: Partial<Milestone>) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, ...updatedMilestone } : m));
  };

  const deleteMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    setTasks([...tasks, { ...task, id: Date.now().toString(), completed: false }]);
  };

  const updateTask = (id: string, updatedTask: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updatedTask } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addNote = (note: Omit<Note, 'id'>) => {
    setNotes([...notes, { ...note, id: Date.now().toString() }]);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const addPhoto = (photo: Omit<Photo, 'id'>) => {
    setPhotos([...photos, { ...photo, id: Date.now().toString() }]);
  };

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const fileId = Date.now().toString();
        const uploadedFile: UploadedFile = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        setFiles([...files, uploadedFile]);
        resolve(fileId);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getFile = (fileId: string): UploadedFile | undefined => {
    return files.find(f => f.id === fileId);
  };

  const deleteFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
    // Also remove file references from notes and photos
    setNotes(notes.map(n => n.fileId === fileId ? { ...n, fileId: undefined } : n));
    setPhotos(photos.map(p => p.fileId === fileId ? { ...p, fileId: undefined, imageUrl: undefined } : p));
  };

  return (
    <AppContext.Provider
      value={{
        phases,
        milestones,
        tasks,
        notes,
        photos,
        files,
        addPhase,
        updatePhase,
        deletePhase,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        addTask,
        updateTask,
        deleteTask,
        addNote,
        deleteNote,
        addPhoto,
        uploadFile,
        getFile,
        deleteFile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export { presetColors };

