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
    """Proxy endpoint to search JIRA issues"""
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
        
        # Fetch all issues (paginated)
        all_issues = []
        start_at = 0
        max_results = 100
        total = 0
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            while True:
                search_body = {
                    "jql": jql,
                    "startAt": start_at,
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
                        "customfield_10016",  # Story points
                        "sprint"
                    ]
                }
                
                response = await client.post(
                    f"{jira_url}/rest/api/3/search",
                    headers=headers,
                    json=search_body
                )
                
                if response.status_code != 200:
                    error_data = response.json() if response.text else {}
                    return {
                        "success": False,
                        "error": error_data.get("errorMessages", ["Failed to fetch issues"])[0] if error_data.get("errorMessages") else "Failed to fetch issues"
                    }
                
                data = response.json()
                all_issues.extend(data.get("issues", []))
                total = data.get("total", 0)
                start_at += max_results
                
                # Stop if we've fetched all issues or hit safety limit
                if len(all_issues) >= total or start_at >= 1000:
                    break
        
        return {
            "success": True,
            "issues": all_issues,
            "total": total
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