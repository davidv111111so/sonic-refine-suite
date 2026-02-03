
import json
import sys
from notebooklm_mcp.server import get_client

def main():
    try:
        client = get_client()
        print("Authenticated with NotebookLM.")
        
        notebook_id = "864ab50d-a00d-4de4-ab90-4872fdc7ca1a"
        
        query_text = (
            "Based on the 'Level Mixer' notebook content, provide a detailed guide on how to improve the media player and mixer application. "
            "Focus strictly on features and technical implementations that avoid licensing issues (specifically GPL). "
            "I need: "
            "1. A list of features to improve (EQ, FX, Sync, etc.). "
            "2. Architecture recommendations using permissive libraries (like Tone.js, Librosa). "
            "3. A table comparing potential libraries and their licenses. "
            "4. Specific coding patterns to use."
            "Format the output with Markdown tables and bullet points."
        )
        
        print(f"Querying Notebook {notebook_id}...")
        answer = client.query(notebook_id, query_text)
        
        if answer and "answer" in answer:
            print("\n--- NOTEBOOKLM RESPONSE ---\n")
            print(answer["answer"])
            print("\n---------------------------\n")
        else:
            print("No answer received or empty response.")
            print(json.dumps(answer, indent=2))

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
