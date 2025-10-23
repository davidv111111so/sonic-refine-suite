# Quick Admin Access Setup

## Make Yourself Admin (3 Easy Steps)

### Step 1: Get Your User ID
1. Log into your app
2. Open browser console (F12)
3. Paste and run this code:
```javascript
supabase.auth.getUser().then(({ data }) => console.log('Your User ID:', data.user.id));
```
4. Copy your user ID from the console

### Step 2: Add Admin Role via Backend
1. Click this button to open your backend:

<lov-actions>
  <lov-open-backend>View Backend</lov-open-backend>
</lov-actions>

2. Go to **Table Editor** → **user_roles**
3. Click **Insert** → **Insert row**
4. Fill in:
   - **user_id**: Paste your user ID from Step 1
   - **role**: Select **admin** from dropdown
5. Click **Save**

### Step 3: Refresh & Enjoy
1. Refresh your browser
2. ✅ You now have full admin access with **zero restrictions**!

---

## For Your Collaborator
Repeat the same 3 steps with their account to grant them admin access.

---

## Google OAuth Fix (Quick Steps)

### The Issue
You're seeing "403. That's an error" because Google OAuth redirect URLs aren't configured.

### Quick Fix (5 minutes):

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com/
   - Select your project (or create one if needed)

2. **Configure OAuth Consent Screen**
   - Navigate to: **APIs & Services** → **OAuth consent screen**
   - Add **Authorized domain**: `supabase.co`
   - Save changes

3. **Set Up OAuth Credentials**
   - Go to: **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   
4. **Add Authorized URLs**
   - Under **Authorized JavaScript origins**, add:
     ```
     https://lyymcpiujrnlwsbyrseh.supabase.co
     ```
   - Under **Authorized redirect URIs**, add:
     ```
     https://lyymcpiujrnlwsbyrseh.supabase.co/auth/v1/callback
     ```
   - Click **Save**

5. **Update Your Backend**
   - Click the button below to open your backend:
   
<lov-actions>
  <lov-open-backend>View Backend</lov-open-backend>
</lov-actions>

   - Go to: **Users** → **Auth Settings** → **Google Settings**
   - Enter your **Google Client ID** and **Google Client Secret**
   - Click **Save**

6. **Test It**
   - Wait 2-3 minutes for changes to propagate
   - Try Google sign-in again
   - Should work perfectly! 🎉

---

## Site URL & Redirect URL Configuration

**Important:** These are automatically managed by Lovable Cloud!

If you need to add custom domains:
1. Open your backend (button above)
2. Go to **Users** → **Auth Settings**
3. Add your domains to the allowed list

That's it! You're all set! 🚀
