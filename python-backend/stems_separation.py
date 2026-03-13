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

def separate_audio(file_path, output_dir, library='demucs', model_name='htdemucs', shifts=1, overlap=0.25, two_stems=False, speed_mode='fast', progress_callback=None):
    """
    Separate audio into stems using Demucs or Spleeter.
    
    Args:
        file_path (str): Path to the input audio file.
        output_dir (str): Directory to save the separated stems.
        library (str): 'demucs' or 'spleeter'.
        model_name (str): Model name (e.g., 'htdemucs' for Demucs, '2stems' for Spleeter).
        shifts (int): Number of random shifts for Demucs.
        overlap (float): Overlap between splits for Demucs.
        two_stems (bool): If True, mix non-vocal stems into 'instrumental'.
        speed_mode (str): 'fast', 'standard', or 'draft'.
        progress_callback (callable): Function to call with progress (0-100).
        
    Returns:
        dict: Result info including success status and output path.
    """
    try:
        file_path = Path(file_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        import librosa
        import soundfile as sf
        
        # 1. OPTIMIZATION: Check for FASTEST/FAST mode and resample early if needed
        # (This avoids heavy processing on 96k/192k files)
        if speed_mode in ['fastest', 'fast']:
             print(f"[INFO] {speed_mode.upper()} MODE: Applying pre-resampling and speed optimizations")
             
             try:
                 # Use librosa.load which is more robust than sf.read (handles MP3, etc.)
                 # We load with sr=None to get native sample rate
                 y, sr = librosa.load(str(file_path), sr=None, mono=False)
                 
                 # librosa.load returns (channels, samples) for stereo
                 if sr > 44100:
                     print(f"   [INFO] Downsampling from {sr} to 44100 to save processing time...")
                     y_resampled = librosa.resample(y, orig_sr=sr, target_sr=44100)
                     # Save to temporary file to use as input
                     temp_resampled = file_path.parent / f"resampled_{file_path.name}"
                     # sf.write expects (samples, channels)
                     sf.write(str(temp_resampled), y_resampled.T if y_resampled.ndim > 1 else y_resampled, 44100)
                     file_path = temp_resampled
             except Exception as read_err:
                 print(f"[WARNING] Pre-resampling check failed: {str(read_err)}. Continuing with original file.")
        
        print(f"[INFO] Starting separation with {library}...")

        # --- SPLEETER PATH (FAST) ---
        if library == 'spleeter':
            if progress_callback: progress_callback(10)
            print("   Using Spleeter for high-speed separation...")
            
            num_stems = 2 if two_stems else 4
            # Spleeter command
            spleeter_bin = os.environ.get('SPLEETER_PATH', 'spleeter')
            if ' ' in spleeter_bin: # Handle potential complex paths
                cmd = f"{spleeter_bin} separate -o \"{output_dir}\" -p spleeter:{num_stems}stems \"{file_path}\""
                shell = True
            else:
                cmd = [
                    spleeter_bin, "separate",
                    "-o", str(output_dir),
                    "-p", f"spleeter:{num_stems}stems",
                    str(file_path)
                ]
                shell = False
            
            print(f"   Executing: {cmd if isinstance(cmd, str) else ' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, shell=shell)
            
            if result.returncode != 0:
                print(f"[ERROR] Spleeter failed: {result.stderr}")
                # Fallback to Demucs fast if spleeter isn't installed
                print("[WARNING] Falling back to Demucs (Fast Mode)...")
                library = 'demucs'
                speed_mode = 'fast'
            else:
                spleeter_out = output_dir / file_path.stem
                stems = list(spleeter_out.glob("*.wav"))
                if progress_callback: progress_callback(100)
                return {
                    "success": True,
                    "output_path": str(spleeter_out),
                    "stems": [str(s) for s in stems]
                }

        # --- LEVEL STEM SEPARATION (PREMIUM PATH) ---
        if library == 'demucs':
            import torch
            import torchaudio
            
            # --- REPLICATE COMMERCIAL API INTEGRATION ---
            replicate_api_token = os.environ.get('REPLICATE_API_TOKEN')
            if replicate_api_token:
                import replicate
                import requests
                import soundfile as sf
                import numpy as np
                
                print(f"[INFO] 💰 Replicate API Token detected! Routing request to commercial GPU backend.")
                if progress_callback: progress_callback(10)
                
                try:
                    # Run Replicate explicitly
                    print(f"   Uploading & running on Replicate's Demucs API (cjwbw/demucs)...")
                    # Using the latest open-source htdemucs model version on Replicate for maximum quality
                    with open(str(file_path), "rb") as audio_file:
                        output = replicate.run(
                            "cjwbw/demucs:25a173108cff36ef9f80f70f2f3b9c7cfcc686b24de8115eb3751d3822184ad2",
                            input={"audio": audio_file}
                        )
                    
                    if progress_callback: progress_callback(80)
                    print(f"   [CORE] Commercial API separation completed. Downloading stems...")
                    
                    track_name = file_path.stem
                    final_output_path = output_dir / model_name / track_name
                    final_output_path.mkdir(parents=True, exist_ok=True)
                    
                    saved_files = []
                    
                    if isinstance(output, dict):
                        for stem_name, stem_url in output.items():
                            if stem_url and isinstance(stem_url, str) and stem_url.startswith('http'):
                                print(f"   Downloading stem: {stem_name}...")
                                stem_file_path = final_output_path / f"{stem_name}.wav"
                                
                                resp = requests.get(stem_url)
                                resp.raise_for_status()
                                with open(str(stem_file_path), 'wb') as f:
                                    f.write(resp.content)
                                    
                                saved_files.append(str(stem_file_path))
                    else:
                        raise Exception(f"Unexpected output format from Replicate: {output}")

                    # Handle 2-stems mixing
                    if two_stems and any(Path(f).stem == 'vocals' for f in saved_files):
                        print("   Mixing down to 2 stems (Vocals + Instrumental)...")
                        vocals_path = next((f for f in saved_files if Path(f).stem == 'vocals'), None)
                        other_paths = [f for f in saved_files if Path(f).stem != 'vocals']
                        
                        if vocals_path:
                            vocals_np, sr = sf.read(vocals_path)
                            inst_np = np.zeros_like(vocals_np)
                            
                            for p in other_paths:
                                p_np, sr_p = sf.read(p)
                                min_len = min(inst_np.shape[0], p_np.shape[0])
                                inst_np[:min_len] += p_np[:min_len]
                            
                            inst_path = final_output_path / "instrumental.wav"
                            sf.write(str(inst_path), inst_np, sr)
                            
                            # Update saved_files to only return the required 2 stems
                            saved_files = [vocals_path, str(inst_path)]

                    if progress_callback: progress_callback(100)
                    
                    return {
                        "success": True,
                        "output_path": str(final_output_path),
                        "stems": saved_files
                    }
                    
                except Exception as api_err:
                    print(f"[ERROR] Replicate API Failed: {api_err}. Falling back to local CPU Demucs...")
            else:
                print(f"[WARNING] ⚠️ REPLICATE_API_TOKEN not found in .env!")
                print(f"[WARNING]    Processing premium stems on local CPU (Demucs).")
                print(f"[WARNING]    This drains profitability! Retrieve your Replicate API key to activate hardware acceleration.")

            import torch
            import torchaudio
            from demucs.pretrained import get_model
            from demucs.apply import apply_model
            import soundfile as sf
            import numpy as np

            # Apply speed_mode overrides
            if speed_mode == 'fastest':
                shifts = 0
                overlap = 0.0
                print(f"[INFO] FASTEST MODE: shifts=0, overlap=0.0")
            elif speed_mode == 'fast':
                shifts = 0
                overlap = 0.1
                print(f"[INFO] FAST MODE: shifts=0, overlap=0.1 (~2x faster)")
            else:
                shifts = max(shifts, 1)  # Ensure at least 1 shift for normal mode
                overlap = max(overlap, 0.25)
                print(f"[INFO] NORMAL MODE: shifts={shifts}, overlap={overlap} (highest quality)")
            
            if progress_callback: progress_callback(5)

            # Load model and detect GPU
            print(f"   Loading Demucs model: {model_name}")
            model = get_model(model_name)
            
            # Auto-detect CUDA GPU
            if torch.cuda.is_available():
                device = torch.device('cuda')
                print(f"   🚀 GPU DETECTED: {torch.cuda.get_device_name(0)} — Using CUDA acceleration!")
            else:
                device = torch.device('cpu')
                print(f"   ⚠️ No GPU detected — Using CPU (slower)")
            
            model.to(device)
            model.eval()

            if progress_callback: progress_callback(15)

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

            if progress_callback: progress_callback(25)

            # Add batch dimension: [channels, length] -> [1, channels, length]
            if wav.shape[0] == 1:
                print("   Converting mono to stereo for Demucs stability...")
                wav = torch.cat([wav, wav], dim=0)
                
            wav = wav.unsqueeze(0)

            # Move audio to same device as model
            wav = wav.to(device)

            # Separate
            print(f"   Separating (tensor shape: {wav.shape})...")
            ref = wav.mean(0)
            # Avoid division by zero for silent files
            std = ref.std()
            if std == 0:
                std = 1.0
            wav = (wav - ref.mean()) / std
            
            # Start simulated progress thread for the separation phase
            stop_progress = threading.Event()
            
            def simulate_progress():
                current_progress = 25.0
                target_progress = 85.0
                fps = 2 # updates per second (slower for less DB overhead)
                # Fast mode is ~2-3x faster than standard
                # Adjust duration based on audio length if possible, or use a safer larger estimate
                estimated_duration = 120 if speed_mode in ['fastest', 'fast'] else 300  # seconds estimate for CPU
                step = (target_progress - current_progress) / (estimated_duration * fps)
                
                print(f"   [PROGRESS] Simulating progress from 25 to 85 over approx {estimated_duration}s")
                
                while not stop_progress.is_set() and current_progress < target_progress:
                    time.sleep(1.0 / fps)
                    # Exponential slowdown as we approach 85% to avoid looking "stuck"
                    if current_progress > 70:
                        dynamic_step = step * (1.0 - (current_progress - 70) / (target_progress - 70) * 0.9)
                    else:
                        dynamic_step = step
                        
                    current_progress += dynamic_step
                    if progress_callback:
                        progress_callback(int(current_progress))
            
            progress_thread = threading.Thread(target=simulate_progress)
            progress_thread.daemon = True
            progress_thread.start()

            try:
                # Apply model
                print(f"   [CORE] Applying Demucs model (shifts={shifts}, overlap={overlap})...")
                start_time = time.time()
                
                # Spectral Pre-Downsampling optimization for 'fastest' mode
                fastest_downsample_ratio = 1
                if speed_mode == 'fastest' and sr > 22050:
                    fastest_downsample_ratio = sr / 22050
                    print(f"   [OPTIMIZATION] Temporarily downsampling Tensor to 22.05kHz for 'fastest' processing...")
                    # Update local sr strictly for Model inference downsampling
                    transform_down = torchaudio.transforms.Resample(sr, 22050).to(wav.device)
                    wav_inference = transform_down(wav)
                    inference_sr = 22050
                else:
                    wav_inference = wav
                    inference_sr = sr

                # We use a try-except here to catch potential memory/torch errors
                try:
                    # htdemucs normally segments audio automatically
                    sources = apply_model(model, wav_inference, shifts=shifts, overlap=overlap)[0]
                    elapsed = time.time() - start_time
                    print(f"   [CORE] Separation completed in {elapsed:.1f}s")
                except Exception as ae:
                    print(f"⚠️ Demucs core separation failed: {ae}. Retrying with absolute minimum parameters...")
                    # Try with 0 shifts and minimal overlap if it failed
                    sources = apply_model(model, wav_inference, shifts=0, overlap=0.0)[0]
                
                # Upsample back to original resolution if we downsampled
                if fastest_downsample_ratio > 1:
                    print(f"   [OPTIMIZATION] Upsampling resulting sources back to {sr}Hz and applying as spectral masks...")
                    transform_up = torchaudio.transforms.Resample(inference_sr, sr).to(sources.device)
                    sources_up = transform_up(sources)
                    
                    # Ensure dimensions match exactly after resampling due to fractional issues
                    if sources_up.shape[-1] != wav.shape[-1]:
                        diff = wav.shape[-1] - sources_up.shape[-1]
                        if diff > 0:
                            sources_up = torch.nn.functional.pad(sources_up, (0, diff))
                        elif diff < 0:
                            sources_up = sources_up[..., :diff]
                            
                    # Apply as soft masks to the original high-resolution audio
                    # This preserves high frequencies that were lost during downsampling
                    eps = 1e-10
                    total_energy = sources_up.abs().sum(dim=0) + eps
                    masks = sources_up.abs() / total_energy
                    
                    sources = masks * wav.to(sources_up.device)
                else:
                    sources = sources

                sources = sources * std + ref.mean()
            except Exception as inner_e:
                print(f"[ERROR] Core separation failed definitively: {str(inner_e)}")
                raise inner_e
            finally:
                stop_progress.set()
                try:
                    progress_thread.join(timeout=2)
                except:
                    pass

            if progress_callback: progress_callback(90) # Separation done

            # Save stems
            track_name = file_path.stem
            output_path = output_dir / model_name / track_name
            output_path.mkdir(parents=True, exist_ok=True)
            
            source_names = model.sources
            saved_files = []
            
            print(f"   Saving stems to {output_path}...")
            
            # Handle 2-stem logic (Vocals + Instrumental)
            if two_stems and "vocals" in source_names:
                print("   Mixing down to 2 stems (Vocals + Instrumental)...")
                
                # Find indices
                vocals_idx = source_names.index("vocals")
                other_indices = [i for i, name in enumerate(source_names) if name != "vocals"]
                
                # Save Vocals
                vocals_source = sources[vocals_idx].cpu().numpy().T
                vocals_path = output_path / "vocals.wav"
                sf.write(str(vocals_path), vocals_source, sr)
                saved_files.append(str(vocals_path))
                
                # Mix Instrumental
                instrumental_source = np.zeros_like(vocals_source)
                for idx in other_indices:
                    instrumental_source += sources[idx].cpu().numpy().T
                
                instrumental_path = output_path / "instrumental.wav"
                sf.write(str(instrumental_path), instrumental_source, sr)
                saved_files.append(str(instrumental_path))
                
            else:
                # Standard saving
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
            
        print(f"[ERROR] Unsupported library requested: {library}")
        return {
            "success": False,
            "error": f"Unsupported library: {library}"
        }
            
    except Exception as e:
        print(f"[ERROR] Separation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }
