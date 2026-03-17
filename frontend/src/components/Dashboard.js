import React, { useState, useRef } from 'react';
import { Settings, Download, Calendar, Filter, FileText, BarChart3 } from 'lucide-react';
import JiraService from '../services/jiraService';
import { processJiraData, getDatePresets } from '../services/dataProcessor';
import { generatePDF } from '../services/pdfGenerator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import MetricsCards from './MetricsCards';
import ChartsPreview from './ChartsPreview';

const Dashboard = ({ jiraConfig, onOpenConfig }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: [],
    issueType: [],
    labels: [],
    sprint: ''
  });
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const chartRefs = useRef({});

  const datePresets = getDatePresets();

  const handlePresetSelect = (preset) => {
    setFilters(prev => ({
      ...prev,
      startDate: preset.start,
      endDate: preset.end
    }));
  };

  const handleGenerateReport = async () => {
    if (!jiraConfig) {
      toast.error('Please configure JIRA connection first');
      onOpenConfig();
      return;
    }

    setLoading(true);
    setProgress(10);
    setProgressText('Connecting to JIRA...');

    try {
      const jiraService = new JiraService(jiraConfig);
      
      setProgress(20);
      setProgressText('Fetching issues...');
      
      const result = await jiraService.fetchIssues(filters);
      
      if (!result.success) {
        setLoading(false);
        setProgress(0);
        setProgressText('');
        toast.error(`Failed to fetch issues: ${result.error}`);
        return;
      }

      setProgress(50);
      setProgressText(`Found ${result.total} issues. Analyzing data...`);

      const processedMetrics = processJiraData(result.issues);
      setMetrics(processedMetrics);

      setProgress(80);
      setProgressText('Preparing preview...');

      setTimeout(() => {
        setProgress(100);
        setProgressText('Report ready!');
        toast.success(`Report generated successfully with ${result.total} issues`);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
          setProgressText('');
        }, 1000);
      }, 500);

    } catch (error) {
      console.error('Error generating report:', error);
      setLoading(false);
      setProgress(0);
      setProgressText('');
      toast.error(`Failed to generate report: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExportPDF = async () => {
    if (!metrics) {
      toast.error('Please generate report first');
      return;
    }

    setLoading(true);
    setProgress(10);
    setProgressText('Preparing PDF...');

    try {
      // Capture chart images
      setProgress(30);
      setProgressText('Generating charts...');
      
      const chartImages = {};
      for (const [key, ref] of Object.entries(chartRefs.current)) {
        if (ref?.toBase64Image) {
          chartImages[key] = ref.toBase64Image();
        }
      }

      setProgress(60);
      setProgressText('Creating PDF pages...');

      const dateRange = filters.startDate && filters.endDate 
        ? `${format(new Date(filters.startDate), 'MMM dd, yyyy')} - ${format(new Date(filters.endDate), 'MMM dd, yyyy')}`
        : 'All Time';

      const config = {
        projectKey: jiraConfig.projectKey,
        dateRange,
        totalIssues: metrics.volumeMetrics.total,
        completedIssues: Object.entries(metrics.volumeMetrics.byStatus)
          .filter(([status]) => status.toLowerCase().includes('done') || status.toLowerCase().includes('closed'))
          .reduce((sum, [, count]) => sum + count, 0),
        completionRate: metrics.storyPointsMetrics.completionRate,
        totalPoints: metrics.storyPointsMetrics.totalPoints,
        teamMembers: metrics.teamMetrics.totalMembers
      };

      const doc = await generatePDF(metrics, config, chartImages);

      setProgress(90);
      setProgressText('Downloading PDF...');

      const fileName = `JIRA_Report_${jiraConfig.projectKey}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      setProgress(100);
      setProgressText('PDF downloaded!');
      toast.success('PDF report downloaded successfully');
      
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setProgressText('');
      }, 1000);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(`Failed to export PDF: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <img 
            src="https://customer-assets.emergentagent.com/job_team-metrics-62/artifacts/9yxyauul_Lumen_Technologies_logo.svg-2048x294.png" 
            alt="Lumen Technologies"
            className="h-8 object-contain"
          />
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            data-testid="nav-dashboard-btn"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#0C9ED9] bg-blue-50 rounded-md"
          >
            <BarChart3 size={18} />
            Dashboard
          </button>
          <button 
            data-testid="nav-reports-btn"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-[#0C9ED9] hover:bg-blue-50 rounded-md transition-colors"
          >
            <FileText size={18} />
            Reports
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            data-testid="settings-btn"
            onClick={onOpenConfig}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-[#0C9ED9] hover:bg-blue-50 rounded-md transition-colors"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">JIRA Report Generator</h1>
            {jiraConfig && (
              <p className="text-sm text-slate-500 mt-0.5">Project: {jiraConfig.projectKey}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="settings-mobile-btn"
              onClick={onOpenConfig}
              variant="outline"
              size="sm"
              className="md:hidden"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Filter Panel */}
            <div className="col-span-1 md:col-span-4 lg:col-span-3 space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter size={18} className="text-[#0C9ED9]" />
                  <h2 className="text-lg font-semibold">Filters</h2>
                </div>

                <div className="space-y-4">
                  {/* Date Range */}
                  <div>
                    <Label htmlFor="start-date" className="flex items-center gap-2 mb-2">
                      <Calendar size={14} />
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      data-testid="start-date-input"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      data-testid="end-date-input"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <Label>Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.values(datePresets).map((preset) => (
                        <Button
                          key={preset.label}
                          data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetSelect(preset)}
                          className="text-xs"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Label htmlFor="status-filter">Status (Optional)</Label>
                    <Input
                      id="status-filter"
                      data-testid="status-filter-input"
                      placeholder="e.g. Done, In Progress"
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        status: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                    />
                  </div>

                  {/* Issue Type Filter */}
                  <div>
                    <Label htmlFor="issue-type-filter">Issue Type (Optional)</Label>
                    <Input
                      id="issue-type-filter"
                      data-testid="issue-type-filter-input"
                      placeholder="e.g. Bug, Story, Task"
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        issueType: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                    />
                  </div>
                </div>

                <Button
                  data-testid="generate-report-btn"
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="w-full mt-6 bg-[#0C9ED9] hover:bg-[#0A85B6] text-white"
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>

                {metrics && (
                  <Button
                    data-testid="export-pdf-btn"
                    onClick={handleExportPDF}
                    disabled={loading}
                    variant="outline"
                    className="w-full mt-3"
                  >
                    <Download size={16} className="mr-2" />
                    Export to PDF
                  </Button>
                )}
              </Card>

              {loading && (
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{progressText}</span>
                      <span className="font-medium text-[#0C9ED9]">{progress}%</span>
                    </div>
                    <div className="loading-bar">
                      <div 
                        className="loading-bar-progress" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Preview Panel */}
            <div className="col-span-1 md:col-span-8 lg:col-span-9">
              {!metrics ? (
                <Card className="p-12 text-center">
                  <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No Report Generated</h3>
                  <p className="text-slate-500">
                    Configure your filters and click "Generate Report" to create your JIRA analysis
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  <MetricsCards metrics={metrics} />
                  <ChartsPreview metrics={metrics} chartRefs={chartRefs} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;