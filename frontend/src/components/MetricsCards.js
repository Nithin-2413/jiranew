import React from 'react';
import { TrendingUp, FileText, Users, Bug, CheckCircle2, Clock, Target, Zap } from 'lucide-react';
import { formatDecimal, formatLargeNumber } from '../lib/utils';

const METRIC_CONFIGS = [
  {
    key: 'total',
    title: 'Total Issues',
    icon: FileText,
    iconStyle: { background: 'linear-gradient(135deg,#FF8C42,#FFB380)' },
    testId: 'metric-total-issues',
    getValue: (m) => formatLargeNumber(m.volumeMetrics.total),
  },
  {
    key: 'completion',
    title: 'Completion Rate',
    icon: TrendingUp,
    iconStyle: { background: 'linear-gradient(135deg,#10B981,#34D399)' },
    testId: 'metric-completion-rate',
    getValue: (m) => `${formatDecimal(parseFloat(m.storyPointsMetrics.completionRate) || 0, 1)}%`,
  },
  {
    key: 'points',
    title: 'Story Points',
    icon: Target,
    iconStyle: { background: 'linear-gradient(135deg,#8B5CF6,#C084FC)' },
    testId: 'metric-story-points',
    getValue: (m) => formatLargeNumber(m.storyPointsMetrics.totalPoints || 0),
    getSubtitle: (m) => `${m.storyPointsMetrics.issuesWithPoints || 0} issues tracked`,
  },
  {
    key: 'team',
    title: 'Team Members',
    icon: Users,
    iconStyle: { background: 'linear-gradient(135deg,#3B82F6,#60A5FA)' },
    testId: 'metric-team-members',
    getValue: (m) => formatLargeNumber(m.teamMetrics.totalMembers),
  },
  {
    key: 'bugs',
    title: 'Bugs',
    icon: Bug,
    iconStyle: { background: 'linear-gradient(135deg,#EF4444,#F87171)' },
    testId: 'metric-bugs',
    getValue: (m) => formatLargeNumber(m.qualityMetrics.totalBugs),
    getSubtitle: (m) => `${m.qualityMetrics.resolvedBugs} resolved`,
  },
  {
    key: 'resolution',
    title: 'Avg Resolution',
    icon: Clock,
    iconStyle: { background: 'linear-gradient(135deg,#F59E0B,#FCD34D)' },
    testId: 'metric-resolution-time',
    getValue: (m) => `${formatDecimal(m.timeMetrics.avgResolutionTime, 1)}d`,
    getSubtitle: () => 'average cycle time',
  },
  {
    key: 'tests',
    title: 'Tests',
    icon: CheckCircle2,
    iconStyle: { background: 'linear-gradient(135deg,#14B8A6,#5EEAD4)' },
    testId: 'metric-tests',
    getValue: (m) => formatLargeNumber(m.advancedAnalytics.testMetrics.total),
    getSubtitle: (m) => `${m.advancedAnalytics.testMetrics.passed} passed`,
  },
  {
    key: 'velocity',
    title: 'Velocity',
    icon: Zap,
    iconStyle: { background: 'linear-gradient(135deg,#EC4899,#F472B6)' },
    testId: 'metric-velocity',
    getValue: (m) => formatLargeNumber(Math.round(m.storyPointsMetrics.completedPoints / 2) || 0),
    getSubtitle: () => 'pts / sprint',
  },
];

const MetricsCards = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {METRIC_CONFIGS.map((cfg, i) => {
        const Icon = cfg.icon;
        const value = cfg.getValue(metrics);
        const subtitle = cfg.getSubtitle ? cfg.getSubtitle(metrics) : null;

        return (
          <div
            key={cfg.key}
            className="metric-card group"
            data-testid={cfg.testId}
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#9CA3AF',
                    marginBottom: '8px',
                  }}
                >
                  {cfg.title}
                </p>
                <p
                  className="metric-value"
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    lineHeight: 1,
                    marginBottom: subtitle ? '6px' : 0,
                  }}
                >
                  {value}
                </p>
                {subtitle && (
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px' }}>
                    {subtitle}
                  </p>
                )}
              </div>

              <div
                className="group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                style={{
                  ...cfg.iconStyle,
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <Icon color="white" size={22} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;
