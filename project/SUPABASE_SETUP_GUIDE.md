# 🚀 Complete Supabase Setup Guide for Beginners

This guide will walk you through setting up Supabase for your Neighborhood OS app, step by step!

## 📋 What You'll Need
- A web browser (Chrome, Firefox, etc.)
- Your computer
- About 15-20 minutes

---

## Step 1: Create Supabase Account

### 1.1 Go to Supabase Website
1. **Open your web browser**
2. **Type this address**: `https://supabase.com`
3. **Press Enter**

### 1.2 Sign Up
1. **Click** the big blue "Start your project" button
2. **Choose how to sign up**:
   - **Option A**: Click "Continue with GitHub" (if you have GitHub)
   - **Option B**: Enter your email and click "Continue with Email"
3. **If you used email**: Check your email and click the verification link

---

## Step 2: Create Your Project

### 2.1 Start New Project
1. **After signing in**, you'll see the Supabase dashboard
2. **Click** the big "New Project" button

### 2.2 Fill in Project Details
1. **Organization**: If you see an organization, select it. If not, create one
2. **Project Name**: Type `neighborhood-os` (or any name you like)
3. **Database Password**: 
   - **Click** the "Generate" button
   - **Copy** the password (you'll need this later!)
   - **Save it somewhere safe** (like a text file)
4. **Region**: Choose the closest to where you live
   - **US East** (if you're in the US)
   - **Europe West** (if you're in Europe)
   - **Asia Pacific** (if you're in Asia)
5. **Click** "Create new project"

### 2.3 Wait for Setup
- **Wait** 1-2 minutes for the project to be created
- **Don't close the browser tab!**

---

## Step 3: Get Your Project Credentials

### 3.1 Go to Settings
1. **In your Supabase dashboard**, look at the left sidebar
2. **Find** "Settings" (it has a gear icon ⚙️)
3. **Click** on "Settings"

### 3.2 Go to API Section
1. **In the Settings menu**, click "API"
2. **You'll see a page with your project details**

### 3.3 Copy Your Credentials
1. **Find "Project URL"** - it looks like: `https://abcdefghijklmnop.supabase.co`
2. **Click** the copy button next to it (📋 icon)
3. **Find "Anon public key"** - it's a long string starting with `eyJ...`
4. **Click** the copy button next to it (📋 icon)

---

## Step 4: Update Your Code

### 4.1 Open the Supabase File
1. **In your project folder**, find the file: `project/lib/supabase.ts`
2. **Open it** in your code editor (like VS Code)

### 4.2 Replace the Placeholder Values
1. **Find these lines** (around line 7-8):
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY_HERE';
   ```

2. **Replace** `YOUR_SUPABASE_URL_HERE` with your Project URL
3. **Replace** `YOUR_SUPABASE_ANON_KEY_HERE` with your Anon public key

**Example**:
```typescript
const supabaseUrl = 'https://abcdefghijklmnop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example';
```

---

## Step 5: Set Up Your Database

### 5.1 Go to SQL Editor
1. **In your Supabase dashboard**, look at the left sidebar
2. **Click** "SQL Editor"

### 5.2 Create the Database Tables
1. **Click** "New query" (or the + button)
2. **Copy** all the text from the file `project/supabase-migrations.sql`
3. **Paste** it into the SQL editor
4. **Click** "Run" (or press Ctrl+Enter)

### 5.3 Check if it Worked
1. **Look for** "Success" message
2. **If you see errors**, don't worry - some parts might already exist

---

## Step 6: Set Up File Storage

### 6.1 Go to Storage
1. **In your Supabase dashboard**, click "Storage" in the left sidebar

### 6.2 Create a Bucket
1. **Click** "New bucket"
2. **Name**: Type `images`
3. **Make it public**: Check the "Public bucket" box
4. **Click** "Create bucket"

### 6.3 Set Up Storage Policies
1. **Click** on your `images` bucket
2. **Click** "Policies" tab
3. **Click** "New policy"
4. **Copy and paste** this policy:

```sql
-- Allow public read access to images
CREATE POLICY "Images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Step 7: Test Your Setup

### 7.1 Install Dependencies
1. **Open your terminal/command prompt**
2. **Navigate** to your project folder
3. **Run**: `npm install`

### 7.2 Start Your App
1. **Run**: `npm start`
2. **Wait** for the app to start
3. **Open** the app on your phone or browser

### 7.3 Test Sign Up
1. **Try to create an account** with your email
2. **Check your email** for verification
3. **Sign in** to the app

---

## 🎉 Congratulations!

Your Neighborhood OS app is now connected to Supabase! You have:

✅ **Real-time database** with PostgreSQL  
✅ **User authentication** with email/password  
✅ **File storage** for images  
✅ **Real-time features** for live updates  
✅ **Secure data** with Row Level Security  

---

## 🔧 Troubleshooting

### "Cannot find module" error
- **Solution**: Run `npm install` again

### "Invalid API key" error
- **Solution**: Double-check your credentials in `supabase.ts`

### "Database connection failed"
- **Solution**: Make sure you ran the SQL migration

### "Storage upload failed"
- **Solution**: Check that you created the `images` bucket

---

## 📞 Need Help?

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

---

## 🚀 Next Steps

Now you can:
1. **Add more features** to your app
2. **Customize the UI**
3. **Add social login** (Google, GitHub)
4. **Set up push notifications**
5. **Deploy to production**

Your app is now ready to scale! 🎊 