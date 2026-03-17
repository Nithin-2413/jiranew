import React from 'react';
import { TrendingUp, FileText, Users, Bug, CheckCircle2, Clock } from 'lucide-react';
import { Card } from './ui/card';

const MetricsCards = ({ metrics }) => {
  const completionRate = parseFloat(metrics.storyPointsMetrics.completionRate);
  const resolvedIssues = Object.entries(metrics.volumeMetrics.byStatus)
    .filter(([status]) => status.toLowerCase().includes('done') || status.toLowerCase().includes('closed'))
    .reduce((sum, [, count]) => sum + count, 0);

  const metricsData = [
    {
      title: 'Total Issues',
      value: metrics.volumeMetrics.total,
      icon: FileText,
      color: 'text-[#0C9ED9]',
      bg: 'bg-blue-50',
      testId: 'metric-total-issues'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'text-[#10B981]',
      bg: 'bg-green-50',
      testId: 'metric-completion-rate'
    },
    {
      title: 'Story Points',
      value: metrics.storyPointsMetrics.totalPoints,
      icon: CheckCircle2,
      color: 'text-[#8B5CF6]',
      bg: 'bg-purple-50',
      testId: 'metric-story-points'
    },
    {
      title: 'Team Members',
      value: metrics.teamMetrics.totalMembers,
      icon: Users,
      color: 'text-[#3B82F6]',
      bg: 'bg-blue-50',
      testId: 'metric-team-members'
    },
    {
      title: 'Bugs',
      value: metrics.qualityMetrics.totalBugs,
      icon: Bug,
      color: 'text-[#EF4444]',
      bg: 'bg-red-50',
      testId: 'metric-bugs'
    },
    {
      title: 'Avg Resolution Time',
      value: `${metrics.timeMetrics.avgResolutionTime} days`,
      icon: Clock,
      color: 'text-[#F59E0B]',
      bg: 'bg-amber-50',
      testId: 'metric-resolution-time'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="metric-card" data-testid={metric.testId}>
            <div>
              <p className="text-sm font-medium text-slate-600">{metric.title}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{metric.value}</p>
            </div>
            <div className={`${metric.bg} p-3 rounded-lg`}>
              <Icon className={metric.color} size={24} />
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MetricsCards;