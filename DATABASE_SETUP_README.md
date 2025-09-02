# 🗄️ Database Setup Guide

## Overview
This guide explains how to set up your Toby Bookmark Manager database using the single, comprehensive setup script.

## 🚀 Quick Setup

### **Option 1: Fresh Database (Recommended)**
1. **Copy the script**: Use `FINAL_DATABASE_SETUP.sql`
2. **Run in Supabase**: Paste into your Supabase SQL Editor
3. **Execute**: Click "Run" to create everything from scratch

### **Option 2: Existing Database**
If you already have some tables, the script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times. All previous migration scripts have been consolidated into this single file.

## 📋 What Gets Created

### **Core Tables**
- ✅ **workspaces** - Magic link system for sharing
- ✅ **spaces** - High-level organization (e.g., "Work", "Personal")
- ✅ **collections** - Within spaces (e.g., "Design Tools", "Productivity")
- ✅ **bookmarks** - Your actual bookmarks with metadata

### **Advanced Features**
- ✅ **shares** - Public view-only links
- ✅ **sessions** - Tab management system
- ✅ **session_tabs** - Individual tabs within sessions

### **Performance & Security**
- ✅ **Indexes** - Fast queries and search
- ✅ **RLS Policies** - Row Level Security enabled
- ✅ **Triggers** - Automatic timestamp updates
- ✅ **Full-text Search** - Search across titles, descriptions, URLs

## 🔧 Setup Steps

### 1. **Supabase Setup**
- Create a new Supabase project
- Go to SQL Editor
- Copy `FINAL_DATABASE_SETUP.sql`

### 2. **Run the Script**
- Paste the script into SQL Editor
- Click "Run" button
- Wait for completion (should take 10-30 seconds)

### 3. **Verify Setup**
- Check the verification output at the end
- All tables should show `exists: true`

### 4. **Environment Variables**
Update your `.env` file with Supabase credentials:
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EDIT_PASSWORD=your_chosen_password
```

## 🎯 Features Included

### **Password Protection System**
- Complete CRUD operation protection
- Lock/unlock functionality
- Session persistence

### **Critical Features (Previously Missing)**
- ✅ **Order Indexing** - Drag & drop reordering (was missing in original)
- ✅ **Expiring Shares** - Time-limited sharing (was missing in original)
- ✅ **Grid2 View Mode** - Additional layout option (was missing in original)
- ✅ **Complete Shares Table** - name, description, expires_at columns (were missing)
- ✅ **Proper UUID Types** - Sessions use UUID not VARCHAR (was incorrect)
- ✅ **Correct View Modes** - Only grid, grid2, compact, list (removed 'card')

### **Sharing System**
- Public view-only links
- Expiring shares
- Custom share names and descriptions

### **Advanced Organization**
- Drag & drop reordering
- Multiple view modes (grid, list, compact)
- Pinning system
- Tag support

### **Performance Features**
- Optimized indexes
- Full-text search
- Efficient queries

## 🚨 Troubleshooting

### **Script Fails to Run**
- Check Supabase permissions
- Ensure you're in the SQL Editor
- Try running sections individually

### **Tables Not Created**
- Check for error messages
- Verify Supabase project access
- Try refreshing the page

### **Sample Data Missing**
- Check if workspaces already exist
- Script only adds sample data to empty databases
- You can manually insert data if needed

## 📚 Next Steps

After running the script:

1. **Test the App** - Start your development server
2. **Verify Features** - Test password protection, sharing, etc.
3. **Deploy** - Push to Vercel or your hosting platform
4. **Share** - Use the password protection to safely share with friends

## 🎉 You're Ready!

Your database is now fully configured with:
- ✅ Complete schema
- ✅ All features enabled
- ✅ Sample data for testing
- ✅ Performance optimizations
- ✅ Security policies

**Happy bookmarking!** 🚀
