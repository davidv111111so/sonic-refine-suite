import json
import sys
import os
from notebooklm_mcp.server import get_client

def main():
    # Set Cookie Explicitly (using the one from the provided tasks.py)
    os.environ["NOTEBOOKLM_COOKIE"] = "g.a0005ghbsVBUCNjlRLy5tJycHtAGC-CQtnjfZbEgdU4oPfZASGyVaml0lQEeGdVzRpjNfq25kQACgYKAV8SARMSFQHGX2Mi1sBcX-LyiHotL3j0FIUTtxoVAUF8yKpaE9wjxdWs-VvKTEBNN3jh0076"
    os.environ["GOOGLE_COOKIE"] = "g.a0005ghbsVBUCNjlRLy5tJycHtAGC-CQtnjfZbEgdU4oPfZASGyVaml0lQEeGdVzRpjNfq25kQACgYKAV8SARMSFQHGX2Mi1sBcX-LyiHotL3j0FIUTtxoVAUF8yKpaE9wjxdWs-VvKTEBNN3jh0076"
    
    level_mixer_id = "864ab50d-a00d-4de4-ab90-4872fdc7ca1a"
    
    try:
        client = get_client()
        
        query_text = """
        Query the 'Level Mixer' project for:
        1. How should 'Tempo Bend' (Pitch Nudging) be implemented for Tone.js? What are the standard percentage adjustments for +/- buttons and how should they affect the playbackRate?
        2. What is the full logic for the 'Sync' button? How do we calculate the phase offset and drift compensation between a Master deck and a Follower deck to ensure they are beat-aligned?
        3. Recommendations for 'Colorful spectral waveforms'. Are there industry standards for mapping Low/Mid/High frequencies to specific RGB/HSL colors in a 2D canvas?
        """
        
        print(f"Querying level mixer: {level_mixer_id}")
        answer = client.query(level_mixer_id, query_text)
        
        print("\n--- NOTEBOOKLM RESPONSE ---")
        print(answer.get("answer"))
        print("---------------------------\n")

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
