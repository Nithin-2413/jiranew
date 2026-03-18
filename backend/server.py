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
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
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
    storyPointsFieldId: Optional[str] = 'customfield_10016'

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# JIRA Proxy Endpoints
@api_router.post("/jira/test-connection")
async def test_jira_connection(config: JiraConfig):
    """Test JIRA connection by fetching current user info"""
    try:
        auth_string = f"{config.email}:{config.apiToken}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
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

@api_router.post("/jira/search")
async def search_jira_issues(request: JiraSearchRequest):
    """Proxy endpoint to search JIRA issues - tries multiple story points fields"""
    try:
        config = request.config
        filters = request.filters
        
        auth_string = f"{config.email}:{config.apiToken}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        jira_url = config.url.rstrip('/')
        
        # Try to detect story points field from field list
        story_points_field_ids = [
            'customfield_10016',  # Most common
            'customfield_10024',  # Alternative 1
            'customfield_10004',  # Alternative 2
            'customfield_10008',  # Alternative 3
            'customfield_10026',  # Alternative 4
        ]
        
        detected_field = 'customfield_10016'  # Default
        
        try:
            # Try to get field metadata to find story points field
            fields_response = await httpx.get(
                f"{jira_url}/rest/api/3/field",
                headers=headers,
                timeout=10.0
            )
            
            if fields_response.status_code == 200:
                fields = fields_response.json()
                for field in fields:
                    if field.get('name') and (
                        'story point' in field['name'].lower() or
                        'estimate' in field['name'].lower() and 'story' in field['name'].lower()
                    ):
                        detected_field = field['id']
                        logger.info(f"Detected story points field: {detected_field} ({field['name']})")
                        break
        except Exception as e:
            logger.warning(f"Could not detect story points field: {str(e)}")
        
        # Build JQL query
        conditions = [f"project = {config.projectKey}"]
        
        if filters.get('startDate'):
            conditions.append(f'created >= "{filters["startDate"]}"')
        if filters.get('endDate'):
            conditions.append(f'created <= "{filters["endDate"]}"')
        if filters.get('status') and len(filters['status']) > 0:
            status_list = ','.join([f'"{s}"' for s in filters['status']])
            conditions.append(f'status in ({status_list})')
        if filters.get('issueType') and len(filters['issueType']) > 0:
            type_list = ','.join([f'"{t}"' for t in filters['issueType']])
            conditions.append(f'issuetype in ({type_list})')
        if filters.get('labels') and len(filters['labels']) > 0:
            label_list = ','.join([f'"{l}"' for l in filters['labels']])
            conditions.append(f'labels in ({label_list})')
        if filters.get('sprint'):
            conditions.append(f'sprint = "{filters["sprint"]}"')
            
        jql = ' AND '.join(conditions) + ' ORDER BY created DESC'
        
        # Fetch all issues - request ALL possible story points fields
        all_issues = []
        next_page_token = None
        max_results = 100
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            while True:
                search_body = {
                    "jql": jql,
                    "maxResults": max_results,
                    "fields": [
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
                        # Request ALL possible story points fields
                        "customfield_10016",
                        "customfield_10024",
                        "customfield_10004",
                        "customfield_10008",
                        "customfield_10026",
                        detected_field
                    ]
                }
                
                if next_page_token:
                    search_body["nextPageToken"] = next_page_token
                
                response = await client.post(
                    f"{jira_url}/rest/api/3/search/jql",
                    headers=headers,
                    json=search_body
                )
                
                if response.status_code != 200:
                    error_data = response.json() if response.text else {}
                    error_msg = error_data.get("errorMessages", ["Failed to fetch issues"])[0] if error_data.get("errorMessages") else "Failed to fetch issues"
                    return {
                        "success": False,
                        "error": error_msg
                    }
                
                data = response.json()
                issues = data.get("issues", [])
                
                # Normalize story points - try all possible fields
                for issue in issues:
                    fields = issue.get("fields", {})
                    story_points = None
                    
                    # Try detected field first
                    if detected_field in fields and fields[detected_field] is not None:
                        story_points = fields[detected_field]
                    
                    # Fall back to trying all common fields
                    if story_points is None:
                        for field_id in story_points_field_ids:
                            if field_id in fields and fields[field_id] is not None:
                                story_points = fields[field_id]
                                if story_points and isinstance(story_points, (int, float)) and story_points > 0:
                                    logger.info(f"Found story points in {field_id}: {story_points}")
                                break
                    
                    # Convert to number and set standardized field
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
                    
                    issue["fields"]["customfield_10016"] = story_points
                
                all_issues.extend(issues)
                
                next_page_token = data.get("nextPageToken")
                
                if not next_page_token or len(all_issues) >= 1000:
                    break
        
        # Count how many issues have story points
        issues_with_points = sum(1 for issue in all_issues if issue["fields"].get("customfield_10016", 0) > 0)
        logger.info(f"Fetched {len(all_issues)} issues, {issues_with_points} have story points")
        
        return {
            "success": True,
            "issues": all_issues,
            "total": len(all_issues),
            "storyPointsField": detected_field,
            "issuesWithPoints": issues_with_points
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
        auth_string = f"{config.email}:{config.apiToken}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
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
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()