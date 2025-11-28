# Supabase Credentials Setup Guide

Your collaborator will need Supabase credentials to run the app locally. Here's how to set them up.

---

## Required Credentials

The app uses **two separate `.env` files**:

### 1. Frontend `.env` (Project Root)
Location: `sonic-refine-suite-project/.env`

```env
VITE_SUPABASE_PROJECT_ID="lyymcpiujrnlwsbyrseh"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eW1jcGl1anJubHdzYnlyc2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjQzMDEsImV4cCI6MjA3NTM0MDMwMX0.yFUYmBLQY80ZLuRZujLaUi7NdumqCXBesy6ZAvEJs2U"
VITE_SUPABASE_URL="https://lyymcpiujrnlwsbyrseh.supabase.co"
VITE_PYTHON_BACKEND_URL="http://localhost:8001"
VITE_BACKEND_URL="http://localhost:8001"
```

### 2. Backend `.env` (Python Backend)
Location: `sonic-refine-suite-project/python-backend/.env`

```env
SUPABASE_URL="https://lyymcpiujrnlwsbyrseh.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eW1jcGl1anJubHdzYnlyc2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjQzMDEsImV4cCI6MjA3NTM0MDMwMX0.yFUYmBLQY80ZLuRZujLaUi7NdumqCXBesy6ZAvEJs2U"
```

---

## Setup Steps for Your Collaborator

### Step 1: Create Frontend `.env`

```bash
# From project root
cd sonic-refine-suite-project

# Create .env file
touch .env  # or create manually in Windows

# Copy the content from "Frontend .env" section above
```

### Step 2: Create Backend `.env`

```bash
# From project root
cd python-backend

# Create .env file
touch .env  # or create manually in Windows

# Copy the content from "Backend .env" section above
```

### Step 3: Verify Setup

After creating both `.env` files:

1. **Frontend Check**:
   ```bash
   npm run dev
   ```
   - Open browser DevTools → Console
   - Should NOT see "Missing VITE_SUPABASE_URL" errors

2. **Backend Check**:
   ```bash
   cd python-backend
   python main.py
   ```
   - Should start without Supabase connection errors

---

## What Each Variable Does

### Frontend Variables (VITE_*)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_PROJECT_ID` | Supabase project identifier |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (anon) key for authentication |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_PYTHON_BACKEND_URL` | Points to local Python backend |
| `VITE_BACKEND_URL` | Alternative backend URL reference |

### Backend Variables

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL (for auth verification) |
| `SUPABASE_KEY` | Supabase key (matches frontend publishable key) |

---

## Testing Without Real Authentication (Optional)

For **testing purposes**, the backend has a dev bypass token:

1. The backend accepts `"dev-bypass-token"` as the Authorization header
2. This bypasses Supabase authentication entirely
3. **Use this only for local testing, never in production**

Example usage in code:
```javascript
headers: {
  'Authorization': 'Bearer dev-bypass-token'
}
```

---

## Security Notes

⚠️ **Important:**
- These are **public (anon) keys** - safe to share with collaborators
- They do NOT grant write access to your Supabase database
- For production, you'd use Row Level Security (RLS) policies
- The `dev-bypass-token` is for local testing only

---

## Troubleshooting

### "Missing VITE_SUPABASE_URL" Error
- ✅ Check: `.env` file exists in **project root**
- ✅ Check: Variable names start with `VITE_` (required for Vite)
- ✅ Restart: `npm run dev` after creating `.env`

### Backend Authentication Errors
- ✅ Check: `python-backend/.env` exists
- ✅ Check: `SUPABASE_URL` and `SUPABASE_KEY` are set
- ✅ Try: Use `dev-bypass-token` for testing

### Still Not Working?
1. Check for typos in variable names
2. Ensure no extra spaces in `.env` values
3. Restart both frontend and backend servers
4. Clear browser cache and reload

---

**Need Help?** Contact David or use Antigravity to debug!
