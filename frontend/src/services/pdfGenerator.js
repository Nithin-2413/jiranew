import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const COLORS = {
  primary: '#0EA5E9',
  secondary: '#1E293B',
  text: '#0F172A',
  textSecondary: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

export const generatePDF = async (metrics, config, chartImages, exportOptions = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let pageNum = 1;
  let currentY = MARGIN;

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace) => {
    if (currentY + requiredSpace > PAGE_HEIGHT - 20) {
      addFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      currentY = MARGIN;
      return true;
    }
    return false;
  };

  // Cover Page
  await addCoverPage(doc, config);
  addFooter(doc, pageNum);

  // Executive Summary
  if (exportOptions.executiveSummary !== false) {
    doc.addPage();
    pageNum++;
    currentY = addExecutiveSummary(doc, metrics, config, MARGIN);
    addFooter(doc, pageNum);
  }

  // Issue Distribution
  if (exportOptions.issueDistribution !== false) {
    doc.addPage();
    pageNum++;
    currentY = await addIssueDistribution(doc, metrics, chartImages, MARGIN);
    addFooter(doc, pageNum);
  }

  // Team Performance
  if (exportOptions.teamPerformance !== false) {
    doc.addPage();
    pageNum++;
    currentY = addTeamPerformance(doc, metrics, chartImages, MARGIN);
    addFooter(doc, pageNum);
  }

  // Story Points Analysis
  if (exportOptions.storyPointsAnalysis !== false) {
    doc.addPage();
    pageNum++;
    currentY = addStoryPointsAnalysis(doc, metrics, chartImages, MARGIN);
    addFooter(doc, pageNum);
  }

  // Bug Analysis
  if (exportOptions.bugAnalysis !== false) {
    doc.addPage();
    pageNum++;
    currentY = addBugAnalysis(doc, metrics, MARGIN);
    addFooter(doc, pageNum);
  }

  // Label Analysis
  if (exportOptions.labelAnalysis !== false && metrics.labelMetrics.topLabels.length > 0) {
    doc.addPage();
    pageNum++;
    currentY = addLabelAnalysis(doc, metrics, MARGIN);
    addFooter(doc, pageNum);
  }

  // Test Execution
  if (exportOptions.testExecution !== false && metrics.advancedAnalytics.testMetrics.total > 0) {
    doc.addPage();
    pageNum++;
    currentY = addTestExecution(doc, metrics, MARGIN);
    addFooter(doc, pageNum);
  }

  // Detailed Issues Table
  if (exportOptions.detailedIssues !== false) {
    doc.addPage();
    pageNum++;
    addDetailedIssues(doc, metrics, pageNum);
  }

  return doc;
};

const addCoverPage = async (doc, config) => {
  // Background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Accent line
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 8, PAGE_HEIGHT, 'F');

  // Title
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('JIRA ANALYTICS', MARGIN + 10, 70);
  
  doc.setFontSize(28);
  doc.setTextColor(14, 165, 233);
  doc.text('REPORT', MARGIN + 10, 85);

  // Project info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Project: ${config.projectKey}`, MARGIN + 10, 110);
  doc.text(`Period: ${config.dateRange}`, MARGIN + 10, 120);
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, MARGIN + 10, 130);

  // Stats box
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(MARGIN + 10, 150, CONTENT_WIDTH - 20, 90, 5, 5, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('KEY HIGHLIGHTS', MARGIN + 20, 170);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  
  const highlights = [
    `Total Issues: ${config.totalIssues}`,
    `Completed: ${config.completedIssues} (${config.completionRate}%)`,
    `Total Story Points: ${config.totalPoints}`,
    `Team Members: ${config.teamMembers}`
  ];
  
  highlights.forEach((text, idx) => {
    doc.text(text, MARGIN + 20, 185 + idx * 12);
  });
};

const addExecutiveSummary = (doc, metrics, config, startY) => {
  let y = startY;
  
  addSectionHeader(doc, 'EXECUTIVE SUMMARY', y);
  y += 20;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  
  const summaryText = `This report provides a comprehensive analysis of team performance for project ${config.projectKey} during ${config.dateRange}. The analysis covers ${metrics.volumeMetrics.total} issues with a ${metrics.storyPointsMetrics.completionRate}% completion rate based on story points.`;
  
  const lines = doc.splitTextToSize(summaryText, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y);
  y += lines.length * 6 + 10;

  // Key metrics table
  const metricsData = [
    ['Metric', 'Value', 'Description'],
    ['Total Issues', metrics.volumeMetrics.total.toString(), 'All issues in the selected period'],
    ['Completion Rate', `${metrics.storyPointsMetrics.completionRate}%`, 'Based on story points completed'],
    ['Total Story Points', metrics.storyPointsMetrics.totalPoints.toString(), `${metrics.storyPointsMetrics.issuesWithPoints || 0} issues with points`],
    ['Team Members', metrics.teamMetrics.totalMembers.toString(), 'Active contributors'],
    ['Avg Resolution', `${metrics.timeMetrics.avgResolutionTime} days`, `${metrics.timeMetrics.resolvedIssues} issues resolved`],
    ['Bug Count', metrics.qualityMetrics.totalBugs.toString(), `${metrics.qualityMetrics.resolvedBugs} resolved`]
  ];

  autoTable(doc, {
    startY: y,
    head: [metricsData[0]],
    body: metricsData.slice(1),
    theme: 'striped',
    headStyles: { 
      fillColor: [14, 165, 233], 
      fontSize: 10, 
      fontStyle: 'bold',
      textColor: [255, 255, 255]
    },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { textColor: [100, 116, 139] }
    }
  });

  return doc.lastAutoTable.finalY + 10;
};

const addIssueDistribution = async (doc, metrics, chartImages, startY) => {
  let y = startY;
  
  addSectionHeader(doc, 'ISSUE DISTRIBUTION', y);
  y += 20;

  // Add chart images if available
  const chartWidth = 80;
  const chartHeight = 55;

  if (chartImages.issueTypeChart) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('By Issue Type', MARGIN, y);
    y += 5;
    
    try {
      doc.addImage(chartImages.issueTypeChart, 'PNG', MARGIN, y, chartWidth, chartHeight);
    } catch (e) {
      console.warn('Could not add issue type chart to PDF');
    }
  }

  if (chartImages.statusChart) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('By Status', MARGIN + chartWidth + 10, startY + 20);
    
    try {
      doc.addImage(chartImages.statusChart, 'PNG', MARGIN + chartWidth + 10, startY + 25, chartWidth, chartHeight);
    } catch (e) {
      console.warn('Could not add status chart to PDF');
    }
  }

  y = startY + 25 + chartHeight + 10;

  // Issue type table
  const typeData = [['Issue Type', 'Count', 'Percentage']];
  const total = metrics.volumeMetrics.total;
  Object.entries(metrics.volumeMetrics.byType).forEach(([type, count]) => {
    typeData.push([type, count.toString(), `${((count / total) * 100).toFixed(1)}%`]);
  });

  autoTable(doc, {
    startY: y,
    head: [typeData[0]],
    body: typeData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // Status table
  const statusData = [['Status', 'Count', 'Percentage']];
  Object.entries(metrics.volumeMetrics.byStatus).forEach(([status, count]) => {
    statusData.push([status, count.toString(), `${((count / total) * 100).toFixed(1)}%`]);
  });

  autoTable(doc, {
    startY: y,
    head: [statusData[0]],
    body: statusData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  return doc.lastAutoTable.finalY + 10;
};

const addTeamPerformance = (doc, metrics, chartImages, startY) => {
  let y = startY;
  
  addSectionHeader(doc, 'TEAM PERFORMANCE', y);
  y += 20;

  // Team data table
  const teamData = [['Team Member', 'Issues', 'Story Points', 'Avg Points/Issue']];

  Object.entries(metrics.teamMetrics.byAssignee)
    .sort((a, b) => (metrics.teamMetrics.pointsByAssignee[b[0]] || 0) - (metrics.teamMetrics.pointsByAssignee[a[0]] || 0))
    .forEach(([member, count]) => {
      const points = metrics.teamMetrics.pointsByAssignee[member] || 0;
      const avg = count > 0 ? (points / count).toFixed(1) : '0';
      teamData.push([member, count.toString(), points.toString(), avg]);
    });

  autoTable(doc, {
    startY: y,
    head: [teamData[0]],
    body: teamData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 60 }
    }
  });

  return doc.lastAutoTable.finalY + 10;
};

const addStoryPointsAnalysis = (doc, metrics, chartImages, startY) => {
  let y = startY;
  
  addSectionHeader(doc, 'STORY POINTS ANALYSIS', y);
  y += 20;

  // Summary stats
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text(`Total Story Points: ${metrics.storyPointsMetrics.totalPoints}`, MARGIN, y);
  doc.text(`Completed Points: ${metrics.storyPointsMetrics.completedPoints}`, MARGIN, y + 8);
  doc.text(`Completion Rate: ${metrics.storyPointsMetrics.completionRate}%`, MARGIN, y + 16);
  doc.text(`Average Points/Issue: ${metrics.storyPointsMetrics.avgPoints}`, MARGIN, y + 24);
  y += 35;

  // Points by status
  const pointsData = [['Status', 'Story Points', 'Percentage']];
  const totalPoints = metrics.storyPointsMetrics.totalPoints || 1;
  Object.entries(metrics.storyPointsMetrics.pointsByStatus).forEach(([status, points]) => {
    pointsData.push([status, points.toString(), `${((points / totalPoints) * 100).toFixed(1)}%`]);
  });

  if (pointsData.length > 1) {
    autoTable(doc, {
      startY: y,
      head: [pointsData[0]],
      body: pointsData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });
    return doc.lastAutoTable.finalY + 10;
  }

  return y;
};

const addBugAnalysis = (doc, metrics, startY) => {
  let y = startY;
  
  addSectionHeader(doc, 'BUG ANALYSIS', y);
  y += 20;

  // Bug summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text(`Total Bugs: ${metrics.qualityMetrics.totalBugs}`, MARGIN, y);
  doc.text(`Resolved: ${metrics.qualityMetrics.resolvedBugs}`, MARGIN, y + 8);
  doc.text(`Bug Density: ${metrics.qualityMetrics.bugDensity}%`, MARGIN, y + 16);
  y += 28;

  // Bugs by priority
  const bugData = [['Priority', 'Count', 'Percentage']];
  const totalBugs = metrics.qualityMetrics.totalBugs || 1;
  Object.entries(metrics.qualityMetrics.bugsByPriority).forEach(([priority, count]) => {
    bugData.push([priority, count.toString(), `${((count / totalBugs) * 100).toFixed(1)}%`]);
  });

  if (bugData.length > 1) {
    autoTable(doc, {
      startY: y,
      head: [bugData[0]],
      body: bugData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], fontSize: 9, fontStyle: 'bold', textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 3 }
    });
    return doc.lastAutoTable.finalY + 10;
  }

  return y;
};

const addLabelAnalysis = (doc, metrics, startY) => {
  let y = startY;
  
  addSectionHeader(doc, 'LABEL ANALYSIS', y);
  y += 20;

  const labelData = [['Label', 'Usage Count', 'Percentage']];
  const totalWithLabels = Object.values(metrics.labelMetrics.labelCount).reduce((a, b) => a + b, 0) || 1;
  
  metrics.labelMetrics.topLabels.slice(0, 15).forEach(([label, count]) => {
    labelData.push([label, count.toString(), `${((count / totalWithLabels) * 100).toFixed(1)}%`]);
  });

  autoTable(doc, {
    startY: y,
    head: [labelData[0]],
    body: labelData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  return doc.lastAutoTable.finalY + 10;
};

const addTestExecution = (doc, metrics, startY) => {
  let y = startY;
  
  addSectionHeader(doc, 'TEST EXECUTION', y);
  y += 20;

  const testMetrics = metrics.advancedAnalytics.testMetrics;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text(`Total Tests: ${testMetrics.total}`, MARGIN, y);
  y += 10;

  const testData = [
    ['Status', 'Count', 'Percentage'],
    ['Passed', testMetrics.passed.toString(), `${((testMetrics.passed / (testMetrics.total || 1)) * 100).toFixed(1)}%`],
    ['Failed', testMetrics.failed.toString(), `${((testMetrics.failed / (testMetrics.total || 1)) * 100).toFixed(1)}%`],
    ['Blocked', testMetrics.blocked.toString(), `${((testMetrics.blocked / (testMetrics.total || 1)) * 100).toFixed(1)}%`]
  ];

  autoTable(doc, {
    startY: y,
    head: [testData[0]],
    body: testData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  return doc.lastAutoTable.finalY + 10;
};

const addDetailedIssues = (doc, metrics, startPageNum) => {
  let pageNum = startPageNum;
  
  addSectionHeader(doc, 'DETAILED ISSUES', MARGIN);

  const issueData = [['Key', 'Summary', 'Type', 'Status', 'Assignee', 'Points']];

  metrics.detailedIssues.slice(0, 100).forEach(issue => {
    issueData.push([
      issue.key,
      (issue.summary || '').substring(0, 35) + ((issue.summary || '').length > 35 ? '...' : ''),
      issue.type || '-',
      issue.status || '-',
      (issue.assignee || 'Unassigned').substring(0, 15),
      issue.storyPoints > 0 ? issue.storyPoints.toString() : '-'
    ]);
  });

  autoTable(doc, {
    startY: MARGIN + 20,
    head: [issueData[0]],
    body: issueData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 55 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 35 },
      5: { cellWidth: 15 }
    },
    didDrawPage: (data) => {
      addFooter(doc, pageNum);
      if (data.pageNumber > 1) {
        pageNum++;
      }
    }
  });
};

const addSectionHeader = (doc, title, y) => {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text(title, MARGIN, y + 8);
  
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 12, MARGIN + 50, y + 12);
};

const addFooter = (doc, pageNum) => {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textSecondary);
  doc.text(
    `Generated on ${format(new Date(), 'MMMM dd, yyyy')} | Page ${pageNum}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 10,
    { align: 'center' }
  );
};

export default generatePDF;
