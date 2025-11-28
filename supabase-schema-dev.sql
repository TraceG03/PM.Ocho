-- DEVELOPMENT VERSION: Works without authentication
-- For production, use the full schema with proper RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES (user_id is nullable for dev)
-- ============================================

-- Phases table
CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('Normal', 'High')) DEFAULT 'Normal',
  crew TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  completed BOOLEAN DEFAULT FALSE,
  related_milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('Plan', 'Contract')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  text_content TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caption TEXT DEFAULT '',
  date DATE NOT NULL,
  source TEXT CHECK (source IN ('camera', 'library')) NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_phases_user_id ON phases(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_phase_id ON milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_related_milestone ON tasks(related_milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_related_document ON tasks(related_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_file_id ON documents(file_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_date ON photos(date);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_text_content ON documents USING gin(to_tsvector('english', text_content));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_phases_updated_at ON phases;
CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES (Allows null user_id for dev)
-- ============================================

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all for development" ON phases;
DROP POLICY IF EXISTS "Allow all for development" ON milestones;
DROP POLICY IF EXISTS "Allow all for development" ON tasks;
DROP POLICY IF EXISTS "Allow all for development" ON files;
DROP POLICY IF EXISTS "Allow all for development" ON documents;
DROP POLICY IF EXISTS "Allow all for development" ON photos;

-- Development policies (allow all operations)
CREATE POLICY "Allow all for development" ON phases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for development" ON photos FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE SETUP
-- ============================================

-- Create storage buckets (run this separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', false) ON CONFLICT DO NOTHING;

-- Storage policies (allow all for dev)
DROP POLICY IF EXISTS "Allow all storage for development" ON storage.objects;
CREATE POLICY "Allow all storage for development" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

