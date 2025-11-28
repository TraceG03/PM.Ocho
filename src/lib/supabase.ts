import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (matching your SQL schema)
export interface Database {
  public: {
    Tables: {
      phases: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string | null;
        };
      };
      milestones: {
        Row: {
          id: string;
          title: string;
          start_date: string;
          end_date: string;
          phase_id: string;
          notes: string;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          start_date: string;
          end_date: string;
          phase_id: string;
          notes?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          start_date?: string;
          end_date?: string;
          phase_id?: string;
          notes?: string;
          user_id?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          name: string;
          date: string;
          category: string;
          priority: 'Normal' | 'High';
          crew: string;
          notes: string;
          completed: boolean;
          related_milestone_id: string | null;
          related_document_id: string | null;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          category: string;
          priority?: 'Normal' | 'High';
          crew?: string;
          notes?: string;
          completed?: boolean;
          related_milestone_id?: string | null;
          related_document_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          category?: string;
          priority?: 'Normal' | 'High';
          crew?: string;
          notes?: string;
          completed?: boolean;
          related_milestone_id?: string | null;
          related_document_id?: string | null;
          user_id?: string | null;
        };
      };
      files: {
        Row: {
          id: string;
          name: string;
          type: string;
          size: number;
          storage_path: string;
          uploaded_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          size: number;
          storage_path: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          size?: number;
          storage_path?: string;
          user_id?: string | null;
        };
      };
      documents: {
        Row: {
          id: string;
          type: 'Plan' | 'Contract';
          title: string;
          description: string;
          file_id: string;
          text_content: string | null;
          uploaded_at: string;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          type: 'Plan' | 'Contract';
          title: string;
          description?: string;
          file_id: string;
          text_content?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          type?: 'Plan' | 'Contract';
          title?: string;
          description?: string;
          file_id?: string;
          text_content?: string | null;
          user_id?: string | null;
        };
      };
      photos: {
        Row: {
          id: string;
          caption: string;
          date: string;
          source: 'camera' | 'library';
          file_id: string | null;
          storage_path: string | null;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          caption?: string;
          date: string;
          source: 'camera' | 'library';
          file_id?: string | null;
          storage_path?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          caption?: string;
          date?: string;
          source?: 'camera' | 'library';
          file_id?: string | null;
          storage_path?: string | null;
          user_id?: string | null;
        };
      };
    };
  };
}

