# Plan & Options: Access Tiers and Performance Optimization

## 1. Access Control Strategy

### 1.1 Identified Roles
*   **Admins (Permanent Access)**:
    *   `davidv111111@gmail.com`
    *   `aelabs1003@gmail.com`
*   **Premium Tester (Temporary Access)**:
    *   `vijay.parwal@gmail.com`
*   **Action**: I will configure the backend to guarantee these emails have appropriate access regardless of the general public restrictions.

### 1.2 User Tier Options (Please Choose One)

**[Option A] The "Preview" Model (Recommended for Cost Safety)**
*   **Basic (Free)**:
    *   **Mastering/Stems**: Limited to **30-second previews** only.
    *   **Mixer**: Playback only (no export).
    *   **Enhance**: Standard resolution (16-bit).
*   **Premium**:
    *   **All Features**: Unlimited full-track processing and export.
    *   **Quality**: High-Res (24-bit/96kHz), Full Stem Separation.
*   **Pros**: Minimizes Cloud Run CPU costs while demonstrating value.
*   **Cons**: Users might want to test meaningful results before buying.

**[Option B] The "Credits" Model**
*   **Basic (Free)**:
    *   **Credits**: **3 Full Generations** per month.
    *   **Mixer**: Basic features.
*   **Premium**:
    *   **Credits**: 100/month (or Unlimited).
*   **Pros**: Higher conversion (freemium), users get "real" results.
*   **Cons**: Higher compute risk if many free users sign up.

**[Option C] The "Feature Lock" Model**
*   **Basic (Free)**:
    *   **AI Features**: **LOCKED** (Mastering, Stems, Mixer Export).
    *   **Player**: Standard playback only.
*   **Premium**:
    *   **AI Features**: Unlocked.
*   **Pros**: Zero compute cost for free users.
*   **Cons**: Hardest to convert users (they can't "taste" the magic).

---

## 2. Performance Optimization (Planned for branch `feat/performance-opt`)

I will implement the following strictly "Commercial Safe" optimizations:

### 2.1 faster_demucs (Algorithm)
*   **Disable "Shifts"**: Set `shifts=0` (default is 1). This test-time augmentation improves quality slightly but doubles inference time. Disabling it yields **2x speedup**.
*   **Overlap Reduction**: Reduce overlap from 0.25 to 0.1. (~10-20% speedup).
*   **Impact**: Separation time reduces from ~2 mins to ~45-60 seconds.

### 2.2 Mastering Engine
*   **Optimization**: Replace `scipy.signal.fftconvolve` with `scipy.ndimage.convolve1d` or optimized overlap-add for long tracks.
*   **Parallelism**: Ensure thread safety for concurrent request handling.

### 2.3 Application Speed
*   **Model Caching**: Ensure Demucs models are pre-loaded in the container to avoid download on startup.
*   **Cold Start**: Optimize import sequence in `main.py`.

---

## 3. Next Steps
1.  **Select Option A, B, or C** for the Basic Tier limits.
2.  **Confirm Admin Emails**: Are `davidv111111@gmail.com` and `aelabs1003@gmail.com` the correct 2 admins?
3.  **Approve**: Once confirmed, I will start implementation on the new branch.
