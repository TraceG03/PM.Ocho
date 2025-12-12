# Supabase Setup Guide

## Step 1: Run the SQL Schema

1. Go to your Supabase project dashboard: https://qsocvmsfedmdnsjgsoyg.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click **Run** (or press Ctrl+Enter)

This will create all the necessary tables:
- `phases` - Project phases
- `milestones` - Project milestones
- `files` - Uploaded files (with base64 data)
- `documents` - Plans and contracts
- `photos` - Photos and images
- `tasks` - Daily tasks

## Step 2: Verify Tables Were Created

1. In Supabase dashboard, go to **Table Editor**
2. You should see all 6 tables listed
3. Check that the initial dummy data was inserted (2 phases, 2 milestones)

## Step 3: Get Your API Keys

1. Go to **Settings** → **API** in Supabase dashboard
2. Copy your:
   - **Project URL**: `https://qsocvmsfedmdnsjgsoyg.supabase.co`
   - **anon/public key**: (This is the key you'll use in the frontend)

## Step 4: Install Supabase Client (When Ready)

When you're ready to connect the app to Supabase:

```bash
npm install @supabase/supabase-js
```

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the SQL schema in the correct order
- The SQL file creates tables in the right order (files before documents/photos)
- Try running the SQL again - it uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run

### Error: "permission denied"
- Check that Row Level Security policies were created
- The SQL includes policies that allow all operations for development

### Tables created but no data
- The initial data insert uses `ON CONFLICT DO NOTHING`, so if you run it multiple times, it won't duplicate
- Check the Table Editor to see if data exists








