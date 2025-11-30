import os
import time
import subprocess
import sys
import threading
from pathlib import Path

def estimate_processing_time(duration, library, hardware_type='cpu'):
    """
    Estimate processing time based on audio duration and hardware.
    Returns estimated seconds.
    """
    # Heuristics based on typical performance
    if library == 'spleeter':
        # Spleeter is fast, approx 1/4 to 1/2 real-time on CPU
        factor = 0.3 if hardware_type == 'gpu' else 0.5
    elif library == 'demucs':
        # Demucs is slower, approx 1-2x real-time on CPU, 0.2x on GPU
        factor = 0.2 if hardware_type == 'gpu' else 1.5
    else:
        factor = 1.0
    
    return duration * factor

def separate_audio(file_path, output_dir, library='demucs', model_name='htdemucs', shifts=1, overlap=0.25, progress_callback=None):
    """
    Separate audio into stems using Demucs.
    
    Args:
        file_path (str): Path to the input audio file.
        output_dir (str): Directory to save the separated stems.
        library (str): 'demucs' (Spleeter removed).
        model_name (str): Model name (e.g., 'htdemucs').
        shifts (int): Number of random shifts for Demucs.
        overlap (float): Overlap between splits for Demucs.
        progress_callback (callable): Function to call with progress (0-100).
        
    Returns:
        dict: Result info including success status and output path.
    """
    try:
        file_path = Path(file_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"🎵 Starting separation with {library} using model {model_name}...")
        
        if library != 'demucs':
             raise ValueError(f"Unsupported library: {library}. Only Demucs is supported.")

        import torch
        import torchaudio
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        import soundfile as sf

        if progress_callback:
            progress_callback(5) # Started

        # Load model
        print(f"   Loading Demucs model: {model_name}")
        model = get_model(model_name)
        model.cpu()
        model.eval()

        if progress_callback:
            progress_callback(10) # Model loaded

        # Load audio
        print(f"   Loading audio: {file_path}")
        # Use soundfile to avoid torchaudio backend issues
        wav_np, sr = sf.read(str(file_path))
        
        # Convert to torch tensor: [length, channels] -> [channels, length]
        wav = torch.from_numpy(wav_np).float()
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)
        else:
            wav = wav.t()
        
        # Resample if necessary
        if sr != model.samplerate:
            resampler = torchaudio.transforms.Resample(sr, model.samplerate)
            wav = resampler(wav)
            sr = model.samplerate

        if progress_callback:
            progress_callback(20) # Audio loaded

        # Add batch dimension: [channels, length] -> [1, channels, length]
        wav = wav.unsqueeze(0)

        # Separate
        print(f"   Separating...")
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / ref.std()
        
        # Start simulated progress thread for the separation phase
        # Demucs separation can take time, and we don't have a direct callback.
        # We'll simulate progress from 20 to 85 over an estimated duration.
        stop_progress = threading.Event()
        
        def simulate_progress():
            current_progress = 20
            # Estimate: 3 minutes (180s) for a typical song
            # We'll increment slowly.
            while not stop_progress.is_set() and current_progress < 85:
                time.sleep(1)
                # Logarithmic-ish slowdown
                if current_progress < 50:
                    increment = 0.5
                elif current_progress < 70:
                    increment = 0.2
                else:
                    increment = 0.1
                
                current_progress += increment
                if progress_callback:
                    progress_callback(int(current_progress))
        
        progress_thread = threading.Thread(target=simulate_progress)
        progress_thread.daemon = True
        progress_thread.start()

        try:
            # Apply model
            sources = apply_model(model, wav, shifts=shifts, overlap=overlap)[0]
            sources = sources * ref.std() + ref.mean()
        finally:
            stop_progress.set()
            progress_thread.join(timeout=1)

        if progress_callback:
            progress_callback(90) # Separation done

        # Save stems
        track_name = file_path.stem
        output_path = output_dir / model_name / track_name
        output_path.mkdir(parents=True, exist_ok=True)
        
        source_names = model.sources
        saved_files = []
        
        print(f"   Saving stems to {output_path}...")
        for i, (source, name) in enumerate(zip(sources, source_names)):
            stem_path = output_path / f"{name}.wav"
            # source is [channels, length], soundfile expects [length, channels]
            source = source.cpu().numpy().T
            sf.write(str(stem_path), source, sr)
            saved_files.append(str(stem_path))
            
            # Update progress for saving
            if progress_callback:
                progress = 90 + int((i + 1) / len(source_names) * 10)
                progress_callback(progress)
        
        return {
            "success": True,
            "output_path": str(output_path),
            "stems": saved_files
        }
            
    except Exception as e:
        print(f"❌ Separation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }
