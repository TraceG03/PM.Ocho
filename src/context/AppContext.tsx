import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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
}

export interface Task {
  id: string;
  name: string;
  date: string;
  endDate?: string; // Optional end date for multi-day tasks
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data from Supabase
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load phases
      const { data: phasesData } = await supabase.from('phases').select('*').order('created_at');
      if (phasesData) {
        setPhases(phasesData.map(p => ({ id: p.id, name: p.name, color: p.color })));
      }

      // Load milestones
      const { data: milestonesData } = await supabase.from('milestones').select('*').order('start_date');
      if (milestonesData) {
        setMilestones(milestonesData.map(m => ({
          id: m.id,
          title: m.title,
          startDate: m.start_date,
          endDate: m.end_date,
          phaseId: m.phase_id,
          notes: m.notes || '',
        })));
      }

      // Load tasks
      const { data: tasksData } = await supabase.from('tasks').select('*').order('date', { ascending: false });
      if (tasksData) {
        setTasks(tasksData.map(t => ({
          id: t.id,
          name: t.name,
          date: t.date,
          category: t.category,
          priority: t.priority,
          crew: t.crew || '',
          notes: t.notes || '',
          completed: t.completed || false,
          relatedMilestoneId: t.related_milestone_id,
          relatedDocumentId: t.related_document_id,
        })));
      }

      // Load files
      const { data: filesData } = await supabase.from('files').select('*').order('uploaded_at', { ascending: false });
      if (filesData) {
        setFiles(filesData.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          dataUrl: f.data_url,
          uploadedAt: f.uploaded_at,
        })));
      }

      // Load documents
      const { data: documentsData } = await supabase.from('documents').select('*').order('uploaded_at', { ascending: false });
      if (documentsData) {
        setDocuments(documentsData.map(d => ({
          id: d.id,
          type: d.type,
          title: d.title,
          description: d.description || '',
          fileId: d.file_id,
          textContent: d.text_content,
          uploadedAt: d.uploaded_at,
        })));
      }

      // Load photos
      const { data: photosData } = await supabase.from('photos').select('*').order('created_at', { ascending: false });
      if (photosData) {
        setPhotos(photosData.map(p => ({
          id: p.id,
          caption: p.caption || '',
          date: p.date,
          source: p.source,
          fileId: p.file_id,
          imageUrl: p.image_url,
        })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Phase operations
  const addPhase = async (phase: Omit<Phase, 'id'>) => {
    const id = Date.now().toString();
    await supabase.from('phases').insert({ id, name: phase.name, color: phase.color });
    setPhases(prev => [...prev, { ...phase, id }]);
  };

  const updatePhase = async (id: string, updatedPhase: Partial<Phase>) => {
    await supabase.from('phases').update({
      name: updatedPhase.name,
      color: updatedPhase.color,
    }).eq('id', id);
    setPhases(prev => prev.map(p => p.id === id ? { ...p, ...updatedPhase } : p));
  };

  const deletePhase = async (id: string) => {
    await supabase.from('phases').delete().eq('id', id);
    setPhases(prev => prev.filter(p => p.id !== id));
  };

  // Milestone operations
  const addMilestone = async (milestone: Omit<Milestone, 'id'>) => {
    const id = Date.now().toString();
    await supabase.from('milestones').insert({
      id,
      title: milestone.title,
      start_date: milestone.startDate,
      end_date: milestone.endDate,
      phase_id: milestone.phaseId,
      notes: milestone.notes || '',
    });
    setMilestones(prev => [...prev, { ...milestone, id }]);
  };

  const updateMilestone = async (id: string, updatedMilestone: Partial<Milestone>) => {
    const updateData: any = {};
    if (updatedMilestone.title !== undefined) updateData.title = updatedMilestone.title;
    if (updatedMilestone.startDate !== undefined) updateData.start_date = updatedMilestone.startDate;
    if (updatedMilestone.endDate !== undefined) updateData.end_date = updatedMilestone.endDate;
    if (updatedMilestone.phaseId !== undefined) updateData.phase_id = updatedMilestone.phaseId;
    if (updatedMilestone.notes !== undefined) updateData.notes = updatedMilestone.notes;
    
    await supabase.from('milestones').update(updateData).eq('id', id);
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          ...updatedMilestone,
          startDate: updatedMilestone.startDate ?? m.startDate,
          endDate: updatedMilestone.endDate ?? m.endDate,
          phaseId: updatedMilestone.phaseId ?? m.phaseId,
        };
      }
      return m;
    }));
  };

  const deleteMilestone = async (id: string) => {
    await supabase.from('milestones').delete().eq('id', id);
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  // Task operations
  const addTask = async (task: Omit<Task, 'id'>) => {
    const id = Date.now().toString();
    await supabase.from('tasks').insert({
      id,
      name: task.name,
      date: task.date,
      end_date: task.endDate || null,
      category: task.category,
      priority: task.priority,
      crew: task.crew || '',
      notes: task.notes || '',
      completed: false,
      related_milestone_id: task.relatedMilestoneId || null,
      related_document_id: task.relatedDocumentId || null,
    });
    setTasks(prev => [...prev, { ...task, id, completed: false }]);
  };

  const updateTask = async (id: string, updatedTask: Partial<Task>) => {
    const updateData: any = {};
    if (updatedTask.name !== undefined) updateData.name = updatedTask.name;
    if (updatedTask.date !== undefined) updateData.date = updatedTask.date;
    if (updatedTask.endDate !== undefined) updateData.end_date = updatedTask.endDate || null;
    if (updatedTask.category !== undefined) updateData.category = updatedTask.category;
    if (updatedTask.priority !== undefined) updateData.priority = updatedTask.priority;
    if (updatedTask.crew !== undefined) updateData.crew = updatedTask.crew;
    if (updatedTask.notes !== undefined) updateData.notes = updatedTask.notes;
    if (updatedTask.completed !== undefined) updateData.completed = updatedTask.completed;
    if (updatedTask.relatedMilestoneId !== undefined) updateData.related_milestone_id = updatedTask.relatedMilestoneId || null;
    if (updatedTask.relatedDocumentId !== undefined) updateData.related_document_id = updatedTask.relatedDocumentId || null;
    
    await supabase.from('tasks').update(updateData).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedTask } : t));
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // File operations
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
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

          await supabase.from('files').insert({
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            data_url: dataUrl,
          });

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
    await supabase.from('files').delete().eq('id', fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setDocuments(prev => prev.filter(d => d.fileId !== fileId));
    setPhotos(prev => prev.map(p => p.fileId === fileId ? { ...p, fileId: undefined, imageUrl: undefined } : p));
  };

  // Document operations
  const addDocument = async (document: Omit<Document, 'id' | 'uploadedAt'>) => {
    const id = Date.now().toString();
    const uploadedAt = new Date().toISOString();
    await supabase.from('documents').insert({
      id,
      type: document.type,
      title: document.title,
      description: document.description || '',
      file_id: document.fileId,
      text_content: document.textContent || null,
    });
    setDocuments(prev => [...prev, { ...document, id, uploadedAt }]);
  };

  const deleteDocument = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc?.fileId) {
      await deleteFile(doc.fileId);
    }
    await supabase.from('documents').delete().eq('id', id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const updateDocumentText = async (id: string, textContent: string) => {
    await supabase.from('documents').update({ text_content: textContent }).eq('id', id);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, textContent } : d));
  };

  // Photo operations
  const addPhoto = async (photo: Omit<Photo, 'id'>) => {
    const id = Date.now().toString();
    await supabase.from('photos').insert({
      id,
      caption: photo.caption || '',
      date: photo.date,
      source: photo.source,
      file_id: photo.fileId || null,
      image_url: photo.imageUrl || null,
    });
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
