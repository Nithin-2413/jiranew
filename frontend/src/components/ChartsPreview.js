import React, { useState, useMemo } from 'react';
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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';

/**
 * Butterscotch Light Color Palette for Charts
 */
const COLORS = [
  '#FF8C42', // Primary Orange
  '#3B82F6', // Info Blue
  '#10B981', // Success Green
  '#F59E0B', // Warning Amber
  '#8B5CF6', // Purple
  '#EF4444', // Danger Red
  '#14B8A6', // Teal
  '#EC4899', // Pink
];

const ChartCard = ({ title, subtitle, children, filtersConfig, onFilterChange, chartId }) => {
  const hasFilters = filtersConfig && (filtersConfig.assignees?.length > 0 || filtersConfig.labels?.length > 0 || filtersConfig.types?.length > 0);
  
  return (
    <div className="chart-card" data-testid={chartId}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-800 tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</h4>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {hasFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 bg-[#FFF9F0] hover:bg-[#FFF4E6] border-[#FFD4A8] text-xs text-[#FF8C42] transition-colors shadow-sm">
                <Filter size={14} className="mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-white border border-[#FFD4A8] p-4 shadow-xl shadow-[#FF8C42]/20 rounded-xl z-50" align="end">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 text-sm mb-3 tracking-wide flex items-center gap-2">
                  <Filter size={16} className="text-[#FF8C42]" />
                  Chart Scope
                </h4>
                
                {filtersConfig.assignees?.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assignee</label>
                    <Select value={filtersConfig.currentAssignee || 'all'} onValueChange={(v) => onFilterChange('assignee', v)}>
                      <SelectTrigger className="h-8 bg-[#FFF9F0] border-[#FFD4A8] text-xs text-gray-800 focus:ring-[#FF8C42]">
                        <SelectValue placeholder="All Members" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#FFD4A8] z-[60]">
                        <SelectItem value="all" className="text-xs">All Members</SelectItem>
                        {filtersConfig.assignees.map(a => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filtersConfig.labels?.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Team / Category</label>
                    <Select value={filtersConfig.currentLabel || 'all'} onValueChange={(v) => onFilterChange('label', v)}>
                      <SelectTrigger className="h-8 bg-[#FFF9F0] border-[#FFD4A8] text-xs text-gray-800 focus:ring-[#FF8C42]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#FFD4A8] z-[60]">
                        <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                        {filtersConfig.labels.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filtersConfig.types?.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Issue Type</label>
                    <Select value={filtersConfig.currentType || 'all'} onValueChange={(v) => onFilterChange('type', v)}>
                      <SelectTrigger className="h-8 bg-[#FFF9F0] border-[#FFD4A8] text-xs text-gray-800 focus:ring-[#FF8C42]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#FFD4A8] z-[60]">
                        <SelectItem value="all" className="text-xs">All Types</SelectItem>
                        {filtersConfig.types.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
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
    <Skeleton className="h-6 w-48 mb-4 bg-[#FFE4CC]" />
    <Skeleton className="h-[280px] w-full bg-[#FFE4CC]/50 rounded-lg" />
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

/**
 * Custom Tooltip for Butterscotch Light
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #FF8C42',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(255,140,66,0.15)',
        fontFamily: 'Plus Jakarta Sans',
      }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1F2937', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color }} />
            <span style={{ color: '#6B7280' }}>
              {entry.name}: <strong style={{ color: '#1F2937' }}>{entry.value}</strong>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Custom Pie Label (Outlined outside)
 */
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) + 30; // Push outside
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for tiny slices

  return (
    <text x={x} y={y} fill="#4B5563" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600 }}>
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ChartsPreview = ({ metrics, chartRefs, loading = false }) => {
  
  const defaultFilters = { assignee: 'all', label: 'all', type: 'all' };

  const [typeFilters, setTypeFilters] = useState(defaultFilters);
  const [statusFilters, setStatusFilters] = useState(defaultFilters);
  const [teamFilters, setTeamFilters] = useState(defaultFilters);
  const [bugFilters, setBugFilters] = useState(defaultFilters);
  const [pointsFilters, setPointsFilters] = useState(defaultFilters);
  const [testFilters, setTestFilters] = useState(defaultFilters);
  const [labelFilters, setLabelFilters] = useState(defaultFilters);
  const [tableFilters, setTableFilters] = useState(defaultFilters);

  const taxonomy = useMemo(() => {
    const list = metrics?.detailedIssues || [];
    const aSet = new Set(list.map(i => i.assignee).filter(Boolean));
    const tSet = new Set(list.map(i => i.type).filter(Boolean));
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
    
    return Object.entries(tallies).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [metrics.detailedIssues, typeFilters]);

  // 2. Status Data
  const statusData = useMemo(() => {
    const issues = getFilteredIssues(metrics.detailedIssues, statusFilters);
    const tallies = {};
    issues.forEach(i => tallies[i.status || 'Unknown'] = (tallies[i.status || 'Unknown'] || 0) + 1);
    
    return Object.entries(tallies).map(([name, Issues]) => ({ name, Issues })).sort((a, b) => b.Issues - a.Issues);
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
    // Return objects mapped for Recharts horizontal bar
    return labels.map(l => ({ name: l, Points: pointsMap[l] || 0 })).filter(d => d.Points > 0).sort((a, b) => b.Points - a.Points);
  }, [metrics.detailedIssues, teamFilters, taxonomy.assignees]);

  // 4. Bug Priority Data
  const bugData = useMemo(() => {
    const enforcedBugFilters = { ...bugFilters, type: 'Bug' };
    const issues = getFilteredIssues(metrics.detailedIssues, enforcedBugFilters);
    
    const tallies = {};
    issues.forEach(i => tallies[i.priority || 'None'] = (tallies[i.priority || 'None'] || 0) + 1);
    
    return Object.entries(tallies).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
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

    return Object.entries(tallies).map(([name, Points]) => ({ name, Points })).sort((a, b) => b.Points - a.Points);
  }, [metrics.detailedIssues, pointsFilters]);

  // 6. Test Execution Data
  const testMetricsData = useMemo(() => {
    const issues = getFilteredIssues(metrics.detailedIssues, testFilters)
      .filter(i => (i.type || '').toLowerCase().includes('test'));
    let passed = 0, failed = 0, blocked = 0, pending = 0;
    
    issues.forEach(i => {
      const s = (i.status || '').toLowerCase();
      const sc = (i.statusCategory || '').toLowerCase();
      if (s.includes('pass') || s.includes('success') || s.includes('done') || s.includes('closed') || sc === 'done' || sc === 'closed') {
        passed++;
      } else if (s.includes('fail')) {
        failed++;
      } else if (s.includes('block')) {
        blocked++;
      } else {
        pending++;
      }
    });

    return {
      total: passed + failed + blocked + pending,
      data: [
        { name: 'Passed', value: passed },
        { name: 'Failed', value: failed },
        { name: 'Blocked', value: blocked },
        { name: 'Pending', value: pending }
      ].filter(d => d.value > 0)
    };
  }, [metrics.detailedIssues, testFilters]);

  // 6b. Unlabeled Test Data
  const unlabeledTestData = useMemo(() => {
    return getFilteredIssues(metrics.detailedIssues, testFilters)
      .filter(i => (i.type || '').toLowerCase().includes('test') && (!i.labels || i.labels.length === 0))
      .sort((a,b) => new Date(b.created) - new Date(a.created));
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
            {typeData.length > 0 ? (
              <div ref={r => { if (r && chartRefs.current) chartRefs.current.issueTypeChart = r; }} style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart animationDuration={800}>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                      {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <RechartsLegend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="flex h-full items-center justify-center text-gray-400">No data found</div>}
          </ChartCard>
          
          <ChartCard 
            title="By Status" 
            chartId="chart-status"
            filtersConfig={generateFilterConfig(statusFilters)}
            onFilterChange={handleFilterChange(setStatusFilters, statusFilters)}
          >
            {statusData.length > 0 ? (
              <div ref={r => { if (r && chartRefs.current) chartRefs.current.statusChart = r; }} style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} animationDuration={800}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFE4CC" />
                    <XAxis dataKey="name" tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,140,66,0.05)' }} />
                    <Bar dataKey="Issues" fill="#FF8C42" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Issues" position="top" style={{ fill: '#FF8C42', fontSize: 12, fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="flex h-full items-center justify-center text-gray-400">No data found</div>}
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
            <div style={{ height: Math.max(300, filteredTeamData.length * 50) + 'px' }}>
             {filteredTeamData.length > 0 ? (
               <div ref={r => { if (r && chartRefs.current) chartRefs.current.teamPointsChart = r; }} style={{ width: '100%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={filteredTeamData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} animationDuration={800}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#FFE4CC" />
                      <XAxis type="number" tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={120} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                      <Bar dataKey="Points" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                         <LabelList dataKey="Points" position="right" style={{ fill: '#3B82F6', fontSize: 12, fontWeight: 'bold' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
             ) : <div className="flex h-full items-center justify-center text-gray-400">No data found</div>}
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
            {bugData.length > 0 ? (
              <div ref={r => { if (r && chartRefs.current) chartRefs.current.bugPriorityChart = r; }} style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart animationDuration={800}>
                    <Pie data={bugData} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                      {bugData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#F97316', '#3B82F6', '#14B8A6'][index % 5]} />)}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <RechartsLegend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400">
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
            {pointsData.length > 0 ? (
               <div ref={r => { if (r && chartRefs.current) chartRefs.current.pointsStatusChart = r; }} style={{ width: '100%', height: '100%' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={pointsData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} animationDuration={800}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFE4CC" />
                     <XAxis dataKey="name" tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                     <YAxis tick={{ fontFamily: 'Inter', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                     <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
                     <Bar dataKey="Points" fill="#10B981" radius={[4, 4, 0, 0]}>
                       <LabelList dataKey="Points" position="top" style={{ fill: '#10B981', fontSize: 12, fontWeight: 'bold' }} />
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            ) : <div className="flex items-center justify-center h-[280px] text-gray-400">No points data</div>}
          </ChartCard>
        </div>
      </div>

      {/* Test Execution */}
      <div className="charts-section">
        <h3 className="section-title">Test Execution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Test Results" 
            subtitle={`${testMetricsData.total} specific tests matched`}
            chartId="chart-test-execution"
            filtersConfig={generateFilterConfig(testFilters)}
            onFilterChange={handleFilterChange(setTestFilters, testFilters)}
          >
            {testMetricsData.total > 0 ? (
               <div ref={r => { if (r && chartRefs.current) chartRefs.current.testExecutionChart = r; }} style={{ width: '100%', height: '100%' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart animationDuration={800}>
                     <Pie data={testMetricsData.data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                       {testMetricsData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Passed' ? '#10B981' : entry.name === 'Failed' ? '#EF4444' : entry.name === 'Blocked' ? '#F59E0B' : '#94A3B8'} />)}
                     </Pie>
                     <RechartsTooltip content={<CustomTooltip />} />
                     <RechartsLegend wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px' }} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            ) : <div className="flex items-center justify-center h-[280px] text-gray-400">No tests found for filters</div>}
          </ChartCard>

          <ChartCard 
            title="Tests missing labels" 
            subtitle={`${unlabeledTestData.length} unlabeled tests found`}
            chartId="chart-unlabeled-tests"
            filtersConfig={generateFilterConfig(testFilters)}
            onFilterChange={handleFilterChange(setTestFilters, testFilters)}
          >
            {unlabeledTestData.length > 0 ? (
              <div className="table-scroll-container h-[280px]">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Summary</th>
                      <th>Status</th>
                      <th>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unlabeledTestData.slice(0, 15).map((issue) => (
                      <tr key={issue.key}>
                        <td className="font-bold text-[#FF8C42] whitespace-nowrap">{issue.key}</td>
                        <td className="max-w-[150px] truncate text-gray-700" title={issue.summary}>
                          {issue.summary?.substring(0, 30)}{issue.summary?.length > 30 ? '...' : ''}
                        </td>
                        <td>
                          <span className={`status-badge py-0.5 ${
                            issue.statusCategory === 'Done' ? 'status-resolved' :
                            issue.statusCategory === 'In Progress' ? 'status-in-progress' :
                            'status-open'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="text-gray-500 whitespace-nowrap">{issue.assignee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="flex items-center justify-center h-[280px] text-gray-400">All tests have labels!</div>}
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
                            <span className="text-gray-400 italic font-medium px-2 py-0.5 rounded border border-gray-300 bg-gray-50">Unlabeled</span>
                          ) : (
                            <span className="label-badge border border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 shadow-sm">{label}</span>
                          )}
                        </td>
                        <td className="font-bold text-gray-800">{count}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-[#FFF4E6] rounded-full h-2 overflow-hidden max-w-[100px]">
                              <div 
                                className={`h-full rounded-full ${label === 'Unlabeled' ? 'bg-gray-400' : 'bg-gradient-to-r from-[#FF8C42] to-[#FFB380]'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="text-center py-8 text-gray-400">No labels found for filters</div>}
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
                      <td className="font-bold text-[#FF8C42] min-w-[80px]">{issue.key}</td>
                      <td className="max-w-[300px] truncate text-gray-700" title={issue.summary}>
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
                      <td className="text-gray-500 whitespace-nowrap">{issue.assignee}</td>
                      <td className="text-center">
                        {issue.storyPoints > 0 ? (
                          <span className="points-badge px-2 py-0.5">{issue.storyPoints}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 w-[120px]">
                          {(!issue.labels || issue.labels.length === 0) ? (
                            <span className="text-gray-400 italic text-[10px]">Unlabeled</span>
                          ) : (
                            <>
                              {issue.labels.slice(0, 2).map(label => (
                                <span key={label} className="mini-label truncate max-w-[80px]">{label}</span>
                              ))}
                              {issue.labels.length > 2 && (
                                <span className="mini-label bg-[#FFEDD5] text-gray-600 border-0">+{issue.labels.length - 2}</span>
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
           ) : <div className="text-center py-8 text-gray-400">No issues matching filters</div>}
        </ChartCard>
      </div>
    </div>
  );
};

export default ChartsPreview;
