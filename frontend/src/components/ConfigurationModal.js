import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import JiraService from '../services/jiraService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const ConfigurationModal = ({ open, onClose, onSave, initialConfig }) => {
  const [config, setConfig] = useState({
    url: '',
    email: '',
    apiToken: '',
    projectKey: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleTestConnection = async () => {
    if (!config.url || !config.email || !config.apiToken) {
      toast.error('Please fill in all connection fields');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const jiraService = new JiraService(config);
      const result = await jiraService.testConnection();

      if (result.success) {
        setTestResult({ success: true, message: `Connected as ${result.data.displayName}` });
        toast.success('Connection successful!');
      } else {
        setTestResult({ success: false, message: result.error });
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
      toast.error(`Connection error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!config.url || !config.email || !config.apiToken || !config.projectKey) {
      toast.error('Please fill in all fields');
      return;
    }

    onSave(config);
    toast.success('Configuration saved successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="config-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">JIRA Configuration</DialogTitle>
          <DialogDescription>
            Configure your JIRA Cloud connection to generate reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="jira-url">JIRA URL</Label>
            <Input
              id="jira-url"
              data-testid="jira-url-input"
              placeholder="https://your-domain.atlassian.net"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
            />
            <p className="text-xs text-slate-500 mt-1">Your JIRA Cloud instance URL</p>
          </div>

          <div>
            <Label htmlFor="jira-email">Email</Label>
            <Input
              id="jira-email"
              data-testid="jira-email-input"
              type="email"
              placeholder="your-email@example.com"
              value={config.email}
              onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
            />
            <p className="text-xs text-slate-500 mt-1">Your JIRA account email</p>
          </div>

          <div>
            <Label htmlFor="api-token">API Token</Label>
            <Input
              id="api-token"
              data-testid="api-token-input"
              type="password"
              placeholder="Your JIRA API token"
              value={config.apiToken}
              onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
            />
            <p className="text-xs text-slate-500 mt-1">
              Generate at: <a 
                href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#0C9ED9] hover:underline"
              >
                Atlassian API Tokens
              </a>
            </p>
          </div>

          <div>
            <Label htmlFor="project-key">Project Key</Label>
            <Input
              id="project-key"
              data-testid="project-key-input"
              placeholder="e.g., PROJ, TEAM, DEV"
              value={config.projectKey}
              onChange={(e) => setConfig(prev => ({ ...prev, projectKey: e.target.value.toUpperCase() }))}
            />
            <p className="text-xs text-slate-500 mt-1">Your JIRA project key (usually 2-4 letters)</p>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              data-testid="test-connection-btn"
              onClick={handleTestConnection}
              disabled={testing}
              variant="outline"
              className="flex-1"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              data-testid="save-config-btn"
              onClick={handleSave}
              className="flex-1 bg-[#0C9ED9] hover:bg-[#0A85B6] text-white"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationModal;