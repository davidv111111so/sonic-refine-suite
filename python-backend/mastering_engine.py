import numpy as np
import librosa
import pyloudnorm as pyln
import soundfile as sf
import scipy.signal as signal
import os
from typing import Tuple, Optional

class MasteringEngine:
    """
    A permissive-license (MIT/ISC) mastering engine.
    Replaces GPL 'Matchering' with transparent stats matching.
    """
    
    def __init__(self, sample_rate: int = 44100):
        self.sr = sample_rate

    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """Loads audio efficiently. Uses soundfile for WAV, librosa for others."""
        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if ext == '.wav':
                # soundfile is much faster for wav
                y, sr = sf.read(file_path, always_2d=True, dtype='float32')
                y = y.T # Back to [channels, samples]
            else:
                # Use librosa for compressed formats
                y, sr = librosa.load(file_path, sr=None, mono=False)
            
            # EMERGENCY FIX for "int object has no attribute ndim"
            # If y is int and sr is array/float, SWAP THEM
            if not hasattr(y, 'ndim') and (hasattr(sr, 'ndim') or isinstance(sr, float)):
                y, sr = sr, y
                
            # Final verification: y must be a numpy array
            if not hasattr(y, 'ndim'):
                # Try one last absolute fallback if the above failed
                print(f"   ⚠️ load_audio fallback for {file_path}")
                y, sr = librosa.load(file_path, sr=self.sr, mono=False)
            
            # Resample only if necessary
            if sr != self.sr:
                y = librosa.resample(y, orig_sr=sr, target_sr=self.sr)
                sr = self.sr
                
            return y, sr
        except Exception as e:
            # Absolute fallback
            try:
                y, sr = librosa.load(file_path, sr=self.sr, mono=False)
                return y, sr
            except Exception as lib_err:
                raise lib_err

    def _get_ndim(self, arr) -> int:
        """Helper to safely get ndim of an object which might not be an array."""
        return getattr(arr, 'ndim', 0)

    def analyze_track(self, y: np.ndarray, sr: int) -> dict:
        """extracts LUFS and Spectral Centroid efficiently."""
        # Use mono for analysis
        y_mono = librosa.to_mono(y) if self._get_ndim(y) > 1 else y
        
        # Loudness (LUFS)
        meter = pyln.Meter(sr)
        # pyloudnorm expects (samples, channels)
        y_ln = y.T if self._get_ndim(y) > 1 else y
        loudness = meter.integrated_loudness(y_ln)
        
        # Spectral Centroid (Brightness) - downsample for speed in analysis if track is long
        duration = len(y_mono) / sr
        if duration > 30:
            # Analyze every 10th sample for centroid to speed up
            cent_y = y_mono[::4]
            cent_sr = sr // 4
        else:
            cent_y = y_mono
            cent_sr = sr

        cent = librosa.feature.spectral_centroid(y=cent_y, sr=cent_sr)
        avg_centroid = np.mean(cent)
        
        return {
            "lufs": loudness,
            "centroid": avg_centroid
        }

    def match_loudness(self, target_y: np.ndarray, target_sr: int, ref_lufs: float) -> np.ndarray:
        """Matches target audio to reference LUFS."""
        # Measure current loudness
        meter = pyln.Meter(target_sr)
        
        # Handle stereo/mono
        if self._get_ndim(target_y) == 1:
            y_measure = target_y
        else:
            y_measure = target_y.T # pyloudnorm expects (samples, channels)
            
        current_lufs = meter.integrated_loudness(y_measure)
        
        # Normalize
        video_lufs = ref_lufs # Target
        normalized_y = pyln.normalize.loudness(y_measure, current_lufs, video_lufs)
        
        return normalized_y.T if self._get_ndim(target_y) > 1 else normalized_y

    def match_eq(self, target_y: np.ndarray, target_sr: int, ref_y: np.ndarray) -> np.ndarray:
        """
        Matches the Long-Term Average Spectrum (LTAS) of target to reference.
        Uses a compact FIR filter (513 taps) for speed and oaconvolve for long tracks.
        """
        # 1. Compute PSD (Power Spectral Density) using Welch's method
        # Ensure nperseg is not larger than signal length
        nperseg = min(len(ref_y) if self._get_ndim(ref_y) == 1 else ref_y.shape[1], 
                      len(target_y) if self._get_ndim(target_y) == 1 else target_y.shape[1], 
                      4096)
        if nperseg < 256: nperseg = 256 # Minimum reasonable window
        
        f_ref, Pxx_ref = signal.welch(librosa.to_mono(ref_y), fs=target_sr, nperseg=nperseg)
        f_tar, Pxx_tar = signal.welch(librosa.to_mono(target_y), fs=target_sr, nperseg=nperseg)
        
        # 2. Derive Gain Curve
        Pxx_ref = np.maximum(Pxx_ref, 1e-10)
        Pxx_tar = np.maximum(Pxx_tar, 1e-10)
        
        gain_curve = np.sqrt(Pxx_ref / Pxx_tar)
        
        # Clamp extreme gain values to prevent artifacts
        gain_curve = np.clip(gain_curve, 0.1, 10.0)
        
        # Smooth the gain curve to prevent ringing
        gain_smooth = signal.savgol_filter(gain_curve, 51, 3)
        
        # 3. Design compact FIR Filter (513 taps instead of 1025 -> ~2x faster)
        freqs = np.linspace(0, 1, len(gain_smooth))
        taps = signal.firwin2(513, freqs, gain_smooth)
        
        # 4. Apply Filter using oaconvolve (overlap-add, optimal for short filter + long signal)
        if self._get_ndim(target_y) > 1:
            y_eq = np.zeros_like(target_y)
            for i in range(target_y.shape[0]):
                y_eq[i] = signal.oaconvolve(target_y[i], taps, mode='same')
        else:
            y_eq = signal.oaconvolve(target_y, taps, mode='same')
            
        return y_eq

    def process(self, target_path: str, reference_path: str, output_path: str, target_lufs: Optional[float] = None, draft_mode: bool = False):
        """Full Permissive Mastering Pipeline."""
        if draft_mode:
            print("[INFO] DRAFT MODE ENABLED: Using speed-optimized pipeline")
            # Force 44.1k for draft mode even if system default is higher
            self.sr = 44100

        # 1. Load
        print(f"   📥 Loading Target: {os.path.basename(target_path)}")
        y_tar, sr = self.load_audio(target_path)
        
        print(f"   📥 Loading Reference: {os.path.basename(reference_path)}")
        y_ref, _ = self.load_audio(reference_path)
        
        import gc
        gc.collect()
        
        # 2. Analyze
        print("   🔍 Analyzing tracks...")
        ref_stats = self.analyze_track(y_ref, self.sr)
        
        # 3. Match EQ
        print("   🎛️ Matching EQ...")
        y_eq = self.match_eq(y_tar, self.sr, y_ref)
        
        # Free memory associated with targets
        del y_tar
        del y_ref
        gc.collect()
        
        # 4. Match Loudness
        print("   🔊 Normalizing Loudness...")
        target_loudness = target_lufs if target_lufs is not None else ref_stats['lufs']
        
        # Ensure we don't over-boost in draft mode to avoid complex limiting
        if draft_mode:
             target_loudness = min(target_loudness, -10.0) 

        meter = pyln.Meter(self.sr)
        y_ln = y_eq.T if self._get_ndim(y_eq) > 1 else y_eq
        curr_lufs = meter.integrated_loudness(y_ln)
        y_master = pyln.normalize.loudness(y_eq.T, curr_lufs, target_loudness).T
        
        # 5. Peak Limiter (Soft clip for speed in draft, or simple clamp)
        print("[INFO] Applying Peak Limiter...")
        max_val = np.max(np.abs(y_master))
        if max_val > 0.98:
            y_master = y_master * (0.95 / max_val)
            
        # 6. Export
        print(f"[INFO] Exporting to {output_path}")
        sf.write(output_path, y_master.T, self.sr)
        
        # Cleanup
        del y_eq
        del y_master
        gc.collect()
        
        return {
            "success": True,
            "lufs": target_loudness,
            "sr": self.sr
        }
