# Google Authentication Setup Guide

## Current Error: 403 - Access Denied

This error occurs because Google Cloud Console is not properly configured for OAuth.

## Required Steps:

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "Level Audio"
   - User support email: Your email
   - Developer contact: Your email
4. **CRITICAL**: Under "Authorized domains", add:
   - `lovableproject.com`
   - Your production domain (if any)
5. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Save and Continue

### 3. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth Client ID"
3. Choose "Web application"
4. **CRITICAL**: Add Authorized JavaScript origins:
   - `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com`
   - Your production URL
5. **CRITICAL**: Add Authorized redirect URIs:
   - `https://lyymcpiujrnlwsbyrseh.supabase.co/auth/v1/callback`
6. Click "Create"
7. Copy the Client ID and Client Secret

### 4. Configure in Lovable Cloud

1. Open Backend dashboard
2. Go to Users > Auth Settings > Google Settings
3. Paste:
   - Client ID
   - Client Secret
4. Click "Enabled" toggle
5. Save changes

### 5. Update Site URL (if needed)

In Backend > Users > Auth Settings:
- Site URL: `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com`
- Redirect URLs: Same as above

## Testing

1. Clear browser cache
2. Click "Google" button on login page
3. Should redirect to Google consent screen
4. After approval, should redirect back to app

## Troubleshooting

- If still 403: Wait 5-10 minutes for Google to propagate changes
- Verify all URLs match exactly (no trailing slashes)
- Check OAuth consent screen is published (not in testing mode)
