import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Settings2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const ConfigurationModal = ({ open, onClose, onSave, initialConfig }) => {
  const [config, setConfig] = useState({
    url: '',
    email: '',
    apiToken: '',
    projectKey: '',
    storyPointsFieldId: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [loadingFields, setLoadingFields] = useState(false);
  const [storyPointsFields, setStoryPointsFields] = useState([]);

  useEffect(() => {
    if (initialConfig) {
      setConfig({
        url: initialConfig.url || '',
        email: initialConfig.email || '',
        apiToken: initialConfig.apiToken || '',
        projectKey: initialConfig.projectKey || '',
        storyPointsFieldId: initialConfig.storyPointsFieldId || ''
      });
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
        
        // After successful connection, fetch available fields
        await fetchStoryPointsFields();
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

  const fetchStoryPointsFields = async () => {
    if (!config.url || !config.email || !config.apiToken) return;
    
    setLoadingFields(true);
    try {
      const jiraService = new JiraService(config);
      const result = await jiraService.fetchFields();
      
      if (result.success && result.storyPointsFields) {
        setStoryPointsFields(result.storyPointsFields);
        
        // Auto-select the first field if available and none selected
        if (result.storyPointsFields.length > 0 && !config.storyPointsFieldId) {
          setConfig(prev => ({
            ...prev,
            storyPointsFieldId: result.storyPointsFields[0].id
          }));
        }
        
        if (result.storyPointsFields.length > 1) {
          toast.info(`Found ${result.storyPointsFields.length} potential Story Points fields. Please select the correct one.`);
        } else if (result.storyPointsFields.length === 1) {
          toast.success(`Found Story Points field: ${result.storyPointsFields[0].name}`);
        }
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleSave = () => {
    if (!config.url || !config.email || !config.apiToken || !config.projectKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave(config);
    toast.success('Configuration saved successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-white border-slate-200" data-testid="config-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings2 className="text-cyan-600" size={24} />
            JIRA Configuration
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Configure your JIRA Cloud connection to generate reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div>
            <Label htmlFor="jira-url" className="text-slate-700">JIRA URL *</Label>
            <Input
              id="jira-url"
              data-testid="jira-url-input"
              placeholder="https://your-domain.atlassian.net"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Your JIRA Cloud instance URL</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jira-email" className="text-slate-700">Email *</Label>
              <Input
                id="jira-email"
                data-testid="jira-email-input"
                type="email"
                placeholder="your-email@example.com"
                value={config.email}
                onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500"
              />
            </div>

            <div>
              <Label htmlFor="api-token" className="text-slate-700">API Token *</Label>
              <Input
                id="api-token"
                data-testid="api-token-input"
                type="password"
                placeholder="Your JIRA API token"
                value={config.apiToken}
                onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500"
              />
            </div>
          </div>
          
          <p className="text-xs text-slate-500 -mt-3">
            Generate API token at: <a 
              href="https://id.atlassian.com/manage-profile/security/api-tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-600 hover:underline"
            >
              Atlassian API Tokens
            </a>
          </p>

          <div>
            <Label htmlFor="project-key" className="text-slate-700">Project Key *</Label>
            <Input
              id="project-key"
              data-testid="project-key-input"
              placeholder="e.g., PROJ, TEAM, DEV"
              value={config.projectKey}
              onChange={(e) => setConfig(prev => ({ ...prev, projectKey: e.target.value.toUpperCase() }))}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Your JIRA project key (usually 2-4 letters)</p>
          </div>

          {/* Story Points Field Selection */}
          <div className="pt-2 border-t border-slate-200">
            <Label htmlFor="story-points-field" className="text-slate-700 flex items-center gap-2">
              Story Points Field
              {loadingFields && <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />}
            </Label>
            <Select
              value={config.storyPointsFieldId || 'auto'}
              onValueChange={(value) => setConfig(prev => ({ 
                ...prev, 
                storyPointsFieldId: value === 'auto' ? '' : value 
              }))}
            >
              <SelectTrigger className="bg-white border-slate-300 text-slate-900 focus:border-cyan-500">
                <SelectValue placeholder="Auto-detect (recommended)" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="auto" className="text-slate-700 focus:bg-slate-100">
                  Auto-detect (recommended)
                </SelectItem>
                {storyPointsFields.map((field) => (
                  <SelectItem 
                    key={field.id} 
                    value={field.id}
                    className="text-slate-700 focus:bg-slate-100"
                  >
                    {field.name} ({field.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              {storyPointsFields.length > 0 
                ? `Found ${storyPointsFields.length} potential Story Points field(s). Select the one your team uses.`
                : 'Test connection to discover available Story Points fields.'
              }
            </p>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
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
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            <Button
              data-testid="save-config-btn"
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 font-semibold"
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
