-- Supabase Schema for Ocho Construction App
-- Run this in your Supabase SQL Editor

-- Phases table
CREATE TABLE IF NOT EXISTS phases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6b7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    phase_id TEXT NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High', 'Critical')),
    completed BOOLEAN DEFAULT FALSE,
    due_date TEXT,
    milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
    document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT '',
    document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
    content TEXT NOT NULL,
    photos JSONB DEFAULT '[]'::jsonb,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    uri TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'image')),
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional, adjust based on your auth needs
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth requirements)
-- For now, we'll allow all operations. You can restrict this later with user authentication.

CREATE POLICY "Allow all operations on phases" ON phases
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on milestones" ON milestones
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on notes" ON notes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on reports" ON reports
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on documents" ON documents
    FOR ALL USING (true) WITH CHECK (true);

-- Insert default phases if they don't exist
INSERT INTO phases (id, name, color) VALUES
    ('1', 'Site Prep', '#ef4444'),
    ('2', 'Foundation', '#f97316'),
    ('3', 'Masonry', '#f59e0b'),
    ('4', 'Roof', '#eab308'),
    ('5', 'Electrical', '#84cc16'),
    ('6', 'Plumbing/PTAR', '#22c55e'),
    ('7', 'Finishes', '#10b981'),
    ('8', 'Inspection', '#ec4899')
ON CONFLICT (id) DO NOTHING;
