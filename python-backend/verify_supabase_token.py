import requests
import json

TOKEN = "sbp_fa91a09ccf53778e56dc708a9836cd67db99eb56"
API_URL = "https://api.supabase.com/v1/projects"

def verify_token():
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(API_URL, headers=headers)
        if response.status_code == 200:
            projects = response.json()
            print("Successfully connected to Supabase Management API.")
            print(f"Found {len(projects)} projects.")
            for p in projects:
                print(f"Project: {p.get('name')} (ID: {p.get('id')})")
            return True
        else:
            print(f"Failed to connect. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    verify_token()
