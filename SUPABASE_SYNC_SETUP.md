# Supabase Sync Setup Guide

This guide will help you set up Supabase to automatically save all changes made in the app.

## Step 1: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` into the editor
4. Run the SQL script to create all necessary tables

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy your **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
3. Copy your **anon/public key** (the `anon` key under "Project API keys")

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your project (copy from `.env.example`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Update Your App to Use Supabase Store

If you're using the web version, update your imports to use the Supabase-enabled store:

```typescript
// Change from:
import { useSiteManagerStore } from '../store/siteManagerStore';

// To:
import { useSiteManagerStore } from '../store/siteManagerStoreWeb';
```

## Step 5: Initialize Supabase Sync in Your App

Add the Supabase sync hook to your main App component:

```typescript
import { useSupabaseSync } from './hooks/useSupabaseSync';

function App() {
  // This will automatically load all data from Supabase on app start
  useSupabaseSync();
  
  // ... rest of your app
}
```

## What Gets Synced

All of the following operations are automatically synced to Supabase:

- ✅ **Milestones**: Add, update, delete, mark as complete
- ✅ **Tasks**: Add, update, delete, mark as complete
- ✅ **Phases**: Add, delete
- ✅ **Notes**: Add, update, delete
- ✅ **Reports**: Add, delete
- ✅ **Documents**: Add, update, delete

## How It Works

1. **On App Start**: All data is loaded from Supabase
2. **On Every Change**: When you add, update, or delete anything, it's immediately saved to Supabase
3. **Offline Support**: Changes are saved locally first, then synced when online
4. **Error Handling**: If Supabase is unavailable, changes are still saved locally

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure your `.env` file exists and has the correct variable names
- Restart your dev server after creating/updating `.env`

### Data not syncing
- Check your Supabase project URL and API key are correct
- Verify the database tables were created successfully
- Check the browser console for error messages
- Ensure Row Level Security (RLS) policies allow your operations

### Tables don't exist
- Run the `supabase-schema.sql` script in your Supabase SQL Editor
- Check that all tables were created successfully

## Security Note

The current setup uses public access. For production, you should:
1. Set up authentication
2. Update RLS policies to restrict access based on user authentication
3. Use service role keys only on the server side

