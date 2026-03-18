import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  // Page 4: Team Performance
  doc.addPage();
  pageNum++;
  await addTeamPerformance(doc, metrics, chartImages, pageNum);

  // Page 5: Story Points Analysis
  doc.addPage();
  pageNum++;
  await addStoryPointsAnalysis(doc, metrics, chartImages, pageNum);

  // Page 6: Bug Analysis
  doc.addPage();
  pageNum++;
  await addBugAnalysis(doc, metrics, chartImages, pageNum);

  // Page 7: Label Analysis
  doc.addPage();
  pageNum++;
  await addLabelAnalysis(doc, metrics, chartImages, pageNum);

  // Pages 8+: Detailed Tables
  doc.addPage();
  pageNum++;
  addDetailedTables(doc, metrics, pageNum);

  return doc;
};

const addCoverPage = async (doc, config) => {
  try {
    const logoUrl = 'https://customer-assets.emergentagent.com/job_team-metrics-62/artifacts/9yxyauul_Lumen_Technologies_logo.svg-2048x294.png';
    doc.addImage(logoUrl, 'PNG', MARGIN, MARGIN, 60, 8.6);
  } catch (error) {
    console.error('Failed to add logo:', error);
  }

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text('JIRA TEAM PERFORMANCE', PAGE_WIDTH / 2, 80, { align: 'center' });
  doc.text('REPORT', PAGE_WIDTH / 2, 95, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textSecondary);
  doc.text(`Project: ${config.projectKey}`, PAGE_WIDTH / 2, 120, { align: 'center' });
  doc.text(`Period: ${config.dateRange}`, PAGE_WIDTH / 2, 130, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, PAGE_WIDTH / 2, 140, { align: 'center' });

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

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  
  const summaryText = `This report provides a comprehensive analysis of team performance for the selected period. The team has shown strong productivity with ${metrics.volumeMetrics.total} total issues processed, maintaining a ${metrics.storyPointsMetrics.completionRate}% completion rate.`;
  
  const lines = doc.splitTextToSize(summaryText, PAGE_WIDTH - 2 * MARGIN);
  doc.text(lines, MARGIN, yPos);
  yPos += lines.length * 6 + 10;

  const metricsData = [
    ['METRIC', 'VALUE'],
    ['Total Issues', metrics.volumeMetrics.total.toString()],
    ['Completion Rate', `${metrics.storyPointsMetrics.completionRate}%`],
    ['Story Points', metrics.storyPointsMetrics.totalPoints.toString()],
    ['Team Members', metrics.teamMetrics.totalMembers.toString()]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [metricsData[0]],
    body: metricsData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  addFooter(doc, pageNum);
};

const addIssueDistribution = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'ISSUE DISTRIBUTION');

  let yPos = 50;

  if (chartImages.issueTypeChart) {
    doc.addImage(chartImages.issueTypeChart, 'PNG', MARGIN, yPos, 80, 60);
  }
  if (chartImages.statusChart) {
    doc.addImage(chartImages.statusChart, 'PNG', MARGIN + 90, yPos, 80, 60);
  }

  yPos += 70;

  const issueTypeData = [
    ['ISSUE TYPE', 'COUNT', 'PERCENTAGE']
  ];
  const total = metrics.volumeMetrics.total;
  Object.entries(metrics.volumeMetrics.byType).forEach(([type, count]) => {
    issueTypeData.push([type, count.toString(), `${((count / total) * 100).toFixed(1)}%`]);
  });

  autoTable(doc, {
    startY: yPos,
    head: [issueTypeData[0]],
    body: issueTypeData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  addFooter(doc, pageNum);
};

const addTeamPerformance = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'TEAM PERFORMANCE');

  let yPos = 50;

  const teamData = [
    ['TEAM MEMBER', 'ISSUES', 'STORY POINTS']
  ];

  Object.entries(metrics.teamMetrics.byAssignee)
    .sort((a, b) => b[1] - a[1])
    .forEach(([member, count]) => {
      const points = metrics.teamMetrics.pointsByAssignee[member] || 0;
      teamData.push([member, count.toString(), points.toString()]);
    });

  autoTable(doc, {
    startY: yPos,
    head: [teamData[0]],
    body: teamData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  addFooter(doc, pageNum);
};

const addStoryPointsAnalysis = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'STORY POINTS ANALYSIS');

  let yPos = 50;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Story Points: ${metrics.storyPointsMetrics.totalPoints}`, MARGIN, yPos);
  doc.text(`Completed: ${metrics.storyPointsMetrics.completedPoints}`, MARGIN, yPos + 8);
  doc.text(`Completion Rate: ${metrics.storyPointsMetrics.completionRate}%`, MARGIN, yPos + 16);
  yPos += 30;

  const pointsData = [
    ['STATUS', 'STORY POINTS', 'PERCENTAGE']
  ];
  const totalPoints = metrics.storyPointsMetrics.totalPoints || 1;
  Object.entries(metrics.storyPointsMetrics.pointsByStatus).forEach(([status, points]) => {
    pointsData.push([status, points.toString(), `${((points / totalPoints) * 100).toFixed(1)}%`]);
  });

  autoTable(doc, {
    startY: yPos,
    head: [pointsData[0]],
    body: pointsData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [12, 158, 217], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  addFooter(doc, pageNum);
};

const addBugAnalysis = async (doc, metrics, chartImages, pageNum) => {
  addPageHeader(doc, 'BUG ANALYSIS');

  let yPos = 50;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Bugs: ${metrics.qualityMetrics.totalBugs}`, MARGIN, yPos);
  doc.text(`Resolved: ${metrics.qualityMetrics.resolvedBugs}`, MARGIN, yPos + 8);
  yPos += 20;

  const bugData = [
    ['PRIORITY', 'COUNT', 'PERCENTAGE']
  ];
  const totalBugs = metrics.qualityMetrics.totalBugs || 1;
  Object.entries(metrics.qualityMetrics.bugsByPriority).forEach(([priority, count]) => {
    bugData.push([priority, count.toString(), `${((count / totalBugs) * 100).toFixed(1)}%`]);
  });

  autoTable(doc, {
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

  const labelData = [
    ['LABEL', 'USAGE COUNT', 'PERCENTAGE']
  ];

  const totalWithLabels = Object.values(metrics.labelMetrics.labelCount).reduce((a, b) => a + b, 0) || 1;
  metrics.labelMetrics.topLabels.forEach(([label, count]) => {
    labelData.push([label, count.toString(), `${((count / totalWithLabels) * 100).toFixed(1)}%`]);
  });

  autoTable(doc, {
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

  autoTable(doc, {
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

export default generatePDF;