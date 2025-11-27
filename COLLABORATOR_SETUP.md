# Collaborator Setup Guide - Sonic Refine Suite

Welcome! This guide will help you set up the **Sonic Refine Suite** project for testing and viewing.

## Prerequisites

- ✅ **Antigravity** installed and configured
- ✅ **Node.js** (v18 or newer) - [Install with nvm](https://github.com/nvm-sh/nvm)
- ✅ **Python** (v3.8 or newer)
- ✅ **Git**

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/davidv111111so/sonic-refine-suite.git
cd sonic-refine-suite
```

### 2. Open in Antigravity

```bash
# Open the project in Antigravity
code .  # Or your preferred method to open Antigravity
```

---

## Frontend Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The frontend will be available at **http://localhost:8080** (or the port shown in terminal).

---

## Backend Setup

The Python backend handles AI mastering and audio processing.

### Navigate to Backend Directory

```bash
cd python-backend
```

### Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Set Up Environment Variables

Create a `.env` file in the `python-backend` directory:

```env
# Supabase Configuration (for authentication)
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# Server Port
PORT=8001
```

> **Note:** Ask David for the actual Supabase credentials.

### Start Backend Server

```bash
python main.py
```

The backend will run on **http://localhost:8001**.

---

## Testing the Full App

1. **Start Frontend**: `npm run dev` (from project root)
2. **Start Backend**: `python main.py` (from `python-backend` folder)
3. **Open Browser**: Navigate to `http://localhost:8080`

### Key Features to Test

- **Level Tab**: Upload audio, adjust levels, download processed files
- **Enhance Tab**: Advanced audio enhancement with EQ and compression
- **AI Mastering Tab**: Upload target and reference tracks for AI-powered mastering
- **Media Player Tab**: Play audio with visualizer, EQ controls, and compressor

---

## Project Structure

```
sonic-refine-suite-project/
├── src/                    # Frontend React/TypeScript code
│   ├── components/         # UI components
│   ├── pages/              # Main pages
│   ├── services/           # API services
│   └── utils/              # Utility functions
├── python-backend/         # Python Flask backend
│   ├── main.py             # Main server file
│   └── audio_analysis.py   # Audio processing utilities
├── public/                 # Static assets
└── package.json            # Frontend dependencies
```

---

## Using Antigravity for Testing

With Antigravity, you can:

1. **Explore Codebase**: Ask questions about the code structure
2. **Navigate Files**: Quickly jump to components and functions
3. **Understand Features**: Get explanations of how features work
4. **Test Changes**: Make local modifications and test them

### Example Prompts

- "Show me how the AI mastering feature works"
- "Explain the media player visualizer"
- "Where is the audio enhancement logic?"

---

## Common Issues

### Port Already in Use

If you see `EADDRINUSE` error:

```bash
# Kill process on port 8080 (frontend)
npx kill-port 8080

# Kill process on port 8001 (backend)
npx kill-port 8001
```

### Python Dependencies Failed

Make sure you have Python 3.8+ installed:

```bash
python --version
```

### Backend Authentication Errors

For **testing purposes only**, you can use the dev bypass token:
- The backend accepts `dev-bypass-token` for local testing
- This bypasses Supabase authentication

---

## Need Help?

- **Contact David** for Supabase credentials or access issues
- **Use Antigravity** to ask questions about the codebase
- **Check Console Logs** in browser DevTools for frontend errors
- **Check Terminal Output** for backend errors

---

## Repository Access

- **Repository**: https://github.com/davidv111111so/sonic-refine-suite
- **Access Level**: Read-only (viewing and testing)
- **Branch**: `main`

---

**Happy Testing! 🎵**
