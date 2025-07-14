# Supabase Setup Guide

## Current Issue
The app is showing "supabaseUrl is required" errors because the Supabase credentials are not configured.

## Quick Fix

1. **Get Your Supabase Credentials:**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Settings** → **API**
   - Copy your **Project URL** and **anon public** key

2. **Update Configuration:**
   Open `project/lib/config.ts` and replace the placeholder values:

   ```typescript
   SUPABASE: {
     URL: 'https://your-actual-project-ref.supabase.co', // Your actual URL
     ANON_KEY: 'your-actual-anon-key', // Your actual anon key
   },
   ```

3. **Restart the App:**
   - Stop the development server
   - Run `npm start` again

## Alternative: Environment Variables

For better security, you can use environment variables:

1. Create a `.env` file in the project root:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Update `project/lib/config.ts`:
   ```typescript
   SUPABASE: {
     URL: process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co',
     ANON_KEY: process.env.SUPABASE_ANON_KEY || 'your-anon-key-here',
   },
   ```

## Database Setup

Make sure your Supabase database has the `profiles` table:

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public profiles or their own profile" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update only their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert only their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Test the Setup

After updating the credentials:

1. The app should start without "supabaseUrl is required" errors
2. You should be able to sign up and sign in
3. Profile creation should work automatically
4. No more loading screen hangs

## Need Help?

If you're still having issues:
1. Check that your Supabase project is active
2. Verify the credentials are correct
3. Make sure the `profiles` table exists in your database
4. Check the browser console for any additional errors 