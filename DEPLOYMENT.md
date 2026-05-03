# 🚀 TaskFlow Deployment Guide

## 📋 Overview
This guide will help you deploy the TaskFlow full-stack application with live URLs that anyone can access.

## 🏗️ Architecture
- **Frontend**: React + Vite (Deployed on Vercel)
- **Backend**: FastAPI + SQLAlchemy (Deployed on Railway)
- **Database**: PostgreSQL (Railway managed)

---

## 🌐 Step 1: Deploy Backend to Railway

### 1.1 Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2 Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. **Root Directory**: `backend`
5. **Environment Variables**:
   ```
   SECRET_KEY=your-super-secret-random-key-here
   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
   ```
6. Click "Deploy"

### 1.3 Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "PostgreSQL"
3. Railway will automatically inject `DATABASE_URL`

---

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" → "Import Git Repository"
3. Select your repository
4. **Root Directory**: `frontend`
5. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.2 Environment Variables
Add this environment variable in Vercel:
```
VITE_API_URL=https://your-backend-domain.railway.app
```

---

## 🔧 Step 3: Configure CORS

### 3.1 Update Backend CORS
After deployment, update the `ALLOWED_ORIGINS` in Railway to include:
```
https://your-frontend-domain.vercel.app
```

### 3.2 Update Frontend API URL
Make sure the `VITE_API_URL` in Vercel points to your Railway backend URL.

---

## ✅ Step 4: Test Your Live Application

1. **Frontend URL**: `https://your-frontend-domain.vercel.app`
2. **Backend API**: `https://your-backend-domain.railway.app`
3. **API Docs**: `https://your-backend-domain.railway.app/docs`

### Test Signup:
1. Go to your frontend URL
2. Click "Signup"
3. Create an admin account
4. Verify you can log in and access the dashboard

---

## 🛠️ Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure `ALLOWED_ORIGINS` includes your frontend URL
2. **Database Connection**: Ensure PostgreSQL plugin is added in Railway
3. **Build Failures**: Check that all dependencies are installed correctly

### Environment Variable Templates:
**Backend (Railway)**:
```
SECRET_KEY=your-long-random-secret-key-here-min-32-chars
ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Frontend (Vercel)**:
```
VITE_API_URL=https://your-backend.railway.app
```

---

## 📱 First User Setup

1. **Create Admin Account**: 
   - Go to `/signup`
   - Select "Admin" role
   - This will be your first admin user

2. **Create Test Member**:
   - Go to `/signup` again
   - Select "Member" role
   - This will be your test member account

3. **Test Full Workflow**:
   - Admin: Create a project
   - Admin: Add the member to the project
   - Member: Log in and update task status

---

## 🎉 Your Live App is Ready!

Share these URLs with anyone:
- **Application**: `https://your-frontend-domain.vercel.app`
- **API Documentation**: `https://your-backend-domain.railway.app/docs`

Users can now sign up, create projects, manage tasks, and collaborate in real-time!
