import React from 'react';
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
import { Bar, Doughnut, Line, Radar, PolarArea } from 'react-chartjs-2';

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
  RadialLinearScale
);

const CHART_COLORS = {
  primary: '#0C9ED9',
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
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
  '#36A2EB', '#FFCE56'
];

const ChartsPreview = ({ metrics, chartRefs }) => {
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

  // ALL Team Members - Story Points
  const allTeamMembers = Object.keys(metrics.teamMetrics.pointsByAssignee);
  const teamData = {
    labels: allTeamMembers,
    datasets: [{
      label: 'Story Points',
      data: allTeamMembers.map(member => metrics.teamMetrics.pointsByAssignee[member] || 0),
      backgroundColor: CHART_COLORS.purple,
      borderRadius: 8
    }]
  };

  // Bug Priority Chart Data
  const bugPriorityData = {
    labels: Object.keys(metrics.qualityMetrics.bugsByPriority),
    datasets: [{
      data: Object.values(metrics.qualityMetrics.bugsByPriority),
      backgroundColor: VIBRANT_COLORS,
      borderWidth: 0
    }]
  };

  // Story Points by Status - Fixed to show data
  const pointsByStatusLabels = Object.keys(metrics.storyPointsMetrics.pointsByStatus);
  const pointsByStatusData = {
    labels: pointsByStatusLabels.length > 0 ? pointsByStatusLabels : ['No Data'],
    datasets: [{
      label: 'Story Points',
      data: pointsByStatusLabels.length > 0 
        ? Object.values(metrics.storyPointsMetrics.pointsByStatus)
        : [0],
      backgroundColor: pointsByStatusLabels.length > 0
        ? VIBRANT_COLORS.slice(0, pointsByStatusLabels.length)
        : ['#9CA3AF'],
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
          font: {
            family: 'Inter',
            size: 11
          },
          padding: 15,
          color: 'rgba(255, 255, 255, 0.9)',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          family: 'Inter',
          weight: 600
        },
        bodyFont: {
          size: 12,
          family: 'Inter'
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          font: {
            family: 'Inter'
          },
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter'
          },
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 0
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Issue Distribution */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-2xl font-bold mb-6 text-white">Issue Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div data-testid="chart-issue-type">
            <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">By Issue Type</h4>
            <div className="chart-container">
              <Doughnut 
                ref={(ref) => { if (ref) chartRefs.current.issueTypeChart = ref; }}
                data={issueTypeData} 
                options={chartOptions} 
              />
            </div>
          </div>
          <div data-testid="chart-status">
            <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">By Status</h4>
            <div className="chart-container">
              <Bar 
                ref={(ref) => { if (ref) chartRefs.current.statusChart = ref; }}
                data={statusData} 
                options={barChartOptions} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance - ALL MEMBERS */}
      {allTeamMembers.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-2xl font-bold mb-6 text-white">Team Performance - All Members</h3>
          <div data-testid="chart-team-points">
            <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">
              Story Points by All Team Members ({allTeamMembers.length} members)
            </h4>
            <div className="chart-container" style={{ height: Math.max(320, allTeamMembers.length * 30) + 'px' }}>
              <Bar 
                ref={(ref) => { if (ref) chartRefs.current.teamPointsChart = ref; }}
                data={teamData} 
                options={{
                  ...barChartOptions,
                  indexAxis: 'y',
                  scales: {
                    x: {
                      ...barChartOptions.scales.y
                    },
                    y: {
                      ...barChartOptions.scales.x
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Bug Analysis & Story Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-2xl font-bold mb-6 text-white">Bug Analysis</h3>
          <div data-testid="chart-bug-priority">
            <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">Bugs by Priority</h4>
            <div className="chart-container">
              <Doughnut 
                data={bugPriorityData} 
                options={chartOptions} 
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-2xl font-bold mb-6 text-white">Story Points</h3>
          <div data-testid="chart-points-status">
            <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">Points by Status</h4>
            <div className="chart-container">
              <Bar 
                data={pointsByStatusData} 
                options={barChartOptions} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics - Issue Type vs Label */}
      {allLabels.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-2xl font-bold mb-6 text-white">Issue Type vs Label Analysis</h3>
          <div data-testid="chart-type-label">
            <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">
              Correlation between Issue Types and Labels
            </h4>
            <div className="chart-container" style={{ height: '400px' }}>
              <Bar 
                data={issueTypeVsLabelData} 
                options={{
                  ...barChartOptions,
                  plugins: {
                    ...barChartOptions.plugins,
                    legend: {
                      ...barChartOptions.plugins.legend,
                      position: 'top'
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Test Execution & Subtask Analysis */}
      {(metrics.advancedAnalytics.testMetrics.total > 0 || subtaskLabels.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.advancedAnalytics.testMetrics.total > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-white">Test Execution</h3>
              <div data-testid="chart-test-execution">
                <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">
                  Test Results ({metrics.advancedAnalytics.testMetrics.total} total)
                </h4>
                <div className="chart-container">
                  <Doughnut 
                    data={testData} 
                    options={chartOptions} 
                  />
                </div>
              </div>
            </div>
          )}

          {subtaskLabels.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-white">Subtask Analysis</h3>
              <div data-testid="chart-subtask-label">
                <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">
                  Subtasks by Label
                </h4>
                <div className="chart-container">
                  <Bar 
                    data={subtaskData} 
                    options={barChartOptions} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Label Analysis */}
      {metrics.labelMetrics.topLabels.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-2xl font-bold mb-6 text-white">Label Analysis</h3>
          <div data-testid="labels-table">
            <div className="table-container">
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
                        <td className="font-semibold">
                          <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-sm">
                            {label}
                          </span>
                        </td>
                        <td className="font-bold text-white">{count}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-white">{percentage}%</span>
                          </div>
                        </td>
                        <td className="text-white/70">
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

      {/* Detailed Issues Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-2xl font-bold mb-6 text-white">Recent Issues</h3>
        <div data-testid="issues-table" className="table-container">
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
              {metrics.detailedIssues.slice(0, 30).map((issue) => (
                <tr key={issue.key}>
                  <td className="font-bold text-cyan-400">{issue.key}</td>
                  <td className="max-w-xs truncate text-white">
                    {issue.summary.substring(0, 60)}{issue.summary.length > 60 ? '...' : ''}
                  </td>
                  <td>
                    <span className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white font-medium">
                      {issue.type}
                    </span>
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
                  <td className="text-white/80">{issue.assignee}</td>
                  <td className="text-center">
                    {issue.storyPoints > 0 ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm">
                        {issue.storyPoints}
                      </span>
                    ) : (
                      <span className="text-white/30">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {issue.labels.slice(0, 2).map(label => (
                        <span key={label} className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/70">
                          {label}
                        </span>
                      ))}
                      {issue.labels.length > 2 && (
                        <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/70">
                          +{issue.labels.length - 2}
                        </span>
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
  );
};

export default ChartsPreview;