-- Supabase Schema for Construction Project Management App
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Phases Table
CREATE TABLE IF NOT EXISTS phases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Milestones Table (references phases)
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    phase_id TEXT NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Files Table (stores uploaded file metadata and base64 data)
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    data_url TEXT NOT NULL, -- Base64 data URL
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Documents Table (references files)
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('Plan', 'Contract')),
    title TEXT NOT NULL,
    description TEXT,
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    text_content TEXT, -- Extracted text for AI access
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Photos Table (references files)
CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    caption TEXT,
    date TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('camera', 'library')),
    file_id TEXT REFERENCES files(id) ON DELETE SET NULL,
    image_url TEXT, -- Data URL for image preview
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tasks Table (references milestones and documents)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Normal', 'High')),
    crew TEXT,
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    related_milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
    related_document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_milestones_phase_id ON milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_milestones_start_date ON milestones(start_date);
CREATE INDEX IF NOT EXISTS idx_documents_file_id ON documents(file_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_photos_file_id ON photos(file_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_related_milestone_id ON tasks(related_milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_related_document_id ON tasks(related_document_id);

-- Enable Row Level Security (RLS) - Optional, but recommended for production
-- For now, we'll allow all operations. You can add RLS policies later if needed.
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development)
-- In production, you should restrict these based on user authentication
CREATE POLICY "Allow all operations on phases" ON phases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on milestones" ON milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on files" ON files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on documents" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on photos" ON photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- Insert some initial dummy data (optional)
INSERT INTO phases (id, name, color) VALUES
    ('1', 'Foundation Work', '#EF4444'),
    ('2', 'Wall Construction', '#3B82F6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO milestones (id, title, start_date, end_date, phase_id, notes) VALUES
    ('1', 'Foundation Complete', '2024-01-15', '2024-02-15', '1', 'Foundation work completed successfully'),
    ('2', 'Frame Walls', '2024-02-16', '2024-03-30', '2', 'Wall framing in progress')
ON CONFLICT (id) DO NOTHING;








