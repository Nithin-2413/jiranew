import React from 'react';
import { TrendingUp, FileText, Users, Bug, CheckCircle2, Clock, Target, Zap } from 'lucide-react';

const MetricsCards = ({ metrics }) => {
  const completionRate = parseFloat(metrics.storyPointsMetrics.completionRate) || 0;
  const resolvedIssues = Object.entries(metrics.volumeMetrics.byStatus)
    .filter(([status]) => status.toLowerCase().includes('done') || status.toLowerCase().includes('closed'))
    .reduce((sum, [, count]) => sum + count, 0);

  const metricsData = [
    {
      title: 'Total Issues',
      value: metrics.volumeMetrics.total,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      iconColor: 'text-blue-400',
      testId: 'metric-total-issues'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      iconColor: 'text-green-400',
      testId: 'metric-completion-rate'
    },
    {
      title: 'Story Points',
      value: metrics.storyPointsMetrics.totalPoints || 0,
      icon: Target,
      gradient: 'from-purple-500 to-pink-500',
      iconColor: 'text-purple-400',
      testId: 'metric-story-points'
    },
    {
      title: 'Team Members',
      value: metrics.teamMetrics.totalMembers,
      icon: Users,
      gradient: 'from-indigo-500 to-blue-500',
      iconColor: 'text-indigo-400',
      testId: 'metric-team-members'
    },
    {
      title: 'Bugs',
      value: metrics.qualityMetrics.totalBugs,
      icon: Bug,
      gradient: 'from-red-500 to-rose-500',
      iconColor: 'text-red-400',
      testId: 'metric-bugs'
    },
    {
      title: 'Avg Resolution',
      value: `${metrics.timeMetrics.avgResolutionTime}d`,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      iconColor: 'text-amber-400',
      testId: 'metric-resolution-time'
    },
    {
      title: 'Tests',
      value: metrics.advancedAnalytics.testMetrics.total,
      icon: CheckCircle2,
      gradient: 'from-teal-500 to-cyan-500',
      iconColor: 'text-teal-400',
      testId: 'metric-tests'
    },
    {
      title: 'Velocity',
      value: Math.round(metrics.storyPointsMetrics.completedPoints / 2) || 0,
      icon: Zap,
      gradient: 'from-yellow-500 to-amber-500',
      iconColor: 'text-yellow-400',
      testId: 'metric-velocity'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.title}
            className="metric-card group"
            data-testid={metric.testId}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white/70 mb-1">{metric.title}</p>
                <p className="text-3xl font-bold text-white">{metric.value}</p>
              </div>
              <div className={`bg-gradient-to-br ${metric.gradient} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;