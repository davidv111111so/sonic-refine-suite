# Google Sign-In Diagnostic Steps

## Current Issue
The "Sign in with Google" button is not functioning properly.

## Diagnostic Steps and Solutions

### Step 1: Verify Google Cloud Console Configuration

**Check OAuth Consent Screen:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "OAuth consent screen"
3. Verify the following:
   - ✅ User type is set to "External"
   - ✅ App name is configured
   - ✅ User support email is set
   - ✅ Authorized domains include:
     - `lovableproject.com`
     - `supabase.co`
   - ✅ Scopes include:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`

**Check OAuth Credentials:**
1. Go to "APIs & Services" > "Credentials"
2. Find your OAuth 2.0 Client ID
3. Verify the following:
   - ✅ **Authorized JavaScript origins** include:
     ```
     https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com
     ```
   - ✅ **Authorized redirect URIs** include:
     ```
     https://lyymcpiujrnlwsbyrseh.supabase.co/auth/v1/callback
     ```
4. If any URLs are missing, add them and click "Save"

### Step 2: Verify Lovable Cloud Backend Configuration

1. Open the Backend dashboard (Users > Auth Settings > Google Settings)
2. Verify:
   - ✅ Google Sign-In is enabled (toggle is ON)
   - ✅ Client ID is correctly pasted
   - ✅ Client Secret is correctly pasted
   - ✅ No extra spaces or line breaks in credentials

### Step 3: Check Site URL Configuration

1. In Backend > Users > Auth Settings:
   - ✅ **Site URL** should be: `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com`
   - ✅ **Redirect URLs** should include:
     - `https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com/**`
     - Your production URL (if applicable)

### Step 4: Test the Authentication Flow

**Frontend Test:**
1. Clear browser cache and cookies
2. Open the app in incognito/private mode
3. Click "Sign in with Google"
4. Observe the console (F12) for any error messages

**Common Error Messages:**

| Error | Cause | Solution |
|-------|-------|----------|
| `redirect_uri_mismatch` | Redirect URI not authorized | Add exact redirect URI to Google Console |
| `invalid_client` | Client ID/Secret incorrect | Re-copy credentials from Google Console |
| `access_denied` | User clicked "Cancel" | Normal behavior - no action needed |
| `403 - Access Denied` | Authorized domains not configured | Add domains to OAuth consent screen |

### Step 5: Verify Frontend Code (Already Implemented)

The frontend code in `src/pages/Auth.tsx` already includes proper Google Sign-In implementation:

```typescript
// Google Sign-In
const handleGoogleSignIn = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) throw error;
  } catch (error: any) {
    toast.error(error.message || 'Failed to sign in with Google');
  }
};
```

### Step 6: Advanced Troubleshooting

**Check Browser Console Logs:**
```javascript
// Look for errors related to:
- CORS issues
- Network failures
- OAuth configuration errors
```

**Network Tab Analysis:**
1. Open DevTools > Network tab
2. Click "Sign in with Google"
3. Look for failed requests to:
   - `accounts.google.com`
   - `supabase.co/auth/v1/authorize`
4. Check response status and error messages

**Test OAuth Flow Manually:**
1. Copy the OAuth URL from the network tab
2. Paste it in a new browser tab
3. Complete the Google sign-in flow
4. Check if you're redirected correctly

### Step 7: Propagation Time

After making changes in Google Cloud Console:
- ⏱️ Wait 5-10 minutes for changes to propagate
- Clear browser cache
- Test in incognito mode

### Step 8: Verify RLS Policies Don't Block Users

The app now has beta access restrictions. Ensure the Google account email is whitelisted:
- ✅ `davidv111111@gmail.com`
- ✅ `santiagov.t068@gmail.com`

If other emails try to sign in, they will see:
> "Access Restricted - This app is currently in beta testing. Access is limited to authorized users only."

## Common Solutions Summary

### Solution 1: Missing Redirect URI
**Problem:** `redirect_uri_mismatch` error  
**Fix:** Add `https://lyymcpiujrnlwsbyrseh.supabase.co/auth/v1/callback` to Google Console

### Solution 2: Wrong Authorized Domains
**Problem:** 403 error or "Access blocked"  
**Fix:** Add `lovableproject.com` and `supabase.co` to OAuth consent screen

### Solution 3: Credentials Not Saved
**Problem:** No error, button does nothing  
**Fix:** Re-enter Client ID and Secret in Backend > Google Settings

### Solution 4: Cache Issues
**Problem:** Old configuration still in use  
**Fix:** Clear cache, test in incognito, wait 5-10 minutes

## Testing Checklist

- [ ] Google Cloud Console configured
- [ ] OAuth credentials created
- [ ] Authorized JavaScript origins added
- [ ] Authorized redirect URIs added
- [ ] Backend Google settings configured
- [ ] Site URL is correct
- [ ] Tested in incognito mode
- [ ] Waited 5-10 minutes after changes
- [ ] Verified user email is whitelisted

## Additional Resources

- [Supabase Google Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Common OAuth Errors](https://developers.google.com/identity/protocols/oauth2/openid-connect#errors)

## Support

If issues persist after following all steps:
1. Check the Supabase project logs in Backend > Logs
2. Verify the Google Cloud Console audit logs
3. Contact support with specific error messages
