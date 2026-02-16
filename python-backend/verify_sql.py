import requests
import json

TOKEN = "sbp_fa91a09ccf53778e56dc708a9836cd67db99eb56"
PROJECT_REF = "nhulnikqfphofqpnmdba"
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/sql"

def run_sql():
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": "SELECT version();"
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        if response.status_code == 200 or response.status_code == 201:
            print("Successfully executed SQL.")
            print(f"Result: {response.json()}")
            return True
        else:
            print(f"Failed to execute SQL. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    run_sql()
