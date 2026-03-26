import React, { useState, useRef, useEffect } from 'react';
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
    sprint: '',
    team: 'all',
    customJql: ''
  });
  const [metrics, setMetrics] = useState(null);
  const [rawIssues, setRawIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState(DEFAULT_EXPORT_OPTIONS);
  const [teams, setTeams] = useState([]);
  const chartRefs = useRef({});
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    const fetchTeams = async () => {
      if (!jiraConfig) return;
      try {
        const res = await fetch(`${API_URL}/api/jira/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: jiraConfig }),
        });
        const data = await res.json();
        if (data.success && data.teams.length > 0) setTeams(data.teams);
      } catch (e) {
        console.warn('Could not load teams:', e);
      }
    };
    fetchTeams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jiraConfig]);


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
    await new Promise(resolve => setTimeout(resolve, 800));
    for (const [key, ref] of Object.entries(chartRefs.current)) {
      if (ref && ref.canvas) {
        const elementToCapture = ref.canvas.closest('.chart-card') || ref.canvas.parentElement;
        if (elementToCapture) {
          const canvasObj = await html2canvas(elementToCapture, {
            backgroundColor: '#FFF9F0',
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
    <div className="min-h-screen" style={{ background: '#FFF9F0' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FF8C42 0%, #FFB380 100%)',
        boxShadow: '0 4px 20px rgba(255,140,66,0.3)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: '8px'
              }}>
                <img 
                  src="https://res.cloudinary.com/dgotonhu5/image/upload/v1774513747/images__1_-removebg-preview_knsdcs.png" 
                  alt="Logo" 
                  style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                />
              </div>
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.3)' }} />
              <div>
                <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                  JIRA Analytics
                </h1>
                {jiraConfig && (
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                    Project: <strong>{jiraConfig.projectKey}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                data-testid="filter-btn"
                onClick={() => setShowFilterModal(true)}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', fontFamily: 'Outfit,sans-serif', fontWeight: 600 }}
              >
                <Filter size={16} className="mr-2" />
                Filters
              </Button>
              <Button
                data-testid="settings-btn"
                onClick={onOpenConfig}
                variant="outline"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}
              >
                <Settings size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">

        {/* Action Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '24px',
          border: '1px solid rgba(255,140,66,0.2)'
        }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>
              Jira Report Controls
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, marginTop: '4px' }}>
              Configure filters using the top right button, then generate your report.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="btn-primary"
            >
              <BarChart3 size={16} />
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
            {metrics && (
              <button
                onClick={() => setShowExportModal(true)}
                disabled={loading}
                className="btn-secondary"
              >
                <Download size={16} />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {loading && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>{progressText}</span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: '#FF8C42' }}>{progress}%</span>
            </div>
            <div className="loading-bar">
              <div className="loading-bar-progress" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {!metrics ? (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #FFE4CC',
            padding: '80px 40px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(255,140,66,0.1)',
            animation: 'fadeInUp 0.6s ease-out',
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: 20,
              background: 'linear-gradient(135deg,#FF8C42,#FFB380)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 24px rgba(255,140,66,0.3)',
            }}>
              <BarChart3 color="white" size={44} />
            </div>
            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
              Ready to Analyze
            </h3>
            <p style={{ color: '#6B7280', fontSize: '1rem', marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
              Use the filter bar above to configure your date range and team, then click <strong>Generate Report</strong>.
            </p>
            <button onClick={() => setShowFilterModal(true)} className="btn-secondary">
              <Filter size={16} />
              Configure Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <MetricsCards metrics={metrics} />

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="analytics-card">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#14B8A6,#5EEAD4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={20} color="white" />
                  </div>
                  <h4 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Test Coverage</h4>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '2rem', fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                  {metrics.advancedAnalytics.testMetrics.total}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Total Tests</div>
                <div className="mt-3 flex gap-2 flex-wrap" style={{ fontSize: '0.72rem' }}>
                  <span style={{ padding: '3px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669', borderRadius: 6, fontWeight: 600 }}>
                    ✓ {metrics.advancedAnalytics.testMetrics.passed} passed
                  </span>
                  {metrics.advancedAnalytics.testMetrics.failed > 0 && (
                    <span style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#DC2626', borderRadius: 6, fontWeight: 600 }}>
                      ✗ {metrics.advancedAnalytics.testMetrics.failed} failed
                    </span>
                  )}
                </div>
              </div>

              <div className="analytics-card">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} color="white" />
                  </div>
                  <h4 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Avg Resolution</h4>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '2rem', fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                  {metrics.timeMetrics.avgResolutionTime}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Days</div>
                <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#9CA3AF' }}>
                  <span style={{ color: '#F59E0B', fontWeight: 600 }}>{metrics.timeMetrics.resolvedIssues}</span> issues resolved
                </div>
              </div>

              <div className="analytics-card">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#8B5CF6,#C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={20} color="white" />
                  </div>
                  <h4 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Labels Used</h4>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '2rem', fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                  {metrics.labelMetrics.topLabels.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Unique Labels</div>
                <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#9CA3AF' }}>
                  <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{Object.keys(metrics.labelMetrics.labelByIssueType).length}</span> categories
                </div>
              </div>

              <div className="analytics-card">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#EF4444,#F87171)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bug size={20} color="white" />
                  </div>
                  <h4 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Bug Density</h4>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '2rem', fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                  {metrics.qualityMetrics.bugDensity}%
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Bugs per Story</div>
                <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#9CA3AF' }}>
                  <span style={{ color: '#EF4444', fontWeight: 600 }}>{metrics.qualityMetrics.totalBugs}</span> total bugs
                </div>
              </div>
            </div>

            {/* Charts */}
            <ChartsPreview
            metrics={metrics}
            rawIssues={rawIssues}
            chartRefs={chartRefs}
            selectedTeam={filters.team}
          />
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
        teams={teams}
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
