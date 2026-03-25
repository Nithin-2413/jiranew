# ⚡ Start Here - First Time Setup

Follow these steps in order to get your Jira Report Maker running.

## ✅ Step 1: Install MongoDB (if not already installed)

### Option A: Local MongoDB
**Windows:**
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer (default settings)
3. MongoDB should start automatically as a service

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Option B: MongoDB Atlas (Cloud - Recommended for Easy Setup)
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0)
3. Get connection string
4. Update `MONGO_URL` in backend/.env

---

## ✅ Step 2: Get Jira API Token (2 minutes)

1. Open: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Name it: "Jira Report Maker"
4. Click "Create"
5. **Copy the token** (you won't see it again!)

**Save these for later:**
- Your Jira domain: `yourcompany.atlassian.net`
- Your email: `your.email@company.com`
- API token: `[paste token here]`
- Project key: `PROJ` (example)

---

## ✅ Step 3: Setup Backend (3 minutes)

Open PowerShell or Terminal and run:

```powershell
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate  # Windows PowerShell
# On macOS/Linux: source venv/bin/activate

# Install dependencies (this may take 2-3 minutes)
pip install -r requirements.txt

# Copy environment file
copy .env.example .env  # Windows
# On macOS/Linux: cp .env.example .env

# (Optional) Edit .env if you need to change MongoDB URL
# Default is: MONGO_URL="mongodb://localhost:27017"
```

**Expected output:** All packages install successfully (no errors)

---

## ✅ Step 4: Setup Frontend (2 minutes)

Open a **NEW** PowerShell or Terminal window and run:

```powershell
# Navigate to frontend folder (from project root)
cd frontend

# Install dependencies (this may take 3-5 minutes)
npm install

# Copy environment file
copy .env.example .env  # Windows
# On macOS/Linux: cp .env.example .env

# No need to edit .env - defaults are correct for local development
```

**Expected output:** All packages install successfully

---

## ✅ Step 5: Start the Application (1 minute)

You need **TWO terminal windows open** - keep them both running.

### Terminal 1: Start Backend

```powershell
# Make sure you're in the backend folder
cd backend

# Activate virtual environment (if not already activated)
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Start the backend server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Wait for:** `Application startup complete` message

**Backend will be running at:** http://localhost:8000

### Terminal 2: Start Frontend

```powershell
# Make sure you're in the frontend folder
cd frontend

# Start the frontend dev server
npm start
```

**Wait for:** Browser to automatically open at http://localhost:3000

**Expected:** You should see the Jira Report Maker interface with a configuration modal

---

## ✅ Step 6: Configure Jira Connection (1 minute)

When the app opens, you'll see a configuration modal:

1. **Jira Domain:** Enter without `https://`
   - ✅ Correct: `yourcompany.atlassian.net`
   - ❌ Wrong: `https://yourcompany.atlassian.net`

2. **Email:** Your Atlassian account email

3. **API Token:** Paste the token from Step 2

4. **Project Key:** Your Jira project key (usually 3-5 letters, all caps)
   - Example: `PROJ`, `DEV`, `TEAM`

5. Click **"Test Connection"**
   - Should show: ✅ Connection successful

6. Click **"Save & Continue"**

---

## ✅ Step 7: Generate Your First Report (1 minute)

1. **Select Date Range:** (optional)
   - Leave empty to get all issues
   - Or set last 30/60/90 days

2. **Click "Generate Report"**
   - Wait 5-30 seconds (depends on number of issues)

3. **View Results:**
   - Metrics cards at top
   - Charts and visualizations below
   - Filter options on the side

4. **Export (optional):**
   - Click export button
   - Choose PDF or Word
   - Download your report!

---

## 🎉 You're Done!

Your Jira Report Maker is now running and ready to use!

---

## 🔧 Troubleshooting Quick Fixes

### "Port 8000 is already in use"
**Solution:**
```powershell
# Use a different port for backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Then update frontend/.env:
REACT_APP_BACKEND_URL=http://localhost:8001
```

### "Cannot connect to MongoDB"
**Solution:**
```powershell
# Check if MongoDB is running
# Windows: Open Services, look for "MongoDB"
# macOS: brew services list
# Linux: sudo systemctl status mongodb

# If not running, start it:
# Windows: Start service in Services app
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongodb
```

### "pip is not recognized"
**Solution:**
```powershell
# Use python -m pip instead:
python -m pip install -r requirements.txt
```

### "npm is not recognized"
**Solution:**
- Install Node.js from: https://nodejs.org/
- Restart terminal after installation

### "Jira authentication failed"
**Check:**
- [ ] Domain has NO `https://` or `http://`
- [ ] Using API token, NOT your password
- [ ] Email is correct
- [ ] API token is valid (not expired)

### Backend fails with dependency errors
**Solution:**
```powershell
# Try upgrading pip first
python -m pip install --upgrade pip

# Then install requirements again
pip install -r requirements.txt
```

### Frontend shows CORS errors
**Solution:**
- Verify backend is running on port 8000
- Check `CORS_ORIGINS` in backend/.env includes `http://localhost:3000`
- Restart both backend and frontend

---

## 📚 What's Next?

- ✅ **Basic Setup:** You're done! Use the app.
- 📖 **Learn More:** Read [README.md](README.md) for detailed documentation
- 🚀 **Deploy:** See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- 🧪 **Test:** Review [TESTING.md](TESTING.md) for comprehensive testing

---

## 💡 Daily Usage

### Starting the App (after initial setup)

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

### Stopping the App

- Press `Ctrl+C` in both terminal windows
- MongoDB can keep running (it's a service)

---

## 🆘 Need Help?

1. **Errors during setup?** → Check troubleshooting section above
2. **App not working?** → Read [README.md](README.md) troubleshooting section
3. **Want to customize?** → See [README.md](README.md) for full documentation
4. **Ready to deploy?** → Follow [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Estimated Total Setup Time: 10-15 minutes**

Good luck! 🚀
