import React, { useState, useRef } from 'react';
import { Settings, Download, Filter, BarChart3, TrendingUp, Activity } from 'lucide-react';
import JiraService from '../services/jiraService';
import { processJiraData } from '../services/dataProcessor';
import { generatePDF } from '../services/pdfGenerator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from './ui/button';
import MetricsCards from './MetricsCards';
import ChartsPreview from './ChartsPreview';
import FilterModal from './FilterModal';

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
  const [showFilterModal, setShowFilterModal] = useState(false);
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

      const processedMetrics = processJiraData(result.issues);
      setMetrics(processedMetrics);

      setProgress(80);
      setProgressText('Preparing analytics...');

      setTimeout(() => {
        setProgress(100);
        setProgressText('Report ready!');
        toast.success(`Report generated with ${result.total} issues`);
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
      setLoading(false);
      setProgress(0);
      setProgressText('');
      toast.error(`Failed to export PDF: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Bar */}
      <div className="glass-panel border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg">
              <BarChart3 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">JIRA Analytics Dashboard</h1>
              {jiraConfig && (
                <p className="text-sm text-slate-300">Project: {jiraConfig.projectKey}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="filter-btn"
              onClick={() => setShowFilterModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 shadow-lg"
            >
              <Filter size={18} className="mr-2" />
              Filters
            </Button>
            <Button
              data-testid="settings-btn"
              onClick={onOpenConfig}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Settings size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            data-testid="generate-report-btn"
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 py-6 text-lg font-semibold shadow-xl"
          >
            <Activity size={20} className="mr-2" />
            {loading ? 'Generating...' : 'Generate Analytics Report'}
          </Button>
          {metrics && (
            <Button
              data-testid="export-pdf-btn"
              onClick={handleExportPDF}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 py-6 px-8 text-lg font-semibold shadow-xl"
            >
              <Download size={20} className="mr-2" />
              Export PDF
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="glass-panel p-6 rounded-2xl mb-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white font-medium">{progressText}</span>
                <span className="font-bold text-cyan-400">{progress}%</span>
              </div>
              <div className="loading-bar">
                <div 
                  className="loading-bar-progress" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {!metrics ? (
          <div className="glass-panel p-16 rounded-2xl text-center">
            <div className="mb-6">
              <TrendingUp size={64} className="mx-auto text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Analytics Yet</h3>
            <p className="text-slate-300 text-lg mb-6">
              Click "Generate Analytics Report" to fetch and analyze your JIRA data
            </p>
            <Button
              onClick={() => setShowFilterModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
            >
              <Filter size={18} className="mr-2" />
              Configure Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <MetricsCards metrics={metrics} />
            
            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="stat-card">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">Test Coverage</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    {metrics.advancedAnalytics.testMetrics.total}
                  </span>
                  <span className="text-lg text-slate-400">tests</span>
                </div>
                <div className="mt-3 flex gap-2 text-sm">
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
                    ✓ {metrics.advancedAnalytics.testMetrics.passed} passed
                  </span>
                  {metrics.advancedAnalytics.testMetrics.failed > 0 && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded">
                      ✗ {metrics.advancedAnalytics.testMetrics.failed} failed
                    </span>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">Avg Resolution</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    {metrics.timeMetrics.avgResolutionTime}
                  </span>
                  <span className="text-lg text-slate-400">days</span>
                </div>
                <div className="mt-3 text-sm text-slate-400">
                  Based on {metrics.timeMetrics.resolvedIssues} resolved issues
                </div>
              </div>

              <div className="stat-card">
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-2">Label Usage</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    {metrics.labelMetrics.topLabels.length}
                  </span>
                  <span className="text-lg text-slate-400">labels</span>
                </div>
                <div className="mt-3 text-sm text-slate-400">
                  {Object.keys(metrics.labelMetrics.labelByIssueType).length} unique categories
                </div>
              </div>
            </div>

            <ChartsPreview metrics={metrics} chartRefs={chartRefs} />
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal 
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={() => {
          if (metrics) {
            handleGenerateReport();
          }
        }}
      />
    </div>
  );
};

export default Dashboard;