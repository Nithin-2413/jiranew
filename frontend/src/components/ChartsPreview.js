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
import { Users, Filter, BarChart3, PieChart, CheckCircle2, Tag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Skeleton } from './ui/skeleton';
import { ResponsiveContainer } from 'recharts';

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

// Premium color palette - soft, professional colors
const PREMIUM_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#A855F7', // Purple
  '#EF4444', // Rose
  '#3B82F6'  // Blue
];

// Premium Chart Card wrapper
const ChartCard = ({ title, subtitle, children, assignees = [], selectedAssignee, onAssigneeChange, chartId, accentColor = 'border-indigo-500' }) => {
  const hasFilter = assignees.length > 0;
  
  return (
    <div className={`chart-container border-t-4 ${accentColor}`} data-chart-id={chartId}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h4 className="text-xl font-bold text-slate-900 mb-1">{title}</h4>
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        </div>
        {hasFilter && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Users size={16} className="text-indigo-600" />
            </div>
            <Select value={selectedAssignee || 'all'} onValueChange={onAssigneeChange}>
              <SelectTrigger className="h-9 w-[180px] bg-white border-slate-200 text-sm text-slate-700 font-medium rounded-lg">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                <SelectItem value="all" className="text-slate-700 text-sm font-medium">All Members</SelectItem>
                {assignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee} className="text-slate-700 text-sm">
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

// Loading skeleton for charts
const ChartSkeleton = () => (
  <div className="chart-container">
    <Skeleton className="h-6 w-48 mb-4 bg-slate-200" />
    <Skeleton className="h-[320px] w-full bg-slate-100 rounded-xl" />
  </div>
);

const ChartsPreview = ({ metrics, chartRefs, loading = false }) => {
  // Local filter states for each visualization
  const [teamChartFilter, setTeamChartFilter] = useState('all');
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
        backgroundColor: '#6366F1',
        borderRadius: 12,
        borderSkipped: false
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
      backgroundColor: PREMIUM_COLORS,
      borderWidth: 0,
      hoverOffset: 12
    }]
  };

  // Status Chart Data
  const statusData = {
    labels: Object.keys(metrics.volumeMetrics.byStatus),
    datasets: [{
      label: 'Issues',
      data: Object.values(metrics.volumeMetrics.byStatus),
      backgroundColor: PREMIUM_COLORS,
      borderRadius: 12,
      borderSkipped: false
    }]
  };

  // Bug Priority Chart Data
  const bugPriorityData = {
    labels: Object.keys(metrics.qualityMetrics.bugsByPriority),
    datasets: [{
      data: Object.values(metrics.qualityMetrics.bugsByPriority),
      backgroundColor: ['#EF4444', '#F59E0B', '#F97316', '#3B82F6', '#14B8A6'],
      borderWidth: 0,
      hoverOffset: 12
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
        ? ['#10B981', '#6366F1', '#F59E0B', '#8B5CF6']
        : ['#E5E7EB'],
      borderRadius: 12,
      borderSkipped: false
    }]
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
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
      borderWidth: 0,
      hoverOffset: 12
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
          font: { family: 'Inter, system-ui, sans-serif', size: 12, weight: '600' },
          padding: 20,
          color: '#475569',
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 16,
        cornerRadius: 12,
        titleFont: { size: 14, family: 'Inter, system-ui, sans-serif', weight: '700' },
        bodyFont: { size: 13, family: 'Inter, system-ui, sans-serif', weight: '500' },
        titleColor: '#FFFFFF',
        bodyColor: '#E2E8F0',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 6
      },
      datalabels: {
        color: '#1E293B',
        font: { weight: '700', size: 12, family: 'Inter, system-ui, sans-serif' },
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
        grid: { color: '#F1F5F9', drawBorder: false },
        ticks: { 
          font: { family: 'Inter, system-ui, sans-serif', size: 11, weight: '600' }, 
          color: '#64748B',
          padding: 8
        }
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { 
          font: { family: 'Inter, system-ui, sans-serif', size: 11, weight: '600' }, 
          color: '#64748B', 
          maxRotation: 45, 
          minRotation: 0,
          padding: 8
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Issue Distribution Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
            <PieChart size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Issue Distribution</h3>
            <p className="text-sm text-slate-600">Overview of issue types and statuses</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="By Issue Type" subtitle={`${metrics.volumeMetrics.total} total issues`} chartId="chart-issue-type" accentColor="border-indigo-500">
            <div style={{ height: '320px' }}>
              <Doughnut 
                ref={(ref) => { if (ref) chartRefs.current.issueTypeChart = ref; }}
                data={issueTypeData} 
                options={chartOptions} 
              />
            </div>
          </ChartCard>
          
          <ChartCard title="By Status" subtitle="Current workflow states" chartId="chart-status" accentColor="border-violet-500">
            <div style={{ height: '320px' }}>
              <Bar 
                ref={(ref) => { if (ref) chartRefs.current.statusChart = ref; }}
                data={statusData} 
                options={barChartOptions} 
              />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Team Performance Section with Local Filter */}
      {uniqueAssignees.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
              <Users size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Team Performance</h3>
              <p className="text-sm text-slate-600">{uniqueAssignees.length} active team members</p>
            </div>
          </div>
          <ChartCard 
            title="Story Points by Team Member" 
            subtitle="Individual contribution breakdown"
            assignees={uniqueAssignees}
            selectedAssignee={teamChartFilter}
            onAssigneeChange={setTeamChartFilter}
            chartId="chart-team-points"
            accentColor="border-emerald-500"
          >
            <div style={{ height: Math.max(320, (teamChartFilter === 'all' ? uniqueAssignees.length : 1) * 50) + 'px' }}>
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
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
            <BarChart3 size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Quality & Progress</h3>
            <p className="text-sm text-slate-600">Bug tracking and story point analysis</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Bugs by Priority" 
            subtitle={`${metrics.qualityMetrics.totalBugs} total bugs tracked`}
            chartId="chart-bug-priority"
            accentColor="border-rose-500"
          >
            {Object.keys(metrics.qualityMetrics.bugsByPriority).length > 0 ? (
              <div style={{ height: '320px' }}>
                <Doughnut data={bugPriorityData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[320px] text-slate-400">
                <CheckCircle2 size={48} className="mb-4 text-emerald-400" />
                <p className="text-lg font-semibold text-slate-600">No bugs found</p>
                <p className="text-sm">Great job maintaining quality!</p>
              </div>
            )}
          </ChartCard>

          <ChartCard 
            title="Story Points by Status" 
            subtitle={`${metrics.storyPointsMetrics.totalPoints} total points`}
            chartId="chart-points-status"
            accentColor="border-violet-500"
          >
            <div style={{ height: '320px' }}>
              <Bar data={pointsByStatusData} options={barChartOptions} />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Test Execution */}
      {metrics.advancedAnalytics.testMetrics.total > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Test Execution</h3>
              <p className="text-sm text-slate-600">Quality assurance metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard 
              title="Test Results" 
              subtitle={`${metrics.advancedAnalytics.testMetrics.total} total tests executed`}
              chartId="chart-test-execution"
              accentColor="border-teal-500"
            >
              <div style={{ height: '320px' }}>
                <Pie data={testData} options={chartOptions} />
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Label Analysis Table */}
      {metrics.labelMetrics.topLabels.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center">
              <Tag size={20} className="text-cyan-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Label Analysis</h3>
              <p className="text-sm text-slate-600">Most used labels and categorization</p>
            </div>
          </div>
          <div className="chart-container border-t-4 border-cyan-500" data-testid="labels-table">
            <div className="overflow-x-auto">
              <table className="premium-data-table">
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
                          <span className="premium-badge">{label}</span>
                        </td>
                        <td className="font-bold text-slate-900">{count}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden max-w-[120px]">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{percentage}%</span>
                          </div>
                        </td>
                        <td className="text-slate-600 font-medium">
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
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            <Filter size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Recent Issues</h3>
            <p className="text-sm text-slate-600">Detailed breakdown of tracked items</p>
          </div>
        </div>
        <div className="chart-container border-t-4 border-blue-500" data-testid="issues-table">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredIssues.slice(0, 50).length}</span> of <span className="font-bold text-slate-900">{filteredIssues.length}</span> issues
            </p>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Filter size={16} className="text-blue-600" />
              </div>
              <Select value={issuesTableFilter} onValueChange={setIssuesTableFilter}>
                <SelectTrigger className="h-9 w-[200px] bg-white border-slate-200 text-sm text-slate-700 font-medium rounded-lg">
                  <SelectValue placeholder="Filter by Assignee" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl max-h-[320px]">
                  <SelectItem value="all" className="text-slate-700 text-sm font-medium">All Assignees</SelectItem>
                  {uniqueAssignees.map((assignee) => (
                    <SelectItem key={assignee} value={assignee} className="text-slate-700 text-sm">
                      {assignee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="premium-data-table">
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
                    <td className="font-bold text-indigo-600">{issue.key}</td>
                    <td className="max-w-[240px] truncate text-slate-700 font-medium" title={issue.summary}>
                      {issue.summary?.substring(0, 60)}{issue.summary?.length > 60 ? '...' : ''}
                    </td>
                    <td>
                      <span className="premium-badge">{issue.type}</span>
                    </td>
                    <td>
                      <span className={`premium-status-badge ${
                        issue.statusCategory === 'Done' ? 'status-done' :
                        issue.statusCategory === 'In Progress' ? 'status-progress' :
                        'status-todo'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="text-slate-700 font-medium">{issue.assignee}</td>
                    <td className="text-center">
                      {issue.storyPoints > 0 ? (
                        <span className="premium-points-badge">{issue.storyPoints}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {issue.labels?.slice(0, 2).map(label => (
                          <span key={label} className="premium-mini-badge">{label}</span>
                        ))}
                        {issue.labels?.length > 2 && (
                          <span className="premium-mini-badge">+{issue.labels.length - 2}</span>
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
