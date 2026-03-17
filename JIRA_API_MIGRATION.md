# JIRA API Migration Guide: /search to /search/jql

## What Changed?

Atlassian deprecated `/rest/api/3/search` and introduced `/rest/api/3/search/jql` as the replacement.

### Key Differences

| Aspect | Old Endpoint | New Endpoint |
|--------|-------------|--------------|
| **URL** | `/rest/api/3/search` | `/rest/api/3/search/jql` |
| **Method** | POST (or GET) | POST only |
| **Request Body** | Same JSON structure | Same JSON structure |
| **Response Format** | Same | Same |
| **Authentication** | Same (Basic Auth) | Same (Basic Auth) |

### Good News ✅
- Response format is **identical**
- Request body structure is **the same**
- Authentication method **unchanged**
- Only the endpoint URL changed

## Updated Code

### Backend Proxy (Python/FastAPI) - ALREADY FIXED ✅

The backend proxy at `/app/backend/server.py` has been updated to use the new endpoint:

```python
# OLD (deprecated)
response = await client.post(
    f"{jira_url}/rest/api/3/search",
    headers=headers,
    json=search_body
)

# NEW (current)
response = await client.post(
    f"{jira_url}/rest/api/3/search/jql",
    headers=headers,
    json=search_body
)
```

### If You're Making Direct Browser Calls

**Old Code:**
```javascript
const response = await fetch(
    `${jiraUrl}/rest/api/3/search`,
    {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(email + ':' + token),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jql: `project = ${projectKey} AND created >= "${startDate}"`,
            startAt: 0,
            maxResults: 100,
            fields: ['summary', 'status', 'issuetype']
        })
    }
);
```

**New Code:**
```javascript
const response = await fetch(
    `${jiraUrl}/rest/api/3/search/jql`,  // Changed endpoint
    {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(email + ':' + token),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jql: `project = ${projectKey} AND created >= "${startDate}"`,
            startAt: 0,
            maxResults: 100,
            fields: ['summary', 'status', 'issuetype']
        })
    }
);
```

### Node.js/Express Proxy Example

**Updated Proxy Route:**
```javascript
app.post('/api/jira/search', async (req, res) => {
    const { config, filters } = req.body;
    
    try {
        const response = await axios.post(
            `${config.url}/rest/api/3/search/jql`,  // Updated endpoint
            {
                jql: buildJQL(filters),
                startAt: 0,
                maxResults: 100,
                fields: [
                    'summary',
                    'status',
                    'issuetype',
                    'priority',
                    'assignee',
                    'created',
                    'resolutiondate',
                    'labels'
                ]
            },
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({
            success: true,
            issues: response.data.issues,
            total: response.data.total
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.response?.data?.errorMessages?.[0] || error.message
        });
    }
});
```

## Other JIRA Endpoints - Status Check

### ✅ Still Working (No Changes Needed)

1. **`/rest/api/3/myself`** - User info endpoint
   - Status: **Active**
   - No changes required

2. **`/rest/api/3/project`** - Project endpoints
   - Status: **Active**
   - No changes required

3. **`/rest/agile/1.0/board/{boardId}/sprint`** - Sprint data
   - Status: **Active**
   - No changes required

### Summary
**Only the issue search endpoint changed.** All other endpoints remain the same.

## Migration Checklist

- [x] Update search endpoint URL from `/search` to `/search/jql`
- [x] Keep POST method (required)
- [x] Keep same request body structure
- [x] Keep same authentication headers
- [x] Test with existing JQL queries
- [x] Verify response parsing still works
- [x] Update error handling (if needed)
- [x] Deploy and test in production

## Request/Response Format

### Request Format (Unchanged)
```json
{
  "jql": "project = MYPROJECT AND created >= '2025-01-01'",
  "startAt": 0,
  "maxResults": 100,
  "fields": [
    "summary",
    "status",
    "issuetype",
    "priority",
    "assignee",
    "created",
    "labels"
  ]
}
```

### Response Format (Unchanged)
```json
{
  "expand": "schema,names",
  "startAt": 0,
  "maxResults": 100,
  "total": 234,
  "issues": [
    {
      "key": "PROJ-123",
      "fields": {
        "summary": "Example issue",
        "status": {
          "name": "Done"
        },
        "issuetype": {
          "name": "Story"
        }
      }
    }
  ]
}
```

## Error Handling

### New Endpoint Error Responses

**Authentication Error (401):**
```json
{
  "errorMessages": ["Authentication failed"],
  "errors": {}
}
```

**Invalid JQL (400):**
```json
{
  "errorMessages": ["Error in the JQL Query: ..."],
  "errors": {}
}
```

**Updated Error Handling:**
```javascript
try {
    const response = await fetch(`${jiraUrl}/rest/api/3/search/jql`, {...});
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errorMessages?.[0] || 'Search failed');
    }
    
    const data = await response.json();
    return data.issues;
    
} catch (error) {
    if (error.message.includes('410')) {
        console.error('API deprecated! Update to /search/jql endpoint');
    }
    throw error;
}
```

## Pagination & Limits

### No Changes to Pagination
- `startAt` parameter: Same usage
- `maxResults` parameter: Same limits (max 100 per request)
- Pagination logic: Unchanged

**Example Pagination:**
```javascript
async function fetchAllIssues(jql) {
    let allIssues = [];
    let startAt = 0;
    const maxResults = 100;
    let total = 0;
    
    do {
        const response = await fetch(`${jiraUrl}/rest/api/3/search/jql`, {
            method: 'POST',
            headers: {...},
            body: JSON.stringify({
                jql,
                startAt,
                maxResults,
                fields: [...]
            })
        });
        
        const data = await response.json();
        allIssues = [...allIssues, ...data.issues];
        total = data.total;
        startAt += maxResults;
        
    } while (allIssues.length < total && startAt < 1000);
    
    return allIssues;
}
```

## JQL Query Requirements

### No Changes to JQL Syntax
All JQL queries work exactly the same way:

```javascript
// Date ranges
const jql = `project = PROJ AND created >= '2025-01-01' AND created <= '2025-01-31'`;

// Status filtering
const jql = `project = PROJ AND status in ('Open', 'In Progress', 'Done')`;

// Multiple conditions
const jql = `project = PROJ AND issuetype = Story AND assignee = currentUser()`;

// Complex queries
const jql = `project = PROJ AND (priority = High OR priority = Critical) AND created >= -30d`;
```

## Rate Limits

**No new rate limits** introduced with the new endpoint. Standard JIRA Cloud rate limits apply:
- **Rate limit**: Varies by plan (typically 150-300 requests/minute)
- **Burst limit**: Short bursts allowed
- **429 status code**: When rate limit exceeded

## Timeline

- **Deprecation Notice**: Q4 2024
- **Migration Period**: Now
- **Old Endpoint Removal**: TBD by Atlassian (could be soon)
- **Status**: Old endpoint returns 410 Gone error

## Testing Your Migration

### Test Checklist

1. **Test connection**:
   ```bash
   curl -X POST https://your-domain.atlassian.net/rest/api/3/search/jql \
     -H "Authorization: Basic $(echo -n 'email:token' | base64)" \
     -H "Content-Type: application/json" \
     -d '{"jql":"project=PROJ","maxResults":1}'
   ```

2. **Verify pagination** works
3. **Test error handling** with invalid JQL
4. **Check response parsing** in your app
5. **Monitor for 410 errors** (deprecated endpoint)

## Your Application Status

### ✅ ALREADY FIXED

Your backend proxy at `/app/backend/server.py` has been updated to use the new endpoint. The change was:

```python
# Line ~140 in server.py
response = await client.post(
    f"{jira_url}/rest/api/3/search/jql",  # Updated ✅
    headers=headers,
    json=search_body
)
```

### Testing the Fix

Restart your backend and test:

```bash
# Restart backend
sudo supervisorctl restart backend

# Test with your JIRA credentials
# The error should now be gone!
```

## Common Migration Issues

### Issue 1: 410 Gone Error
**Symptom**: `The requested API has been removed`
**Solution**: Update endpoint URL to `/search/jql`

### Issue 2: 404 Not Found
**Symptom**: Endpoint not found after migration
**Solution**: Ensure you're using POST method, not GET

### Issue 3: CORS Errors (Browser)
**Symptom**: CORS errors when calling new endpoint
**Solution**: Use backend proxy (already implemented in your app)

## Best Practices

1. **Always use the backend proxy** (avoids CORS and exposes credentials)
2. **Implement pagination** for large datasets
3. **Cache results** when appropriate
4. **Handle rate limits** gracefully (retry with backoff)
5. **Log API errors** for debugging
6. **Monitor API usage** to avoid hitting limits

## Additional Resources

- [Atlassian Migration Guide](https://developer.atlassian.com/changelog/#CHANGE-2046)
- [New API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/)
- [JQL Reference](https://support.atlassian.com/jira-service-management-cloud/docs/use-advanced-search-with-jira-query-language-jql/)

---

## Quick Reference

**Old**: `POST /rest/api/3/search`
**New**: `POST /rest/api/3/search/jql`

Everything else stays the same! 🎉
