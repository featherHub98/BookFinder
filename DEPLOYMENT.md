# BookWorm Free Deployment Guide

This guide covers deploying BookWorm to free tiers of Vercel (frontend), Render (backend), MongoDB Atlas (database), and Resend (email).

## Architecture for Free Deployment

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Vercel       │────▶│    Render       │────▶│  MongoDB Atlas  │
│   (Frontend)    │     │ (Auth + Book    │     │   (Database)    │
│    Next.js      │     │   Services)     │     │     512MB       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │     Resend      │
                        │    (Email)      │
                        │  3000/mo free   │
                        └─────────────────┘
```

---

## Step 1: MongoDB Atlas (Database)

### Create Free Cluster

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a new project called "BookWorm"
4. Click "Build a Database"
5. Choose **M0 FREE** tier
6. Select a cloud provider (AWS recommended) and region closest to you
7. Name your cluster: `bookworm-cluster`
8. Click "Create Cluster" (takes 3-5 minutes)

### Create Database User

1. Go to **Database Access** in left sidebar
2. Click "Add New Database User"
3. Authentication Method: Password
4. Username: `bookworm`
5. Password: Generate a secure password (save this!)
6. Database User Privileges: Read and write to any database
7. Click "Add User"

### Network Access (Whitelist IPs)

1. Go to **Network Access** in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, you'd restrict to specific IPs
4. Click "Confirm"

### Get Connection String

1. Go to **Database** in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Node.js, Version: latest
5. Copy the connection string:
   ```
   mongodb+srv://bookworm:<password>@bookworm-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your database user password

**Save this connection string - you'll need it for Render!**

---

## Step 2: Render (Backend Services)

### Create Render Account

1. Go to https://dashboard.render.com/register
2. Sign up with GitHub (recommended) or email

### Option A: Deploy as Single Combined Service (Recommended for Free Tier)

Since Render free tier limits you to 1 web service, we'll combine auth and book services.

#### Push Code to GitHub

```bash
# In your BookWorm directory
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bookworm.git
git push -u origin main
```

#### Create Web Service on Render

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `bookworm-api`
   - **Region**: Choose closest to your MongoDB region
   - **Branch**: `main`
   - **Root Directory**: Leave blank (we'll create a combined service)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

#### Environment Variables

Add these in Render's Environment section:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://bookworm:YOUR_PASSWORD@bookworm-cluster.xxxxx.mongodb.net/bookworm?retryWrites=true&w=majority
JWT_SECRET=your-32-character-secret-key-here-change-this
JWT_EXPIRES_IN=60m
FRONTEND_URL=https://your-app.vercel.app
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Option B: Separate Services (Requires Paid Plan or Railway)

For separate services, you'd need Render's paid plan or use Railway with free credits.

---

## Step 3: Vercel (Frontend)

### Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub

### Deploy Frontend

1. Click "Add New" → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Environment Variables

Add in Vercel's Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
AUTH_SERVICE_URL=https://bookworm-api.onrender.com
BOOK_SERVICE_URL=https://bookworm-api.onrender.com
```

4. Click "Deploy"

---

## Step 4: Resend (Email)

### Setup Resend

1. You already have an API key from earlier
2. For production, verify your domain in Resend dashboard
3. Update `FROM_EMAIL` in Render environment variables

---

## Quick Deploy Alternative: Railway (Easiest)

Railway offers $5 free credit monthly which can run the entire Docker Compose setup.

### Deploy to Railway

1. Go to https://railway.app/
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your BookWorm repository
5. Railway will auto-detect docker-compose.yml

### Add Environment Variables

In Railway dashboard, add variables for auth-service:

```
MONGODB_URI=mongodb+srv://bookworm:PASSWORD@cluster.mongodb.net/bookworm
JWT_SECRET=your-secret-key
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=https://your-app.railway.app
```

6. Railway will deploy all services automatically

---

## Troubleshooting

### Frontend Can't Connect to Backend

1. Check CORS settings in backend `ALLOWED_ORIGINS`
2. Verify `AUTH_SERVICE_URL` and `BOOK_SERVICE_URL` in Vercel
3. Make sure backend is running (free tier spins down after 15min)

### Database Connection Issues

1. Verify MongoDB Atlas IP whitelist (0.0.0.0/0 for testing)
2. Check connection string format
3. Ensure database user has correct permissions

### Email Not Sending

1. Verify `RESEND_API_KEY` is set
2. Check Resend dashboard for delivery status
3. For testing, use `onboarding@resend.dev`

### Free Tier Limitations

| Service | Limitation |
|---------|------------|
| Render | Spins down after 15min inactivity (30s cold start) |
| MongoDB Atlas | 512MB storage, shared RAM |
| Vercel | 100GB bandwidth/month |
| Resend | 3,000 emails/month |

---

## Production Checklist

Before going live:

- [ ] Change all default secrets (JWT_SECRET, etc.)
- [ ] Verify domain in Resend for email
- [ ] Set up MongoDB Atlas alerts
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up error monitoring (optional: Sentry)
- [ ] Configure rate limiting (already built-in)

---

## Estimated Costs After Free Tier

If you exceed free tier limits:

| Service | Paid Plan |
|---------|-----------|
| Render | $7/month (Starter) |
| MongoDB Atlas | $9/month (Dedicated) |
| Vercel | $20/month (Pro) |
| Resend | $20/month (50k emails) |

For a small app, free tiers should be sufficient!
