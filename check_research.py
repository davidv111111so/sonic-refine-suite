import json
import sys
from notebooklm_mcp.server import get_client

def main():
    try:
        client = get_client()
        
        # 1. Find 'Audio Libraries Research' notebook
        notebooks = client.list_notebooks()
        target_nb = next((nb for nb in notebooks if nb.title == "Audio Libraries Research"), None)
        
        if not target_nb:
            print("ERROR: 'Audio Libraries Research' notebook not found.")
            sys.exit(1)
            
        print(f"Target Notebook: {target_nb.title} ({target_nb.id})")
        
        # 2. Query Research Findings
        print("\n--- Querying Research Findings ---")
        summary = client.query(target_nb.id, "Summarize the findings on best Python audio libraries for EQ, Compression, and Stems. Focus on License types (MIT/Apache vs GPL).")
        print(f"Summary: {summary.get('answer')}")
        
        # 3. Specific Check on Matchering (Critical for Compliance)
        print("\n--- Checking Matchering License ---")
        # querying the research notebook specifically about matchering
        license_check = client.query(target_nb.id, "What is the specific software license for the 'Matchering' Python library? Is it GPL or MIT/BSD?")
        print(f"Matchering License: {license_check.get('answer')}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
