# NotebookLM Agent Tutorial & Guide

This guide explains how to use the **NotebookLM MCP Server** to empower your agentic workflows. By connecting to NotebookLM, the agent can research topics, query your existing documents, and manage your notebooks directly from the chat.

## 1. Core Features & Tools

The agent has access to the following tools via the `notebooklm` server:

### 📚 Notebook Management
- **`notebook_list`**: View all your notebooks. Use this to find the `notebook_id` for a project.
- **`notebook_create`**: Start a new notebook for a specific task or topic.
- **`notebook_delete` / `notebook_rename`**: Manage your workspace.

### 🧠 Knowledge & Querying
- **`notebook_query`**: The most powerful tool. Ask questions based *strictly* on the sources in a specific notebook.
    - *Best for:* Technical rules, project guidelines, extracting specific data from documents.
- **`source_get_content`**: Read the raw text of a specific source (PDF, Doc, URL).
    - *Best for:* Copying code snippets or reading full specs.

### 🔎 Research (The "Agent" Mode)
- **`research_start`**: Command NotebookLM to search the web or your Drive for *new* information.
    - *Modes:* `fast` (quick summary) or `deep` (comprehensive report).
- **`notebook_add_url` / `notebook_add_text` / `notebook_add_drive`**: Manually add context for the agent to use.

---

## 2. Best Prompts for the Agent

When asking the agent to help you, use these patterns to get the best results from NotebookLM.

### 🏗️ Getting Project Architecture / Rules
If you have a notebook with technical documentation (like "Level Mixer"):

> "Query the 'Level Mixer' notebook specifically asking for the [Audio Driver constraints] and [Licensing requirements]. List them as a checklist."

*Why it works:* It directs the agent to a specific source and defines the output format.

### 🧪 Researching New Tech Stacks
If you need to investigate a new library:

> "Create a new notebook named 'Audio Libraries Research'. Use `research_start` to find the best Python libraries for 'real-time stem separation' with permissive licenses. Summarize the findings."

*Why it works:* It isolates the research in a clean workspace and uses the Deep Research capability.

### 📝 Coding from Documentation
If you have API docs in a notebook:

> "I need to implement the [Feature X]. Read the implementation details from the 'API Docs' notebook/source and generate the boilerplate code."

---

## 3. Independent Project Configuration

To use NotebookLM effectively across multiple projects (e.g., "Level" vs "BluePrint"):

1.  **One Server, Multiple Notebooks:** The MCP server connects to your *Google Account*. It sees *all* your notebooks.
2.  **Context Switching:**
    - Always start a session by asking the agent to **"List notebooks"** or providing the specific **Notebook ID**.
    - The agent effectively "switches context" by targeting a different `notebook_id` for its queries.
3.  **Isolation:**
    - Create separate notebooks for separate projects.
    - Do not mix "Level" sources with "BluePrint" sources in the same notebook to prevent hallucinated cross-contamination.

## 4. Quick Reference: Tool IDs

| Action | Tool Name | Required Args |
| :--- | :--- | :--- |
| **List Notebooks** | `notebook_list` | None |
| **Ask Question** | `notebook_query` | `notebook_id`, `query` |
| **Research Web** | `research_start` | `query`, `source="web"` |
| **Read Source** | `source_get_content` | `source_id` |

---

*Verified Installation: February 2026*
