import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Use the token from the file or env if available
TOKEN = "sbp_fa91a09ccf53778e56dc708a9836cd67db99eb56"
PROJECT_REF = "nhulnikqfphofqpnmdba"
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/sql"

def run_sql(query):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": query
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        if response.status_code == 200 or response.status_code == 201:
            return response.json()
        else:
            print(f"Failed to execute SQL. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    print("Checking columns of job_logs...")
    check_query = """
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'job_logs';
    """
    columns = run_sql(check_query)
    if columns:
        print(f"Columns in job_logs: {[c['column_name'] for c in columns]}")
        
        column_names = [c['column_name'] for c in columns]
        if 'error' not in column_names:
            print("Adding 'error' column...")
            run_sql("ALTER TABLE job_logs ADD COLUMN error TEXT;")
        
        if 'progress' not in column_names:
            print("Adding 'progress' column...")
            run_sql("ALTER TABLE job_logs ADD COLUMN progress INTEGER DEFAULT 0;")
            
        # Refresh the PostgREST cache so the new columns are recognized
        print("Notifying PostgREST to reload schema...")
        run_sql("NOTIFY pgrst, 'reload schema';")
    else:
        print("Could not retrieve columns.")
