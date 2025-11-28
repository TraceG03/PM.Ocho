import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Keep the same interfaces for compatibility
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
  dataUrl: string;
  uploadedAt: string;
  storagePath?: string;
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
  error: string | null;
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
  uploadFile: (file: File, bucket: 'documents' | 'photos') => Promise<string>;
  getFile: (fileId: string) => UploadedFile | undefined;
  deleteFile: (fileId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const presetColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

// Helper to get current user ID (for now, using a default - you can add auth later)
const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
    setupRealtimeSubscriptions();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = await getUserId();

      // Load phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .order('created_at', { ascending: true });

      if (phasesError) throw phasesError;
      setPhases(phasesData?.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
      })) || []);

      // Load milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .order('start_date', { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData?.map(m => ({
        id: m.id,
        title: m.title,
        startDate: m.start_date,
        endDate: m.end_date,
        phaseId: m.phase_id,
        notes: m.notes || '',
      })) || []);

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('date', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData?.map(t => ({
        id: t.id,
        name: t.name,
        date: t.date,
        category: t.category,
        priority: t.priority,
        crew: t.crew || '',
        notes: t.notes || '',
        completed: t.completed,
        relatedMilestoneId: t.related_milestone_id || undefined,
        relatedDocumentId: t.related_document_id || undefined,
      })) || []);

      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData?.map(d => ({
        id: d.id,
        type: d.type,
        title: d.title,
        description: d.description || '',
        fileId: d.file_id,
        textContent: d.text_content || undefined,
        uploadedAt: d.uploaded_at,
      })) || []);

      // Load photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .order('date', { ascending: false });

      if (photosError) throw photosError;
      setPhotos(photosData?.map(p => ({
        id: p.id,
        caption: p.caption || '',
        date: p.date,
        source: p.source,
        fileId: p.file_id || undefined,
        imageUrl: p.storage_path ? getStorageUrl('photos', p.storage_path) : undefined,
      })) || []);

      // Load files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (filesError) throw filesError;
      
      // For files, we need to get the actual file data from storage
      const filesWithData = await Promise.all(
        (filesData || []).map(async (f) => {
          const { data } = await supabase.storage
            .from(f.storage_path.includes('documents') ? 'documents' : 'photos')
            .download(f.storage_path.split('/').pop() || '');
          
          let dataUrl = '';
          if (data) {
            dataUrl = URL.createObjectURL(data);
          }
          
          return {
            id: f.id,
            name: f.name,
            type: f.type,
            size: f.size,
            dataUrl,
            uploadedAt: f.uploaded_at,
            storagePath: f.storage_path,
          };
        })
      );
      
      setFiles(filesWithData);

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to real-time updates (optional but nice)
    const phasesChannel = supabase
      .channel('phases-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'phases' }, () => {
        loadAllData();
      })
      .subscribe();

    const milestonesChannel = supabase
      .channel('milestones-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, () => {
        loadAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(phasesChannel);
      supabase.removeChannel(milestonesChannel);
    };
  };

  const getStorageUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  // Phase operations
  const addPhase = async (phase: Omit<Phase, 'id'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('phases')
        .insert([{ name: phase.name, color: phase.color, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPhases([...phases, { id: data.id, name: data.name, color: data.color }]);
      }
    } catch (err: any) {
      console.error('Error adding phase:', err);
      setError(err.message);
      throw err;
    }
  };

  const updatePhase = async (id: string, updatedPhase: Partial<Phase>) => {
    try {
      const updateData: any = {};
      if (updatedPhase.name) updateData.name = updatedPhase.name;
      if (updatedPhase.color) updateData.color = updatedPhase.color;

      const { error } = await supabase
        .from('phases')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      setPhases(phases.map(p => p.id === id ? { ...p, ...updatedPhase } : p));
    } catch (err: any) {
      console.error('Error updating phase:', err);
      setError(err.message);
      throw err;
    }
  };

  const deletePhase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('phases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPhases(phases.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting phase:', err);
      setError(err.message);
      throw err;
    }
  };

  // Milestone operations
  const addMilestone = async (milestone: Omit<Milestone, 'id'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('milestones')
        .insert([{
          title: milestone.title,
          start_date: milestone.startDate,
          end_date: milestone.endDate,
          phase_id: milestone.phaseId,
          notes: milestone.notes,
          user_id: userId,
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMilestones([...milestones, {
          id: data.id,
          title: data.title,
          startDate: data.start_date,
          endDate: data.end_date,
          phaseId: data.phase_id,
          notes: data.notes || '',
        }]);
      }
    } catch (err: any) {
      console.error('Error adding milestone:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateMilestone = async (id: string, updatedMilestone: Partial<Milestone>) => {
    try {
      const updateData: any = {};
      if (updatedMilestone.title) updateData.title = updatedMilestone.title;
      if (updatedMilestone.startDate) updateData.start_date = updatedMilestone.startDate;
      if (updatedMilestone.endDate) updateData.end_date = updatedMilestone.endDate;
      if (updatedMilestone.phaseId) updateData.phase_id = updatedMilestone.phaseId;
      if (updatedMilestone.notes !== undefined) updateData.notes = updatedMilestone.notes;

      const { error } = await supabase
        .from('milestones')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      setMilestones(milestones.map(m => {
        if (m.id === id) {
          return {
            ...m,
            ...updatedMilestone,
            startDate: updatedMilestone.startDate || m.startDate,
            endDate: updatedMilestone.endDate || m.endDate,
          };
        }
        return m;
      }));
    } catch (err: any) {
      console.error('Error updating milestone:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMilestones(milestones.filter(m => m.id !== id));
    } catch (err: any) {
      console.error('Error deleting milestone:', err);
      setError(err.message);
      throw err;
    }
  };

  // Task operations
  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          name: task.name,
          date: task.date,
          category: task.category,
          priority: task.priority,
          crew: task.crew,
          notes: task.notes,
          completed: task.completed || false,
          related_milestone_id: task.relatedMilestoneId || null,
          related_document_id: task.relatedDocumentId || null,
          user_id: userId,
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTasks([...tasks, {
          id: data.id,
          name: data.name,
          date: data.date,
          category: data.category,
          priority: data.priority,
          crew: data.crew || '',
          notes: data.notes || '',
          completed: data.completed,
          relatedMilestoneId: data.related_milestone_id || undefined,
          relatedDocumentId: data.related_document_id || undefined,
        }]);
      }
    } catch (err: any) {
      console.error('Error adding task:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (id: string, updatedTask: Partial<Task>) => {
    try {
      const updateData: any = {};
      if (updatedTask.name) updateData.name = updatedTask.name;
      if (updatedTask.date) updateData.date = updatedTask.date;
      if (updatedTask.category) updateData.category = updatedTask.category;
      if (updatedTask.priority) updateData.priority = updatedTask.priority;
      if (updatedTask.crew !== undefined) updateData.crew = updatedTask.crew;
      if (updatedTask.notes !== undefined) updateData.notes = updatedTask.notes;
      if (updatedTask.completed !== undefined) updateData.completed = updatedTask.completed;
      if (updatedTask.relatedMilestoneId !== undefined) updateData.related_milestone_id = updatedTask.relatedMilestoneId || null;
      if (updatedTask.relatedDocumentId !== undefined) updateData.related_document_id = updatedTask.relatedDocumentId || null;

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === id ? { ...t, ...updatedTask } : t));
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message);
      throw err;
    }
  };

  // Document operations
  const addDocument = async (document: Omit<Document, 'id' | 'uploadedAt'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          type: document.type,
          title: document.title,
          description: document.description,
          file_id: document.fileId,
          text_content: document.textContent || null,
          user_id: userId,
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setDocuments([...documents, {
          id: data.id,
          type: data.type,
          title: data.title,
          description: data.description || '',
          fileId: data.file_id,
          textContent: data.text_content || undefined,
          uploadedAt: data.uploaded_at,
        }]);
      }
    } catch (err: any) {
      console.error('Error adding document:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateDocumentText = async (id: string, textContent: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ text_content: textContent })
        .eq('id', id);

      if (error) throw error;
      setDocuments(documents.map(d => d.id === id ? { ...d, textContent } : d));
    } catch (err: any) {
      console.error('Error updating document text:', err);
      setError(err.message);
      throw err;
    }
  };

  // Photo operations
  const addPhoto = async (photo: Omit<Photo, 'id'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('photos')
        .insert([{
          caption: photo.caption,
          date: photo.date,
          source: photo.source,
          file_id: photo.fileId || null,
          storage_path: photo.imageUrl || null,
          user_id: userId,
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPhotos([...photos, {
          id: data.id,
          caption: data.caption || '',
          date: data.date,
          source: data.source,
          fileId: data.file_id || undefined,
          imageUrl: data.storage_path ? getStorageUrl('photos', data.storage_path) : undefined,
        }]);
      }
    } catch (err: any) {
      console.error('Error adding photo:', err);
      setError(err.message);
      throw err;
    }
  };

  // File operations
  const uploadFile = async (file: File, bucket: 'documents' | 'photos'): Promise<string> => {
    try {
      const userId = await getUserId();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = userId ? `${userId}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert([{
          name: file.name,
          type: file.type,
          size: file.size,
          storage_path: filePath,
          user_id: userId,
        }])
        .select()
        .single();

      if (fileError) throw fileError;

      // Add to local state
      const newFile: UploadedFile = {
        id: fileData.id,
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        dataUrl: urlData.publicUrl,
        uploadedAt: fileData.uploaded_at,
        storagePath: fileData.storage_path,
      };

      setFiles([...files, newFile]);
      return fileData.id;
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message);
      throw err;
    }
  };

  const getFile = (fileId: string): UploadedFile | undefined => {
    return files.find(f => f.id === fileId);
  };

  const deleteFile = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      // Delete from storage
      if (file.storagePath) {
        const bucket = file.storagePath.includes('documents') ? 'documents' : 'photos';
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([file.storagePath]);

        if (storageError) console.error('Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err: any) {
      console.error('Error deleting file:', err);
      setError(err.message);
      throw err;
    }
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
        error,
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

