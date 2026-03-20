import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Users, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Skeleton } from './ui/skeleton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ChartDataLabels
);

const CHART_COLORS = {
  primary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  teal: '#14B8A6',
  orange: '#F97316',
  pink: '#EC4899',
  indigo: '#6366F1',
  cyan: '#06B6D4',
  lime: '#84CC16'
};

const VIBRANT_COLORS = [
  '#0EA5E9', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899',
  '#F97316', '#6366F1', '#14B8A6', '#EF4444', '#84CC16',
  '#06B6D4', '#A855F7'
];

// Card wrapper component with optional local filter
const ChartCard = ({ title, subtitle, children, assignees = [], selectedAssignee, onAssigneeChange, chartId }) => {
  const hasFilter = assignees.length > 0;
  
  return (
    <div className="chart-card group" data-testid={chartId}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-slate-100">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {hasFilter && (
          <div className="flex items-center gap-2">
            <Users size={14} className="text-slate-500" />
            <Select value={selectedAssignee || 'all'} onValueChange={onAssigneeChange}>
              <SelectTrigger className="h-8 w-[160px] bg-slate-700/50 border-slate-600 text-xs text-slate-300">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all" className="text-slate-200 text-xs">All Members</SelectItem>
                {assignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee} className="text-slate-200 text-xs">
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="chart-wrapper">
        {children}
      </div>
    </div>
  );
};

// Loading skeleton for charts
const ChartSkeleton = () => (
  <div className="chart-card">
    <Skeleton className="h-6 w-48 mb-4 bg-slate-700" />
    <Skeleton className="h-[280px] w-full bg-slate-700/50 rounded-lg" />
  </div>
);

const ChartsPreview = ({ metrics, chartRefs, loading = false }) => {
  // Local filter states for each visualization
  const [teamChartFilter, setTeamChartFilter] = useState('all');
  const [pointsStatusFilter, setPointsStatusFilter] = useState('all');
  const [issuesTableFilter, setIssuesTableFilter] = useState('all');

  // Get unique assignees
  const uniqueAssignees = useMemo(() => {
    return Object.keys(metrics.teamMetrics.byAssignee || {}).sort();
  }, [metrics.teamMetrics.byAssignee]);

  // Filtered data based on local filters
  const filteredTeamData = useMemo(() => {
    const assignees = teamChartFilter === 'all' 
      ? uniqueAssignees 
      : [teamChartFilter];
    
    return {
      labels: assignees,
      datasets: [{
        label: 'Story Points',
        data: assignees.map(member => metrics.teamMetrics.pointsByAssignee[member] || 0),
        backgroundColor: CHART_COLORS.purple,
        borderRadius: 8
      }]
    };
  }, [teamChartFilter, uniqueAssignees, metrics.teamMetrics.pointsByAssignee]);

  const filteredIssues = useMemo(() => {
    if (issuesTableFilter === 'all') return metrics.detailedIssues;
    return metrics.detailedIssues.filter(issue => issue.assignee === issuesTableFilter);
  }, [issuesTableFilter, metrics.detailedIssues]);

  // Issue Type Chart Data
  const issueTypeData = {
    labels: Object.keys(metrics.volumeMetrics.byType),
    datasets: [{
      data: Object.values(metrics.volumeMetrics.byType),
      backgroundColor: VIBRANT_COLORS,
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  // Status Chart Data
  const statusData = {
    labels: Object.keys(metrics.volumeMetrics.byStatus),
    datasets: [{
      label: 'Issues',
      data: Object.values(metrics.volumeMetrics.byStatus),
      backgroundColor: VIBRANT_COLORS,
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  // Bug Priority Chart Data
  const bugPriorityData = {
    labels: Object.keys(metrics.qualityMetrics.bugsByPriority),
    datasets: [{
      data: Object.values(metrics.qualityMetrics.bugsByPriority),
      backgroundColor: [CHART_COLORS.error, CHART_COLORS.warning, CHART_COLORS.orange, CHART_COLORS.blue, CHART_COLORS.teal],
      borderWidth: 0
    }]
  };

  // Story Points by Status
  const pointsByStatusLabels = Object.keys(metrics.storyPointsMetrics.pointsByStatus);
  const pointsByStatusData = {
    labels: pointsByStatusLabels.length > 0 ? pointsByStatusLabels : ['No Data'],
    datasets: [{
      label: 'Story Points',
      data: pointsByStatusLabels.length > 0 
        ? Object.values(metrics.storyPointsMetrics.pointsByStatus)
        : [0],
      backgroundColor: pointsByStatusLabels.length > 0
        ? [CHART_COLORS.success, CHART_COLORS.primary, CHART_COLORS.warning, CHART_COLORS.purple]
        : ['#374151'],
      borderRadius: 8
    }]
  };

  // Issue Type vs Label Analysis
  const issueTypes = Object.keys(metrics.advancedAnalytics.issueTypeVsLabel);
  const allLabelsSet = new Set();
  issueTypes.forEach(type => {
    Object.keys(metrics.advancedAnalytics.issueTypeVsLabel[type]).forEach(label => {
      allLabelsSet.add(label);
    });
  });
  const allLabels = Array.from(allLabelsSet).slice(0, 10);

  const issueTypeVsLabelData = {
    labels: allLabels,
    datasets: issueTypes.map((type, idx) => ({
      label: type,
      data: allLabels.map(label => metrics.advancedAnalytics.issueTypeVsLabel[type]?.[label] || 0),
      backgroundColor: VIBRANT_COLORS[idx % VIBRANT_COLORS.length],
      borderRadius: 6
    }))
  };

  // Test Execution Metrics
  const testData = {
    labels: ['Passed', 'Failed', 'Blocked'],
    datasets: [{
      data: [
        metrics.advancedAnalytics.testMetrics.passed,
        metrics.advancedAnalytics.testMetrics.failed,
        metrics.advancedAnalytics.testMetrics.blocked
      ],
      backgroundColor: [CHART_COLORS.success, CHART_COLORS.error, CHART_COLORS.warning],
      borderWidth: 0
    }]
  };

  // Subtask Analysis
  const subtaskLabels = Object.keys(metrics.advancedAnalytics.subtaskMetrics.subtasksByLabel).slice(0, 10);
  const subtaskData = {
    labels: subtaskLabels,
    datasets: [{
      label: 'Subtasks Count',
      data: subtaskLabels.map(label => metrics.advancedAnalytics.subtaskMetrics.subtasksByLabel[label]),
      backgroundColor: CHART_COLORS.cyan,
      borderRadius: 8
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: { family: 'Inter', size: 11 },
          padding: 15,
          color: '#94A3B8',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, family: 'Inter', weight: 600 },
        bodyFont: { size: 12, family: 'Inter' },
        borderColor: 'rgba(71, 85, 105, 0.5)',
        borderWidth: 1
      },
      datalabels: {
        color: '#F1F5F9',
        font: { weight: 'bold', size: 11 },
        formatter: (value) => value > 0 ? value : '',
        display: (context) => context.dataset.data[context.dataIndex] > 0
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(71, 85, 105, 0.3)' },
        ticks: { font: { family: 'Inter' }, color: '#94A3B8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter' }, color: '#94A3B8', maxRotation: 45, minRotation: 0 }
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Issue Distribution Section */}
      <div className="charts-section">
        <h3 className="section-title">Issue Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="By Issue Type" chartId="chart-issue-type">
            <Doughnut 
              ref={(ref) => { if (ref) chartRefs.current.issueTypeChart = ref; }}
              data={issueTypeData} 
              options={chartOptions} 
            />
          </ChartCard>
          
          <ChartCard title="By Status" chartId="chart-status">
            <Bar 
              ref={(ref) => { if (ref) chartRefs.current.statusChart = ref; }}
              data={statusData} 
              options={barChartOptions} 
            />
          </ChartCard>
        </div>
      </div>

      {/* Team Performance Section with Local Filter */}
      {uniqueAssignees.length > 0 && (
        <div className="charts-section">
          <h3 className="section-title">Team Performance</h3>
          <ChartCard 
            title="Story Points by Team Member" 
            subtitle={`${uniqueAssignees.length} team members`}
            assignees={uniqueAssignees}
            selectedAssignee={teamChartFilter}
            onAssigneeChange={setTeamChartFilter}
            chartId="chart-team-points"
          >
            <div style={{ height: Math.max(300, (teamChartFilter === 'all' ? uniqueAssignees.length : 1) * 40) + 'px' }}>
              <Bar 
                ref={(ref) => { if (ref) chartRefs.current.teamPointsChart = ref; }}
                data={filteredTeamData} 
                options={{
                  ...barChartOptions,
                  indexAxis: 'y',
                  scales: {
                    x: { ...barChartOptions.scales.y },
                    y: { ...barChartOptions.scales.x }
                  }
                }} 
              />
            </div>
          </ChartCard>
        </div>
      )}

      {/* Bug Analysis & Story Points Section */}
      <div className="charts-section">
        <h3 className="section-title">Quality & Progress</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Bugs by Priority" 
            subtitle={`${metrics.qualityMetrics.totalBugs} total bugs`}
            chartId="chart-bug-priority"
          >
            {Object.keys(metrics.qualityMetrics.bugsByPriority).length > 0 ? (
              <Doughnut data={bugPriorityData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-slate-500">
                No bugs found
              </div>
            )}
          </ChartCard>

          <ChartCard 
            title="Story Points by Status" 
            subtitle={`${metrics.storyPointsMetrics.totalPoints} total points`}
            chartId="chart-points-status"
          >
            <Bar data={pointsByStatusData} options={barChartOptions} />
          </ChartCard>
        </div>
      </div>

      {/* Advanced Analytics */}
      {allLabels.length > 0 && (
        <div className="charts-section">
          <h3 className="section-title">Advanced Analytics</h3>
          <ChartCard 
            title="Issue Type vs Label Correlation" 
            subtitle="Relationship between issue types and labels"
            chartId="chart-type-label"
          >
            <div style={{ height: '380px' }}>
              <Bar 
                data={issueTypeVsLabelData} 
                options={{
                  ...barChartOptions,
                  plugins: {
                    ...barChartOptions.plugins,
                    legend: { ...barChartOptions.plugins.legend, position: 'top' }
                  }
                }} 
              />
            </div>
          </ChartCard>
        </div>
      )}

      {/* Test & Subtask Analysis */}
      {(metrics.advancedAnalytics.testMetrics.total > 0 || subtaskLabels.length > 0) && (
        <div className="charts-section">
          <h3 className="section-title">Testing & Subtasks</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metrics.advancedAnalytics.testMetrics.total > 0 && (
              <ChartCard 
                title="Test Execution Results" 
                subtitle={`${metrics.advancedAnalytics.testMetrics.total} total tests`}
                chartId="chart-test-execution"
              >
                <Pie data={testData} options={chartOptions} />
              </ChartCard>
            )}

            {subtaskLabels.length > 0 && (
              <ChartCard 
                title="Subtasks by Label" 
                chartId="chart-subtask-label"
              >
                <Bar data={subtaskData} options={barChartOptions} />
              </ChartCard>
            )}
          </div>
        </div>
      )}

      {/* Label Analysis Table */}
      {metrics.labelMetrics.topLabels.length > 0 && (
        <div className="charts-section">
          <h3 className="section-title">Label Analysis</h3>
          <div className="chart-card" data-testid="labels-table">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Count</th>
                    <th>Percentage</th>
                    <th>Top Issue Types</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.labelMetrics.topLabels.map(([label, count]) => {
                    const total = metrics.labelMetrics.topLabels.reduce((sum, [, c]) => sum + c, 0);
                    const percentage = ((count / total) * 100).toFixed(1);
                    const types = metrics.labelMetrics.labelByIssueType[label] || {};
                    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
                    
                    return (
                      <tr key={label}>
                        <td>
                          <span className="label-badge">{label}</span>
                        </td>
                        <td className="font-bold text-slate-200">{count}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden max-w-[100px]">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-400">{percentage}%</span>
                          </div>
                        </td>
                        <td className="text-slate-400">
                          {topType ? `${topType[0]} (${topType[1]})` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Issues Table with Local Filter */}
      <div className="charts-section">
        <h3 className="section-title">Recent Issues</h3>
        <div className="chart-card" data-testid="issues-table">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">
              Showing {filteredIssues.slice(0, 50).length} of {filteredIssues.length} issues
            </p>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <Select value={issuesTableFilter} onValueChange={setIssuesTableFilter}>
                <SelectTrigger className="h-8 w-[180px] bg-slate-700/50 border-slate-600 text-xs text-slate-300">
                  <SelectValue placeholder="Filter by Assignee" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-[300px]">
                  <SelectItem value="all" className="text-slate-200 text-xs">All Assignees</SelectItem>
                  {uniqueAssignees.map((assignee) => (
                    <SelectItem key={assignee} value={assignee} className="text-slate-200 text-xs">
                      {assignee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Summary</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Points</th>
                  <th>Labels</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.slice(0, 50).map((issue) => (
                  <tr key={issue.key}>
                    <td className="font-bold text-cyan-400">{issue.key}</td>
                    <td className="max-w-[200px] truncate text-slate-300" title={issue.summary}>
                      {issue.summary?.substring(0, 50)}{issue.summary?.length > 50 ? '...' : ''}
                    </td>
                    <td>
                      <span className="type-badge">{issue.type}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        issue.statusCategory === 'Done' ? 'status-resolved' :
                        issue.statusCategory === 'In Progress' ? 'status-in-progress' :
                        'status-open'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="text-slate-400">{issue.assignee}</td>
                    <td className="text-center">
                      {issue.storyPoints > 0 ? (
                        <span className="points-badge">{issue.storyPoints}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {issue.labels?.slice(0, 2).map(label => (
                          <span key={label} className="mini-label">{label}</span>
                        ))}
                        {issue.labels?.length > 2 && (
                          <span className="mini-label">+{issue.labels.length - 2}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsPreview;
