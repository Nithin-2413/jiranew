# Story Points Fix - Dynamic Field Detection

## Problem
Story points were showing as zero because the custom field ID varies between JIRA instances.

## Solution Implemented

### What Changed:

1. **Frontend (jiraService.js)**:
   - Now fetches all JIRA fields first
   - Automatically detects the story points field by searching for:
     - Fields containing "story point" in the name
     - Common field IDs: `customfield_10016`, `customfield_10024`, `customfield_10004`
   - Sends the detected field ID to backend
   - Falls back to `customfield_10016` if detection fails

2. **Backend (server.py)**:
   - Accepts `storyPointsFieldId` parameter in requests
   - Uses the dynamic field ID when fetching issues
   - Normalizes the field to `customfield_10016` for consistent processing
   - Logs which field ID was used

### How It Works:

1. User clicks "Generate Report"
2. Frontend calls `/rest/api/3/field` to get all available fields
3. Searches for story points field by name or common IDs
4. Passes detected field ID to backend
5. Backend fetches issues using the correct field
6. Data is normalized for consistent processing

### Testing:

The fix should now work with any JIRA instance, regardless of which custom field ID is used for story points.

**To verify:**
1. Generate a report
2. Check browser console for log: "Found story points field: [field_id] [field_name]"
3. Story points should now appear in:
   - Metrics cards (Story Points count)
   - Team Performance chart (Story Points by Team Member)
   - Story Points by Status chart
   - Detailed issues table (Points column)

### Common Story Points Field IDs:

- `customfield_10016` - Most common (Jira Software Cloud)
- `customfield_10024` - Common alternative
- `customfield_10004` - Older Jira instances
- `customfield_10008` - Some Jira instances
- Custom field with "Story Points" or "Story point estimate" in the name

### Fallback Behavior:

If the automatic detection fails:
- Uses `customfield_10016` as default
- You can manually check your JIRA field ID at: `https://your-domain.atlassian.net/rest/api/3/field`
- Look for the field with name containing "Story Point"

### Manual Override (if needed):

If automatic detection doesn't work, you can hardcode your field ID in:

**Frontend**: `/app/frontend/src/services/jiraService.js` line ~18:
```javascript
let storyPointsFieldId = 'YOUR_CUSTOM_FIELD_ID'; // Change this
```

**Backend**: `/app/backend/server.py` line ~89:
```python
story_points_field = request.storyPointsFieldId or 'YOUR_CUSTOM_FIELD_ID'
```

## Files Modified:

- `/app/frontend/src/services/jiraService.js` - Added field detection
- `/app/backend/server.py` - Added dynamic field support

## Next Steps:

Test with your JIRA instance and verify story points appear correctly in all visualizations.
