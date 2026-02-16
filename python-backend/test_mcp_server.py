import subprocess
import json
import sys
import os

SERVER_SCRIPT = os.path.join(os.path.dirname(__file__), "supabase_mcp", "server.py")

def run_test():
    # Start the MCP server process
    process = subprocess.Popen(
        [sys.executable, SERVER_SCRIPT],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=sys.stderr,
        text=True,
        bufsize=0  # Unbuffered
    )

    print(f"Started server process with PID: {process.pid}")

    try:
        # 1. Initialize
        print("\n--- Sending Initialize Request ---")
        init_req = {
            "jsonrpc": "2.0",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test-client", "version": "1.0"}
            },
            "id": 0
        }
        process.stdin.write(json.dumps(init_req) + "\n")
        process.stdin.flush()

        response_line = process.stdout.readline()
        if not response_line:
            print("No response from server.")
            return
        
        print(f"Received: {response_line.strip()}")
        response = json.loads(response_line)
        if "error" in response:
            print(f"Error in initialize: {response['error']}")
            return

        # 2. List Tools
        print("\n--- Sending tools/list Request ---")
        list_tools_req = {
            "jsonrpc": "2.0",
            "method": "tools/list",
            "id": 1
        }
        process.stdin.write(json.dumps(list_tools_req) + "\n")
        process.stdin.flush()

        response_line = process.stdout.readline()
        print(f"Received: {response_line.strip()}")
        response = json.loads(response_line)
        
        tools = response.get("result", {}).get("tools", [])
        print(f"Found {len(tools)} tools:")
        for t in tools:
            print(f"- {t['name']}")

        # 3. Call list_projects
        print("\n--- Calling list_projects ---")
        call_req = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": "list_projects",
                "arguments": {}
            },
            "id": 2
        }
        process.stdin.write(json.dumps(call_req) + "\n")
        process.stdin.flush()

        response_line = process.stdout.readline()
        # It might take a moment, but readline should block
        print(f"Received: {response_line.strip()}")
        response = json.loads(response_line)
        
        # Check result
        if "result" in response:
            content = response["result"].get("content", [])
            for item in content:
                print(f"Result Content: {item['text'][:200]}...") # Truncate for display
        else:
            print(f"Error calling tool: {response.get('error')}")

    except Exception as e:
        print(f"Exception: {e}")
    finally:
        process.terminate()

if __name__ == "__main__":
    run_test()
