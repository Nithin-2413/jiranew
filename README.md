# Jira Report Maker - Self-Hosted Edition

A comprehensive Jira reporting and analytics application that runs completely self-hosted on your infrastructure. Generate beautiful reports with charts, metrics, and insights from your Jira projects.

## 📋 Features

- **Real-time Jira Integration**: Direct connection to Atlassian Jira Cloud using official REST API
- **Dynamic Story Points Discovery**: Automatically detects custom story points fields in your Jira instance
- **Advanced Filtering**: Filter issues by date range, status, issue type, sprint, assignee, and labels
- **Rich Visualizations**: Multiple chart types including burndown, velocity, status distribution, and more
- **Export Reports**: Generate PDF and Word documents with customizable report templates
- **User Management**: View and filter by project assignees
- **Sprint Analytics**: Track sprint progress and metrics
- **Responsive UI**: Beautiful interface built with React, Tailwind CSS, and Radix UI

## 🏗️ Architecture

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **Recharts & Chart.js** - Data visualization
- **jsPDF & html2canvas** - PDF generation

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - Database for storing reports and metadata
- **Motor** - Async MongoDB driver
- **httpx** - Async HTTP client for Jira API calls

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
- **Jira API Token** - See instructions below

## 🔑 Getting Your Jira API Token

1. Log in to your Atlassian account at [https://id.atlassian.com](https://id.atlassian.com)
2. Go to **Security** → **Create and manage API tokens**
3. Click **Create API token**
4. Give it a label (e.g., "Jira Report Maker")
5. Copy the token - **you won't be able to see it again!**
6. You'll need:
   - Your Jira domain (e.g., `yourcompany.atlassian.net`)
   - Your Atlassian account email
   - The API token you just created

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd jiranew-nok
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (recommended)
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
copy .env.example .env  # Windows
# OR
cp .env.example .env    # macOS/Linux

# Edit .env file and configure MongoDB connection
# Default MongoDB URL: mongodb://localhost:27017
```

**Backend `.env` Configuration:**

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="jira_reports"
CORS_ORIGINS="http://localhost:3000,http://localhost:8000"
```

**Note:** Jira credentials are NOT stored in the backend. Users enter their credentials in the frontend UI, which are securely passed through the API on each request.

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Copy environment template and configure
copy .env.example .env  # Windows
# OR
cp .env.example .env    # macOS/Linux
```

**Frontend `.env` Configuration:**

```env
REACT_APP_BACKEND_URL=http://localhost:8000
WDS_SOCKET_PORT=3000
ENABLE_HEALTH_CHECK=false
```

### Step 4: Start MongoDB

Make sure MongoDB is running before starting the application:

```bash
# If installed locally, MongoDB usually starts as a service
# Otherwise, start it manually:

# On Windows (if not running as service):
mongod --dbpath="C:\data\db"

# On macOS/Linux:
mongod --dbpath=/data/db

# Or use MongoDB Compass GUI to start a local instance
```

## ▶️ Running the Application

You'll need **two terminal windows** - one for backend, one for frontend.

### Terminal 1: Start Backend

```bash
cd backend
# Activate virtual environment if not already activated
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Start FastAPI server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### Terminal 2: Start Frontend

```bash
cd frontend

# Start React development server
npm start
```

Frontend will automatically open at: `http://localhost:3000`

## 📖 Usage Guide

### First Time Setup

1. Open the application at `http://localhost:3000`
2. You'll see the configuration modal
3. Enter your Jira credentials:
   - **Jira Domain**: e.g., `yourcompany.atlassian.net`
   - **Email**: Your Atlassian account email
   - **API Token**: The token you created earlier
   - **Project Key**: Your Jira project key (e.g., `PROJ`)
4. Click **Test Connection** to verify
5. Once connected, click **Save & Continue**

### Generating Reports

1. **Select Date Range**: Choose the time period for your report
2. **Apply Filters**: 
   - Status (To Do, In Progress, Done, etc.)
   - Issue Type (Story, Task, Bug, etc.)
   - Sprint (if using Scrum)
   - Assignee
   - Labels
3. **View Metrics**: See real-time statistics and charts
4. **Export Report**: Generate PDF or Word document

### Story Points

The application automatically discovers your custom Story Points field. It checks for fields named:
- "Story Points"
- "Story Point Estimate"
- Any field containing both "story" and "point"

No manual configuration needed!

## 🔧 Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError` when starting backend

**Solution**: Make sure virtual environment is activated and dependencies are installed
```bash
pip install -r requirements.txt
```

**Problem**: Database connection error

**Solution**: Verify MongoDB is running and `MONGO_URL` in `.env` is correct

### Frontend Issues

**Problem**: API connection failed

**Solution**: 
1. Verify backend is running on port 8000
2. Check `REACT_APP_BACKEND_URL` in frontend `.env`
3. Check browser console for CORS errors

**Problem**: `npm install` fails

**Solution**: 
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Jira Connection Issues

**Problem**: Authentication failed

**Solution**:
1. Verify your Jira domain doesn't include `https://` (just `company.atlassian.net`)
2. Confirm you're using an API token, not your Atlassian password
3. Check that your Atlassian account email is correct
4. Ensure your API token hasn't expired

**Problem**: "403 Forbidden" error

**Solution**: Your API token may not have permission to access the project. Verify:
1. You have access to the project in Jira
2. The project key is correct
3. Your Jira permissions allow API access

## 📁 Project Structure

```
jiranew-nok/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment configuration
│   └── .env.example           # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   └── App.js             # Main app component
│   ├── package.json           # Node dependencies
│   ├── .env                   # Environment configuration
│   └── .env.example          # Environment template
└── README.md                  # This file
```

## 🔒 Security Notes

- **API Tokens**: Never commit your `.env` files or API tokens to version control
- **CORS**: Configure `CORS_ORIGINS` appropriately for production deployments
- **MongoDB**: Use authentication for MongoDB in production environments
- **HTTPS**: Use HTTPS in production (configure reverse proxy like nginx)

## 🚢 Production Deployment

### Backend Deployment

1. Use a production WSGI server:
```bash
pip install gunicorn
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. Set up environment variables securely (don't use `.env` files in production)
3. Configure MongoDB with authentication
4. Set up HTTPS with a reverse proxy (nginx, Apache, etc.)
5. Configure `CORS_ORIGINS` to your production frontend URL

### Frontend Deployment

1. Build the production bundle:
```bash
cd frontend
npm run build
```

2. Serve the `build` folder with a web server (nginx, Apache, etc.)
3. Update `REACT_APP_BACKEND_URL` to your production backend URL

### Recommended Hosting Options

- **Backend**: AWS EC2, Google Cloud Run, DigitalOcean Droplets, Heroku
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront, GitHub Pages
- **Database**: MongoDB Atlas (managed MongoDB in the cloud)

## 📝 API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/jira/test-connection` - Test Jira credentials
- `POST /api/jira/fields` - Discover available Jira fields (including story points)
- `POST /api/jira/users` - Get assignable users for a project
- `POST /api/jira/search` - Search issues with filters
- `POST /api/jira/sprints` - Get sprints for a project
- `POST /api/status` - Create status check (internal)
- `GET /api/status` - Get status checks (internal)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Jira API documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
3. Check MongoDB documentation: https://docs.mongodb.com/

## 🎉 Acknowledgments

- Built with FastAPI and React
- Uses Atlassian Jira Cloud REST API v3
- UI components from Radix UI
- Charts powered by Recharts and Chart.js
