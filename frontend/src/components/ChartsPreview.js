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
import { Filter } from 'lucide-react';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
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

// Brighter colors for dark mode
const VIBRANT_COLORS = [
  '#00D9FF', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899',
  '#F97316', '#6366F1', '#14B8A6', '#EF4444', '#84CC16',
  '#06B6D4', '#A855F7'
];

const ChartCard = ({ title, subtitle, children, filtersConfig, onFilterChange, chartId }) => {
  const hasFilters = filtersConfig && (filtersConfig.assignees?.length > 0 || filtersConfig.labels?.length > 0 || filtersConfig.types?.length > 0);
  
  return (
    <div className="chart-card" data-testid={chartId}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-white tracking-wide">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {hasFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 bg-[#1E293B] hover:bg-[#334155] border-white/10 text-xs text-cyan-400 transition-colors shadow-sm">
                <Filter size={14} className="mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-[#0F172A] border border-white/10 p-4 shadow-xl shadow-black/50 rounded-xl z-50" align="end">
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-sm mb-3 tracking-wide">Chart Scope</h4>
                
                {filtersConfig.assignees?.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee</label>
                    <Select value={filtersConfig.currentAssignee || 'all'} onValueChange={(v) => onFilterChange('assignee', v)}>
                      <SelectTrigger className="h-8 bg-[#1E293B] border-white/10 text-xs text-slate-200">
                        <SelectValue placeholder="All Members" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E293B] border-white/10 max-h-[200px] z-[60]">
                        <SelectItem value="all" className="text-xs text-slate-200">All Members</SelectItem>
                        {filtersConfig.assignees.map(a => <SelectItem key={a} value={a} className="text-xs text-slate-200">{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filtersConfig.labels?.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team (Label)</label>
                    <Select value={filtersConfig.currentLabel || 'all'} onValueChange={(v) => onFilterChange('label', v)}>
                      <SelectTrigger className="h-8 bg-[#1E293B] border-white/10 text-xs text-slate-200">
                        <SelectValue placeholder="All Teams" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E293B] border-white/10 max-h-[200px] z-[60]">
                        <SelectItem value="all" className="text-xs text-slate-200">All Teams</SelectItem>
                        {filtersConfig.labels.map(l => <SelectItem key={l} value={l} className="text-xs text-slate-200">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filtersConfig.types?.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Type</label>
                    <Select value={filtersConfig.currentType || 'all'} onValueChange={(v) => onFilterChange('type', v)}>
                      <SelectTrigger className="h-8 bg-[#1E293B] border-white/10 text-xs text-slate-200">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E293B] border-white/10 max-h-[200px] z-[60]">
                        <SelectItem value="all" className="text-xs text-slate-200">All Types</SelectItem>
                        {filtersConfig.types.map(t => <SelectItem key={t} value={t} className="text-xs text-slate-200">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="chart-wrapper">
        {children}
      </div>
    </div>
  );
};

const ChartSkeleton = () => (
  <div className="chart-card">
    <Skeleton className="h-6 w-48 mb-4 bg-slate-800" />
    <Skeleton className="h-[280px] w-full bg-slate-800/50 rounded-lg" />
  </div>
);

// Unified Helper for multi-dimensional local filtering
const getFilteredIssues = (issues, filters) => {
  return issues.filter(i => {
    if (filters.assignee !== 'all' && i.assignee !== filters.assignee) return false;
    if (filters.type !== 'all' && i.type !== filters.type) return false;
    
    if (filters.label !== 'all') {
      if (filters.label === 'Unlabeled') {
        if (i.labels && i.labels.length > 0) return false;
      } else {
        if (!i.labels || !i.labels.includes(filters.label)) return false;
      }
    }
    return true;
  });
};

const ChartsPreview = ({ metrics, chartRefs, loading = false }) => {
  
  // Create shared default state object
  const defaultFilters = { assignee: 'all', label: 'all', type: 'all' };

  // Independent Filter States for each visualization
  const [typeFilters, setTypeFilters] = useState(defaultFilters);
  const [statusFilters, setStatusFilters] = useState(defaultFilters);
  const [teamFilters, setTeamFilters] = useState(defaultFilters);
  const [bugFilters, setBugFilters] = useState(defaultFilters);
  const [pointsFilters, setPointsFilters] = useState(defaultFilters);
  const [testFilters, setTestFilters] = useState(defaultFilters);
  const [labelFilters, setLabelFilters] = useState(defaultFilters);
  const [tableFilters, setTableFilters] = useState(defaultFilters);

  // Extract unique taxonomy for dropdown options
  const taxonomy = useMemo(() => {
    const list = metrics?.detailedIssues || [];
    
    // Assignees
    const aSet = new Set(list.map(i => i.assignee).filter(Boolean));
    
    // Issue Types
    const tSet = new Set(list.map(i => i.type).filter(Boolean));
    
    // Labels (incorporating 'Unlabeled' marker)
    const lSet = new Set(['Unlabeled']);
    list.forEach(i => {
      (i.labels || []).forEach(l => lSet.add(l));
    });

    return {
      assignees: Array.from(aSet).sort(),
      types: Array.from(tSet).sort(),
      labels: Array.from(lSet).sort()
    };
  }, [metrics?.detailedIssues]);

  // Unified configuration generator for ChartCard
  const generateFilterConfig = (currentFilters) => ({
    assignees: taxonomy.assignees,
    labels: taxonomy.labels,
    types: taxonomy.types,
    currentAssignee: currentFilters.assignee,
    currentLabel: currentFilters.label,
    currentType: currentFilters.type
  });

  const handleFilterChange = (setter, prev) => (key, value) => {
    setter({ ...prev, [key]: value });
  };

  // 1. Issue Type Data
  const typeData = useMemo(() => {
    const issues = getFilteredIssues(metrics.detailedIssues, typeFilters);
    const tallies = {};
    issues.forEach(i => tallies[i.type || 'Unknown'] = (tallies[i.type || 'Unknown'] || 0) + 1);
    
    return {
      labels: Object.keys(tallies),
      datasets: [{
        data: Object.values(tallies),
        backgroundColor: VIBRANT_COLORS,
        borderWidth: 1,
        borderColor: '#0F172A',
        hoverOffset: 10
      }]
    };
  }, [metrics.detailedIssues, typeFilters]);

  // 2. Status Data
  const statusData = useMemo(() => {
    const issues = getFilteredIssues(metrics.detailedIssues, statusFilters);
    const tallies = {};
    issues.forEach(i => tallies[i.status || 'Unknown'] = (tallies[i.status || 'Unknown'] || 0) + 1);
    
    return {
      labels: Object.keys(tallies),
      datasets: [{
        label: 'Issues',
        data: Object.values(tallies),
        backgroundColor: VIBRANT_COLORS,
        borderRadius: 8,
        borderSkipped: false
      }]
    };
  }, [metrics.detailedIssues, statusFilters]);

  // 3. Team Performance Data
  const filteredTeamData = useMemo(() => {
    const issues = getFilteredIssues(metrics.detailedIssues, teamFilters);
    const pointsMap = {};
    issues.forEach(i => {
      const a = i.assignee || 'Unassigned';
      pointsMap[a] = (pointsMap[a] || 0) + (i.storyPoints || 0);
    });

    const labels = teamFilters.assignee === 'all' ? taxonomy.assignees : [teamFilters.assignee];
    return {
      labels,
      datasets: [{
        label: 'Story Points',
        data: labels.map(l => pointsMap[l] || 0),
        backgroundColor: '#8B5CF6',
        borderRadius: 8
      }]
    };
  }, [metrics.detailedIssues, teamFilters, taxonomy.assignees]);

  // 4. Bug Priority Data
  const bugData = useMemo(() => {
    // Force issue type = 'Bug' inherently for this chart
    const enforcedBugFilters = { ...bugFilters, type: 'Bug' };
    const issues = getFilteredIssues(metrics.detailedIssues, enforcedBugFilters);
    
    const tallies = {};
    issues.forEach(i => tallies[i.priority || 'None'] = (tallies[i.priority || 'None'] || 0) + 1);
    
    return {
      labels: Object.keys(tallies),
      datasets: [{
        data: Object.values(tallies),
        backgroundColor: ['#EF4444', '#F59E0B', '#F97316', '#3B82F6', '#14B8A6'],
        borderWidth: 1,
        borderColor: '#0F172A'
      }]
    };
  }, [metrics.detailedIssues, bugFilters]);

  // 5. Story Points by Status
  const pointsData = useMemo(() => {
    const issues = getFilteredIssues(metrics.detailedIssues, pointsFilters);
    const tallies = {};
    issues.forEach(i => {
      if (i.storyPoints > 0) {
        tallies[i.status || 'To Do'] = (tallies[i.status || 'To Do'] || 0) + i.storyPoints;
      }
    });

    const labels = Object.keys(tallies);
    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        label: 'Story Points',
        data: labels.length > 0 ? Object.values(tallies) : [0],
        backgroundColor: labels.length > 0 ? ['#10B981', '#00D9FF', '#F59E0B', '#8B5CF6'] : ['#334155'],
        borderRadius: 8
      }]
    };
  }, [metrics.detailedIssues, pointsFilters]);

  // 6. Test Execution Data
  const testMetricsData = useMemo(() => {
    // Force issue type = 'Test' inherently for this chart
    const enforcedTestFilters = { ...testFilters, type: 'Test' };
    const issues = getFilteredIssues(metrics.detailedIssues, enforcedTestFilters);
    let passed = 0, failed = 0, blocked = 0;
    
    issues.forEach(i => {
      const s = (i.status || '').toLowerCase();
      if (s.includes('pass') || s.includes('done')) passed++;
      else if (s.includes('fail')) failed++;
      else if (s.includes('block')) blocked++;
    });

    return {
      total: passed + failed + blocked,
      data: {
        labels: ['Passed', 'Failed', 'Blocked'],
        datasets: [{
          data: [passed, failed, blocked],
          backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
          borderWidth: 1,
          borderColor: '#0F172A'
        }]
      }
    };
  }, [metrics.detailedIssues, testFilters]);

  // 7. Labels Analysis Table Data
  const filteredLabelsData = useMemo(() => {
    const issues = getFilteredIssues(metrics.detailedIssues, labelFilters);
    const labelCount = {};
    
    issues.forEach(i => {
      if (!i.labels || i.labels.length === 0) {
        labelCount['Unlabeled'] = (labelCount['Unlabeled'] || 0) + 1;
      } else {
        i.labels.forEach(l => labelCount[l] = (labelCount[l] || 0) + 1);
      }
    });
    return Object.entries(labelCount).sort((a, b) => b[1] - a[1]);
  }, [metrics.detailedIssues, labelFilters]);

  // Chart Options configured for Dark Theme
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    color: '#94A3B8',
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
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, family: 'Inter', weight: 600 },
        bodyFont: { size: 12, family: 'Inter' },
        titleColor: '#F8FAFC',
        bodyColor: '#E2E8F0'
      },
      datalabels: {
        color: '#FFFFFF',
        font: { weight: 'bold', size: 11 },
        textShadowBlur: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
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
        grid: { color: 'rgba(255,255,255,0.05)' },
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
          <ChartCard 
            title="By Issue Type" 
            chartId="chart-issue-type"
            filtersConfig={generateFilterConfig(typeFilters)}
            onFilterChange={handleFilterChange(setTypeFilters, typeFilters)}
          >
            {typeData.labels.length > 0 ? (
              <Doughnut ref={(ref) => { if (ref) chartRefs.current.issueTypeChart = ref; }} data={typeData} options={chartOptions} />
            ) : <div className="flex h-full items-center justify-center text-slate-500">No data found</div>}
          </ChartCard>
          
          <ChartCard 
            title="By Status" 
            chartId="chart-status"
            filtersConfig={generateFilterConfig(statusFilters)}
            onFilterChange={handleFilterChange(setStatusFilters, statusFilters)}
          >
            {statusData.labels.length > 0 ? (
              <Bar ref={(ref) => { if (ref) chartRefs.current.statusChart = ref; }} data={statusData} options={barChartOptions} />
            ) : <div className="flex h-full items-center justify-center text-slate-500">No data found</div>}
          </ChartCard>
        </div>
      </div>

      {/* Team Performance Section */}
      {taxonomy.assignees.length > 0 && (
        <div className="charts-section">
          <h3 className="section-title">Team Performance</h3>
          <ChartCard 
            title="Story Points by Team Member" 
            subtitle={`${taxonomy.assignees.length} team members available`}
            chartId="chart-team-points"
            filtersConfig={generateFilterConfig(teamFilters)}
            onFilterChange={handleFilterChange(setTeamFilters, teamFilters)}
          >
            <div style={{ height: Math.max(300, (teamFilters.assignee === 'all' ? taxonomy.assignees.length : 1) * 40) + 'px' }}>
             {filteredTeamData.labels.length > 0 ? (
               <Bar 
                 ref={(ref) => { if (ref) chartRefs.current.teamPointsChart = ref; }}
                 data={filteredTeamData} 
                 options={{
                   ...barChartOptions,
                   indexAxis: 'y',
                   scales: {
                     x: { ...barChartOptions.scales.y, grid: { color: 'rgba(255,255,255,0.05)' } },
                     y: { ...barChartOptions.scales.x, grid: { display: false } }
                   }
                 }} 
               />
             ) : <div className="flex h-full items-center justify-center text-slate-500">No data found</div>}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Quality & Progress */}
      <div className="charts-section">
        <h3 className="section-title">Quality & Progress</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Bugs by Priority" 
            chartId="chart-bug-priority"
            filtersConfig={generateFilterConfig(bugFilters)}
            onFilterChange={handleFilterChange(setBugFilters, bugFilters)}
          >
            {bugData.labels.length > 0 ? (
              <Doughnut data={bugData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-slate-500">
                No bugs found for chosen filters
              </div>
            )}
          </ChartCard>

          <ChartCard 
            title="Story Points by Status" 
            chartId="chart-points-status"
            filtersConfig={generateFilterConfig(pointsFilters)}
            onFilterChange={handleFilterChange(setPointsFilters, pointsFilters)}
          >
            {pointsData.labels[0] !== 'No Data' ? (
               <Bar data={pointsData} options={barChartOptions} />
            ) : <div className="flex items-center justify-center h-[280px] text-slate-500">No points data</div>}
          </ChartCard>
        </div>
      </div>

      {/* Test Execution */}
      <div className="charts-section">
        <h3 className="section-title">Test Execution</h3>
        <div className="grid grid-cols-1 gap-6">
          <ChartCard 
            title="Test Results" 
            subtitle={`${testMetricsData.total} specific tests matched`}
            chartId="chart-test-execution"
            filtersConfig={generateFilterConfig(testFilters)}
            onFilterChange={handleFilterChange(setTestFilters, testFilters)}
          >
            {testMetricsData.total > 0 ? (
                <Pie data={testMetricsData.data} options={chartOptions} />
            ) : <div className="flex items-center justify-center h-[280px] text-slate-500">No tests found for filters</div>}
          </ChartCard>
        </div>
      </div>

      {/* Label Analysis Table */}
      <div className="charts-section">
        <h3 className="section-title">Label Analysis</h3>
        <ChartCard 
            title="Top Labels" 
            subtitle="Includes 'Unlabeled' distribution"
            chartId="labels-table"
            filtersConfig={generateFilterConfig(labelFilters)}
            onFilterChange={handleFilterChange(setLabelFilters, labelFilters)}
        >
          {filteredLabelsData.length > 0 ? (
            <div className="table-scroll-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Label / Tag</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLabelsData.map(([label, count]) => {
                    const total = filteredLabelsData.reduce((sum, [, c]) => sum + c, 0);
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <tr key={label}>
                        <td>
                          {label === 'Unlabeled' ? (
                            <span className="text-slate-500 italic font-medium px-2 py-0.5 rounded border border-slate-700 bg-slate-800/50">Unlabeled</span>
                          ) : (
                            <span className="label-badge border border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 shadow-sm">{label}</span>
                          )}
                        </td>
                        <td className="font-bold text-white">{count}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden max-w-[100px]">
                              <div 
                                className={`h-full rounded-full ${label === 'Unlabeled' ? 'bg-slate-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-400">{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="text-center py-8 text-slate-500">No labels found for filters</div>}
        </ChartCard>
      </div>

      {/* Detailed Issues Table */}
      <div className="charts-section">
        <h3 className="section-title">Recent Issues Map</h3>
        <ChartCard 
            title="Tracked Items" 
            chartId="issues-table"
            filtersConfig={generateFilterConfig(tableFilters)}
            onFilterChange={handleFilterChange(setTableFilters, tableFilters)}
        >
          {getFilteredIssues(metrics.detailedIssues, tableFilters).length > 0 ? (
            <div className="table-scroll-container">
              <table className="data-table text-sm">
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
                  {getFilteredIssues(metrics.detailedIssues, tableFilters).map((issue) => (
                    <tr key={issue.key}>
                      <td className="font-bold text-cyan-400 min-w-[80px]">{issue.key}</td>
                      <td className="max-w-[300px] truncate text-slate-200" title={issue.summary}>
                        {issue.summary?.substring(0, 50)}{issue.summary?.length > 50 ? '...' : ''}
                      </td>
                      <td>
                        <span className="type-badge leading-tight py-1">{issue.type}</span>
                      </td>
                      <td>
                        <span className={`status-badge py-1 ${
                          issue.statusCategory === 'Done' ? 'status-resolved' :
                          issue.statusCategory === 'In Progress' ? 'status-in-progress' :
                          'status-open'
                        }`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="text-slate-400 whitespace-nowrap">{issue.assignee}</td>
                      <td className="text-center">
                        {issue.storyPoints > 0 ? (
                          <span className="points-badge px-2 py-0.5">{issue.storyPoints}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 w-[120px]">
                          {(!issue.labels || issue.labels.length === 0) ? (
                            <span className="text-slate-600 italic text-[10px]">Unlabeled</span>
                          ) : (
                            <>
                              {issue.labels.slice(0, 2).map(label => (
                                <span key={label} className="mini-label truncate max-w-[80px]">{label}</span>
                              ))}
                              {issue.labels.length > 2 && (
                                <span className="mini-label bg-slate-700/50 text-slate-300 border-0">+{issue.labels.length - 2}</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           ) : <div className="text-center py-8 text-slate-500">No issues matching filters</div>}
        </ChartCard>
      </div>
    </div>
  );
};

export default ChartsPreview;
