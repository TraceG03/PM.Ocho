import { supabase } from './supabase';
import type { Milestone, Task, Phase, Note, Photo, Report, Document } from '../store/siteManagerStore';

// Sync Milestones
export const syncMilestones = {
  async load(): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.notes || '',
        startDate: m.start_date,
        endDate: m.end_date,
        phase: m.phase_id,
        completed: m.completed || false,
        createdAt: m.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error loading milestones:', error);
      return [];
    }
  },

  async add(milestone: Omit<Milestone, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .insert({
          title: milestone.title,
          notes: milestone.description || '',
          start_date: milestone.startDate,
          end_date: milestone.endDate,
          phase_id: milestone.phase,
          completed: milestone.completed || false,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error adding milestone:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Milestone>): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.notes = updates.description;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
      if (updates.phase !== undefined) updateData.phase_id = updates.phase;
      if (updates.completed !== undefined) updateData.completed = updates.completed;

      const { error } = await supabase
        .from('milestones')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating milestone:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      return false;
    }
  },
};

// Sync Tasks
export const syncTasks = {
  async load(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        priority: (t.priority as 'Normal' | 'High' | 'Critical') || 'Normal',
        completed: t.completed || false,
        dueDate: t.due_date || undefined,
        milestoneId: t.milestone_id || undefined,
        documentId: t.document_id || undefined,
        createdAt: t.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  },

  async add(task: Omit<Task, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description || '',
          priority: task.priority || 'Normal',
          completed: task.completed || false,
          due_date: task.dueDate || null,
          milestone_id: task.milestoneId || null,
          document_id: task.documentId || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.milestoneId !== undefined) updateData.milestone_id = updates.milestoneId;
      if (updates.documentId !== undefined) updateData.document_id = updates.documentId;

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  },
};

// Sync Phases
export const syncPhases = {
  async load(): Promise<Phase[]> {
    try {
      const { data, error } = await supabase
        .from('phases')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        color: p.color || '#6b7280',
      }));
    } catch (error) {
      console.error('Error loading phases:', error);
      return [];
    }
  },

  async add(phase: Omit<Phase, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('phases')
        .insert({
          name: phase.name,
          color: phase.color,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error adding phase:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('phases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting phase:', error);
      return false;
    }
  },
};

// Sync Notes
export const syncNotes = {
  async load(): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content || '',
        category: n.category || '',
        documentId: n.document_id || undefined,
        createdAt: n.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  },

  async add(note: Omit<Note, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: note.title,
          content: note.content,
          category: note.category || '',
          document_id: note.documentId || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error adding note:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Note>): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.documentId !== undefined) updateData.document_id = updates.documentId;

      const { error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  },
};

// Sync Reports
export const syncReports = {
  async load(): Promise<Report[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        type: (r.type as 'daily' | 'weekly') || 'daily',
        content: r.content || '',
        photos: r.photos || [],
        date: r.date || new Date().toISOString(),
        createdAt: r.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  },

  async add(report: Omit<Report, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          type: report.type,
          content: report.content,
          photos: report.photos || [],
          date: report.date,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error adding report:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  },
};

// Sync Documents
export const syncDocuments = {
  async load(): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        uri: d.uri || d.url || '',
        type: (d.type as 'pdf' | 'image') || 'pdf',
        extractedText: d.extracted_text || undefined,
        createdAt: d.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  },

  async add(document: Omit<Document, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: document.name,
          uri: document.uri,
          type: document.type,
          extracted_text: document.extractedText || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error adding document:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Document>): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.uri !== undefined) updateData.uri = updates.uri;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.extractedText !== undefined) updateData.extracted_text = updates.extractedText;

      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  },
};

// Sync Photos (stored as JSON in reports or separate table)
export const syncPhotos = {
  async load(): Promise<Photo[]> {
    try {
      // Photos might be stored in reports or a separate photos table
      // For now, we'll extract from reports
      const reports = await syncReports.load();
      const photos: Photo[] = [];
      
      reports.forEach(report => {
        report.photos.forEach((photoUri, index) => {
          photos.push({
            id: `${report.id}-photo-${index}`,
            uri: photoUri,
            date: report.date,
            createdAt: report.createdAt,
          });
        });
      });

      return photos;
    } catch (error) {
      console.error('Error loading photos:', error);
      return [];
    }
  },
};

