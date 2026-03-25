import React from 'react';
import { TrendingUp, FileText, Users, Bug, CheckCircle2, Clock, Target, Zap } from 'lucide-react';

const MetricsCards = ({ metrics }) => {
  const completionRate = parseFloat(metrics.storyPointsMetrics.completionRate) || 0;

  const metricsData = [
    {
      title: 'Total Issues',
      value: metrics.volumeMetrics.total,
      icon: FileText,
      iconBg: 'from-cyan-500/20 to-blue-500/20',
      iconColor: 'text-cyan-400',
      testId: 'metric-total-issues'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      iconBg: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-emerald-400',
      testId: 'metric-completion-rate'
    },
    {
      title: 'Story Points',
      value: metrics.storyPointsMetrics.totalPoints || 0,
      subtitle: `${metrics.storyPointsMetrics.issuesWithPoints || 0} issues`,
      icon: Target,
      iconBg: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
      testId: 'metric-story-points'
    },
    {
      title: 'Team Members',
      value: metrics.teamMetrics.totalMembers,
      icon: Users,
      iconBg: 'from-indigo-500/20 to-blue-500/20',
      iconColor: 'text-indigo-400',
      testId: 'metric-team-members'
    },
    {
      title: 'Bugs',
      value: metrics.qualityMetrics.totalBugs,
      subtitle: `${metrics.qualityMetrics.resolvedBugs} resolved`,
      icon: Bug,
      iconBg: 'from-rose-500/20 to-red-500/20',
      iconColor: 'text-rose-400',
      testId: 'metric-bugs'
    },
    {
      title: 'Avg Resolution',
      value: `${metrics.timeMetrics.avgResolutionTime}d`,
      icon: Clock,
      iconBg: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      testId: 'metric-resolution-time'
    },
    {
      title: 'Tests',
      value: metrics.advancedAnalytics.testMetrics.total,
      subtitle: `${metrics.advancedAnalytics.testMetrics.passed} passed`,
      icon: CheckCircle2,
      iconBg: 'from-teal-500/20 to-emerald-500/20',
      iconColor: 'text-teal-400',
      testId: 'metric-tests'
    },
    {
      title: 'Velocity',
      value: Math.round(metrics.storyPointsMetrics.completedPoints / 2) || 0,
      subtitle: 'pts/sprint',
      icon: Zap,
      iconBg: 'from-yellow-500/20 to-amber-500/20',
      iconColor: 'text-yellow-400',
      testId: 'metric-velocity'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                <p className="text-sm font-medium text-slate-400 mb-1">{metric.title}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{metric.subtitle}</p>
                )}
              </div>
              <div className={`bg-gradient-to-br ${metric.iconBg} p-3 rounded-xl shadow-sm border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={metric.iconColor} size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;
