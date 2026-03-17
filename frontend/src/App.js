import React, { useState, useEffect } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from './components/Dashboard';
import ConfigurationModal from './components/ConfigurationModal';
import { Toaster } from './components/ui/sonner';

function App() {
  const [jiraConfig, setJiraConfig] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Check if JIRA config exists in localStorage
    const savedConfig = localStorage.getItem('jiraConfig');
    if (savedConfig) {
      setJiraConfig(JSON.parse(savedConfig));
    } else {
      setShowConfig(true);
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