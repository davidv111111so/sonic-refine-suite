import sys
import os

# Ensure the package is in path (it should be installed in site-packages, but being explicit helps)
# sys.path.append(r"C:\Users\david\AppData\Local\Programs\Python\Python313\Lib\site-packages")

try:
    from notebooklm_mcp.server import get_client
    print("Successfully imported NotebookLM Client factory.")
    
    print("Attempting to get authenticated client...")
    client = get_client()
    print("Client created using cached credentials.")
    
    print("Listing notebooks...")
    notebooks = client.list_notebooks()
    
    print(f"Found {len(notebooks)} notebooks:")
    for nb in notebooks[:5]:
        print(f"- {nb.title} (ID: {nb.id})")
        
    if len(notebooks) > 5:
        print(f"... and {len(notebooks) - 5} more.")
        
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
