import React from 'react';
import { TrendingUp, TrendingDown, FileText, Users, Bug, CheckCircle2, Clock, Target, Zap } from 'lucide-react';

const MetricsCards = ({ metrics }) => {
  const completionRate = parseFloat(metrics.storyPointsMetrics.completionRate) || 0;

  const metricsData = [
    {
      title: 'Total Issues',
      value: metrics.volumeMetrics.total,
      subtitle: 'All tracked items',
      icon: FileText,
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-50',
      iconColor: 'text-blue-600',
      trend: null,
      accentColor: 'border-blue-400',
      testId: 'metric-total-issues'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      subtitle: 'Project progress',
      icon: TrendingUp,
      iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
      iconColor: 'text-emerald-600',
      trend: completionRate >= 75 ? { value: 'On Track', positive: true } : { value: 'Needs Attention', positive: false },
      accentColor: 'border-emerald-400',
      testId: 'metric-completion-rate'
    },
    {
      title: 'Story Points',
      value: metrics.storyPointsMetrics.totalPoints || 0,
      subtitle: `${metrics.storyPointsMetrics.issuesWithPoints || 0} issues`,
      icon: Target,
      iconBg: 'bg-gradient-to-br from-violet-100 to-violet-50',
      iconColor: 'text-violet-600',
      trend: { value: `${metrics.storyPointsMetrics.completedPoints || 0} completed`, positive: true },
      accentColor: 'border-violet-400',
      testId: 'metric-story-points'
    },
    {
      title: 'Team Members',
      value: metrics.teamMetrics.totalMembers,
      subtitle: 'Active contributors',
      icon: Users,
      iconBg: 'bg-gradient-to-br from-indigo-100 to-indigo-50',
      iconColor: 'text-indigo-600',
      trend: null,
      accentColor: 'border-indigo-400',
      testId: 'metric-team-members'
    },
    {
      title: 'Bugs',
      value: metrics.qualityMetrics.totalBugs,
      subtitle: `${metrics.qualityMetrics.resolvedBugs} resolved`,
      icon: Bug,
      iconBg: 'bg-gradient-to-br from-rose-100 to-rose-50',
      iconColor: 'text-rose-600',
      trend: metrics.qualityMetrics.totalBugs > 0 
        ? { value: `${((metrics.qualityMetrics.resolvedBugs / metrics.qualityMetrics.totalBugs) * 100).toFixed(0)}% resolved`, positive: true }
        : null,
      accentColor: 'border-rose-400',
      testId: 'metric-bugs'
    },
    {
      title: 'Avg Resolution',
      value: `${metrics.timeMetrics.avgResolutionTime}d`,
      subtitle: `${metrics.timeMetrics.resolvedIssues} resolved`,
      icon: Clock,
      iconBg: 'bg-gradient-to-br from-amber-100 to-amber-50',
      iconColor: 'text-amber-600',
      trend: metrics.timeMetrics.avgResolutionTime <= 7 
        ? { value: 'Fast', positive: true } 
        : { value: 'Needs Improvement', positive: false },
      accentColor: 'border-amber-400',
      testId: 'metric-resolution-time'
    },
    {
      title: 'Tests',
      value: metrics.advancedAnalytics.testMetrics.total,
      subtitle: `${metrics.advancedAnalytics.testMetrics.passed} passed`,
      icon: CheckCircle2,
      iconBg: 'bg-gradient-to-br from-teal-100 to-teal-50',
      iconColor: 'text-teal-600',
      trend: metrics.advancedAnalytics.testMetrics.total > 0 
        ? { value: `${((metrics.advancedAnalytics.testMetrics.passed / metrics.advancedAnalytics.testMetrics.total) * 100).toFixed(0)}% passing`, positive: true }
        : null,
      accentColor: 'border-teal-400',
      testId: 'metric-tests'
    },
    {
      title: 'Velocity',
      value: Math.round(metrics.storyPointsMetrics.completedPoints / 2) || 0,
      subtitle: 'points per sprint',
      icon: Zap,
      iconBg: 'bg-gradient-to-br from-yellow-100 to-yellow-50',
      iconColor: 'text-yellow-600',
      trend: null,
      accentColor: 'border-yellow-400',
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
            className={`kpi-card border-t-4 ${metric.accentColor}`}
            data-testid={metric.testId}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {metric.title}
                </p>
                <p className="text-4xl font-bold text-slate-900 mb-1 leading-none">
                  {metric.value}
                </p>
                <p className="text-sm text-slate-600">
                  {metric.subtitle}
                </p>
              </div>
              <div className={`${metric.iconBg} p-3 rounded-2xl shadow-sm flex-shrink-0`}>
                <Icon className={metric.iconColor} size={28} strokeWidth={2.5} />
              </div>
            </div>
            
            {metric.trend && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                {metric.trend.positive ? (
                  <TrendingUp size={16} className="text-emerald-600" />
                ) : (
                  <TrendingDown size={16} className="text-rose-600" />
                )}
                <span className={`text-xs font-semibold ${metric.trend.positive ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {metric.trend.value}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;
