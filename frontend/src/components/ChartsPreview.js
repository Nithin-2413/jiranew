import React from 'react';
import { Card } from './ui/card';
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
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const CHART_COLORS = {
  primary: '#0C9ED9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  teal: '#14B8A6',
  orange: '#F97316'
};

const ChartsPreview = ({ metrics, chartRefs }) => {
  // Issue Type Chart Data
  const issueTypeData = {
    labels: Object.keys(metrics.volumeMetrics.byType),
    datasets: [{
      data: Object.values(metrics.volumeMetrics.byType),
      backgroundColor: [
        CHART_COLORS.primary,
        CHART_COLORS.success,
        CHART_COLORS.warning,
        CHART_COLORS.purple,
        CHART_COLORS.blue
      ],
      borderWidth: 0
    }]
  };

  // Status Chart Data
  const statusData = {
    labels: Object.keys(metrics.volumeMetrics.byStatus),
    datasets: [{
      label: 'Issues',
      data: Object.values(metrics.volumeMetrics.byStatus),
      backgroundColor: CHART_COLORS.primary,
      borderRadius: 6
    }]
  };

  // Team Performance Chart Data
  const teamData = {
    labels: Object.keys(metrics.teamMetrics.pointsByAssignee).slice(0, 10),
    datasets: [{
      label: 'Story Points',
      data: Object.values(metrics.teamMetrics.pointsByAssignee).slice(0, 10),
      backgroundColor: CHART_COLORS.purple,
      borderRadius: 6
    }]
  };

  // Bug Priority Chart Data
  const bugPriorityData = {
    labels: Object.keys(metrics.qualityMetrics.bugsByPriority),
    datasets: [{
      data: Object.values(metrics.qualityMetrics.bugsByPriority),
      backgroundColor: [
        CHART_COLORS.error,
        CHART_COLORS.warning,
        CHART_COLORS.blue,
        CHART_COLORS.success,
        '#9CA3AF'
      ],
      borderWidth: 0
    }]
  };

  // Story Points by Status
  const pointsByStatusData = {
    labels: Object.keys(metrics.storyPointsMetrics.pointsByStatus),
    datasets: [{
      label: 'Story Points',
      data: Object.values(metrics.storyPointsMetrics.pointsByStatus),
      backgroundColor: [
        CHART_COLORS.success,
        CHART_COLORS.primary,
        CHART_COLORS.warning
      ],
      borderRadius: 6
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
            family: 'Inter'
          },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 6,
        titleFont: {
          size: 13,
          family: 'Inter'
        },
        bodyFont: {
          size: 12,
          family: 'Inter'
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: 'Inter'
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter'
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Issue Distribution */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-slate-900">Issue Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div data-testid="chart-issue-type">
            <h4 className="text-sm font-medium text-slate-600 mb-3">By Issue Type</h4>
            <div className="chart-container" style={{ height: '280px' }}>
              <Doughnut 
                ref={(ref) => { if (ref) chartRefs.current.issueTypeChart = ref; }}
                data={issueTypeData} 
                options={chartOptions} 
              />
            </div>
          </div>
          <div data-testid="chart-status">
            <h4 className="text-sm font-medium text-slate-600 mb-3">By Status</h4>
            <div className="chart-container" style={{ height: '280px' }}>
              <Bar 
                ref={(ref) => { if (ref) chartRefs.current.statusChart = ref; }}
                data={statusData} 
                options={barChartOptions} 
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Team Performance */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-slate-900">Team Performance</h3>
        <div data-testid="chart-team-points">
          <h4 className="text-sm font-medium text-slate-600 mb-3">Story Points by Team Member (Top 10)</h4>
          <div className="chart-container" style={{ height: '350px' }}>
            <Bar 
              ref={(ref) => { if (ref) chartRefs.current.teamPointsChart = ref; }}
              data={teamData} 
              options={{
                ...barChartOptions,
                indexAxis: 'y'
              }} 
            />
          </div>
        </div>
      </Card>

      {/* Bug Analysis & Story Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-slate-900">Bug Analysis</h3>
          <div data-testid="chart-bug-priority">
            <h4 className="text-sm font-medium text-slate-600 mb-3">Bugs by Priority</h4>
            <div className="chart-container" style={{ height: '280px' }}>
              <Doughnut 
                data={bugPriorityData} 
                options={chartOptions} 
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-slate-900">Story Points</h3>
          <div data-testid="chart-points-status">
            <h4 className="text-sm font-medium text-slate-600 mb-3">Points by Status</h4>
            <div className="chart-container" style={{ height: '280px' }}>
              <Bar 
                data={pointsByStatusData} 
                options={barChartOptions} 
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Label Analysis */}
      {metrics.labelMetrics.topLabels.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-slate-900">Label Analysis</h3>
          <div data-testid="labels-table">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.labelMetrics.topLabels.map(([label, count]) => {
                    const total = metrics.labelMetrics.topLabels.reduce((sum, [, c]) => sum + c, 0);
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <tr key={label}>
                        <td className="font-medium">{label}</td>
                        <td>{count}</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Issues Table */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 text-slate-900">Recent Issues</h3>
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
              </tr>
            </thead>
            <tbody>
              {metrics.detailedIssues.slice(0, 20).map((issue) => (
                <tr key={issue.key}>
                  <td className="font-medium text-[#0C9ED9]">{issue.key}</td>
                  <td>{issue.summary.substring(0, 50)}{issue.summary.length > 50 ? '...' : ''}</td>
                  <td>
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
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
                  <td className="text-slate-600">{issue.assignee}</td>
                  <td className="text-center font-medium">{issue.storyPoints || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ChartsPreview;