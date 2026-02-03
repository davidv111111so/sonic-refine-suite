import numpy as np
import librosa
import pyloudnorm as pyln
import soundfile as sf
import scipy.signal as signal
from typing import Tuple, Optional

class MasteringEngine:
    """
    A permissive-license (MIT/ISC) mastering engine.
    Replaces GPL 'Matchering' with transparent stats matching.
    """
    
    def __init__(self, sample_rate: int = 44100):
        self.sr = sample_rate

    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """Loads audio and ensures standard format (float32)."""
        y, sr = librosa.load(file_path, sr=self.sr, mono=False)
        return y, sr

    def analyze_track(self, y: np.ndarray, sr: int) -> dict:
        """extracts LUFS and Spectral Centroid."""
        # Ensure mono for analysis
        y_mono = librosa.to_mono(y)
        
        # Loudness (LUFS)
        meter = pyln.Meter(sr)
        loudness = meter.integrated_loudness(y_mono)
        
        # Spectral Centroid (Brightness)
        cent = librosa.feature.spectral_centroid(y=y_mono, sr=sr)
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
        if target_y.ndim == 1:
            y_measure = target_y
        else:
            y_measure = target_y.T # pyloudnorm expects (samples, channels)
            
        current_lufs = meter.integrated_loudness(y_measure)
        
        # Normalize
        video_lufs = ref_lufs # Target
        normalized_y = pyln.normalize.loudness(y_measure, current_lufs, video_lufs)
        
        return normalized_y.T if target_y.ndim > 1 else normalized_y

    def match_eq(self, target_y: np.ndarray, target_sr: int, ref_y: np.ndarray) -> np.ndarray:
        """
        Matches the Long-Term Average Spectrum (LTAS) of target to reference.
        Uses a simple FIR filter design to avoid heavy FFT artifacts.
        """
        # 1. Compute PSD (Power Spectral Density)
        # Use Welch's method for smooth spectrum
        f_ref, Pxx_ref = signal.welch(librosa.to_mono(ref_y), fs=target_sr, nperseg=4096)
        f_tar, Pxx_tar = signal.welch(librosa.to_mono(target_y), fs=target_sr, nperseg=4096)
        
        # 2. Derive Gain Curve (Filter Response needed)
        # Avoid division by zero
        Pxx_ref = np.maximum(Pxx_ref, 1e-10)
        Pxx_tar = np.maximum(Pxx_tar, 1e-10)
        
        gain_curve = np.sqrt(Pxx_ref / Pxx_tar)
        
        # Smooth the gain curve to prevent ringing
        gain_smooth = signal.savgol_filter(gain_curve, 51, 3)
        
        # 3. Design FIR Filter from Gain Curve
        # Create a filter kernel using frequency sampling method
        # This is a simplified approach; usually we'd use firwin2
        # matching frequencies 0 to Nyquist
        freqs = np.linspace(0, 1, len(gain_smooth))
        taps = signal.firwin2(1025, freqs, gain_smooth) # Default fs=2, so 0-1 is Nyquist
        
        # 4. Apply Filter
        if target_y.ndim > 1:
            y_eq = np.zeros_like(target_y)
            for i in range(target_y.shape[0]):
                y_eq[i] = signal.fftconvolve(target_y[i], taps, mode='same')
        else:
            y_eq = signal.fftconvolve(target_y, taps, mode='same')
            
        return y_eq

    def process(self, target_path: str, reference_path: str, output_path: str, target_lufs: Optional[float] = None):
        """Full Permissive Mastering Pipeline."""
        
        # 1. Load
        print(f"Loading Target: {target_path}")
        y_tar, sr = self.load_audio(target_path)
        
        print(f"Loading Reference: {reference_path}")
        y_ref, _ = self.load_audio(reference_path)
        
        # 2. Key Stats
        print("Analyzing Reference...")
        ref_stats = self.analyze_track(y_ref, sr)
        print(f"Reference LUFS: {ref_stats['lufs']:.2f} dB")
        
        # Determine Target LUFS
        final_lufs = target_lufs if target_lufs is not None else ref_stats['lufs']
        
        # 3. EQ Match (Spectral)
        print("Matching EQ Profile...")
        y_eq = self.match_eq(y_tar, sr, y_ref)
        
        # 4. Loudness Match
        print(f"Matching Loudness to {final_lufs:.2f} LUFS...")
        y_mastered = self.match_loudness(y_eq, sr, final_lufs)
        
        # 5. Safety Limiter (Hard Clip at -0.1 dB to prevent artifacts)
        peak = np.max(np.abs(y_mastered))
        if peak > 0.99:
            print("Limiting Peaks...")
            y_mastered = y_mastered * (0.99 / peak)
            
        # 6. Export
        print(f"Saving to {output_path}")
        sf.write(output_path, y_mastered.T if y_mastered.ndim > 1 else y_mastered, sr)
        
        return {
            "status": "success",
            "ref_lufs": ref_stats['lufs'],
            "target_lufs": final_lufs,
            "output_path": output_path
        }
