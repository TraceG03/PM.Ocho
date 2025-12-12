-- Migration: Add completed column to milestones table
-- Run this SQL in your Supabase SQL Editor if you already have a milestones table

-- Add the completed column if it doesn't exist
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Update any existing milestones to have completed = false if they're null
UPDATE milestones 
SET completed = FALSE 
WHERE completed IS NULL;

