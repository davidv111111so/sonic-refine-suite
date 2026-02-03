# NotebookLM Agent Tutorial & Guide

This guide explains how to use the **NotebookLM MCP Server** to empower your agentic workflows. By connecting to NotebookLM, the agent can research topics, query your existing documents, and manage your notebooks directly from its environment.

## 1. Core Features & Tools

The agent has access to the following tools via the `notebooklm` server:

### 📚 Notebook Management
- **`notebook_list`**: View all your notebooks. Use this to find the `notebook_id` for a specific project.
- **`notebook_create`**: Start a new notebook for a task or topic.
- **`notebook_describe`**: Get an AI-generated summary and suggested topics for a notebook.
- **`notebook_rename` / **`notebook_delete`**: Manage your workspace.

### 🧠 Knowledge & Querying
- **`notebook_query`**: The most powerful tool. Ask questions based *strictly* on the sources in a specific notebook.
    - *Best for:* Technical rules, project guidelines, extracting specific data from documents.
- **`source_get_content`**: Read the raw text of a specific source (PDF, Doc, URL).
    - *Best for:* Copying code snippets or reading full technical specs.
- **`source_describe`**: Get a summary and key keywords for a specific source.

### 🔎 Research (The "Agent" Mode)
- **`research_start`**: Start a web or Drive search for *new* information.
    - *Modes:* `fast` (~30s, ~10 sources) or `deep` (~5min, ~40 sources).
- **`research_status`**: **Crucial.** Poll this tool to check the progress of a research task.
- **`research_import`**: **Crucial.** Once research is complete, use this to bring the findings into your notebook.
- **`notebook_add_url` / `notebook_add_text` / `notebook_add_drive`**: Manually add context for the agent to use.

---

## 2. Best Prompts for the Agent

When asking the agent to help you, use these patterns to get the best results.

### 🏗️ Getting Project Architecture / Rules
If you have a notebook with technical documentation (like "Level Mixer"):

> "Query the 'Level Mixer' notebook specifically asking for the [Audio Driver constraints] and [Licensing requirements]. List them as a checklist."

### 🧪 Researching New Tech Stacks
Research requires a 3-step workflow:

1.  **Start:** "Start a deep research on 'Next.js 15 Server Components best practices' in a new notebook."
2.  **Wait:** (The agent will poll `research_status`)
3.  **Import:** "Import the research results into the notebook once finished."

### 📝 Coding from Documentation
If you have API docs in a notebook:

> "I need to implement Feature X. Read the implementation details from the 'API Docs' notebook and generate the boilerplate code."

---

## 3. Independent Project Configuration

To use NotebookLM effectively across multiple projects:

1.  **One Server, Multiple Notebooks:** The MCP server connects to your *Google Account*. It sees *all* your notebooks.
2.  **Context Switching:**
    - Always start a session by asking the agent to **"List notebooks"** or providing the specific **Notebook ID**.
    - The agent "switches context" by targeting a different `notebook_id`.
3.  **Isolation:**
    - Create separate notebooks for separate projects.
    - Avoid mixing unrelated projects in one notebook to prevent "hallucinated cross-contamination" across sources.

---

## 4. Quick Reference: Tool IDs

| Action | Tool Name | Required Args |
| :--- | :--- | :--- |
| **List Notebooks** | `notebook_list` | None (optional: `max_results`) |
| **Ask Question** | `notebook_query` | `notebook_id`, `query` |
| **Start Research** | `research_start` | `query` (optional: `source`, `mode`) |
| **Get Status** | `research_status` | `notebook_id` |
| **Import Results** | `research_import` | `notebook_id`, `task_id` |
| **Read Source** | `source_get_content` | `source_id` |
| **Add URL Source** | `notebook_add_url` | `notebook_id`, `url` |

---

## 🔐 Troubleshooting Authentication

If you see an **"Authentication expired"** error:
1.  Open your terminal.
2.  Run the command: `notebooklm-mcp-auth`
3.  Follow the prompts in the browser to sign in and refresh your tokens.
4.  Tell the agent to `refresh_auth` to pick up the new tokens.
