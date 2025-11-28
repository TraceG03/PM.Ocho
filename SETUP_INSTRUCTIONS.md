# Supabase Integration Setup

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Your Supabase Credentials

1. Go to https://app.supabase.com and log in with your password: `8MoPTwHxPQZxedp8`
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### 3. Create `.env` File

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run SQL Schema in Supabase

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the SQL from the previous message (the complete schema with all tables)
3. Click **Run**

### 5. Create Storage Buckets

**Option A: Via Dashboard**
1. Go to **Storage** in Supabase
2. Click **New bucket**
3. Create two buckets:
   - Name: `documents` (Private)
   - Name: `photos` (Private)

**Option B: Via SQL** (use the storage SQL from the schema)

### 6. Switch to Supabase Context

Update `src/App.tsx` to use the Supabase context:

```tsx
// Change this line:
import { AppProvider } from './context/AppContext';

// To this:
import { AppProvider } from './context/AppContextSupabase';
```

### 7. Test It!

Start your dev server:
```bash
npm run dev
```

Your data will now persist to Supabase! 🎉

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure your `.env` file exists in the project root
- Check that variable names start with `VITE_`
- Restart your dev server after creating `.env`

### "Failed to load data" or RLS errors
- Make sure you ran the SQL schema
- Check that storage buckets exist
- If using without auth, you may need to temporarily disable RLS (not recommended for production)

### Files not uploading
- Verify storage buckets are created
- Check bucket names match: `documents` and `photos`
- Ensure storage policies are set up (included in SQL)

## Next Steps (Optional)

### Add Authentication
1. Enable email auth in Supabase Dashboard → Authentication
2. Update `getUserId()` in `AppContextSupabase.tsx` to use actual auth
3. Add login/signup UI

### Enable Real-time
Real-time subscriptions are already set up! Your data will sync across tabs/devices automatically.

## Notes

- The password you provided is for dashboard login, not API access
- The anon key is safe to use in frontend code
- All data is protected by Row Level Security (RLS)
- Files are stored in Supabase Storage, not as base64 in the database

