import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const COLORS = {
  primary: '#0C9ED9',
  secondary: '#000000',
  text: '#0F172A',
  textSecondary: '#64748B',
  bug: '#EF4444',
  story: '#0C9ED9',
  task: '#3B82F6',
  epic: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;

export const generatePDF = async (metrics, config, chartImages) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let pageNum = 1;

  // Page 1: Cover Page
  await addCoverPage(doc, config);
  
  // Page 2: Executive Summary
  doc.addPage();
  pageNum++;
  addExecutiveSummary(doc, metrics, pageNum);

  // Page 3: Issue Distribution
  doc.addPage();
  pageNum++;
  await addIssueDistribution(doc, metrics, chartImages, pageNum);

  // Page 4: Sprint Performance
  doc.addPage();
  pageNum++;
  await addSprintPerformance(doc, metrics, chartImages, pageNum);

  // Page 5: Story Points Analysis
  doc.addPage();
  pageNum++;
  await addStoryPointsAnalysis(doc, metrics, chartImages, pageNum);

  // Page 6: Team Performance
  doc.addPage();
  pageNum++;
  await addTeamPerformance(doc, metrics, chartImages, pageNum);

  // Page 7: Bug Analysis
  doc.addPage();
  pageNum++;
  await addBugAnalysis(doc, metrics, chartImages, pageNum);

  // Page 8: Label Analysis
  doc.addPage();
  pageNum++;
  await addLabelAnalysis(doc, metrics, chartImages, pageNum);

  // Pages 9+: Detailed Tables
  doc.addPage();
  pageNum++;
  addDetailedTables(doc, metrics, pageNum);

  // Last Page: Insights
  doc.addPage();
  pageNum++;
  addInsightsPage(doc, metrics, pageNum);

  return doc;
};

const addCoverPage = async (doc, config) => {
  // Add logo
  try {
    const logoUrl = 'https://customer-assets.emergentagent.com/job_team-metrics-62/artifacts/9yxyauul_Lumen_Technologies_logo.svg-2048x294.png';
    doc.addImage(logoUrl, 'PNG', MARGIN, MARGIN, 60, 8.6);
  } catch (error) {
    console.error('Failed to add logo:', error);
  }

  // Title
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text('JIRA TEAM PERFORMANCE', PAGE_WIDTH / 2, 80, { align: 'center' });
  doc.text('REPORT', PAGE_WIDTH / 2, 95, { align: 'center' });

  // Project info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textSecondary);
  doc.text(`Project: ${config.projectKey}`, PAGE_WIDTH / 2, 120, { align: 'center' });
  doc.text(`Period: ${config.dateRange}`, PAGE_WIDTH / 2, 130, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, PAGE_WIDTH / 2, 140, { align: 'center' });

  // Key highlights box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(30, 160, 150, 80, 3, 3, 'F');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text('KEY HIGHLIGHTS', PAGE_WIDTH / 2, 172, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Issues: ${config.totalIssues}`, PAGE_WIDTH / 2, 185, { align: 'center' });
  doc.text(`Completed: ${config.completedIssues} (${config.completionRate}%)`, PAGE_WIDTH / 2, 195, { align: 'center' });
  doc.text(`Story Points: ${config.totalPoints}`, PAGE_WIDTH / 2, 205, { align: 'center' });
  doc.text(`Team Members: ${config.teamMembers}`, PAGE_WIDTH / 2, 215, { align: 'center' });

  addFooter(doc, 1);
};

const addExecutiveSummary = (doc, metrics, pageNum) => {
  addPageHeader(doc, 'EXECUTIVE SUMMARY');

  let yPos = 50;

  // Summary text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  
  const summaryText = `This report provides a comprehensive analysis of team performance for the selected period. The team has shown strong productivity with ${metrics.volumeMetrics.total} total issues processed, maintaining a ${metrics.storyPointsMetrics.completionRate}% completion rate. Key focus areas include sprint velocity optimization, bug resolution efficiency, and workload distribution across team members.`;
  
  const lines = doc.splitTextToSize(summaryText, PAGE_WIDTH - 2 * MARGIN);
  doc.text(lines, MARGIN, yPos);
  yPos += lines.length * 6 + 10;

  // Metrics grid
  const metricsData = [
    ['METRIC', 'VALUE', 'STATUS'],
    ['Total Issues', metrics.volumeMetrics.total.toString(), getStatus(metrics.volumeMetrics.total, 100)],
    ['Completion Rate', `${metrics.storyPointsMetrics.completionRate}%`, getStatus(parseFloat(metrics.storyPointsMetrics.completionRate), 70)],
    ['Story Points', metrics.storyPointsMetrics.totalPoints.toString(), 'Good'],
    ['Avg Resolution Time', `${metrics.timeMetrics.avgResolutionTime} days`, getStatus(20 - parseFloat(metrics.timeMetrics.avgResolutionTime), 10)],
    ['Bug Count', metrics.qualityMetrics.totalBugs.toString(), getStatus(50 - metrics.qualityMetrics.totalBugs, 40)],
    ['Team Members', metrics.teamMetrics.totalMembers.toString(), 'Good']
  ];

  doc.autoTable({
    startY: yPos,
    head: [metricsData[0]],
    body: metricsData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'center' }
    }
  });

  addFooter(doc, pageNum);
};

const addIssueDistribution = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'ISSUE DISTRIBUTION');

  let yPos = 50;

  // Add charts if available
  if (chartImages.issueTypeChart) {
    doc.addImage(chartImages.issueTypeChart, 'PNG', MARGIN, yPos, 80, 60);
  }
  if (chartImages.statusChart) {
    doc.addImage(chartImages.statusChart, 'PNG', MARGIN + 90, yPos, 80, 60);
  }

  yPos += 70;

  // Issue type breakdown table
  const issueTypeData = [
    ['ISSUE TYPE', 'COUNT', 'PERCENTAGE']
  ];
  const total = metrics.volumeMetrics.total;
  Object.entries(metrics.volumeMetrics.byType).forEach(([type, count]) => {
    issueTypeData.push([type, count.toString(), `${((count / total) * 100).toFixed(1)}%`]);
  });

  doc.autoTable({
    startY: yPos,
    head: [issueTypeData[0]],
    body: issueTypeData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Status breakdown table
  const statusData = [
    ['STATUS', 'COUNT', 'PERCENTAGE']
  ];
  Object.entries(metrics.volumeMetrics.byStatus).forEach(([status, count]) => {
    statusData.push([status, count.toString(), `${((count / total) * 100).toFixed(1)}%`]);
  });

  doc.autoTable({
    startY: yPos,
    head: [statusData[0]],
    body: statusData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  addFooter(doc, pageNum);
};

const addSprintPerformance = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'SPRINT PERFORMANCE');

  let yPos = 50;

  // Add velocity chart if available
  if (chartImages.velocityChart) {
    doc.addImage(chartImages.velocityChart, 'PNG', MARGIN, yPos, 170, 70);
    yPos += 80;
  }

  // Sprint details table
  const sprintData = [
    ['SPRINT', 'TOTAL', 'COMPLETED', 'IN PROGRESS', 'POINTS', 'COMPLETION %']
  ];

  Object.entries(metrics.sprintMetrics.sprints).forEach(([sprint, data]) => {
    const completionRate = data.total > 0 ? ((data.completed / data.total) * 100).toFixed(0) : 0;
    sprintData.push([
      sprint,
      data.total.toString(),
      data.completed.toString(),
      data.inProgress.toString(),
      data.points.toString(),
      `${completionRate}%`
    ]);
  });

  doc.autoTable({
    startY: yPos,
    head: [sprintData[0]],
    body: sprintData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  addFooter(doc, pageNum);
};

const addStoryPointsAnalysis = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'STORY POINTS ANALYSIS');

  let yPos = 50;

  // Key metrics
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Story Points: ${metrics.storyPointsMetrics.totalPoints}`, MARGIN, yPos);
  doc.text(`Completed: ${metrics.storyPointsMetrics.completedPoints}`, MARGIN, yPos + 8);
  doc.text(`Completion Rate: ${metrics.storyPointsMetrics.completionRate}%`, MARGIN, yPos + 16);
  doc.text(`Average Points per Story: ${metrics.storyPointsMetrics.avgPoints}`, MARGIN, yPos + 24);
  yPos += 35;

  // Add team points chart if available
  if (chartImages.teamPointsChart) {
    doc.addImage(chartImages.teamPointsChart, 'PNG', MARGIN, yPos, 170, 70);
    yPos += 80;
  }

  // Points by status table
  const pointsData = [
    ['STATUS', 'STORY POINTS', 'PERCENTAGE']
  ];
  const totalPoints = metrics.storyPointsMetrics.totalPoints;
  Object.entries(metrics.storyPointsMetrics.pointsByStatus).forEach(([status, points]) => {
    pointsData.push([status, points.toString(), `${((points / totalPoints) * 100).toFixed(1)}%`]);
  });

  doc.autoTable({
    startY: yPos,
    head: [pointsData[0]],
    body: pointsData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  addFooter(doc, pageNum);
};

const addTeamPerformance = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'TEAM PERFORMANCE');

  let yPos = 50;

  // Team workload table
  const teamData = [
    ['TEAM MEMBER', 'ISSUES', 'STORY POINTS']
  ];

  Object.entries(metrics.teamMetrics.byAssignee)
    .sort((a, b) => b[1] - a[1])
    .forEach(([member, count]) => {
      const points = metrics.teamMetrics.pointsByAssignee[member] || 0;
      teamData.push([member, count.toString(), points.toString()]);
    });

  doc.autoTable({
    startY: yPos,
    head: [teamData[0]],
    body: teamData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  addFooter(doc, pageNum);
};

const addBugAnalysis = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'BUG ANALYSIS');

  let yPos = 50;

  // Bug summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Bugs: ${metrics.qualityMetrics.totalBugs}`, MARGIN, yPos);
  doc.text(`Resolved: ${metrics.qualityMetrics.resolvedBugs}`, MARGIN, yPos + 8);
  doc.text(`Bug Density: ${metrics.qualityMetrics.bugDensity}%`, MARGIN, yPos + 16);
  yPos += 30;

  // Bugs by priority table
  const bugData = [
    ['PRIORITY', 'COUNT', 'PERCENTAGE']
  ];
  const totalBugs = metrics.qualityMetrics.totalBugs || 1;
  Object.entries(metrics.qualityMetrics.bugsByPriority).forEach(([priority, count]) => {
    bugData.push([priority, count.toString(), `${((count / totalBugs) * 100).toFixed(1)}%`]);
  });

  doc.autoTable({
    startY: yPos,
    head: [bugData[0]],
    body: bugData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68], fontSize: 10, fontStyle: 'bold', textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  addFooter(doc, pageNum);
};

const addLabelAnalysis = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'LABEL ANALYSIS');

  let yPos = 50;

  // Top labels table
  const labelData = [
    ['LABEL', 'USAGE COUNT', 'PERCENTAGE']
  ];

  const totalWithLabels = Object.values(metrics.labelMetrics.labelCount).reduce((a, b) => a + b, 0) || 1;
  metrics.labelMetrics.topLabels.forEach(([label, count]) => {
    labelData.push([label, count.toString(), `${((count / totalWithLabels) * 100).toFixed(1)}%`]);
  });

  doc.autoTable({
    startY: yPos,
    head: [labelData[0]],
    body: labelData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  addFooter(doc, pageNum);
};

const addDetailedTables = (doc, metrics, startPageNum) => {
  let pageNum = startPageNum;
  addPageHeader(doc, 'DETAILED ISSUE REPORT');

  const issueData = [
    ['KEY', 'SUMMARY', 'TYPE', 'STATUS', 'ASSIGNEE']
  ];

  metrics.detailedIssues.forEach(issue => {
    issueData.push([
      issue.key,
      issue.summary.substring(0, 40) + (issue.summary.length > 40 ? '...' : ''),
      issue.type,
      issue.status,
      issue.assignee
    ]);
  });

  doc.autoTable({
    startY: 50,
    head: [issueData[0]],
    body: issueData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      1: { cellWidth: 60 }
    },
    didDrawPage: (data) => {
      addFooter(doc, pageNum);
      if (data.pageNumber > 1) {
        pageNum++;
      }
    }
  });
};

const addInsightsPage = (doc, metrics, pageNum) => {
  addPageHeader(doc, 'KEY INSIGHTS & RECOMMENDATIONS');

  let yPos = 50;

  // Highlights
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.success);
  doc.text('HIGHLIGHTS', MARGIN, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  
  const highlights = [
    `Team completed ${metrics.storyPointsMetrics.completedPoints} story points`,
    `${metrics.storyPointsMetrics.completionRate}% completion rate achieved`,
    `Average resolution time: ${metrics.timeMetrics.avgResolutionTime} days`
  ];

  highlights.forEach(highlight => {
    doc.text(`• ${highlight}`, MARGIN + 5, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Areas of concern
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.warning);
  doc.text('AREAS OF CONCERN', MARGIN, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  
  const concerns = [
    `${metrics.qualityMetrics.totalBugs} bugs currently in backlog`,
    `Bug density at ${metrics.qualityMetrics.bugDensity}% of stories`,
    `${metrics.volumeMetrics.total - metrics.qualityMetrics.resolvedBugs} issues still open`
  ];

  concerns.forEach(concern => {
    doc.text(`• ${concern}`, MARGIN + 5, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Recommendations
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary);
  doc.text('RECOMMENDATIONS', MARGIN, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  
  const recommendations = [
    'Focus on reducing bug backlog in next sprint',
    'Maintain current velocity for consistent delivery',
    'Consider workload rebalancing across team members',
    'Improve test coverage to reduce bug density'
  ];

  recommendations.forEach(rec => {
    doc.text(`${recommendations.indexOf(rec) + 1}. ${rec}`, MARGIN + 5, yPos);
    yPos += 7;
  });

  addFooter(doc, pageNum);
};

const addPageHeader = (doc, title) => {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text(title, MARGIN, 30);
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(12, 158, 217);
  doc.line(MARGIN, 35, PAGE_WIDTH - MARGIN, 35);
};

const addFooter = (doc, pageNum) => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textSecondary);
  doc.text(
    `Generated on ${format(new Date(), 'MMMM dd, yyyy')} | Page ${pageNum}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 10,
    { align: 'center' }
  );
};

const getStatus = (value, threshold) => {
  if (value >= threshold) return 'Good';
  if (value >= threshold * 0.7) return 'Fair';
  return 'Needs Improvement';
};

export default generatePDF;