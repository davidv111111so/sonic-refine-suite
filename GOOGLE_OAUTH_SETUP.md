# Google OAuth Setup Instructions

You're seeing a "403. That's an error. We're sorry, but you do not have access to this page" error when clicking the Google sign-in button. This happens because Google OAuth needs to be configured properly in your Lovable Cloud backend.

## Why This Error Occurs

The 403 error occurs because:
1. Google OAuth credentials haven't been configured in your Lovable Cloud backend
2. Your app's domain isn't authorized in Google Cloud Console
3. The redirect URLs haven't been set up correctly

## How to Fix It

### Step 1: Access Your Lovable Cloud Dashboard

1. Click the button below to open your Lovable Cloud backend:

<lov-actions>
  <lov-open-backend>View Backend</lov-open-backend>
</lov-actions>

2. Navigate to **Users → Auth Settings → Google Settings**

### Step 2: Configure Google OAuth in Google Cloud Console

1. **Go to Google Cloud Console:**
   - Visit https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

3. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type (or "Internal" if using Google Workspace)
   - Fill in required information:
     - App name: "Level Audio" (or your preferred name)
     - User support email: Your email
     - Developer contact email: Your email
   - Under "Authorized domains", add:
     - `lovable.app` (for Lovable preview)
     - Your custom domain (if you have one)
   - Configure scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth Client ID"
   - Application type: **Web application**
   - Name: "Level Audio Web Client" (or your preferred name)
   
   **Authorized JavaScript origins:**
   - Add your Lovable preview URL (e.g., `https://your-project.lovable.app`)
   - Add your deployed URL (if you have one)
   - For local testing: `http://localhost` (if needed)
   
   **Authorized redirect URLs:**
   - Add the callback URL from your Lovable Cloud dashboard
   - Format: `https://lyymcpiujrnlwsbyrseh.supabase.co/auth/v1/callback`
   - Also add your preview URL + `/auth/callback`
   - Also add your deployed URL + `/auth/callback` (if you have one)

5. **Save Credentials:**
   - Click "Create"
   - Copy your **Client ID** and **Client Secret**
   - Keep these secure!

### Step 3: Add Credentials to Lovable Cloud

1. Return to your Lovable Cloud dashboard (Users → Auth Settings → Google Settings)

2. Enter your Google OAuth credentials:
   - **Client ID:** Paste the Client ID from Google Cloud Console
   - **Client Secret:** Paste the Client Secret from Google Cloud Console

3. Configure the redirect URLs in the Lovable Cloud dashboard:
   - **Site URL:** Your app's main URL (e.g., `https://your-project.lovable.app`)
   - **Redirect URLs:** Add all URLs where users might return after login:
     - `https://your-project.lovable.app/`
     - `https://your-project.lovable.app/auth`
     - Your deployed domain (if you have one)

4. Save the configuration

### Step 4: Test Google Sign-In

1. **Clear your browser cache and cookies** (important!)
2. Try signing in with Google again
3. You should now see the Google account selection screen
4. After selecting an account, you'll be redirected back to your app

## Common Issues & Solutions

### Issue: Still Getting 403 Error

**Solution:**
- Make sure you added **all** redirect URLs in Google Cloud Console
- Verify the Client ID and Client Secret are correct in Lovable Cloud
- Wait 5-10 minutes after making changes (Google needs time to propagate changes)
- Clear browser cache and try again

### Issue: "redirect_uri_mismatch" Error

**Solution:**
- The redirect URL in Google Cloud Console doesn't match the one being used
- Add these URLs to "Authorized redirect URLs" in Google Cloud Console:
  - `https://lyymcpiujrnlwsbyrseh.supabase.co/auth/v1/callback`
  - `https://your-project.lovable.app/` (your preview URL)
  - Your deployed URL (if applicable)

### Issue: "Access Blocked: This app's request is invalid"

**Solution:**
- Your OAuth consent screen isn't published or is missing required information
- Go back to Google Cloud Console → OAuth consent screen
- Make sure all required fields are filled
- If in "Testing" mode, add your email to the test users list

### Issue: Sign-in Works But User Data Not Saved

**Solution:**
- Check that your `profiles` table and trigger are set up correctly
- The `handle_new_user()` function should automatically create profile entries
- Check the database for any errors in the profiles table

## Important Notes

1. **Development vs Production:**
   - Use different OAuth credentials for development and production
   - Never commit OAuth secrets to version control

2. **Security:**
   - Keep your Client Secret secure
   - Never share it publicly or commit it to Git
   - Rotate credentials if they're ever compromised

3. **Domains:**
   - Google OAuth requires HTTPS in production
   - HTTP is only allowed for localhost during development
   - Make sure your deployed app uses HTTPS

4. **Multiple Environments:**
   - If you have multiple domains (preview, production, custom domain)
   - Add ALL of them to the authorized URLs in Google Cloud Console
   - Add ALL of them to the redirect URLs in Lovable Cloud

## Testing Checklist

Before considering Google OAuth fully configured, test these scenarios:

- [ ] Can sign up with Google on preview URL
- [ ] Can sign in with Google on preview URL
- [ ] Profile is created correctly in database
- [ ] User is redirected to homepage after sign-in
- [ ] Can sign out and sign back in
- [ ] Works on deployed/custom domain (if applicable)

## Need Help?

If you're still having issues after following these steps:

1. Check the browser console for error messages
2. Check the Lovable Cloud logs for backend errors
3. Verify all URLs are using HTTPS (except localhost)
4. Make sure Google Cloud Console changes have propagated (wait 10 minutes)
5. Try using an incognito/private window to rule out cache issues

For additional support, contact support@levelaudio.com with:
- The exact error message you're seeing
- Screenshots of your Google Cloud Console configuration
- Your Lovable project URL

---

**Good luck! Google OAuth should work perfectly once these steps are completed.**
