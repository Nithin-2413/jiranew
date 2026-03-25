# Deployment Guide - Render & Vercel

Complete guide to deploy the JIRA Analytics Dashboard to production.

## Architecture Overview

**Two-Service Architecture:**
- **Backend (FastAPI)** → Deploy to Render
- **Frontend (React)** → Deploy to Vercel
- **Database (MongoDB)** → MongoDB Atlas (free tier)

---

## Part 1: MongoDB Atlas Setup (Free Tier)

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free account
3. Create a new cluster (Select FREE M0 tier)
4. Choose your region (closest to your users)

### Step 2: Configure Database Access

1. Click "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `jira_admin`
5. Password: Generate secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Step 3: Configure Network Access

1. Click "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 4: Get Connection String

1. Click "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://jira_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Save this - you'll need it for Render deployment

---

## Part 2: Backend Deployment (Render)

### Step 1: Prepare Backend for Render

Create `/app/backend/render.yaml`:

```yaml
services:
  - type: web
    name: jira-analytics-backend
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MONGO_URL
        sync: false
      - key: DB_NAME
        value: jira_analytics
      - key: CORS_ORIGINS
        value: "*"
      - key: PYTHON_VERSION
        value: 3.11.0
```

### Step 2: Create Render Account

1. Go to [https://render.com/](https://render.com/)
2. Sign up with GitHub account
3. Authorize Render to access your repositories

### Step 3: Deploy Backend

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `jira-analytics-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

### Step 4: Add Environment Variables

In Render dashboard, go to Environment tab and add:

| Key | Value | Description |
|-----|-------|-------------|
| `MONGO_URL` | Your MongoDB Atlas connection string | From MongoDB setup |
| `DB_NAME` | `jira_analytics` | Database name |
| `CORS_ORIGINS` | `*` | Allow all origins (or specific domain) |
| `PYTHON_VERSION` | `3.11.0` | Python version |

Click "Save Changes"

### Step 5: Get Backend URL

After deployment completes:
- Your backend URL will be: `https://jira-analytics-backend.onrender.com`
- Save this URL - you'll need it for frontend

### Step 6: Test Backend

```bash
curl https://jira-analytics-backend.onrender.com/api/
```

Should return: `{"message":"Hello World"}`

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Vercel

Create `/app/frontend/vercel.json`:

```json
{
  "buildCommand": "yarn build",
  "outputDirectory": "build",
  "devCommand": "yarn start",
  "installCommand": "yarn install",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_BACKEND_URL": "@backend_url"
  }
}
```

### Step 2: Create Vercel Account

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub account
3. Authorize Vercel to access repositories

### Step 3: Deploy Frontend

1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`
   - **Install Command**: `yarn install`

### Step 4: Add Environment Variables

Click "Environment Variables" and add:

| Key | Value | Description |
|-----|-------|-------------|
| `REACT_APP_BACKEND_URL` | `https://jira-analytics-backend.onrender.com` | Your Render backend URL |

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Your app URL: `https://your-app.vercel.app`

### Step 6: Configure Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Part 4: Environment Variables Reference

### Backend Environment Variables (.env)

**Required:**
```bash
# Database
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=jira_analytics

# CORS
CORS_ORIGINS=*  # Or your frontend domain: https://your-app.vercel.app
```

**Optional:**
```bash
# Python Version
PYTHON_VERSION=3.11.0

# Logging
LOG_LEVEL=INFO
```

### Frontend Environment Variables (.env)

**Required:**
```bash
# Backend API URL
REACT_APP_BACKEND_URL=https://jira-analytics-backend.onrender.com
```

**Optional (Development only):**
```bash
# Webpack Dev Server
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

---

## Part 5: Post-Deployment Configuration

### Update CORS Settings (Important!)

After deployment, update backend CORS to only allow your frontend:

**In Render Dashboard:**
1. Go to Environment Variables
2. Update `CORS_ORIGINS` from `*` to:
   ```
   https://your-app.vercel.app,https://your-app-*.vercel.app
   ```
3. Save and redeploy

### Test Full Flow

1. Open your Vercel app: `https://your-app.vercel.app`
2. Click "Settings" → Configure JIRA connection
3. Enter your JIRA credentials
4. Click "Test Connection"
5. If successful, configure filters and generate report

---

## Part 6: Code Changes for Production

### Backend Changes Required

**File: `/app/backend/server.py`**

No changes needed! The code already uses environment variables correctly:
```python
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
```

### Frontend Changes Required

**File: `/app/frontend/src/services/jiraService.js`**

Already using environment variable correctly:
```javascript
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';
```

**No code changes needed!** Everything is already configured for deployment.

---

## Part 7: Deployment Checklist

### Before Deployment

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with password saved
- [ ] Network access configured (0.0.0.0/0)
- [ ] MongoDB connection string obtained
- [ ] GitHub repository ready
- [ ] Render account created
- [ ] Vercel account created

### Backend Deployment

- [ ] Backend deployed to Render
- [ ] Environment variables added to Render
- [ ] Backend URL obtained and saved
- [ ] Backend health check passed (`/api/` returns response)

### Frontend Deployment

- [ ] Frontend deployed to Vercel
- [ ] REACT_APP_BACKEND_URL environment variable set
- [ ] Frontend loads successfully
- [ ] JIRA configuration modal appears

### Post-Deployment

- [ ] CORS updated to specific domain
- [ ] JIRA connection tested successfully
- [ ] Report generation tested
- [ ] PDF export tested
- [ ] Custom domain configured (optional)

---

## Part 8: Troubleshooting

### Issue: CORS Errors

**Symptom:** "Access-Control-Allow-Origin" error in browser console

**Solution:**
1. Check `CORS_ORIGINS` in Render environment variables
2. Must include your Vercel domain
3. Format: `https://your-app.vercel.app,https://your-app-*.vercel.app`
4. Redeploy backend after changes

### Issue: Backend Connection Failed

**Symptom:** Frontend can't reach backend

**Solution:**
1. Verify `REACT_APP_BACKEND_URL` in Vercel
2. Check Render backend is running (not sleeping)
3. Test backend directly: `curl https://your-backend.onrender.com/api/`
4. Render free tier sleeps after 15 min inactivity - first request wakes it up (30-60 seconds)

### Issue: MongoDB Connection Failed

**Symptom:** Backend logs show "Connection refused" or "Authentication failed"

**Solution:**
1. Verify `MONGO_URL` in Render environment variables
2. Check password is correct (no special characters causing issues)
3. Verify IP whitelist includes 0.0.0.0/0 in MongoDB Atlas
4. Test connection string locally first

### Issue: Build Fails on Vercel

**Symptom:** Build error during deployment

**Solution:**
1. Check build logs for specific error
2. Verify `package.json` has all dependencies
3. Try running `yarn install && yarn build` locally first
4. Common fix: Clear Vercel cache and redeploy

### Issue: Environment Variables Not Working

**Symptom:** App shows errors related to missing config

**Solution:**
1. Environment variables in Vercel must start with `REACT_APP_`
2. After adding variables, must redeploy
3. Check spelling and case sensitivity
4. View deployment logs to verify variables are set

---

## Part 9: Monitoring & Maintenance

### Monitor Backend (Render)

1. Go to Render dashboard
2. Click on your service
3. Check "Logs" tab for errors
4. Monitor "Metrics" for performance

### Monitor Frontend (Vercel)

1. Go to Vercel dashboard
2. Click on your project
3. Check "Deployments" for build status
4. View "Analytics" for usage stats

### Keep Services Awake (Free Tier)

Render free tier sleeps after 15 minutes of inactivity.

**Solution 1: UptimeRobot (Free)**
1. Sign up at [https://uptimerobot.com](https://uptimerobot.com)
2. Add new monitor (HTTP)
3. URL: `https://your-backend.onrender.com/api/`
4. Interval: 5 minutes
5. Keeps backend awake

**Solution 2: Cron Job**
Use Render's cron jobs (paid feature) or external service

---

## Part 10: Upgrading to Paid Tiers

### When to Upgrade

**Render (Backend):**
- Free tier limitations:
  - Service spins down after 15 min inactivity
  - 750 hours/month total across all services
  - Limited memory (512 MB)

**Upgrade to Starter ($7/month):**
- Always on (no spin down)
- 1 GB memory
- Custom domains
- Better performance

**Vercel (Frontend):**
- Free tier is generous:
  - 100 GB bandwidth/month
  - Unlimited deployments
  - 100 projects

**Upgrade to Pro ($20/month):**
- Unlimited bandwidth
- Better analytics
- Team collaboration

### Cost Estimation

**Minimum (Free Tier):**
- MongoDB Atlas: Free (M0 tier, 512 MB)
- Render Backend: Free (with sleep)
- Vercel Frontend: Free
- **Total: $0/month**

**Recommended (Production):**
- MongoDB Atlas: $9/month (M10 tier, 2 GB)
- Render Backend: $7/month (Starter)
- Vercel Frontend: Free
- **Total: $16/month**

**Enterprise:**
- MongoDB Atlas: $25/month (M20 tier, 4 GB)
- Render Backend: $25/month (Standard)
- Vercel Frontend: $20/month (Pro)
- **Total: $70/month**

---

## Part 11: Alternative: All-in-One Deployment

If you prefer single platform deployment:

### Option A: Railway (Similar to Render)
- Single platform for both frontend and backend
- Built-in PostgreSQL/MongoDB
- $5/month starter plan
- [https://railway.app](https://railway.app)

### Option B: Fly.io
- Global edge deployment
- PostgreSQL included
- Better for high traffic
- [https://fly.io](https://fly.io)

### Option C: Digital Ocean App Platform
- $5/month basic tier
- Managed databases available
- Simple deployment from GitHub
- [https://www.digitalocean.com/products/app-platform](https://www.digitalocean.com/products/app-platform)

---

## Quick Start Commands

### Deploy to Render (Backend)
```bash
# Already configured - just connect repo to Render!
# No manual commands needed
```

### Deploy to Vercel (Frontend)
```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy from command line
cd /app/frontend
vercel
```

### Environment Variables Quick Copy

**Backend (Render):**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=jira_analytics
CORS_ORIGINS=https://your-app.vercel.app
```

**Frontend (Vercel):**
```
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

---

## Support & Resources

**Render Documentation:**
- [https://render.com/docs](https://render.com/docs)
- [Deploy FastAPI](https://render.com/docs/deploy-fastapi)

**Vercel Documentation:**
- [https://vercel.com/docs](https://vercel.com/docs)
- [Deploy React](https://vercel.com/docs/frameworks/create-react-app)

**MongoDB Atlas Documentation:**
- [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- [Get Started](https://docs.atlas.mongodb.com/getting-started/)

---

## Security Best Practices

1. **Never commit .env files to GitHub**
   - Add `.env` to `.gitignore`
   - Use platform environment variables

2. **Use Strong Passwords**
   - MongoDB user password: 20+ characters
   - JIRA API tokens: Generate new, don't share

3. **Restrict CORS**
   - Production: Use specific domain, not `*`
   - Format: `https://your-app.vercel.app`

4. **MongoDB Network Access**
   - Development: 0.0.0.0/0 is OK
   - Production: Consider restricting to Render IPs

5. **Keep Dependencies Updated**
   ```bash
   # Backend
   pip list --outdated
   
   # Frontend
   yarn outdated
   ```

6. **Enable HTTPS Only**
   - Both Render and Vercel provide free SSL
   - Automatic HTTPS redirect enabled by default

---

**Deployment Complete! 🎉**

Your JIRA Analytics Dashboard is now live and accessible worldwide!