from notebooklm_mcp.server import get_client
import os

def main():
    # Set Cookie Explicitly (copied from notebooklm_tasks.py)
    cookie = "g.a0005ghbsVBUCNjlRLy5tJycHtAGC-CQtnjfZbEgdU4oPfZASGyVaml0lQEeGdVzRpjNfq25kQACgYKAV8SARMSFQHGX2Mi1sBcX-LyiHotL3j0FIUTtxoVAUF8yKpaE9wjxdWs-VvKTEBNN3jh0076"
    os.environ["NOTEBOOKLM_COOKIE"] = cookie
    os.environ["GOOGLE_COOKIE"] = cookie
    
    try:
        client = get_client()
        print("Authenticated.")
        
        notebook_id = "864ab50d-a00d-4de4-ab90-4872fdc7ca1a"
        query_text = "Provide the EXACT technical logic for 'Sync' as described in this notebook. Give me a step-by-step implementation guide for a DJ mixer. Include concepts like Phase Sync, Beat Grids, and Follower/Master relationship. Also, what are the rules for 'VU Meters'?"
        
        print(f"Querying {notebook_id}...")
        res = client.query(notebook_id, query_text)
        
        answer = res.get('answer', str(res))
        
        with open('research_sync_full.txt', 'w', encoding='utf-8') as f:
            f.write(answer)
        
        print("Response saved to research_sync_full.txt")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
