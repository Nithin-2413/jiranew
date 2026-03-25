from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'jira_reports')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# JIRA Proxy Models
class JiraConfig(BaseModel):
    url: str
    email: str
    apiToken: str
    projectKey: str

class JiraSearchRequest(BaseModel):
    config: JiraConfig
    filters: Optional[Dict[str, Any]] = {}
    storyPointsFieldId: Optional[str] = None
    excludeSubtasks: Optional[bool] = True  # Exclude subtasks by default to match Jira behavior
    dateField: Optional[str] = "created"  # Options: created, updated, resolved

class JiraFieldsRequest(BaseModel):
    config: JiraConfig

class JiraUsersRequest(BaseModel):
    config: JiraConfig


def get_jira_auth_headers(config: JiraConfig) -> dict:
    """Generate authorization headers for Jira API"""
    auth_string = f"{config.email}:{config.apiToken}"
    auth_bytes = auth_string.encode('utf-8')
    auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
    
    return {
        'Authorization': f'Basic {auth_b64}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/jira/test-connection")
async def test_jira_connection(config: JiraConfig):
    """Test JIRA connection by fetching current user info"""
    try:
        headers = get_jira_auth_headers(config)
        jira_url = config.url.rstrip('/')
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{jira_url}/rest/api/3/myself",
                headers=headers
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "success": True,
                    "data": {
                        "displayName": user_data.get("displayName", "User"),
                        "emailAddress": user_data.get("emailAddress", config.email)
                    }
                }
            else:
                error_data = response.json() if response.text else {}
                return {
                    "success": False,
                    "error": error_data.get("errorMessages", ["Authentication failed"])[0] if error_data.get("errorMessages") else "Authentication failed"
                }
                
    except httpx.TimeoutException:
        return {"success": False, "error": "Connection timeout. Please check your JIRA URL."}
    except Exception as e:
        logger.error(f"JIRA connection test error: {str(e)}")
        return {"success": False, "error": str(e)}


@api_router.post("/jira/fields")
async def get_jira_fields(request: JiraFieldsRequest):
    """Fetch all available fields from Jira to discover Story Points field dynamically"""
    try:
        config = request.config
        headers = get_jira_auth_headers(config)
        jira_url = config.url.rstrip('/')
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{jira_url}/rest/api/3/field",
                headers=headers
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.text else {}
                return {
                    "success": False,
                    "error": error_data.get("errorMessages", ["Failed to fetch fields"])[0] if error_data.get("errorMessages") else "Failed to fetch fields"
                }
            
            fields = response.json()
            
            # Find potential story points fields
            story_points_fields = []
            for field in fields:
                field_name = field.get('name', '').lower()
                field_id = field.get('id', '')
                
                # Check for story points related fields
                if ('story' in field_name and 'point' in field_name) or \
                   field_name == 'story points' or \
                   field_name == 'story point estimate' or \
                   'estimate' in field_name:
                    story_points_fields.append({
                        'id': field_id,
                        'name': field.get('name'),
                        'type': field.get('schema', {}).get('type', 'unknown'),
                        'custom': field.get('custom', False)
                    })
            
            # Sort by relevance - exact matches first
            def sort_key(f):
                name = f['name'].lower()
                if name == 'story points':
                    return 0
                elif name == 'story point estimate':
                    return 1
                elif 'story point' in name:
                    return 2
                else:
                    return 3
            
            story_points_fields.sort(key=sort_key)
            
            return {
                "success": True,
                "storyPointsFields": story_points_fields,
                "allFields": [{"id": f.get("id"), "name": f.get("name")} for f in fields if f.get("custom", False)]
            }
            
    except httpx.TimeoutException:
        return {"success": False, "error": "Connection timeout."}
    except Exception as e:
        logger.error(f"JIRA fields fetch error: {str(e)}")
        return {"success": False, "error": str(e)}


@api_router.post("/jira/users")
async def get_jira_users(request: JiraUsersRequest):
    """Fetch all users/assignees for a project"""
    try:
        config = request.config
        headers = get_jira_auth_headers(config)
        jira_url = config.url.rstrip('/')
        
        users = []
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Method 1: Get users assignable to project
            response = await client.get(
                f"{jira_url}/rest/api/3/user/assignable/search?project={config.projectKey}&maxResults=1000",
                headers=headers
            )
            
            if response.status_code == 200:
                user_data = response.json()
                for user in user_data:
                    users.append({
                        'accountId': user.get('accountId'),
                        'displayName': user.get('displayName'),
                        'emailAddress': user.get('emailAddress', ''),
                        'avatarUrl': user.get('avatarUrls', {}).get('24x24', '')
                    })
            
            # Remove duplicates based on accountId
            seen = set()
            unique_users = []
            for user in users:
                if user['accountId'] not in seen:
                    seen.add(user['accountId'])
                    unique_users.append(user)
            
            # Sort by display name
            unique_users.sort(key=lambda x: x.get('displayName', '').lower())
            
            return {
                "success": True,
                "users": unique_users,
                "total": len(unique_users)
            }
            
    except httpx.TimeoutException:
        return {"success": False, "error": "Connection timeout.", "users": []}
    except Exception as e:
        logger.error(f"JIRA users fetch error: {str(e)}")
        return {"success": False, "error": str(e), "users": []}


@api_router.post("/jira/search")
async def search_jira_issues(request: JiraSearchRequest):
    """Proxy endpoint to search JIRA issues with proper story points field detection"""
    try:
        config = request.config
        filters = request.filters or {}
        
        headers = get_jira_auth_headers(config)
        jira_url = config.url.rstrip('/')
        
        # Use provided story points field or detect dynamically
        story_points_field = request.storyPointsFieldId
        
        # Common story points field IDs to try
        story_points_field_ids = [
            'customfield_10016',  # Most common
            'customfield_10024',
            'customfield_10004',
            'customfield_10008',
            'customfield_10026',
            'customfield_10002',
            'customfield_10005',
        ]
        
        # If no field specified, try to detect it
        if not story_points_field:
            try:
                async with httpx.AsyncClient(timeout=15.0) as http_client:
                    fields_response = await http_client.get(
                        f"{jira_url}/rest/api/3/field",
                        headers=headers
                    )
                    
                    if fields_response.status_code == 200:
                        fields = fields_response.json()
                        for field in fields:
                            field_name = field.get('name', '').lower()
                            if field_name == 'story points' or field_name == 'story point estimate':
                                story_points_field = field.get('id')
                                logger.info(f"Detected story points field: {story_points_field} ({field.get('name')})")
                                break
                            elif 'story' in field_name and 'point' in field_name:
                                story_points_field = field.get('id')
                                logger.info(f"Detected story points field (partial match): {story_points_field} ({field.get('name')})")
            except Exception as e:
                logger.warning(f"Could not auto-detect story points field: {str(e)}")
        
        if story_points_field and story_points_field not in story_points_field_ids:
            story_points_field_ids.insert(0, story_points_field)
        
        # Build JQL query with proper quoting for multi-word values
        conditions = [f"project = {config.projectKey}"]
        
        # Exclude subtasks by default unless explicitly requested (matches Jira's typical behavior)
        exclude_subtasks = request.excludeSubtasks if request.excludeSubtasks is not None else True
        if exclude_subtasks:
            conditions.append('issuetype != Sub-task')
            logger.info("Excluding Sub-tasks from query (default behavior)")
        
        # Date filtering - support different date fields
        date_field = request.dateField or "created"
        if filters.get('startDate'):
            conditions.append(f'{date_field} >= "{filters["startDate"]}"')
        if filters.get('endDate'):
            conditions.append(f'{date_field} <= "{filters["endDate"]}"')
        
        # Status filter with proper quoting
        if filters.get('status') and len(filters['status']) > 0:
            status_list = ','.join([f'"{s}"' for s in filters['status']])
            conditions.append(f'status in ({status_list})')
        
        # Issue type filter with proper quoting for multi-word types
        if filters.get('issueType') and len(filters['issueType']) > 0:
            # Always quote issue types to handle multi-word types like "Sub-task"
            type_list = ','.join([f'"{t.strip()}"' for t in filters['issueType']])
            conditions.append(f'issuetype in ({type_list})')
            logger.info(f"Filtering by issue types: {filters['issueType']}")
        
        # Labels filter
        if filters.get('labels') and len(filters['labels']) > 0:
            label_list = ','.join([f'"{label}"' for label in filters['labels']])
            conditions.append(f'labels in ({label_list})')
        
        # Sprint filter
        if filters.get('sprint'):
            conditions.append(f'sprint = "{filters["sprint"]}"')
        
        # Assignee filter (for people filtering)
        if filters.get('assignee'):
            if filters['assignee'] == 'Unassigned':
                conditions.append('assignee is EMPTY')
            else:
                conditions.append(f'assignee = "{filters["assignee"]}"')
            
        jql = ' AND '.join(conditions) + ' ORDER BY created DESC'
        logger.info(f"=== JQL Query ===")
        logger.info(f"JQL: {jql}")
        logger.info(f"Date Field: {date_field}")
        logger.info(f"Exclude Subtasks: {exclude_subtasks}")
        logger.info(f"==================")
        
        # Build fields list - include all potential story points fields
        fields_to_fetch = [
            "summary",
            "status",
            "issuetype",
            "priority",
            "assignee",
            "created",
            "resolutiondate",
            "labels",
            "subtasks",
            "parent",
            "sprint",
        ] + story_points_field_ids
        
        # Fetch all issues with pagination using the NEW /search/jql endpoint
        all_issues = []
        next_page_token = None
        max_results = 100
        
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            while True:
                # Use the new /search/jql endpoint format
                search_body = {
                    "jql": jql,
                    "maxResults": max_results,
                    "fields": fields_to_fetch
                }
                
                # Add pagination token if available
                if next_page_token:
                    search_body["nextPageToken"] = next_page_token
                
                response = await http_client.post(
                    f"{jira_url}/rest/api/3/search/jql",
                    headers=headers,
                    json=search_body
                )
                
                if response.status_code != 200:
                    error_data = response.json() if response.text else {}
                    error_msg = error_data.get("errorMessages", ["Failed to fetch issues"])
                    if isinstance(error_msg, list):
                        error_msg = error_msg[0] if error_msg else "Failed to fetch issues"
                    logger.error(f"Jira search error: {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg
                    }
                
                data = response.json()
                issues = data.get("issues", [])
                total = data.get("total", 0)
                
                # Normalize story points - try all possible fields
                for issue in issues:
                    fields_data = issue.get("fields", {})
                    story_points = None
                    detected_field = None
                    
                    # Try the specified field first
                    if story_points_field and story_points_field in fields_data:
                        val = fields_data[story_points_field]
                        if val is not None:
                            story_points = val
                            detected_field = story_points_field
                    
                    # Fall back to trying all common fields
                    if story_points is None:
                        for field_id in story_points_field_ids:
                            if field_id in fields_data and fields_data[field_id] is not None:
                                story_points = fields_data[field_id]
                                detected_field = field_id
                                break
                    
                    # Convert to number
                    try:
                        if story_points is not None:
                            if isinstance(story_points, str):
                                story_points = float(story_points) if story_points else 0
                            elif isinstance(story_points, (int, float)):
                                story_points = float(story_points)
                            else:
                                story_points = 0
                        else:
                            story_points = 0
                    except (ValueError, TypeError):
                        story_points = 0
                    
                    # Set normalized story points field
                    issue["fields"]["storyPoints"] = story_points
                    issue["fields"]["_storyPointsField"] = detected_field
                
                all_issues.extend(issues)
                
                # Check for next page using nextPageToken (new API format)
                next_page_token = data.get("nextPageToken")
                
                if not next_page_token or len(all_issues) >= 2000:
                    break
                
                # Safety limit
                if len(all_issues) >= 2000:
                    logger.warning("Reached 2000 issues limit")
                    break
        
        # Count by issue type for debugging
        issue_type_counts = {}
        issues_with_points = 0
        total_points = 0
        
        for issue in all_issues:
            issue_type = issue.get("fields", {}).get("issuetype", {}).get("name", "Unknown")
            issue_type_counts[issue_type] = issue_type_counts.get(issue_type, 0) + 1
            
            # Count issues with story points and sum total points
            story_points = issue.get("fields", {}).get("storyPoints", 0)
            if story_points and story_points > 0:
                issues_with_points += 1
                total_points += story_points
        
        logger.info(f"=== Query Results ===")
        logger.info(f"Total Issues Fetched: {len(all_issues)}")
        logger.info(f"Issues by Type: {issue_type_counts}")
        logger.info(f"Issues with Story Points: {issues_with_points}")
        logger.info(f"Total Story Points: {total_points}")
        logger.info(f"=====================")
        
        return {
            "success": True,
            "issues": all_issues,
            "total": len(all_issues),
            "storyPointsField": story_points_field or "auto-detected",
            "issuesWithPoints": issues_with_points,
            "totalStoryPoints": total_points,
            "issueTypeCounts": issue_type_counts,
            "jqlUsed": jql
        }
                
    except httpx.TimeoutException:
        return {"success": False, "error": "Request timeout. Try reducing the date range."}
    except Exception as e:
        logger.error(f"JIRA search error: {str(e)}")
        return {"success": False, "error": str(e)}


@api_router.post("/jira/sprints")
async def fetch_jira_sprints(config: JiraConfig):
    """Fetch sprints for a project"""
    try:
        headers = get_jira_auth_headers(config)
        jira_url = config.url.rstrip('/')
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # First, get boards for the project
            boards_response = await client.get(
                f"{jira_url}/rest/agile/1.0/board?projectKeyOrId={config.projectKey}",
                headers=headers
            )
            
            if boards_response.status_code != 200:
                return {"success": True, "sprints": []}
            
            boards_data = boards_response.json()
            if not boards_data.get("values"):
                return {"success": True, "sprints": []}
            
            board_id = boards_data["values"][0]["id"]
            
            # Fetch sprints
            sprints_response = await client.get(
                f"{jira_url}/rest/agile/1.0/board/{board_id}/sprint?maxResults=50",
                headers=headers
            )
            
            if sprints_response.status_code == 200:
                sprints_data = sprints_response.json()
                return {
                    "success": True,
                    "sprints": sprints_data.get("values", [])
                }
            else:
                return {"success": True, "sprints": []}
                
    except Exception as e:
        logger.error(f"JIRA sprints fetch error: {str(e)}")
        return {"success": True, "sprints": []}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)