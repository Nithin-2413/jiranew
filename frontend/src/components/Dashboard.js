import React, { useState, useRef } from 'react';
import { Settings, Download, Filter, FileText, BarChart3, Users, Bug, Target, Clock, CheckCircle, Zap, Tag, TrendingUp, TrendingDown, X } from 'lucide-react';
import JiraService from '../services/jiraService';
import { processJiraData } from '../services/dataProcessor';
import { generatePDF } from '../services/pdfGenerator';
import { generateWordDocument } from '../services/wordGenerator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from './ui/button';
import MetricsCards from './MetricsCards';
import ChartsPreview from './ChartsPreview';
import FilterModalEnhanced from './FilterModalEnhanced';
import ExportOptionsModalEnhanced, { DEFAULT_EXPORT_OPTIONS } from './ExportOptionsModalEnhanced';
import html2canvas from 'html2canvas';
import '../premium-design.css';

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
  const [rawIssues, setRawIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState(DEFAULT_EXPORT_OPTIONS);
  const chartRefs = useRef({});

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

      setRawIssues(result.issues);
      const processedMetrics = processJiraData(result.issues);
      
      // Add query info to metrics for display
      processedMetrics.queryInfo = {
        jql: result.jqlUsed,
        issueTypeCounts: result.issueTypeCounts,
        total: result.total
      };
      
      setMetrics(processedMetrics);

      setProgress(80);
      setProgressText('Preparing analytics...');

      console.log('Story Points Summary:', {
        field: result.storyPointsField,
        issuesWithPoints: result.issuesWithPoints,
        totalPoints: result.totalStoryPoints
      });

      console.log('Issue Type Breakdown:', result.issueTypeCounts);

      setTimeout(() => {
        setProgress(100);
        setProgressText('Report ready!');
        const breakdown = Object.entries(result.issueTypeCounts || {})
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ');
        toast.success(`Report generated with ${result.total} issues (${breakdown})`);
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
      toast.error(`Failed: ${error.message}`);
    }
  };

  const getExportConfig = () => {
    const dateRange = filters.startDate && filters.endDate 
      ? `${format(new Date(filters.startDate), 'MMM dd, yyyy')} - ${format(new Date(filters.endDate), 'MMM dd, yyyy')}`
      : 'All Time';

    const completedIssues = Object.entries(metrics.volumeMetrics.byStatus)
      .filter(([status]) => status.toLowerCase().includes('done') || status.toLowerCase().includes('closed'))
      .reduce((sum, [, count]) => sum + count, 0);

    return {
      projectKey: jiraConfig.projectKey,
      dateRange,
      totalIssues: metrics.volumeMetrics.total,
      completedIssues,
      completionRate: metrics.storyPointsMetrics.completionRate,
      totalPoints: metrics.storyPointsMetrics.totalPoints,
      teamMembers: metrics.teamMetrics.totalMembers
    };
  };

  const handleExportPDF = async () => {
    if (!metrics) {
      toast.error('Please generate report first');
      return;
    }

    setLoading(true);
    setProgress(10);
    setProgressText('Preparing PDF...');
    setShowExportModal(false);

    try {
      setProgress(20);
      setProgressText('Capturing high-quality charts...');
      
      // Use html2canvas for HIGH QUALITY chart capture
      const chartImages = {};
      const chartElements = document.querySelectorAll('[data-chart-id]');
      const quality = exportOptions.chartScale || 2;
      
      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i];
        const chartId = element.getAttribute('data-chart-id');
        
        setProgressText(`Capturing chart ${i + 1}/${chartElements.length}...`);
        setProgress(20 + (i / chartElements.length) * 30);
        
        try {
          const canvas = await html2canvas(element, {
            scale: quality,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: element.offsetWidth,
            height: element.offsetHeight
          });
          chartImages[chartId] = canvas.toDataURL('image/png', 0.95);
        } catch (err) {
          console.warn(`Failed to capture chart ${chartId}:`, err);
        }
      }

      setProgress(60);
      setProgressText('Creating PDF document...');

      const config = getExportConfig();
      const doc = await generatePDF(metrics, config, chartImages, exportOptions);

      setProgress(90);
      setProgressText('Preparing download...');

      const fileName = `JIRA_Report_${jiraConfig.projectKey}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      setProgress(100);
      toast.success('PDF downloaded successfully!');
      
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setProgressText('');
      }, 1000);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      setLoading(false);
      setProgress(0);
      setProgressText('');
      toast.error(`Failed to export PDF: ${error.message}`);
    }
  };

  const handleExportWord = async () => {
    if (!metrics) {
      toast.error('Please generate report first');
      return;
    }

    setLoading(true);
    setProgress(10);
    setProgressText('Preparing Word document...');
    setShowExportModal(false);

    try {
      setProgress(20);
      setProgressText('Capturing high-quality charts...');
      
      // Use html2canvas for HIGH QUALITY chart capture
      const chartImages = {};
      const chartElements = document.querySelectorAll('[data-chart-id]');
      const quality = exportOptions.chartScale || 2;
      
      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i];
        const chartId = element.getAttribute('data-chart-id');
        
        setProgressText(`Capturing chart ${i + 1}/${chartElements.length}...`);
        setProgress(20 + (i / chartElements.length) * 30);
        
        try {
          const canvas = await html2canvas(element, {
            scale: quality,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: element.offsetWidth,
            height: element.offsetHeight
          });
          chartImages[chartId] = canvas.toDataURL('image/png', 0.95);
        } catch (err) {
          console.warn(`Failed to capture chart ${chartId}:`, err);
        }
      }

      setProgress(60);
      setProgressText('Creating Word document...');

      const config = getExportConfig();
      await generateWordDocument(metrics, config, chartImages, exportOptions);

      setProgress(100);
      toast.success('Word document downloaded successfully!');
      
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setProgressText('');
      }, 1000);

    } catch (error) {
      console.error('Error exporting Word:', error);
      setLoading(false);
      setProgress(0);
      setProgressText('');
      toast.error(`Failed to export Word: ${error.message}`);
    }
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
    handleGenerateReport();
  };

  return (
    <div className="min-h-screen premium-app-bg">
      {/* Premium Hero Section */}
      <div className="hero-section">
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_team-metrics-62/artifacts/9yxyauul_Lumen_Technologies_logo.svg-2048x294.png" 
                alt="Lumen Technologies"
                className="h-10 object-contain opacity-90"
              />
              <div className="h-10 w-px bg-slate-300/50" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">JIRA Analytics Platform</h1>
                {jiraConfig && (
                  <p className="text-sm text-slate-600 mt-0.5">
                    Project: <span className="text-indigo-600 font-semibold">{jiraConfig.projectKey}</span>
                  </p>
                )}
              </div>
            </div>
            <Button
              data-testid="settings-btn"
              onClick={onOpenConfig}
              className="btn-premium-ghost"
            >
              <Settings size={18} />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Comprehensive Team Analytics
              </h2>
              <p className="text-slate-600 text-base md:text-lg">
                Generate insightful reports with live JIRA data visualization and export capabilities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                data-testid="filter-btn"
                onClick={() => setShowFilterModal(true)}
                className="btn-premium-ghost"
              >
                <Filter size={18} className="mr-2" />
                Configure Filters
              </Button>
              <Button
                data-testid="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={loading}
                className="btn-premium"
              >
                <BarChart3 size={20} className="mr-2" />
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              {metrics && (
                <Button
                  data-testid="export-btn"
                  onClick={() => setShowExportModal(true)}
                  disabled={loading}
                  className="btn-premium-secondary"
                >
                  <Download size={20} className="mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-8 premium-card p-6">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-700 font-medium">{progressText}</span>
                <span className="font-bold text-indigo-600">{progress}%</span>
              </div>
              <div className="premium-progress-bar">
                <div className="premium-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Filter Bar (when report is loaded) */}
      {metrics && (
        <div className="max-w-[1600px] mx-auto px-8 -mt-8 relative z-10">
          <div className="premium-filter-bar">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Filter size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Active JQL Query</p>
                <code className="text-xs text-slate-700 font-mono truncate block">
                  {metrics.queryInfo?.jql || 'No filters applied'}
                </code>
              </div>
            </div>
            <Button
              onClick={() => setShowFilterModal(true)}
              className="btn-premium-ghost flex-shrink-0"
              size="sm"
            >
              <Filter size={16} className="mr-2" />
              Modify Filters
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">

        {/* Analytics Content */}
        {!metrics ? (
          <div className="premium-card p-16 text-center premium-empty-state">
            <div className="max-w-lg mx-auto">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-100">
                <BarChart3 size={48} className="text-indigo-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Ready to Generate Insights</h3>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                Configure your JIRA filters and generate comprehensive analytics with beautiful visualizations and export capabilities
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => setShowFilterModal(true)}
                  className="btn-premium-ghost"
                >
                  <Filter size={18} className="mr-2" />
                  Configure Filters
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  className="btn-premium"
                >
                  <BarChart3 size={18} className="mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Query Info Section */}
            {metrics.queryInfo && (
              <div className="premium-card p-6 border-l-4 border-indigo-500">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <BarChart3 size={20} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Query Details</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">JQL Query</p>
                        <code className="text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 block overflow-x-auto font-mono">
                          {metrics.queryInfo.jql}
                        </code>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Issue Type Breakdown</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(metrics.queryInfo.issueTypeCounts || {}).map(([type, count]) => (
                            <span key={type} className="premium-badge">
                              {type}: <strong>{count}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        💡 Sub-tasks are excluded by default. You can verify by copying the JQL query above and running it in JIRA.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* KPI Cards */}
            <MetricsCards metrics={metrics} />

            {/* Charts */}
            <ChartsPreview metrics={metrics} chartRefs={chartRefs} />
          </div>
        )}
      </div>

      {/* Modals */}
      <FilterModalEnhanced 
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
        availableAssignees={metrics ? Object.keys(metrics.teamMetrics.byAssignee || {}) : []}
        availableLabels={metrics ? metrics.labelMetrics.topLabels.map(l => l.label) : []}
      />

      <ExportOptionsModalEnhanced
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportOptions={exportOptions}
        setExportOptions={setExportOptions}
        onExportPDF={handleExportPDF}
        onExportWord={handleExportWord}
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;
