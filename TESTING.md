# Testing Guide - Jira Report Maker

This guide helps you verify that the self-hosted Jira Report Maker is working correctly.

## Prerequisites for Testing

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 3000
- [ ] MongoDB running and accessible
- [ ] Valid Jira credentials (domain, email, API token)
- [ ] Access to a Jira project with issues

## Test Plan

### 1. Backend API Tests

#### Test Backend Health
```bash
curl http://localhost:8000/api/
```
**Expected:** `{"message": "Hello World"}`

#### Test MongoDB Connection
Check backend logs for successful MongoDB connection message.

**Expected:** No connection errors in logs

### 2. Frontend Loading Tests

#### Test Frontend Loads
1. Open browser to `http://localhost:3000`
2. Configuration modal should appear if no config saved

**Expected:** 
- Page loads without errors
- No console errors
- Configuration modal visible

### 3. Jira Connection Tests

#### Test 3.1: Test Connection with Valid Credentials
1. Open configuration modal
2. Enter valid Jira credentials:
   - Domain: `yourcompany.atlassian.net`
   - Email: Your Atlassian email
   - API Token: Your API token
   - Project Key: Valid project key (e.g., `PROJ`)
3. Click "Test Connection"

**Expected:**
- ✅ Connection successful message
- User display name shown
- "Save & Continue" button enabled

#### Test 3.2: Test Connection with Invalid Domain
1. Enter invalid domain: `invalid-domain.atlassian.net`
2. Click "Test Connection"

**Expected:**
- ❌ Connection failed message
- Appropriate error shown

#### Test 3.3: Test Connection with Invalid API Token
1. Enter invalid API token
2. Click "Test Connection"

**Expected:**
- ❌ Authentication failed error

### 4. Story Points Field Discovery Tests

#### Test 4.1: Automatic Field Discovery
1. Successfully connect to Jira
2. Check browser console for field discovery logs

**Expected:**
- Console shows detected story points field ID
- Field name logged (e.g., "Story Points", "Story point estimate")

#### Test 4.2: Issues with Story Points
1. Generate report with filters
2. Check that issues with story points show values
3. Verify total story points calculated

**Expected:**
- Story points displayed for issues that have them
- Total story points match sum of individual issues
- Issues without story points show 0 or empty

### 5. Data Fetching Tests

#### Test 5.1: Fetch All Issues
1. Set only project key, no filters
2. Click "Generate Report"

**Expected:**
- All project issues fetched
- Total count displayed
- Metrics calculated correctly

#### Test 5.2: Date Range Filter
1. Set start date: 30 days ago
2. Set end date: today
3. Generate report

**Expected:**
- Only issues created in date range shown
- Count reflects filtered results

#### Test 5.3: Status Filter
1. Select specific statuses (e.g., "To Do", "In Progress")
2. Generate report

**Expected:**
- Only issues with selected statuses shown
- Status distribution chart shows only selected statuses

#### Test 5.4: Issue Type Filter
1. Select specific issue types (e.g., "Story", "Bug")
2. Generate report

**Expected:**
- Only selected issue types shown
- Issue type distribution chart accurate

#### Test 5.5: Assignee Filter
1. Select specific assignee from dropdown
2. Generate report

**Expected:**
- Only issues assigned to selected person shown
- Assignee metrics accurate

#### Test 5.6: Sprint Filter
1. Select specific sprint
2. Generate report

**Expected:**
- Only issues in selected sprint shown
- Sprint metrics shown

#### Test 5.7: Labels Filter
1. Select one or more labels
2. Generate report

**Expected:**
- Only issues with selected labels shown

#### Test 5.8: Combined Filters
1. Apply multiple filters simultaneously
2. Generate report

**Expected:**
- Issues match ALL filter criteria (AND logic)
- Metrics reflect filtered dataset

#### Test 5.9: Large Dataset
1. Query project with 500+ issues
2. Generate report

**Expected:**
- All issues fetched (pagination handled)
- No timeout errors
- Performance acceptable (< 30 seconds)

### 6. Metrics Display Tests

#### Test 6.1: Summary Metrics
Verify all summary cards display:
- [ ] Total Issues
- [ ] Total Story Points
- [ ] Average Velocity
- [ ] Completion Rate
- [ ] Average Cycle Time
- [ ] Bug Count

**Expected:** All metrics show realistic values, no NaN or undefined

#### Test 6.2: Charts
Verify all charts render:
- [ ] Status Distribution (pie chart)
- [ ] Issue Type Distribution (bar chart)
- [ ] Story Points by Issue Type (bar chart)
- [ ] Issues Over Time (line chart)
- [ ] Assignee Distribution (bar chart or pie)
- [ ] Sprint Burndown (if sprint data available)
- [ ] Velocity Chart (if multiple sprints)

**Expected:** 
- Charts render without errors
- Data matches metrics
- Charts are interactive (tooltips work)

### 7. Export Tests

#### Test 7.1: PDF Export with Default Options
1. Generate report with data
2. Click export button
3. Select PDF
4. Use default export options
5. Click export

**Expected:**
- PDF downloads successfully
- PDF contains report title and date range
- PDF includes selected charts
- Charts render correctly in PDF
- No missing or broken elements

#### Test 7.2: PDF Export with Custom Options
1. Click export
2. Customize:
   - Add company name/logo description
   - Select specific charts
   - Add custom notes
3. Export PDF

**Expected:**
- PDF includes customizations
- Custom notes appear
- Only selected charts included

#### Test 7.3: Word Export
1. Generate report
2. Export as Word document

**Expected:**
- Word document downloads
- Contains all report content
- Tables formatted correctly
- Charts included (if supported)

#### Test 7.4: Export with No Data
1. Apply filters that return 0 issues
2. Try to export

**Expected:**
- Warning message OR
- Export with "no data" message

### 8. User Experience Tests

#### Test 8.1: Loading States
1. Generate report
2. Observe loading indicators

**Expected:**
- Progress bar shows
- Progress text updates
- Cannot generate new report while loading

#### Test 8.2: Error Handling
1. Disconnect from internet
2. Try to generate report

**Expected:**
- Appropriate error message
- No app crash
- Can retry after reconnecting

#### Test 8.3: Configuration Persistence
1. Configure Jira connection
2. Reload page
3. Check if configuration persists

**Expected:**
- Configuration saved in localStorage
- Don't need to re-enter credentials

#### Test 8.4: Reconfiguration
1. Click settings icon
2. Modify Jira configuration
3. Save changes
4. Generate new report

**Expected:**
- New configuration used
- No issues accessing new project

### 9. Browser Compatibility Tests

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)

**Expected:** Works consistently across all browsers

### 10. Performance Tests

#### Test 10.1: Memory Leaks
1. Generate 10 reports in succession
2. Monitor browser memory usage

**Expected:**
- Memory doesn't continuously increase
- No memory leaks

#### Test 10.2: Response Times
Measure time for key operations:
- [ ] Test connection: < 3 seconds
- [ ] Field discovery: < 5 seconds
- [ ] Fetch 100 issues: < 10 seconds
- [ ] Fetch 500 issues: < 30 seconds
- [ ] Generate charts: < 2 seconds
- [ ] PDF export: < 10 seconds

**Expected:** Times within acceptable ranges

## Test Results Template

```
Date: _____________
Tester: ___________
Environment: Development / Staging / Production

Backend API Tests:        PASS / FAIL
Frontend Loading:         PASS / FAIL
Jira Connection:          PASS / FAIL
Story Points Discovery:   PASS / FAIL
Data Fetching:            PASS / FAIL
Metrics Display:          PASS / FAIL
Export Functions:         PASS / FAIL
User Experience:          PASS / FAIL
Browser Compatibility:    PASS / FAIL
Performance:              PASS / FAIL

Issues Found:
1. _______________________________
2. _______________________________
3. _______________________________

Notes:
_____________________________________
_____________________________________
_____________________________________
```

## Common Issues and Fixes

### Issue: "Cannot connect to backend"
**Fix:** 
- Verify backend is running: `http://localhost:8000/api/`
- Check `REACT_APP_BACKEND_URL` in frontend/.env

### Issue: "MongoDB connection error"
**Fix:**
- Check MongoDB is running: `mongod` or service status
- Verify `MONGO_URL` in backend/.env

### Issue: "Jira authentication failed"
**Fix:**
- Don't include `https://` in Jira domain
- Use API token, not password
- Verify API token is valid

### Issue: "Story points not showing"
**Fix:**
- Check Jira field configuration
- Look for field discovery logs in console
- Manually specify field ID if needed

### Issue: "Charts not rendering"
**Fix:**
- Check browser console for errors
- Verify data structure is correct
- Try clearing browser cache

### Issue: "PDF export fails"
**Fix:**
- Check for console errors
- Try exporting with fewer charts
- Verify html2canvas and jsPDF are working

## Automated Testing (Optional)

For more thorough testing, consider setting up:

### Backend API Tests (pytest)
```python
# tests/test_api.py
import pytest
from httpx import AsyncClient
from backend.server import app

@pytest.mark.asyncio
async def test_root():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

@pytest.mark.asyncio
async def test_jira_connection():
    # Test Jira connection endpoint
    pass
```

### Frontend Tests (Jest + React Testing Library)
```javascript
// Dashboard.test.js
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

test('renders dashboard', () => {
  render(<Dashboard />);
  expect(screen.getByText(/Generate Report/i)).toBeInTheDocument();
});
```

### End-to-End Tests (Playwright or Cypress)
```javascript
// e2e/jira-connection.spec.js
test('can connect to Jira', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('[name="domain"]', 'test.atlassian.net');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="apiToken"]', 'test-token');
  await page.click('button:has-text("Test Connection")');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Acceptance Criteria

Application is ready for production when:
- ✅ All critical tests pass
- ✅ No high-severity bugs found
- ✅ Performance meets requirements
- ✅ Works in all target browsers
- ✅ Error handling is graceful
- ✅ Documentation is complete
- ✅ Security measures in place

---

**Remember:** Test thoroughly before deploying to production!
