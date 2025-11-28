import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qsocvmsfedmdnsjgsoyg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzb2N2bXNmZWRtZG5zamdzb3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTI0MTYsImV4cCI6MjA3OTkyODQxNn0.vlp_b7JCzTcxek6rZ9hMneHJGp-HhLALHOl04_k2kTs';

if (!supabaseAnonKey) {
  console.warn('Supabase anon key not found. Please set VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

