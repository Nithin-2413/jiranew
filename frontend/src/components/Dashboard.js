import React, { useState, useRef } from 'react';
import { Settings, Download, Filter, FileText, BarChart3, Users, Bug, Target, Clock, CheckCircle, Zap, Tag } from 'lucide-react';
import JiraService from '../services/jiraService';
import { processJiraData } from '../services/dataProcessor';
import { generatePDF } from '../services/pdfGenerator';
import { generateWordDocument } from '../services/wordGenerator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from './ui/button';
import MetricsCards from './MetricsCards';
import ChartsPreview from './ChartsPreview';
import FilterModal from './FilterModal';
import ExportOptionsModal, { DEFAULT_EXPORT_OPTIONS } from './ExportOptionsModal';

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
      setMetrics(processedMetrics);

      setProgress(80);
      setProgressText('Preparing analytics...');

      console.log('Story Points Summary:', {
        field: result.storyPointsField,
        issuesWithPoints: result.issuesWithPoints,
        totalPoints: result.totalStoryPoints
      });

      setTimeout(() => {
        setProgress(100);
        setProgressText('Report ready!');
        toast.success(`Report generated with ${result.total} issues (${result.issuesWithPoints || 0} with story points)`);
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

  const captureCharts = async () => {
    const chartImages = {};
    const html2canvas = (await import('html2canvas')).default;
    
    // Slight delay to ensure charts are fully rendered
    await new Promise(resolve => setTimeout(resolve, 800));

    for (const [key, ref] of Object.entries(chartRefs.current)) {
      if (ref && ref.canvas) {
        const elementToCapture = ref.canvas.closest('.chart-card') || ref.canvas.parentElement;
        if (elementToCapture) {
          const canvasObj = await html2canvas(elementToCapture, {
            backgroundColor: '#0F172A', // Dark theme background for exports to match UI
            scale: 2,
            logging: false
          });
          chartImages[key] = canvasObj.toDataURL('image/png');
        } else {
          chartImages[key] = ref.toBase64Image();
        }
      } else if (ref && ref.toBase64Image) {
        chartImages[key] = ref.toBase64Image();
      }
    }
    return chartImages;
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
      setProgress(30);
      setProgressText('Capturing charts...');
      
      const chartImages = await captureCharts();

      setProgress(60);
      setProgressText('Creating PDF...');

      const config = getExportConfig();
      const doc = await generatePDF(metrics, config, chartImages, exportOptions);

      setProgress(90);
      setProgressText('Downloading...');

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
      setProgress(30);
      setProgressText('Capturing charts...');
      
      const chartImages = await captureCharts();

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
    <div className="min-h-screen bg-[#0B1120] text-slate-200">
      {/* Header */}
      <div className="bg-[#0F172A]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">JIRA Analytics</h1>
                {jiraConfig && (
                  <p className="text-sm text-slate-400">Project: <span className="text-cyan-400 font-semibold">{jiraConfig.projectKey}</span></p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                data-testid="filter-btn"
                onClick={() => setShowFilterModal(true)}
                className="bg-[#1E293B] hover:bg-[#334155] text-slate-200 border border-white/10 font-medium shadow-sm transition-colors"
              >
                <Filter size={18} className="mr-2 text-cyan-400" />
                Filters
              </Button>
              <Button
                data-testid="settings-btn"
                onClick={onOpenConfig}
                variant="outline"
                className="bg-[#1E293B] hover:bg-[#334155] text-slate-200 border border-white/10 transition-colors"
              >
                <Settings size={18} className="text-cyan-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Action Bar */}
        <div className="bg-[#0F172A]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 mb-8 shadow-xl">
          <div className="flex flex-wrap gap-4">
            <Button
              data-testid="generate-report-btn"
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex-1 min-w-[200px] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-14 text-base font-semibold shadow-lg shadow-cyan-500/20 transition-all border-0"
            >
              <BarChart3 size={20} className="mr-2" />
              {loading ? 'Generating Report...' : 'Generate Report'}
            </Button>
            {metrics && (
              <Button
                data-testid="export-btn"
                onClick={() => setShowExportModal(true)}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white h-14 px-8 text-base font-semibold shadow-lg shadow-emerald-500/20 transition-all border-0"
              >
                <Download size={20} className="mr-2" />
                Export Report
              </Button>
            )}
          </div>

          {/* Progress */}
          {loading && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium">{progressText}</span>
                <span className="font-bold text-cyan-400">{progress}%</span>
              </div>
              <div className="loading-bar">
                <div className="loading-bar-progress" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Analytics Content */}
        {!metrics ? (
          <div className="bg-[#0F172A]/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/5 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                <BarChart3 size={48} className="text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">Ready to Analyze</h3>
              <p className="text-slate-400 mb-8 text-lg">
                Configure your filters and click "Generate Report" to fetch and analyze your JIRA data
              </p>
              <Button
                onClick={() => setShowFilterModal(true)}
                className="bg-[#1E293B] hover:bg-[#334155] text-white border border-white/10 font-medium shadow-sm transition-colors px-6 h-12"
              >
                <Filter size={18} className="mr-2 text-cyan-400" />
                Configure Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <MetricsCards metrics={metrics} />
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="analytics-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center border border-white/5 shadow-sm">
                    <CheckCircle size={20} className="text-teal-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Test Coverage</h4>
                </div>
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">
                  {metrics.advancedAnalytics.testMetrics.total}
                </div>
                <div className="text-sm text-slate-500">Total Tests</div>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-medium">
                    ✓ {metrics.advancedAnalytics.testMetrics.passed} passed
                  </span>
                  {metrics.advancedAnalytics.testMetrics.failed > 0 && (
                    <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded font-medium">
                      ✗ {metrics.advancedAnalytics.testMetrics.failed} failed
                    </span>
                  )}
                </div>
              </div>

              <div className="analytics-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-white/5 shadow-sm">
                    <Clock size={20} className="text-amber-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Avg Resolution</h4>
                </div>
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">
                  {metrics.timeMetrics.avgResolutionTime}
                </div>
                <div className="text-sm text-slate-500">Days</div>
                <div className="mt-3 text-xs text-slate-400">
                  <span className="text-amber-400 font-medium">{metrics.timeMetrics.resolvedIssues}</span> issues resolved
                </div>
              </div>

              <div className="analytics-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/5 shadow-sm">
                    <Tag size={20} className="text-purple-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Labels Used</h4>
                </div>
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">
                  {metrics.labelMetrics.topLabels.length}
                </div>
                <div className="text-sm text-slate-500">Unique Labels</div>
                <div className="mt-3 text-xs text-slate-400">
                  <span className="text-purple-400 font-medium">{Object.keys(metrics.labelMetrics.labelByIssueType).length}</span> categories
                </div>
              </div>

              <div className="analytics-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center border border-white/5 shadow-sm">
                    <Bug size={20} className="text-rose-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Bug Density</h4>
                </div>
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">
                  {metrics.qualityMetrics.bugDensity}%
                </div>
                <div className="text-sm text-slate-500">Bugs per Story</div>
                <div className="mt-3 text-xs text-slate-400">
                  <span className="text-rose-400 font-medium">{metrics.qualityMetrics.totalBugs}</span> total bugs
                </div>
              </div>
            </div>

            {/* Charts */}
            <ChartsPreview metrics={metrics} chartRefs={chartRefs} />
          </div>
        )}
      </div>

      {/* Modals */}
      <FilterModal 
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
      />

      <ExportOptionsModal
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
