"""
Audio Analysis Module for LUFS Measurement
Provides loudness analysis for mastering quality control
"""
import pyloudnorm as pyln
import soundfile as sf
import numpy as np

def analyze_lufs(file_path: str) -> dict:
    """
    Analyze audio file for LUFS loudness and dynamics
    
    Args:
        file_path: Path to audio file (WAV, FLAC, MP3)
        
    Returns:
        dict with:
            - integrated_lufs: Overall loudness (LUFS)
            - true_peak_db: Maximum true peak (dBTP)
            - dynamic_range_db: Estimated dynamic range
            - sample_rate: Original sample rate
            - duration_seconds: File duration
    """
    try:
        # Load audio file
        data, rate = sf.read(file_path)
        
        # Handle mono/stereo
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        
        # Calculate duration
        duration = len(data) / rate
        
        # Initialize loudness meter (ITU-R BS.1770-4)
        meter = pyln.Meter(rate)
        
        # Calculate integrated LUFS
        integrated_lufs = meter.integrated_loudness(data)
        
        # Calculate true peak
        true_peak = np.max(np.abs(data))
        true_peak_db = 20 * np.log10(true_peak) if true_peak > 0 else -np.inf
        
        # Estimate dynamic range (simplified)
        # Using difference between peak and RMS
        rms = np.sqrt(np.mean(data ** 2))
        rms_db = 20 * np.log10(rms) if rms > 0 else -np.inf
        dynamic_range_db = true_peak_db - rms_db
        
        return {
            "integrated_lufs": round(integrated_lufs, 2),
            "true_peak_db": round(true_peak_db, 2),
            "dynamic_range_db": round(dynamic_range_db, 2),
            "sample_rate": rate,
            "duration_seconds": round(duration, 2),
            "success": True
        }
        
    except Exception as e:
        return {
            "integrated_lufs": None,
            "true_peak_db": None,
            "dynamic_range_db": None,
            "sample_rate": None,
            "duration_seconds": None,
            "success": False,
            "error": str(e)
        }


def get_loudness_category(lufs: float) -> str:
    """
    Categorize loudness level
    
    Args:
        lufs: Integrated LUFS value
        
    Returns:
        Category: 'very_loud', 'loud', 'optimal', 'quiet', 'very_quiet'
    """
    if lufs >= -6:
        return "very_loud"
    elif lufs >= -8:
        return "loud"
    elif lufs >= -12:
        return "optimal"
    elif lufs >= -16:
        return "quiet"
    else:
        return "very_quiet"


def is_reference_suitable(lufs: float, genre: str = None) -> dict:
    """
    Check if reference track is suitable for mastering
    
    Args:
        lufs: Integrated LUFS of reference
        genre: Optional genre for specific recommendations
        
    Returns:
        dict with:
            - suitable: bool
            - warning_level: 'none', 'caution', 'warning'
            - message: Human-readable message
            - recommended_range: Suggested LUFS range
    """
    # Genre-specific optimal ranges
    genre_ranges = {
        "edm": (-7, -9),
        "dance": (-7, -9),
        "pop": (-8, -10),
        "hip-hop": (-8, -10),
        "rock": (-7, -9),
        "metal": (-7, -9),
        "indie": (-8, -11),
        "jazz": (-12, -16),
        "classical": (-14, -20),
        "acoustic": (-12, -16)
    }
    
    # Default range for unknown genres
    optimal_min, optimal_max = genre_ranges.get(genre.lower() if genre else None, (-8, -12))
    
    # Determine suitability
    if lufs >= -6:
        return {
            "suitable": False,
            "warning_level": "warning",
            "message": f"⚠️ Reference muy loud ({lufs} LUFS). Puede causar distorsión y artifacts. Recomendado: {optimal_min} a {optimal_max} LUFS",
            "recommended_range": (optimal_min, optimal_max)
        }
    elif lufs >= -7:
        return {
            "suitable": True,
            "warning_level": "caution",
            "message": f"⚡ Reference loud ({lufs} LUFS). Puede reducir dinámica. Óptimo: {optimal_min} a {optimal_max} LUFS",
            "recommended_range": (optimal_min, optimal_max)
        }
    elif optimal_min <= lufs <= optimal_max:
        return {
            "suitable": True,
            "warning_level": "none",
            "message": f"✅ Reference óptima ({lufs} LUFS) para {genre or 'este género'}",
            "recommended_range": (optimal_min, optimal_max)
        }
    elif lufs < -16:
        return {
            "suitable": True,
            "warning_level": "caution",
            "message": f"📉 Reference quiet ({lufs} LUFS). Resultado puede ser menos loud. Óptimo: {optimal_min} a {optimal_max} LUFS",
            "recommended_range": (optimal_min, optimal_max)
        }
    else:
        return {
            "suitable": True,
            "warning_level": "none",
            "message": f"✓ Reference aceptable ({lufs} LUFS)",
            "recommended_range": (optimal_min, optimal_max)
        }
