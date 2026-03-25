# JIRA Advanced Report Generator

A professional, browser-based JIRA reporting tool that generates beautiful PDF reports with comprehensive team performance analytics.

## Features

### Core Functionality
- **One-Click PDF Generation**: Export professional 10+ page reports instantly
- **Comprehensive Metrics**: Volume, team, sprint, quality, story points, labels, and time metrics
- **Beautiful Visualizations**: Charts and graphs using Chart.js
- **Professional Design**: Clean UI with Lumen Technologies branding

### Report Sections
1. **Cover Page**: Company logo, project info, key highlights
2. **Executive Summary**: High-level metrics and performance overview
3. **Issue Distribution**: Charts showing issues by type, status, and priority
4. **Sprint Performance**: Velocity trends and sprint completion rates
5. **Story Points Analysis**: Team performance and points distribution
6. **Team Workload**: Issues and points by team member
7. **Bug Analysis**: Bug metrics by priority and status
8. **Label Analysis**: Top labels and usage statistics
9. **Detailed Tables**: Complete issue listings with all details
10. **Insights & Recommendations**: AI-generated insights and action items

### Filters & Date Ranges
- Custom date range selection
- Quick presets: This Week, This Month, This Quarter, Last 30/60/90 Days
- Status filtering
- Issue type filtering
- Label filtering
- Sprint filtering

## Technology Stack

### Frontend
- **React 19**: Modern React with hooks
- **Chart.js**: Professional data visualizations
- **jsPDF**: Client-side PDF generation
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: High-quality component library
- **Lucide React**: Modern icon set
- **Date-fns**: Date manipulation utilities

### Design System
- **Typography**: Outfit (headings), Inter (body)
- **Primary Color**: #0C9ED9 (Lumen Blue)
- **Layout**: Professional dashboard with sidebar navigation
- **No Emojis**: Clean, professional headings throughout

## Setup Instructions

### Prerequisites
```bash
# Node.js 16+ and Yarn installed
node --version
yarn --version
```

### Installation
```bash
# Install dependencies
cd /app/frontend
yarn install

# Start development server
yarn start
```

### JIRA Configuration
1. Open the application
2. Configure JIRA connection in the modal:
   - JIRA URL: Your Atlassian instance (e.g., https://your-domain.atlassian.net)
   - Email: Your JIRA account email
   - API Token: Generate at [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Project Key: Your JIRA project key (e.g., PROJ, TEAM, DEV)
3. Test connection and save

### Generating Reports
1. Select date range or use quick presets
2. Apply optional filters (status, issue type, labels)
3. Click "Generate Report" to fetch and analyze data
4. Preview metrics and charts
5. Click "Export to PDF" to download the report

## Important Notes

### CORS Limitations
This is a **client-side only** application. Direct browser access to JIRA API is restricted by CORS policies. You may encounter CORS errors when testing with real JIRA instances.

**Solutions:**
- Use a CORS proxy service
- Implement a backend proxy endpoint
- Use JIRA's OAuth authentication flow
- For demonstration: Use with corporate VPNs or networks that allow JIRA API access

### Hardcoded Credentials
As requested, you can hardcode your JIRA credentials in the code:

```javascript
// In src/App.js or Dashboard component
const DEFAULT_CONFIG = {
  url: 'https://your-domain.atlassian.net',
  email: 'your-email@example.com',
  apiToken: 'your-api-token-here',
  projectKey: 'YOUR-PROJECT-KEY'
};
```

## Project Structure

```
/app/frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.js              # Main dashboard component
│   │   ├── ConfigurationModal.js     # JIRA setup modal
│   │   ├── MetricsCards.js           # Summary metric cards
│   │   ├── ChartsPreview.js          # Chart visualizations
│   │   └── ui/                       # Shadcn UI components
│   ├── services/
│   │   ├── jiraService.js            # JIRA API integration
│   │   ├── dataProcessor.js          # Metrics calculation
│   │   └── pdfGenerator.js           # PDF creation logic
│   ├── lib/
│   │   └── utils.js                  # Utility functions
│   ├── App.js                        # Root component
│   ├── App.css                       # Application styles
│   └── index.css                     # Global styles + Tailwind
└── package.json
```

## Customization

### Brand Colors
Edit `/app/frontend/src/index.css` to change primary colors:
```css
:root {
  --primary: 195 92% 46%;  /* Lumen Blue #0C9ED9 */
}
```

### Company Logo
Replace logo URL in:
- `/app/frontend/src/components/Dashboard.js`
- `/app/frontend/src/services/pdfGenerator.js`

### Report Sections
Modify `/app/frontend/src/services/pdfGenerator.js` to:
- Add/remove report pages
- Customize metrics
- Change chart types
- Adjust layout and styling

## Performance

- Report generation: < 10 seconds
- PDF size: 2-5 MB (depending on data volume)
- Optimal data range: 30-90 days
- Maximum issues: 1000 (safety limit)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ⚠️ Limited (PDF generation may be slow)

## Troubleshooting

### CORS Errors
```
Error: CORS policy blocked the request
```
**Solution**: Use a CORS proxy or backend service. This is expected behavior for client-side JIRA API calls.

### Authentication Failed
```
Error: 401 Unauthorized
```
**Solution**: Verify your API token is correct and has not expired. Regenerate if needed.

### Charts Not Displaying
**Solution**: Ensure Chart.js and react-chartjs-2 are properly installed:
```bash
yarn add chart.js react-chartjs-2
```

### PDF Not Generating
**Solution**: Check browser console for errors. Ensure jsPDF and jspdf-autotable are installed:
```bash
yarn add jspdf jspdf-autotable
```

## Future Enhancements

- Backend API integration for CORS-free access
- Real-time data refresh
- Custom report templates
- Email report scheduling
- Multi-project comparison
- Advanced filtering (components, versions, etc.)
- Export to Excel/CSV
- Dashboard customization
- User authentication

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review JIRA API documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
3. Check browser console for detailed error messages

---

 | Powered by Lumen Technologies
