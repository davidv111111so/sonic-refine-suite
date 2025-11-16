# 🔧 Quick Fix: Local Mastering Not Working

## Problem
The local servers at `http://127.0.0.1:8000` and `http://192.168.1.164:8000` are showing "simulating" instead of real mastering.

## Solution: Run Dev Server Instead of Built Version

The backend serves the **built** frontend (static), but the dynamic URL detection requires the **dev server** (live compilation).

### Option 1: Run Frontend Dev Server + Backend (RECOMMENDED)

**Terminal 1 - Backend:**
```powershell
cd backend
.\start_with_credentials.ps1
```

**Terminal 2 - Frontend Dev Server:**
```powershell
cd sonic-refine-suite
npm run dev
```

**Access at:**
- `http://localhost:5173` (dev server) → Will use real mastering ✅
- `http://127.0.0.1:8000` (backend serves built frontend) → Will use Cloud Run backend ✅

### Option 2: Add Environment Variable (For Built Version)

Create a `.env` file in `sonic-refine-suite/`:

```env
VITE_PYTHON_BACKEND_URL=http://192.168.1.164:8000
```

Then rebuild:
```powershell
cd sonic-refine-suite
npm run build
```

Restart backend to serve updated build.

### Option 3: Test Specific Network IP

For network access (`192.168.1.164:8000`), use the dev server with network exposure:

```powershell
cd sonic-refine-suite
npm run dev -- --host
```

Access at: `http://192.168.1.164:5173` ✅

## Why This Happens

- **Built frontend** (in `dist/`) has static code compiled at build time
- **Dev server** compiles code dynamically, so `window.location.origin` works correctly
- Backend serving built frontend means the frontend was built when backend URL was `localhost:8000`

## Summary

**For Development:**
- Use dev server: `npm run dev` at `http://localhost:5173`
- Keep backend running at `http://localhost:8000`
- Both will work with real mastering ✅

**For Production:**
- Built frontend will use Cloud Run backend (production)
- Or set `VITE_PYTHON_BACKEND_URL` env var for custom backend

