from fastmcp import FastMCP
import requests
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, List, Dict, Any

# Load environment variables
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=ENV_PATH)

# Constants
SUPABASE_MANAGEMENT_TOKEN = "sbp_fa91a09ccf53778e56dc708a9836cd67db99eb56"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Create MCP Server
mcp = FastMCP("Supabase Integration")

# Supabase Management API Base URL
MANAGEMENT_API_URL = "https://api.supabase.com/v1"

@mcp.tool()
def list_projects() -> List[Dict[str, Any]]:
    """List all Supabase projects associated with the account."""
    headers = {
        "Authorization": f"Bearer {SUPABASE_MANAGEMENT_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{MANAGEMENT_API_URL}/projects", headers=headers)
    response.raise_for_status()
    return response.json()

@mcp.tool()
def get_project_details(project_ref: str) -> Dict[str, Any]:
    """Get details of a specific Supabase project."""
    # Assuming ref is the ID
    # Actually, GET /projects returns list, GET /projects/{ref} might work but standard API is by ID?
    # No, ref is usually the subdomain part.
    # Management API: GET /projects returns objects with 'id' and 'ref'.
    # I'll iterate or use the ref directly if supported.
    # Typically GET /projects/{ref} works.
    headers = {
        "Authorization": f"Bearer {SUPABASE_MANAGEMENT_TOKEN}",
        "Content-Type": "application/json"
    }
    # First list to find the project ID if needed? Or just try ref.
    # According to docs, get requires REF.
    # But let's stick to listing for now or use the generic list to filter.
    projects = list_projects()
    for p in projects:
        if p.get('id') == project_ref or p.get('ref') == project_ref:
            return p
    return {"error": "Project not found"}

@mcp.tool()
def query_table(table_name: str, select: str = "*", limit: int = 10) -> List[Dict[str, Any]]:
    """Query a table in the database using the Service Role Key."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return [{"error": "Missing SUPABASE_URL or SUPABASE_KEY in .env"}]
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    try:
        response = supabase.table(table_name).select(select).limit(limit).execute()
        return response.data
    except Exception as e:
        return [{"error": str(e)}]

@mcp.tool()
def insert_data(table_name: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Insert data into a table."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return [{"error": "Missing SUPABASE_URL or SUPABASE_KEY in .env"}]
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    try:
        response = supabase.table(table_name).insert(data).execute()
        return response.data
    except Exception as e:
        return [{"error": str(e)}]

if __name__ == "__main__":
    mcp.run()
