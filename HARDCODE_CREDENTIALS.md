# How to Hardcode Your JIRA Credentials

Since you mentioned you want to hardcode your JIRA credentials later, here's exactly where to add them:

## Option 1: Hardcode in Frontend (Recommended for Testing)

Edit `/app/frontend/src/App.js`:

```javascript
import React, { useState, useEffect } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from './components/Dashboard';
import ConfigurationModal from './components/ConfigurationModal';
import { Toaster } from './components/ui/sonner';

// 🔑 HARDCODED JIRA CREDENTIALS - Replace with your actual values
const DEFAULT_JIRA_CONFIG = {
  url: 'https://your-company.atlassian.net',  // Your JIRA URL
  email: 'your-email@company.com',             // Your JIRA email
  apiToken: 'YOUR_API_TOKEN_HERE',             // Your JIRA API token
  projectKey: 'YOURPROJECT'                    // Your project key (e.g., PROJ, TEAM)
};

function App() {
  const [jiraConfig, setJiraConfig] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Check if JIRA config exists in localStorage
    const savedConfig = localStorage.getItem('jiraConfig');
    if (savedConfig) {
      setJiraConfig(JSON.parse(savedConfig));
    } else {
      // 🔑 Use hardcoded config if no saved config exists
      setJiraConfig(DEFAULT_JIRA_CONFIG);
      localStorage.setItem('jiraConfig', JSON.stringify(DEFAULT_JIRA_CONFIG));
      // Optionally skip showing the config modal
      // setShowConfig(false); // Uncomment to auto-skip configuration
    }
  }, []);

  const handleConfigSave = (config) => {
    setJiraConfig(config);
    localStorage.setItem('jiraConfig', JSON.stringify(config));
    setShowConfig(false);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                jiraConfig={jiraConfig} 
                onOpenConfig={() => setShowConfig(true)}
              />
            } 
          />
        </Routes>
      </BrowserRouter>
      
      <ConfigurationModal 
        open={showConfig}
        onClose={() => setShowConfig(false)}
        onSave={handleConfigSave}
        initialConfig={jiraConfig}
      />
      
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
```

## Option 2: Environment Variables (Recommended for Production)

Create/edit `/app/frontend/.env`:

```bash
REACT_APP_BACKEND_URL=https://team-metrics-62.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false

# 🔑 Add your JIRA credentials here
REACT_APP_JIRA_URL=https://your-company.atlassian.net
REACT_APP_JIRA_EMAIL=your-email@company.com
REACT_APP_JIRA_API_TOKEN=YOUR_API_TOKEN_HERE
REACT_APP_JIRA_PROJECT_KEY=YOURPROJECT
```

Then update `/app/frontend/src/App.js` to read from environment:

```javascript
const DEFAULT_JIRA_CONFIG = {
  url: process.env.REACT_APP_JIRA_URL || 'https://your-company.atlassian.net',
  email: process.env.REACT_APP_JIRA_EMAIL || 'your-email@company.com',
  apiToken: process.env.REACT_APP_JIRA_API_TOKEN || 'YOUR_API_TOKEN_HERE',
  projectKey: process.env.REACT_APP_JIRA_PROJECT_KEY || 'YOURPROJECT'
};
```

## Option 3: Backend Environment Variables (Most Secure)

Create/edit `/app/backend/.env`:

```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"

# 🔑 Add your JIRA credentials here (server-side)
JIRA_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=YOUR_API_TOKEN_HERE
JIRA_PROJECT_KEY=YOURPROJECT
```

## How to Get Your JIRA API Token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "JIRA Report Generator")
4. Copy the token (you won't see it again!)
5. Paste it into your configuration

## Testing Your Credentials

After hardcoding your credentials:

1. Clear your browser's localStorage (F12 → Application → Local Storage → Clear)
2. Refresh the page
3. Your credentials should be automatically loaded
4. Click "Generate Report" to test
5. If successful, you'll see your JIRA data!

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit credentials to Git** - Add `.env` to `.gitignore`
2. **Use environment variables** in production (Option 2 or 3)
3. **Rotate API tokens** regularly
4. **Use restricted tokens** with minimal permissions
5. **Backend storage** (Option 3) is most secure as credentials never reach the browser

## Quick Start Command

After hardcoding credentials, restart the frontend:

```bash
sudo supervisorctl restart frontend
```

## Need Help?

If you encounter issues:
1. Check that your JIRA URL doesn't have a trailing slash
2. Verify your API token is valid (test at https://your-company.atlassian.net/rest/api/3/myself)
3. Confirm your project key is correct (usually 2-4 uppercase letters)
4. Check browser console for detailed error messages

---

**Current Configuration:**
- Backend proxy: ✅ Active (CORS resolved)
- Frontend: ✅ Ready for credentials
- Endpoints: ✅ All working
