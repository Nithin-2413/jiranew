import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType,
  BorderStyle,
  ShadingType,
  ImageRun,
  PageBreak
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

// Helper to convert base64 chart image to buffer
const base64ToArrayBuffer = (base64) => {
  // Remove the data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Create a styled heading
const createHeading = (text, level = HeadingLevel.HEADING_1) => {
  return new Paragraph({
    text: text,
    heading: level,
    spacing: { before: 400, after: 200 },
  });
};

// Create a styled paragraph
const createParagraph = (text, options = {}) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        size: options.size || 22,
        bold: options.bold || false,
        color: options.color || '333333',
      }),
    ],
    spacing: { before: options.spaceBefore || 100, after: options.spaceAfter || 100 },
    alignment: options.alignment || AlignmentType.LEFT,
  });
};

// Create a table with data
const createTable = (headers, rows, options = {}) => {
  const headerCells = headers.map(header => 
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: header,
              bold: true,
              color: 'FFFFFF',
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
      shading: {
        fill: '0EA5E9',
        type: ShadingType.CLEAR,
      },
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
    })
  );

  const dataRows = rows.map((row, rowIndex) => 
    new TableRow({
      children: row.map((cell, cellIndex) => 
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: String(cell),
                  size: 18,
                  bold: cellIndex === 0,
                }),
              ],
              alignment: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
            }),
          ],
          shading: {
            fill: rowIndex % 2 === 0 ? 'F8FAFC' : 'FFFFFF',
            type: ShadingType.CLEAR,
          },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
        })
      ),
    })
  );

  return new Table({
    rows: [
      new TableRow({ children: headerCells }),
      ...dataRows,
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

// Create image paragraph from base64
const createChartImage = (base64Image, width = 500, height = 300) => {
  if (!base64Image) return null;
  
  try {
    const imageData = base64ToArrayBuffer(base64Image);
    return new Paragraph({
      children: [
        new ImageRun({
          data: imageData,
          transformation: { width, height },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    });
  } catch (error) {
    console.warn('Could not add chart image to Word document:', error);
    return null;
  }
};

export const generateWordDocument = async (metrics, config, chartImages, exportOptions = {}) => {
  const sections = [];
  
  // Cover Section
  sections.push(
    createHeading('JIRA ANALYTICS REPORT', HeadingLevel.TITLE),
    createParagraph('', { spaceAfter: 200 }),
    createParagraph(`Project: ${config.projectKey}`, { size: 28, bold: true }),
    createParagraph(`Period: ${config.dateRange}`, { size: 24 }),
    createParagraph(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, { size: 24 }),
    createParagraph('', { spaceAfter: 400 }),
    createHeading('Key Highlights', HeadingLevel.HEADING_2),
    createParagraph(`• Total Issues: ${config.totalIssues}`),
    createParagraph(`• Completed: ${config.completedIssues} (${config.completionRate}%)`),
    createParagraph(`• Total Story Points: ${config.totalPoints}`),
    createParagraph(`• Team Members: ${config.teamMembers}`),
  );

  // Executive Summary
  if (exportOptions.executiveSummary !== false) {
    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      createHeading('EXECUTIVE SUMMARY', HeadingLevel.HEADING_1),
      createParagraph(
        `This report provides a comprehensive analysis of team performance for project ${config.projectKey} during ${config.dateRange}. ` +
        `The analysis covers ${metrics.volumeMetrics.total} issues with a ${metrics.storyPointsMetrics.completionRate}% completion rate based on story points.`
      ),
      createParagraph('', { spaceAfter: 200 }),
      createTable(
        ['Metric', 'Value', 'Description'],
        [
          ['Total Issues', metrics.volumeMetrics.total, 'All issues in selected period'],
          ['Completion Rate', `${metrics.storyPointsMetrics.completionRate}%`, 'Based on story points'],
          ['Total Story Points', metrics.storyPointsMetrics.totalPoints, `${metrics.storyPointsMetrics.issuesWithPoints || 0} issues with points`],
          ['Team Members', metrics.teamMetrics.totalMembers, 'Active contributors'],
          ['Avg Resolution', `${metrics.timeMetrics.avgResolutionTime} days`, `${metrics.timeMetrics.resolvedIssues} resolved`],
          ['Bug Count', metrics.qualityMetrics.totalBugs, `${metrics.qualityMetrics.resolvedBugs} resolved`],
        ]
      ),
    );
  }

  // Issue Distribution
  if (exportOptions.issueDistribution !== false) {
    const issueTypeRows = Object.entries(metrics.volumeMetrics.byType).map(([type, count]) => [
      type,
      count,
      `${((count / metrics.volumeMetrics.total) * 100).toFixed(1)}%`
    ]);

    const statusRows = Object.entries(metrics.volumeMetrics.byStatus).map(([status, count]) => [
      status,
      count,
      `${((count / metrics.volumeMetrics.total) * 100).toFixed(1)}%`
    ]);

    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      createHeading('ISSUE DISTRIBUTION', HeadingLevel.HEADING_1),
    );

    // Add chart image if available
    if (chartImages.issueTypeChart) {
      const chartParagraph = createChartImage(chartImages.issueTypeChart, 450, 280);
      if (chartParagraph) sections.push(chartParagraph);
    }

    sections.push(
      createHeading('By Issue Type', HeadingLevel.HEADING_2),
      createTable(['Issue Type', 'Count', 'Percentage'], issueTypeRows),
      createParagraph('', { spaceAfter: 300 }),
      createHeading('By Status', HeadingLevel.HEADING_2),
      createTable(['Status', 'Count', 'Percentage'], statusRows),
    );
  }

  // Team Performance
  if (exportOptions.teamPerformance !== false) {
    const teamRows = Object.entries(metrics.teamMetrics.byAssignee)
      .sort((a, b) => (metrics.teamMetrics.pointsByAssignee[b[0]] || 0) - (metrics.teamMetrics.pointsByAssignee[a[0]] || 0))
      .map(([member, count]) => {
        const points = metrics.teamMetrics.pointsByAssignee[member] || 0;
        const avg = count > 0 ? (points / count).toFixed(1) : '0';
        return [member, count, points, avg];
      });

    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      createHeading('TEAM PERFORMANCE', HeadingLevel.HEADING_1),
      createTable(['Team Member', 'Issues', 'Story Points', 'Avg Points/Issue'], teamRows),
    );
  }

  // Story Points Analysis
  if (exportOptions.storyPointsAnalysis !== false) {
    const pointsRows = Object.entries(metrics.storyPointsMetrics.pointsByStatus).map(([status, points]) => [
      status,
      points,
      `${((points / (metrics.storyPointsMetrics.totalPoints || 1)) * 100).toFixed(1)}%`
    ]);

    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      createHeading('STORY POINTS ANALYSIS', HeadingLevel.HEADING_1),
      createParagraph(`Total Story Points: ${metrics.storyPointsMetrics.totalPoints}`, { bold: true }),
      createParagraph(`Completed Points: ${metrics.storyPointsMetrics.completedPoints}`),
      createParagraph(`Completion Rate: ${metrics.storyPointsMetrics.completionRate}%`),
      createParagraph(`Average Points per Issue: ${metrics.storyPointsMetrics.avgPoints}`),
      createParagraph('', { spaceAfter: 200 }),
    );

    if (pointsRows.length > 0) {
      sections.push(
        createHeading('Points by Status', HeadingLevel.HEADING_2),
        createTable(['Status', 'Story Points', 'Percentage'], pointsRows),
      );
    }
  }

  // Bug Analysis
  if (exportOptions.bugAnalysis !== false) {
    const bugRows = Object.entries(metrics.qualityMetrics.bugsByPriority).map(([priority, count]) => [
      priority,
      count,
      `${((count / (metrics.qualityMetrics.totalBugs || 1)) * 100).toFixed(1)}%`
    ]);

    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      createHeading('BUG ANALYSIS', HeadingLevel.HEADING_1),
      createParagraph(`Total Bugs: ${metrics.qualityMetrics.totalBugs}`, { bold: true }),
      createParagraph(`Resolved Bugs: ${metrics.qualityMetrics.resolvedBugs}`),
      createParagraph(`Bug Density: ${metrics.qualityMetrics.bugDensity}%`),
      createParagraph('', { spaceAfter: 200 }),
    );

    if (bugRows.length > 0) {
      sections.push(
        createHeading('Bugs by Priority', HeadingLevel.HEADING_2),
        createTable(['Priority', 'Count', 'Percentage'], bugRows),
      );
    }
  }

  // Label Analysis
  if (exportOptions.labelAnalysis !== false && metrics.labelMetrics.topLabels.length > 0) {
    const totalWithLabels = Object.values(metrics.labelMetrics.labelCount).reduce((a, b) => a + b, 0) || 1;
    const labelRows = metrics.labelMetrics.topLabels.slice(0, 15).map(([label, count]) => [
      label,
      count,
      `${((count / totalWithLabels) * 100).toFixed(1)}%`
    ]);

    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      createHeading('LABEL ANALYSIS', HeadingLevel.HEADING_1),
      createTable(['Label', 'Usage Count', 'Percentage'], labelRows),
    );
  }

  // Test Execution
  if (exportOptions.testExecution !== false && metrics.advancedAnalytics.testMetrics.total > 0) {
    const testMetrics = metrics.advancedAnalytics.testMetrics;
    const testRows = [
      ['Passed', testMetrics.passed, `${((testMetrics.passed / (testMetrics.total || 1)) * 100).toFixed(1)}%`],
      ['Failed', testMetrics.failed, `${((testMetrics.failed / (testMetrics.total || 1)) * 100).toFixed(1)}%`],
      ['Blocked', testMetrics.blocked, `${((testMetrics.blocked / (testMetrics.total || 1)) * 100).toFixed(1)}%`],
    ];

    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      createHeading('TEST EXECUTION', HeadingLevel.HEADING_1),
      createParagraph(`Total Tests: ${testMetrics.total}`, { bold: true }),
      createParagraph('', { spaceAfter: 200 }),
      createTable(['Status', 'Count', 'Percentage'], testRows),
    );
  }

  // Detailed Issues
  if (exportOptions.detailedIssues !== false) {
    const issueRows = metrics.detailedIssues.slice(0, 50).map(issue => [
      issue.key,
      (issue.summary || '').substring(0, 40) + ((issue.summary || '').length > 40 ? '...' : ''),
      issue.type || '-',
      issue.status || '-',
      (issue.assignee || 'Unassigned').substring(0, 15),
      issue.storyPoints > 0 ? issue.storyPoints : '-'
    ]);

    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      createHeading('DETAILED ISSUES', HeadingLevel.HEADING_1),
      createParagraph(`Showing ${issueRows.length} of ${metrics.detailedIssues.length} issues`),
      createParagraph('', { spaceAfter: 200 }),
      createTable(['Key', 'Summary', 'Type', 'Status', 'Assignee', 'Points'], issueRows),
    );
  }

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections,
    }],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  const fileName = `JIRA_Report_${config.projectKey}_${format(new Date(), 'yyyy-MM-dd')}.docx`;
  saveAs(blob, fileName);
};

export default generateWordDocument;
