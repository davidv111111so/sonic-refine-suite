# Supabase MCP Server

This directory contains a custom Model Context Protocol (MCP) server for Supabase integration.
It allows AI assistants (like Claude Desktop) to interact with your Supabase project using the provided management token and service role key.

## Features

- **Project Management**: List all projects associated with the account.
- **Database Access**: Query and modify data in tables directly.

## Setup

1.  Ensure you have Python installed. Preferably use the project's virtual environment:
    `c:\Users\david\sonic-refine-suite-project\.venv\Scripts\python.exe`

2.  Install dependencies (if not already):
    ```bash
    pip install fastmcp requests python-dotenv supabase
    ```

## Usage with Claude Desktop / Cursor

Add the following to your MCP configuration file (e.g., `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "supabase-integration": {
      "command": "c:\\Users\\david\\sonic-refine-suite-project\\.venv\\Scripts\\python.exe",
      "args": [
        "c:\\Users\\david\\sonic-refine-suite-project\\python-backend\\supabase_mcp\\server.py"
      ]
    }
  }
}
```

## Testing

Run the test script to verify the server works locally:
```bash
python ../test_mcp_server.py
```
