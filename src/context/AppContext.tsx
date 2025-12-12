import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type definitions
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
  completed?: boolean;
}

export interface Task {
  id: string;
  name: string;
  date: string;
  endDate?: string;
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
  dataUrl: string;
  uploadedAt: string;
}

export interface Document {
  id: string;
  type: 'Plan' | 'Contract';
  title: string;
  description: string;
  fileId: string;
  textContent?: string;
  uploadedAt: string;
}

export interface Photo {
  id: string;
  caption: string;
  date: string;
  source: 'camera' | 'library';
  fileId?: string;
  imageUrl?: string;
}

interface AppContextType {
  phases: Phase[];
  milestones: Milestone[];
  tasks: Task[];
  documents: Document[];
  photos: Photo[];
  files: UploadedFile[];
  loading: boolean;
  addPhase: (phase: Omit<Phase, 'id'>) => Promise<void>;
  updatePhase: (id: string, phase: Partial<Phase>) => Promise<void>;
  deletePhase: (id: string) => Promise<void>;
  addMilestone: (milestone: Omit<Milestone, 'id'>) => Promise<void>;
  updateMilestone: (id: string, milestone: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addDocument: (document: Omit<Document, 'id' | 'uploadedAt'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateDocumentText: (id: string, textContent: string) => Promise<void>;
  addPhoto: (photo: Omit<Photo, 'id'>) => Promise<void>;
  uploadFile: (file: File) => Promise<UploadedFile>;
  getFile: (fileId: string) => UploadedFile | undefined;
  deleteFile: (fileId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const presetColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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

// localStorage helpers
const STORAGE_KEYS = {
  phases: 'ocho_phases',
  milestones: 'ocho_milestones',
  tasks: 'ocho_tasks',
  documents: 'ocho_documents',
  photos: 'ocho_photos',
  files: 'ocho_files',
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data from localStorage on mount
  useEffect(() => {
    const loadedPhases = loadFromStorage<Phase[]>(STORAGE_KEYS.phases, defaultPhases);
    const loadedMilestones = loadFromStorage<Milestone[]>(STORAGE_KEYS.milestones, []);
    const loadedTasks = loadFromStorage<Task[]>(STORAGE_KEYS.tasks, []);
    const loadedDocuments = loadFromStorage<Document[]>(STORAGE_KEYS.documents, []);
    const loadedPhotos = loadFromStorage<Photo[]>(STORAGE_KEYS.photos, []);
    const loadedFiles = loadFromStorage<UploadedFile[]>(STORAGE_KEYS.files, []);

    setPhases(loadedPhases.length > 0 ? loadedPhases : defaultPhases);
    setMilestones(loadedMilestones);
    setTasks(loadedTasks);
    setDocuments(loadedDocuments);
    setPhotos(loadedPhotos);
    setFiles(loadedFiles);
    setLoading(false);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEYS.phases, phases);
    }
  }, [phases, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEYS.milestones, milestones);
    }
  }, [milestones, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEYS.tasks, tasks);
    }
  }, [tasks, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEYS.documents, documents);
    }
  }, [documents, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEYS.photos, photos);
    }
  }, [photos, loading]);

  useEffect(() => {
    if (!loading) {
      saveToStorage(STORAGE_KEYS.files, files);
    }
  }, [files, loading]);

  // Phase operations
  const addPhase = async (phase: Omit<Phase, 'id'>) => {
    const id = Date.now().toString();
    setPhases(prev => [...prev, { ...phase, id }]);
  };

  const updatePhase = async (id: string, updatedPhase: Partial<Phase>) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, ...updatedPhase } : p));
  };

  const deletePhase = async (id: string) => {
    setPhases(prev => prev.filter(p => p.id !== id));
  };

  // Milestone operations
  const addMilestone = async (milestone: Omit<Milestone, 'id'>) => {
    const id = Date.now().toString();
    setMilestones(prev => [...prev, { ...milestone, id }]);
  };

  const updateMilestone = async (id: string, updatedMilestone: Partial<Milestone>) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, ...updatedMilestone };
      }
      return m;
    }));
  };

  const deleteMilestone = async (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  // Task operations
  const addTask = async (task: Omit<Task, 'id'>) => {
    const id = Date.now().toString();
    setTasks(prev => [...prev, { ...task, id, completed: false }]);
  };

  const updateTask = async (id: string, updatedTask: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedTask } : t));
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // File operations
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
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
          setFiles(prev => [...prev, uploadedFile]);
          resolve(uploadedFile);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getFile = (fileId: string): UploadedFile | undefined => {
    return files.find(f => f.id === fileId);
  };

  const deleteFile = async (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setDocuments(prev => prev.filter(d => d.fileId !== fileId));
    setPhotos(prev => prev.map(p => p.fileId === fileId ? { ...p, fileId: undefined, imageUrl: undefined } : p));
  };

  // Document operations
  const addDocument = async (document: Omit<Document, 'id' | 'uploadedAt'>) => {
    const id = Date.now().toString();
    const uploadedAt = new Date().toISOString();
    setDocuments(prev => [...prev, { ...document, id, uploadedAt }]);
  };

  const deleteDocument = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc?.fileId) {
      await deleteFile(doc.fileId);
    }
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const updateDocumentText = async (id: string, textContent: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, textContent } : d));
  };

  // Photo operations
  const addPhoto = async (photo: Omit<Photo, 'id'>) => {
    const id = Date.now().toString();
    setPhotos(prev => [...prev, { ...photo, id }]);
  };

  return (
    <AppContext.Provider
      value={{
        phases,
        milestones,
        tasks,
        documents,
        photos,
        files,
        loading,
        addPhase,
        updatePhase,
        deletePhase,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        addTask,
        updateTask,
        deleteTask,
        addDocument,
        deleteDocument,
        updateDocumentText,
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
