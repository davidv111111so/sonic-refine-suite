# 🎵 LEVEL AUDIO - Comprehensive Access Guide

## 📋 Quick Reference

| Who | Where | URL | How to Start |
|-----|-------|-----|--------------|
| **You (Local)** | Your computer | `http://localhost:5173` | Run `START_LEVEL_AUDIO.ps1` |
| **Collaborator (Same Network)** | Same WiFi | `http://192.168.1.164:5173` | You run `START_LEVEL_AUDIO_NETWORK.ps1` |
| **Anyone** | Lovable Cloud | `https://[your-id].lovable.app` | Always online, no setup needed |

---

## 🚀 For You (Primary Developer)

### Option 1: Local Development (Recommended)

**Start Everything with One Script:**
```powershell
.\START_LEVEL_AUDIO.ps1
```

**What it does:**
- ✅ Starts backend at `http://localhost:8000`
- ✅ Starts frontend at `http://localhost:5173`
- ✅ Opens 2 terminal windows (one for each service)
- ✅ Enables 100% real AI mastering

**Access:**
- Open browser: `http://localhost:5173`
- Login with: `davidv111111@gmail.com`

### Option 2: Share with Collaborator on Network

**Start with Network Access:**
```powershell
.\START_LEVEL_AUDIO_NETWORK.ps1
```

**What it does:**
- ✅ Same as Option 1, but exposes frontend to network
- ✅ Your collaborator can access from their device

**You access:** `http://localhost:5173`  
**Collaborator accesses:** `http://192.168.1.164:5173`

---

## 👥 For Your Collaborator (santiagov.t068@gmail.com)

### Scenario 1: Same Network as You (WiFi/LAN)

**Prerequisites:**
- You must have started the server with `START_LEVEL_AUDIO_NETWORK.ps1`
- Both devices on same network
- Firewall allows ports 5173 and 8000

**Access:**
1. Get the network URL from you (e.g., `http://192.168.1.164:5173`)
2. Open in browser
3. Login with: `santiagov.t068@gmail.com`
4. Full access to all features including AI Mastering!

**Features Available:**
- ✅ Real AI Mastering (not simulated)
- ✅ All enhancement features
- ✅ Admin permissions
- ✅ File upload/download

### Scenario 2: Remote Access (Different Network)

**Use Lovable Cloud:**
1. Go to: `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovable.app`
2. Login with: `santiagov.t068@gmail.com`
3. Everything works, including AI Mastering!

**Features Available:**
- ✅ Real AI Mastering via Cloud Run backend
- ✅ All enhancement features
- ✅ Admin permissions
- ✅ File upload/download to Google Cloud Storage

---

## 🌐 Lovable Cloud Access (For Everyone)

### URL
`https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovable.app`

### Who Can Access
- **You:** `davidv111111@gmail.com` (Admin)
- **Collaborator:** `santiagov.t068@gmail.com` (Admin)
- **Beta Users:** Added via Supabase database

### Features
- ✅ **Always Online** - No setup needed
- ✅ **Real AI Mastering** - Uses Cloud Run backend
- ✅ **Google Cloud Storage** - Secure file storage
- ✅ **Admin Panel** - Full access to all features
- ✅ **Mobile Friendly** - Works on phones/tablets

### Backend
- **Cloud Run URL:** `https://mastering-backend-azkp62xtaq-uc.a.run.app`
- **Status:** ✅ Deployed and running
- **CORS:** Configured for lovable.app domains
- **GCS:** Configured with proper CORS

---

## 🔧 Technical Details

### Local Development Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Your Computer                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────┐     ┌──────────────────────┐ │
│  │  Frontend        │     │  Backend             │ │
│  │  (Vite Dev)      │────▶│  (FastAPI)           │ │
│  │  :5173           │     │  :8000               │ │
│  └──────────────────┘     └──────────────────────┘ │
│           │                         │                │
│           │                         │                │
│           ▼                         ▼                │
│    window.location.origin    Matchering Engine      │
│    (Dynamic URL Detection)   (Real Mastering)       │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Cloud Production Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Lovable Cloud                        │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Frontend: https://[id].lovable.app                  │
│       │                                                │
│       ├──▶ Supabase Edge Functions                   │
│       │    (generate-upload-url, etc.)                │
│       │                                                │
│       └──▶ Google Cloud Run                          │
│            https://mastering-backend-...run.app       │
│                 │                                      │
│                 └──▶ Matchering Engine               │
│                      (Real AI Mastering)              │
│                                                        │
│  Google Cloud Storage:                                │
│  gs://spectrum-mastering-files-857351913435          │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## 🔐 Admin Configuration

Both users have **identical permissions**:

### Admin Emails (Configured in 3 places)
1. `sonic-refine-suite/src/config/beta.ts`
2. `sonic-refine-suite/src/hooks/useUserSubscription.ts`
3. Database: `user_roles` table (after first login)

### Admin Features
- ✅ Bypass beta restrictions
- ✅ Permanent premium access
- ✅ AI Mastering unlimited
- ✅ All enhancement features
- ✅ Admin panel access
- ✅ User management (future feature)

---

## 📊 Feature Comparison

| Feature | Local Dev | Network Access | Lovable Cloud |
|---------|-----------|----------------|---------------|
| **AI Mastering** | ✅ Real | ✅ Real | ✅ Real |
| **Backend** | Local Python | Local Python | Cloud Run |
| **Storage** | Temp files | Temp files | GCS |
| **Access Speed** | ⚡ Fastest | ⚡ Fast | 🌐 Internet speed |
| **Setup Required** | Yes | Yes | No |
| **Always Available** | Only when running | Only when running | ✅ Always |
| **Mobile Access** | No | No | ✅ Yes |
| **External Access** | No | Same network only | ✅ Worldwide |

---

## 🐛 Troubleshooting

### "Backend unavailable, simulating..."

**Problem:** Frontend using mock processing instead of real mastering

**Solution:**
```powershell
# Stop and restart with dev server
# Terminal 1:
cd backend
.\start_with_credentials.ps1

# Terminal 2:
cd sonic-refine-suite
npm run dev

# Access at: http://localhost:5173 (NOT :8000)
```

### Collaborator Can't Access Network URL

**Problem:** Connection refused or timeout

**Solutions:**
1. **Check Firewall:**
   ```powershell
   # Run as Administrator
   New-NetFirewallRule -DisplayName "LEVEL Audio Dev" -Direction Inbound -LocalPort 5173,8000 -Protocol TCP -Action Allow
   ```

2. **Verify Network:**
   - Both on same WiFi
   - Get IP: `ipconfig` (look for IPv4 on Wi-Fi adapter)
   - Ping test: `ping 192.168.1.164`

3. **Check Servers Running:**
   - Backend: `http://localhost:8000/health`
   - Frontend: `http://localhost:5173`

### Lovable Setup Checker Shows Error

**Problem:** "Backend error or CORS issue" with 500 status

**This is EXPECTED!** The checker sends a test URL that the backend correctly rejects. If you see:
```
Status: 500. {"error":"Could not extract blob name from URL: https://test.url/file.wav"
```

This means **backend is working correctly** ✅ (rejecting invalid test data)

After Lovable update, it will show: ✅ "Backend correctly rejected test data"

---

## 📝 Quick Command Reference

```powershell
# Start everything locally
.\START_LEVEL_AUDIO.ps1

# Start with network access
.\START_LEVEL_AUDIO_NETWORK.ps1

# Manual start - Backend only
cd backend
.\start_with_credentials.ps1

# Manual start - Frontend only
cd sonic-refine-suite
npm run dev

# Frontend with network access
cd sonic-refine-suite
npm run dev -- --host

# Build for production
cd sonic-refine-suite
npm run build

# Deploy to Cloud Run
cd sonic-refine-suite\python-backend
.\deploy-cloud-run.ps1
```

---

## 🎯 Best Practices

### For Daily Development (You)
1. Use `START_LEVEL_AUDIO.ps1`
2. Access at `http://localhost:5173`
3. Leave servers running while working
4. Stop with Ctrl+C when done

### For Collaboration Sessions
1. Use `START_LEVEL_AUDIO_NETWORK.ps1`
2. Share network URL with collaborator
3. Both can work simultaneously
4. All changes sync via Supabase

### For Remote Collaboration
1. Both use Lovable Cloud
2. No local servers needed
3. Always in sync
4. Works from anywhere

---

## 🆘 Support

### Issues with Local Setup
- Check `backend/err.log` for backend errors
- Check browser console for frontend errors
- Ensure ports 5173 and 8000 are free
- Restart servers if needed

### Issues with Lovable Cloud
- Check browser console
- Verify internet connection
- Try incognito mode
- Check service status at Lovable dashboard

### Need Help?
- Email: davidv111111@gmail.com
- Slack/Discord: [Your communication channel]
- Check GitHub issues: [If using GitHub]

---

## ✅ Checklist for Collaborator First-Time Setup

- [ ] Received network URL from primary developer
- [ ] On same WiFi network
- [ ] Can ping IP address: `192.168.1.164`
- [ ] Firewall allows port 5173
- [ ] Browser updated to latest version
- [ ] Have login credentials: `santiagov.t068@gmail.com`
- [ ] Can access URL: `http://192.168.1.164:5173`
- [ ] Successfully logged in
- [ ] Tested AI Mastering feature
- [ ] Confirmed "Real AI Mastering" (not simulated)

---

**Last Updated:** $(Get-Date)  
**Version:** 2.0  
**Status:** ✅ Fully Functional

