-- Supabase Schema for Ocho Construction App
-- Run this in your Supabase SQL Editor

-- Drop existing tables if you want to start fresh (uncomment if needed)
-- DROP TABLE IF EXISTS photos CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS files CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS milestones CASCADE;
-- DROP TABLE IF EXISTS phases CASCADE;

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
    phase_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table (for storing uploaded file data)
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    data_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    end_date TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High')),
    crew TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    completed BOOLEAN DEFAULT FALSE,
    related_milestone_id TEXT,
    related_document_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table (Plans & Contracts)
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('Plan', 'Contract')),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    file_id TEXT,
    text_content TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    caption TEXT DEFAULT '',
    date TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('camera', 'library')),
    file_id TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on phases" ON phases;
DROP POLICY IF EXISTS "Allow all operations on milestones" ON milestones;
DROP POLICY IF EXISTS "Allow all operations on files" ON files;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;
DROP POLICY IF EXISTS "Allow all operations on photos" ON photos;

-- Create policies to allow all operations (for public access without auth)
CREATE POLICY "Allow all operations on phases" ON phases
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on milestones" ON milestones
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on files" ON files
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks" ON tasks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on documents" ON documents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on photos" ON photos
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
