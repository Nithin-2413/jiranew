import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfWeek, endOfWeek } from 'date-fns';

export const processJiraData = (issues) => {
  if (!issues || issues.length === 0) {
    return getEmptyMetrics();
  }

  const metrics = {
    volumeMetrics: calculateVolumeMetrics(issues),
    teamMetrics: calculateTeamMetrics(issues),
    sprintMetrics: calculateSprintMetrics(issues),
    qualityMetrics: calculateQualityMetrics(issues),
    storyPointsMetrics: calculateStoryPointsMetrics(issues),
    labelMetrics: calculateLabelMetrics(issues),
    timeMetrics: calculateTimeMetrics(issues),
    detailedIssues: processDetailedIssues(issues),
    advancedAnalytics: calculateAdvancedAnalytics(issues)
  };

  return metrics;
};

const calculateVolumeMetrics = (issues) => {
  const byType = {};
  const byStatus = {};
  const byPriority = {};

  issues.forEach(issue => {
    const type = issue.fields.issuetype?.name || 'Unknown';
    const status = issue.fields.status?.name || 'Unknown';
    const priority = issue.fields.priority?.name || 'None';

    byType[type] = (byType[type] || 0) + 1;
    byStatus[status] = (byStatus[status] || 0) + 1;
    byPriority[priority] = (byPriority[priority] || 0) + 1;
  });

  return {
    total: issues.length,
    byType,
    byStatus,
    byPriority
  };
};

const calculateTeamMetrics = (issues) => {
  const byAssignee = {};
  const pointsByAssignee = {};

  issues.forEach(issue => {
    const assignee = issue.fields.assignee?.displayName || 'Unassigned';
    const points = issue.fields.customfield_10016 || 0;

    byAssignee[assignee] = (byAssignee[assignee] || 0) + 1;
    pointsByAssignee[assignee] = (pointsByAssignee[assignee] || 0) + points;
  });

  return {
    byAssignee,
    pointsByAssignee,
    totalMembers: Object.keys(byAssignee).length
  };
};

const calculateSprintMetrics = (issues) => {
  const sprints = {};
  
  issues.forEach(issue => {
    const sprint = issue.fields.sprint?.name || 'No Sprint';
    const points = issue.fields.customfield_10016 || 0;
    const status = issue.fields.status?.statusCategory?.name || 'To Do';

    if (!sprints[sprint]) {
      sprints[sprint] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        points: 0,
        completedPoints: 0
      };
    }

    sprints[sprint].total += 1;
    sprints[sprint].points += points;

    if (status === 'Done') {
      sprints[sprint].completed += 1;
      sprints[sprint].completedPoints += points;
    } else if (status === 'In Progress') {
      sprints[sprint].inProgress += 1;
    } else {
      sprints[sprint].todo += 1;
    }
  });

  return { sprints };
};

const calculateQualityMetrics = (issues) => {
  const bugs = issues.filter(i => i.fields.issuetype?.name === 'Bug');
  const stories = issues.filter(i => i.fields.issuetype?.name === 'Story');

  const bugsByPriority = {};
  const resolvedBugs = bugs.filter(b => b.fields.status?.statusCategory?.name === 'Done').length;

  bugs.forEach(bug => {
    const priority = bug.fields.priority?.name || 'None';
    bugsByPriority[priority] = (bugsByPriority[priority] || 0) + 1;
  });

  return {
    totalBugs: bugs.length,
    bugsByPriority,
    resolvedBugs,
    bugDensity: stories.length > 0 ? (bugs.length / stories.length * 100).toFixed(2) : 0
  };
};

const calculateStoryPointsMetrics = (issues) => {
  let totalPoints = 0;
  let completedPoints = 0;
  const pointsByStatus = {};
  const pointDistribution = [];

  issues.forEach(issue => {
    const points = issue.fields.customfield_10016 || 0;
    const status = issue.fields.status?.statusCategory?.name || 'To Do';

    if (points > 0) {
      totalPoints += points;
      pointDistribution.push(points);

      if (status === 'Done') {
        completedPoints += points;
      }

      pointsByStatus[status] = (pointsByStatus[status] || 0) + points;
    }
  });

  const avgPoints = pointDistribution.length > 0 
    ? (pointDistribution.reduce((a, b) => a + b, 0) / pointDistribution.length).toFixed(1)
    : 0;

  return {
    totalPoints,
    completedPoints,
    pointsByStatus,
    avgPoints,
    completionRate: totalPoints > 0 ? ((completedPoints / totalPoints) * 100).toFixed(1) : 0
  };
};

const calculateLabelMetrics = (issues) => {
  const labelCount = {};
  const labelCombinations = {};
  const labelByIssueType = {};

  issues.forEach(issue => {
    const labels = issue.fields.labels || [];
    const issueType = issue.fields.issuetype?.name || 'Unknown';
    
    labels.forEach(label => {
      labelCount[label] = (labelCount[label] || 0) + 1;
      
      if (!labelByIssueType[label]) {
        labelByIssueType[label] = {};
      }
      labelByIssueType[label][issueType] = (labelByIssueType[label][issueType] || 0) + 1;
    });

    if (labels.length > 1) {
      const combo = labels.sort().join(' + ');
      labelCombinations[combo] = (labelCombinations[combo] || 0) + 1;
    }
  });

  const topLabels = Object.entries(labelCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  return {
    labelCount,
    topLabels,
    labelCombinations,
    labelByIssueType
  };
};

const calculateTimeMetrics = (issues) => {
  const resolutionTimes = [];
  
  issues.forEach(issue => {
    if (issue.fields.resolutiondate && issue.fields.created) {
      const created = new Date(issue.fields.created);
      const resolved = new Date(issue.fields.resolutiondate);
      const daysDiff = (resolved - created) / (1000 * 60 * 60 * 24);
      resolutionTimes.push(daysDiff);
    }
  });

  const avgResolutionTime = resolutionTimes.length > 0
    ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
    : 0;

  return {
    avgResolutionTime,
    resolvedIssues: resolutionTimes.length
  };
};

const calculateAdvancedAnalytics = (issues) => {
  // Issue type vs Label correlation
  const issueTypeVsLabel = {};
  
  // Test execution tracking
  const testMetrics = {
    total: 0,
    passed: 0,
    failed: 0,
    blocked: 0
  };
  
  // Subtask analysis
  const subtaskMetrics = {
    totalWithSubtasks: 0,
    avgSubtasksPerIssue: 0,
    subtasksByLabel: {}
  };
  
  let subtaskCount = 0;
  
  issues.forEach(issue => {
    const issueType = issue.fields.issuetype?.name || 'Unknown';
    const labels = issue.fields.labels || [];
    const subtasks = issue.fields.subtasks || [];
    
    // Issue type vs label
    if (!issueTypeVsLabel[issueType]) {
      issueTypeVsLabel[issueType] = {};
    }
    
    labels.forEach(label => {
      issueTypeVsLabel[issueType][label] = (issueTypeVsLabel[issueType][label] || 0) + 1;
    });
    
    // Test tracking
    if (issueType === 'Test') {
      testMetrics.total += 1;
      const status = issue.fields.status?.name?.toLowerCase() || '';
      if (status.includes('pass') || status.includes('done')) {
        testMetrics.passed += 1;
      } else if (status.includes('fail')) {
        testMetrics.failed += 1;
      } else if (status.includes('block')) {
        testMetrics.blocked += 1;
      }
    }
    
    // Subtask analysis
    if (subtasks.length > 0) {
      subtaskMetrics.totalWithSubtasks += 1;
      subtaskCount += subtasks.length;
      
      labels.forEach(label => {
        subtaskMetrics.subtasksByLabel[label] = (subtaskMetrics.subtasksByLabel[label] || 0) + subtasks.length;
      });
    }
  });
  
  subtaskMetrics.avgSubtasksPerIssue = subtaskMetrics.totalWithSubtasks > 0 
    ? (subtaskCount / subtaskMetrics.totalWithSubtasks).toFixed(1)
    : 0;
  
  return {
    issueTypeVsLabel,
    testMetrics,
    subtaskMetrics
  };
};

const processDetailedIssues = (issues) => {
  return issues.map(issue => ({
    key: issue.key,
    summary: issue.fields.summary,
    type: issue.fields.issuetype?.name,
    status: issue.fields.status?.name,
    priority: issue.fields.priority?.name,
    assignee: issue.fields.assignee?.displayName || 'Unassigned',
    created: issue.fields.created,
    resolved: issue.fields.resolutiondate,
    labels: issue.fields.labels || [],
    storyPoints: issue.fields.customfield_10016 || 0,
    statusCategory: issue.fields.status?.statusCategory?.name
  }));
};

const getEmptyMetrics = () => ({
  volumeMetrics: { total: 0, byType: {}, byStatus: {}, byPriority: {} },
  teamMetrics: { byAssignee: {}, pointsByAssignee: {}, totalMembers: 0 },
  sprintMetrics: { sprints: {} },
  qualityMetrics: { totalBugs: 0, bugsByPriority: {}, resolvedBugs: 0, bugDensity: 0 },
  storyPointsMetrics: { totalPoints: 0, completedPoints: 0, pointsByStatus: {}, avgPoints: 0, completionRate: 0 },
  labelMetrics: { labelCount: {}, topLabels: [], labelCombinations: {}, labelByIssueType: {} },
  timeMetrics: { avgResolutionTime: 0, resolvedIssues: 0 },
  detailedIssues: [],
  advancedAnalytics: {
    issueTypeVsLabel: {},
    testMetrics: { total: 0, passed: 0, failed: 0, blocked: 0 },
    subtaskMetrics: { totalWithSubtasks: 0, avgSubtasksPerIssue: 0, subtasksByLabel: {} }
  }
});

export const getDatePresets = () => ({
  thisWeek: {
    label: 'This Week',
    start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  },
  thisMonth: {
    label: 'This Month',
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  },
  thisQuarter: {
    label: 'This Quarter',
    start: format(startOfQuarter(new Date()), 'yyyy-MM-dd'),
    end: format(endOfQuarter(new Date()), 'yyyy-MM-dd')
  },
  last30Days: {
    label: 'Last 30 Days',
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  },
  last60Days: {
    label: 'Last 60 Days',
    start: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  },
  last90Days: {
    label: 'Last 90 Days',
    start: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  }
});