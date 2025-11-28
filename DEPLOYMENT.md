# Deployment Guide - Supabase Integration

## Issue: Supabase Not Saving Changes on GitHub Deployment

If your changes aren't persisting when deployed to GitHub (GitHub Pages, Vercel, Netlify, etc.), you need to configure environment variables in your deployment platform.

## Step 1: Configure Environment Variables in Your Deployment Platform

### For GitHub Pages:
GitHub Pages doesn't support server-side environment variables. You'll need to use a different deployment platform like:
- **Vercel** (Recommended - Free)
- **Netlify** (Free)
- **Render** (Free tier available)

### For Vercel:
1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   - `VITE_SUPABASE_URL` = `https://qsocvmsfedmdnsjgsoyg.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_anon_key_here`
   - `VITE_OPENAI_API_KEY` = `your_openai_key_here` (optional)

### For Netlify:
1. Go to your site on Netlify
2. Click **Site settings** → **Environment variables**
3. Add the same variables as above

### For Render:
1. Go to your service on Render
2. Click **Environment** tab
3. Add the same variables

## Step 2: Verify Your App is Using AppContextSupabase

Make sure `src/App.tsx` imports from `AppContextSupabase`:
```tsx
import { AppProvider } from './context/AppContextSupabase';
```

## Step 3: Check Browser Console

Open your deployed site and check the browser console (F12) for errors:
- "Supabase anon key not found" - Environment variable not set
- Network errors - Check Supabase URL and CORS settings
- Authentication errors - Check RLS policies in Supabase

## Step 4: Verify Supabase RLS Policies

Make sure your Supabase tables have the correct Row Level Security policies:
1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Ensure policies allow public access (for development) or set up proper authentication

## Troubleshooting

### Changes Still Not Saving?
1. **Check environment variables** - They must be set in your deployment platform, not just locally
2. **Check Supabase connection** - Open browser console and look for errors
3. **Verify RLS policies** - Make sure your Supabase tables allow the operations you need
4. **Check network tab** - See if API calls to Supabase are failing

### Local Works But Deployment Doesn't?
- Environment variables are different between local and deployed
- Set them in your deployment platform's settings
- Restart/redeploy after adding environment variables

