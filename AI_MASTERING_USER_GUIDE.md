# AI Mastering - Complete User Guide

## 🎯 Overview

The AI Mastering feature uses advanced audio processing to professionally master your audio tracks. It analyzes a reference track (either from genre presets or your custom upload) and applies sophisticated algorithms to make your target audio match the reference's characteristics.

---

## 📋 Prerequisites

### 1. Authentication Required
- You **MUST** be logged in to use AI Mastering
- Go to `/auth` route to sign up or log in
- AI Mastering is a **Premium Feature** - requires premium subscription

### 2. File Requirements
- **Target Audio**: The track you want to master
- **Reference Audio**: Either choose a genre preset OR upload your own
- **Supported Formats**: WAV, MP3, FLAC, AAC
- **Recommended**: Use high-quality audio files (44.1kHz or 48kHz, 16-bit minimum)

---

## 🚀 How to Use AI Mastering

### Step 1: Access the Feature
1. Navigate to the AI Mastering tab in the main application
2. If you see "Premium Feature Locked", click "Upgrade to Premium"
3. Once authenticated with premium access, you'll see the full interface

### Step 2: Upload Target Audio
1. Click the **"Select Target Audio"** button
2. Choose your audio file from your computer
3. You'll see the file name and size displayed
4. This is the track that will be mastered

### Step 3: Choose Reference Method

#### Option A: Genre Presets (Recommended for Beginners)
1. Browse the grid of 20 genre presets:
   - 🎸 Rock, ⚡ Metal, 🎛️ EDM, 🎷 Jazz
   - 🎻 Classical, 🎤 Pop, 🎧 Hip Hop, 🎹 R&B
   - And 12 more specialized genres
2. Click on a genre card that matches your desired sound
3. Selected preset will be highlighted with a gradient border

#### Option B: Custom Reference Track
1. Click **"Use Custom Reference"** button
2. Upload your own reference audio file
3. This gives you complete control over the mastering target
4. Use a professionally mastered track in your target genre

### Step 4: Advanced Settings (Optional)

Click **"Advanced Settings"** button to access 37 professional parameters:

#### Core Parameters
- **Threshold** (0-1): Matching sensitivity - higher = stricter matching
- **Epsilon** (0.000001): Numerical precision for calculations
- **Max Piece Length** (seconds): Maximum chunk size for processing

#### Timing & Structure
- **BPM**: Beats per minute (0 = auto-detect)
- **Time Signature**: Numerator/Denominator (e.g., 4/4)
- **Piece Length**: Processing chunks measured in bars

#### Processing Methods
- **Resampling**: FastSinc (fastest) / Sinc (balanced) / Linear (basic)
- **Spectrum Compensation**: Frequency-Domain or Time-Domain
- **Loudness Compensation**: LUFS (recommended) or RMS

#### Spectrum Analysis (Advanced Users Only)
- **Analyze Full Spectrum**: Toggle detailed frequency analysis
- **Smoothing Width**: Frequency smoothing amount
- **Spectrum Steps**: Resolution of frequency analysis
- **FFT Size**: 512-8192 (higher = more detail, slower processing)

#### Output Settings
- **Normalize Input**: Pre-normalize before processing
- **Normalize Output**: Post-normalize result
- **Limiter Method**: None / Classic / Modern / Aggressive
- **Limiter Threshold**: -12dB to 0dB
- **Output Bits**: 16, 24, 32, or 32-float
- **Dithering**: None / TPDF / RPDF (for 16/24-bit)

**Default Settings**: Pre-configured for optimal results. Only modify if you understand audio mastering!

### Step 5: Start Mastering

1. Click the **"Start AI Mastering"** button
2. Process flow:
   ```
   ┌─────────────────────┐
   │ Validate Inputs     │
   └──────────┬──────────┘
              │
   ┌──────────▼──────────┐
   │ Generate Upload URLs│  (3-5 seconds)
   └──────────┬──────────┘
              │
   ┌──────────▼──────────┐
   │ Upload to GCS       │  (5-30 seconds depending on file size)
   └──────────┬──────────┘
              │
   ┌──────────▼──────────┐
   │ Start Mastering Job │  (1-2 seconds)
   └──────────┬──────────┘
              │
   ┌──────────▼──────────┐
   │ Poll Job Status     │  (30-180 seconds processing)
   │ Every 5 seconds     │
   └──────────┬──────────┘
              │
   ┌──────────▼──────────┐
   │ Download Result     │  (5-15 seconds)
   └──────────┬──────────┘
              │
   ┌──────────▼──────────┐
   │ Save to Downloads   │  ✓ Complete!
   └─────────────────────┘
   ```

3. You'll see toast notifications at each stage
4. Processing typically takes 1-3 minutes total
5. The mastered file will automatically download as `mastered_[filename].wav`

### Step 6: Review Results

1. The mastered file is saved to your Downloads folder
2. Compare original vs mastered using your preferred audio player
3. If unsatisfied, try:
   - Different genre preset
   - Adjust advanced settings
   - Use a different reference track

---

## 🔧 Troubleshooting

### "Premium Feature Locked"
- **Solution**: Log in and upgrade to premium subscription
- Navigate to `/auth` and complete authentication

### "Please select a target audio file"
- **Solution**: You forgot to upload your target audio
- Click "Select Target Audio" first

### "Please select a reference file or choose a genre preset"
- **Solution**: You need to either:
  - Click a genre preset card, OR
  - Click "Use Custom Reference" and upload a file

### "Backend error: 401"
- **Solution**: Your session expired
- Log out and log back in
- Try the mastering process again

### "Processing timeout"
- **Solution**: 
  - Large files (>50MB) may take longer
  - Check your internet connection
  - Try again with a smaller file or lower quality

### "Invalid settings" error
- **Solution**: Your advanced settings have invalid values
- Click "Reset to Defaults" in Advanced Settings modal
- Common issues:
  - Threshold not between 0-1
  - FFT size not between 512-8192
  - Limiter threshold out of range

---

## 👨‍💼 Admin Features

### Reference Track Manager (Admins Only)

If you have admin role, you'll see an additional **"Manage Reference Tracks"** section:

#### Features:
1. **Upload Genre References**: Add official reference tracks for all 20 genres
2. **View Storage**: See which genres have reference tracks stored
3. **Delete References**: Remove outdated or incorrect reference files
4. **Status Indicators**: 
   - ✓ Green checkmark = Reference available
   - Gray circle = No reference uploaded

#### How to Use:
1. Scroll to "Reference Track Library Management" section
2. For each genre card:
   - Click "Upload Reference" to add/replace
   - Click "Delete" to remove existing reference
3. References are stored in browser's IndexedDB
4. References persist across sessions
5. All users can use uploaded references when selecting genre presets

**Important**: Only upload high-quality, professionally mastered tracks as references!

---

## 🎓 Best Practices

### For Best Results:
1. **Use High-Quality Source Files**
   - 44.1kHz or 48kHz sample rate
   - 24-bit depth if possible
   - Minimal compression

2. **Choose Appropriate References**
   - Match genre to your target audio
   - Use professionally mastered reference tracks
   - Avoid over-compressed references

3. **Start with Defaults**
   - Advanced settings are pre-optimized
   - Only adjust if you understand the parameters
   - Make small incremental changes

4. **Process in Stages**
   - Master one track at a time
   - Compare results carefully
   - Build a library of successful settings

5. **Understand Limitations**
   - AI mastering can't fix poor recordings
   - Garbage in = garbage out
   - Consider proper mixing before mastering

---

## 📊 Technical Details

### Processing Pipeline:
1. **Upload Phase**: Files uploaded to Google Cloud Storage
2. **Job Creation**: Backend creates processing job with unique ID
3. **Audio Analysis**: Reference track analyzed for spectral characteristics
4. **Matching**: Target audio transformed to match reference
5. **Post-Processing**: Normalization, limiting, format conversion
6. **Delivery**: Result stored in GCS, download URL provided

### Security:
- All uploads require authentication
- User ID verified via Supabase JWT
- Files are user-isolated in cloud storage
- Edge functions validate all requests

### Advanced Settings Validation:
```typescript
Threshold: 0.0 - 1.0
Epsilon: > 0.0 (typically 0.000001)
Max Piece Length: > 0 seconds
BPM: ≥ 0 (0 = auto-detect)
FFT Size: 512, 1024, 2048, 4096, 8192
Output Bits: 16, 24, 32, 32 (float)
Limiter Threshold: -12dB to 0dB
```

---

## 🆘 Support

### Common Questions:

**Q: How long does mastering take?**
A: Typically 1-3 minutes. Longer files (>10 minutes) may take up to 5 minutes.

**Q: What output format do I get?**
A: WAV format at 32-bit floating point by default (configurable in Advanced Settings).

**Q: Can I master multiple files at once?**
A: No, currently one file at a time. Process each individually.

**Q: Do genre presets work without uploaded references?**
A: Yes, the backend has default characteristics for each genre. Admin-uploaded references override defaults.

**Q: Is my audio stored permanently?**
A: No, temporary storage only during processing. Files are deleted after download.

**Q: Can I cancel a job in progress?**
A: Not currently supported. Wait for completion or refresh the page (note: this wastes processing credits).

---

## 🔐 Authentication & Database Guide

### User Roles System

The application uses a secure role-based access control (RBAC) system:

#### Database Tables:

1. **profiles** (public schema)
   ```sql
   - id: UUID (references auth.users)
   - email: TEXT
   - full_name: TEXT
   - subscription: TEXT (free/premium)
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP
   ```

2. **user_roles** (public schema)
   ```sql
   - id: UUID (primary key)
   - user_id: UUID (references auth.users)
   - role: app_role ENUM (admin/moderator/user)
   - unique constraint on (user_id, role)
   ```

3. **app_role** (custom enum type)
   ```sql
   VALUES: 'admin', 'moderator', 'user'
   ```

#### Security Functions:

1. **has_role(user_id, role)**: Checks if user has specific role
2. **has_premium_access(user_id)**: Checks premium subscription or admin status
3. **is_beta_user(user_id)**: Checks beta access (hardcoded emails + admins)
4. **handle_new_user()**: Trigger function that auto-creates profile + assigns 'user' role on signup

#### Row-Level Security (RLS):

All tables have RLS enabled. Policies use SECURITY DEFINER functions to avoid recursive checks.

### How to Grant Admin Access:

**Manual Method** (via Backend/SQL):
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

**Important**: 
- Never check roles client-side only
- Always use `has_role()` function in RLS policies
- Never store roles in localStorage/sessionStorage
- Admin checks should always query the database

### Login Flow:

1. User visits `/auth`
2. Signs up with email + password
3. `handle_new_user()` trigger fires:
   - Creates profile in `profiles` table
   - Assigns 'user' role in `user_roles` table
4. Email confirmation (can be disabled in Supabase settings for testing)
5. User redirected to main app
6. `useUserSubscription()` hook fetches:
   - Subscription tier from `profiles`
   - Roles from `user_roles`
   - Calculates `isPremium`, `isAdmin` flags

### Checking Access in Components:

```typescript
import { useUserSubscription } from '@/hooks/useUserSubscription';

const { isPremium, isAdmin, loading } = useUserSubscription();

// Conditional rendering
if (!isPremium) {
  return <PremiumLockedMessage />;
}

if (isAdmin) {
  return <AdminPanel />;
}
```

---

## 📝 Changelog

### Current Version (Async Processing)
- ✅ Asynchronous job processing
- ✅ Progress polling with status updates
- ✅ User identification authentication
- ✅ GCS direct upload
- ✅ Advanced settings validation
- ✅ SessionStorage persistence
- ✅ 20 genre presets
- ✅ Admin reference manager
- ✅ Premium access control

### Previous Version (Deprecated)
- ❌ Synchronous processing (caused timeouts)
- ❌ FormData direct upload
- ❌ Single edge function

---

## 🎉 Tips for Success

1. **Start Simple**: Use genre presets before custom references
2. **Compare Carefully**: A/B test original vs mastered
3. **Learn Gradually**: Explore advanced settings one parameter at a time
4. **Save Favorites**: Note down settings that work well for your style
5. **Trust the Defaults**: They're based on industry best practices
6. **Be Patient**: Quality mastering takes time - don't rush!

---

For technical support or feature requests, contact the development team or check the project documentation.

**Happy Mastering! 🎵**
