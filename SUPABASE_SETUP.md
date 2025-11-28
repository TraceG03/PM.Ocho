# Supabase Setup Instructions

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 2: Create Environment File

1. Create a `.env` file in the root of your project
2. Add your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** The `.env` file is already in `.gitignore` so it won't be committed to git.

## Step 3: Run the SQL Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from the previous message (the complete schema)
4. Click **Run** to create all tables, indexes, and policies

## Step 4: Create Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create two buckets:
   - **documents** (private)
   - **photos** (private)

Or use the SQL provided in the schema to create them programmatically.

## Step 5: Install Dependencies

Run:
```bash
npm install
```

This will install `@supabase/supabase-js` which is already added to `package.json`.

## Step 6: Test the Connection

Once you've:
- ✅ Created the `.env` file with your credentials
- ✅ Run the SQL schema in Supabase
- ✅ Created the storage buckets
- ✅ Installed dependencies

The app will automatically connect to Supabase and persist all your data!

## Notes

- The password you provided (`8MoPTwHxPQZxedp8`) is for your Supabase dashboard login, not for the API
- For the client connection, we use the **anon key** which is safe to use in frontend code
- All data is protected by Row Level Security (RLS) policies
- Each user will only see their own data

