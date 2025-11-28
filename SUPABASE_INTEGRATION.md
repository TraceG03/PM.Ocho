# Supabase Integration Guide

## Step 1: Install Supabase Client

Run this command in your terminal:

```bash
npm install @supabase/supabase-js
```

If you get a PowerShell execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try the npm install again.

**Note:** If npm install still fails, you can manually add this to your `package.json` dependencies:
```json
"@supabase/supabase-js": "^2.39.0"
```
Then run `npm install` again.

## Step 2: Get Your Supabase Anon Key

1. Go to your Supabase dashboard: https://qsocvmsfedmdnsjgsoyg.supabase.co
2. Click **Settings** → **API**
3. Copy the **anon/public** key (not the service_role key)

## Step 3: Create .env File

Create a file named `.env` in the root of your project with:

```
VITE_SUPABASE_URL=https://qsocvmsfedmdnsjgsoyg.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

**Important:** Replace `paste_your_anon_key_here` with the actual anon key from Step 2.

## Step 4: Restart Your Dev Server

After creating the `.env` file, restart your development server:

1. Stop the current server (Ctrl+C)
2. Run `npm run dev` again

## Step 5: Test the Integration

1. Open the app in your browser
2. Go to the Timeline tab
3. Add a new milestone
4. Refresh the page - the milestone should still be there!
5. Delete a milestone - it should persist after refresh

## What Changed

- **App.tsx** now uses `AppContextSupabase` instead of `AppContext`
- All data operations now sync with Supabase automatically
- Data persists across page refreshes
- All CRUD operations (Create, Read, Update, Delete) work with the database

## Troubleshooting

### "Supabase anon key not found" warning
- Make sure you created the `.env` file in the root directory
- Make sure the variable name is exactly `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after creating/updating `.env`

### Data not loading
- Check the browser console for errors
- Verify your Supabase tables were created correctly
- Check that Row Level Security policies allow access

### Operations failing
- Check the browser console for specific error messages
- Verify your Supabase anon key is correct
- Make sure all tables exist in Supabase

## Next Steps

Your app is now fully integrated with Supabase! All data will persist:
- ✅ Phases
- ✅ Milestones  
- ✅ Tasks
- ✅ Documents
- ✅ Photos
- ✅ Files

No more losing data on page refresh!

