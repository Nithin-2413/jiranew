# Quick Start Guide - Jira Report Maker

This guide will help you get the Jira Report Maker up and running in under 10 minutes.

## Prerequisites Checklist

Before starting, make sure you have:
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed  
- [ ] MongoDB installed and running (or MongoDB Atlas account)
- [ ] Jira API token from Atlassian

## Step-by-Step Setup

### 1. Get Your Jira API Token (2 minutes)

1. Visit https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Name it "Jira Report Maker" 
4. **Copy and save the token** - you'll need:
   - Jira domain (e.g., `mycompany.atlassian.net`)
   - Your email address
   - The API token

### 2. Backend Setup (3 minutes)

```bash
# Navigate to backend folder  
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure .env
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Edit .env if needed - defaults should work:
# MONGO_URL="mongodb://localhost:27017"
# DB_NAME="jira_reports"
# CORS_ORIGINS="http://localhost:3000,http://localhost:8000"
```

### 3. Frontend Setup (2 minutes)

```bash
# Navigate to frontend folder (from project root)
cd frontend

# Install dependencies
npm install

# Copy .env (no changes needed)
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux
```

### 4. Start MongoDB (1 minute)

MongoDB should start automatically if installed as a service. If not:

```bash
# Windows (in a new terminal):
mongod --dbpath="C:\data\db"

# macOS/Linux (in a new terminal):
mongod --dbpath=/data/db
```

Or use MongoDB Atlas cloud database (free tier available).

### 5. Run the Application (2 minutes)

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will open automatically at `http://localhost:3000`

### 6. First Time Configuration (1 minute)

1. The configuration modal will appear
2. Enter your Jira credentials:
   - **Jira Domain**: `yourcompany.atlassian.net` (no https://)
   - **Email**: Your Atlassian email
   - **API Token**: Paste the token from step 1
   - **Project Key**: Your Jira project key (e.g., `PROJ`)
3. Click **Test Connection**
4. If successful, click **Save & Continue**

## You're Done! 🎉

Start generating reports:
1. Select a date range
2. Apply filters (status, issue type, sprint, etc.)
3. View metrics and charts
4. Export to PDF or Word

## Common Issues

### "Cannot connect to MongoDB"
- Make sure MongoDB is running: `mongod` command or service
- Check `MONGO_URL` in backend/.env

### "Backend connection failed"  
- Verify backend is running on port 8000
- Check `REACT_APP_BACKEND_URL` in frontend/.env

### "Jira authentication failed"
- Don't include `https://` in domain
- Use API token, not password
- Verify email is correct
- Check project key matches Jira

### Port 8000 or 3000 already in use
- Change backend port: `uvicorn server:app --port 8001`
- Update `REACT_APP_BACKEND_URL` in frontend/.env
- Change frontend port: `PORT=3001 npm start` (macOS/Linux) or set PORT=3001 in .env

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Customize report templates
- Set up production deployment
- Configure MongoDB authentication

## Support

For detailed troubleshooting, see the [Troubleshooting section](README.md#-troubleshooting) in the main README.
