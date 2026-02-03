import json
import sys
from notebooklm_mcp.server import get_client

def main():
    try:
        client = get_client()
        print("Authenticated.")
        
        # 1. Find 'Level Mixer' notebook
        notebooks = client.list_notebooks()
        level_mixer_id = "864ab50d-a00d-4de4-ab90-4872fdc7ca1a" # From user
        
        # Verify it exists in the list (optional, but good for confirmation)
        target_nb = next((nb for nb in notebooks if nb.id == level_mixer_id), None)
        
        results = {
            "level_mixer_found": bool(target_nb),
            "level_mixer_title": target_nb.title if target_nb else "Unknown",
            "query_response": None,
            "new_notebook": None,
            "research_task": None
        }
        
        if target_nb:
            print(f"Found Level Mixer: {target_nb.title}")
            # Query for context
            query_text = "What are the current tech stack details, coding language, and target OS mentioned in this notebook? Also list any specific library constraints."
            print(f"Querying: {query_text}")
            answer = client.query(level_mixer_id, query_text)
            results["query_response"] = answer.get("answer")
        else:
            print("Level Mixer notebook not found by ID. Proceeding with provided ID anyway.")
            
        # 2. Create 'Audio Libraries Research'
        print("Creating 'Audio Libraries Research' notebook...")
        new_nb = client.create_notebook("Audio Libraries Research")
        if new_nb:
            results["new_notebook"] = {"id": new_nb.id, "title": new_nb.title}
            print(f"Created: {new_nb.title} ({new_nb.id})")
            
            # 3. Start Research
            research_query = "best Python audio libraries for EQ, dynamic compression, stem separation, and DJ mixing with permissive licenses (MIT, Apache, BSD)"
            print(f"Starting research: {research_query}")
            research_res = client.start_research(new_nb.id, query=research_query, source="web", mode="deep")
            results["research_task"] = research_res
        
        print("\nRESULTS_JSON:")
        print(json.dumps(results, indent=2, default=str))

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
