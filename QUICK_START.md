# Quick Start: Supabase Integration

## ✅ What's Been Set Up

1. **Supabase client** (`src/lib/supabase.ts`)
2. **Supabase-integrated context** (`src/context/AppContextSupabase.tsx`)
3. **SQL schemas** (production and dev versions)
4. **Environment template** (`env.template`)
5. **Setup instructions**

## 🚀 5-Minute Setup

### Step 1: Get Credentials
1. Go to https://app.supabase.com
2. Login with password: `8MoPTwHxPQZxedp8`
3. Go to **Settings** → **API**
4. Copy **Project URL** and **anon key**

### Step 2: Create `.env` File
```bash
# Copy the template
cp env.template .env

# Edit .env and add your credentials:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Run SQL Schema
1. In Supabase Dashboard → **SQL Editor**
2. Open `supabase-schema-dev.sql` (for development)
3. Click **Run**

### Step 4: Create Storage Buckets
1. Go to **Storage** in Supabase
2. Create bucket: `documents` (Private)
3. Create bucket: `photos` (Private)

### Step 5: Switch to Supabase Context

Edit `src/App.tsx`:
```tsx
// Change line 2 from:
import { AppProvider } from './context/AppContext';

// To:
import { AppProvider } from './context/AppContextSupabase';
```

### Step 6: Install & Run
```bash
npm install
npm run dev
```

## 🎉 Done!

Your data will now persist to Supabase. Try:
- Creating a phase
- Adding a milestone
- Refreshing the page
- Data should still be there!

## 📝 Files Created

- `src/lib/supabase.ts` - Supabase client
- `src/context/AppContextSupabase.tsx` - Supabase-integrated context
- `supabase-schema-dev.sql` - Development SQL schema
- `env.template` - Environment variables template
- `SETUP_INSTRUCTIONS.md` - Detailed setup guide

## 🔧 Troubleshooting

**"Missing Supabase environment variables"**
- Check `.env` file exists
- Restart dev server after creating `.env`

**"Failed to load data"**
- Verify SQL schema was run
- Check Supabase dashboard for errors

**Files not uploading**
- Ensure storage buckets are created
- Check bucket names: `documents` and `photos`

## 📚 Next Steps

- See `SETUP_INSTRUCTIONS.md` for detailed info
- Add authentication (optional)
- Customize RLS policies for production

