import React from 'react';
import { TrendingUp, FileText, Users, Bug, CheckCircle2, Clock, Target, Zap } from 'lucide-react';

const MetricsCards = ({ metrics }) => {
  const completionRate = parseFloat(metrics.storyPointsMetrics.completionRate) || 0;

  const metricsData = [
    {
      title: 'Total Issues',
      value: metrics.volumeMetrics.total,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      testId: 'metric-total-issues'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/20 to-emerald-500/20',
      testId: 'metric-completion-rate'
    },
    {
      title: 'Story Points',
      value: metrics.storyPointsMetrics.totalPoints || 0,
      subtitle: `${metrics.storyPointsMetrics.issuesWithPoints || 0} issues`,
      icon: Target,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/20 to-pink-500/20',
      testId: 'metric-story-points'
    },
    {
      title: 'Team Members',
      value: metrics.teamMetrics.totalMembers,
      icon: Users,
      gradient: 'from-indigo-500 to-blue-500',
      bgGradient: 'from-indigo-500/20 to-blue-500/20',
      testId: 'metric-team-members'
    },
    {
      title: 'Bugs',
      value: metrics.qualityMetrics.totalBugs,
      subtitle: `${metrics.qualityMetrics.resolvedBugs} resolved`,
      icon: Bug,
      gradient: 'from-red-500 to-rose-500',
      bgGradient: 'from-red-500/20 to-rose-500/20',
      testId: 'metric-bugs'
    },
    {
      title: 'Avg Resolution',
      value: `${metrics.timeMetrics.avgResolutionTime}d`,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/20 to-orange-500/20',
      testId: 'metric-resolution-time'
    },
    {
      title: 'Tests',
      value: metrics.advancedAnalytics.testMetrics.total,
      subtitle: `${metrics.advancedAnalytics.testMetrics.passed} passed`,
      icon: CheckCircle2,
      gradient: 'from-teal-500 to-cyan-500',
      bgGradient: 'from-teal-500/20 to-cyan-500/20',
      testId: 'metric-tests'
    },
    {
      title: 'Velocity',
      value: Math.round(metrics.storyPointsMetrics.completedPoints / 2) || 0,
      subtitle: 'pts/sprint',
      icon: Zap,
      gradient: 'from-yellow-500 to-amber-500',
      bgGradient: 'from-yellow-500/20 to-amber-500/20',
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
            className="metric-card group relative overflow-hidden"
            data-testid={metric.testId}
          >
            {/* Background gradient effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-400 mb-1">{metric.title}</p>
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{metric.subtitle}</p>
                )}
              </div>
              <div className={`bg-gradient-to-br ${metric.gradient} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
