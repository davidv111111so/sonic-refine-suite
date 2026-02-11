
import os
import sys
from pathlib import Path
import wave
import struct

# Add python-backend to path
sys.path.append(str(Path(__file__).parent))

from stems_separation import separate_audio

def progress_cb(p):
    print(f"Progress: {p}%")

test_file = "test_audio_long.wav"
# Create a 10 sec silent wav
with wave.open(test_file, 'w') as f:
    f.setnchannels(2) # Stereo
    f.setsampwidth(2)
    f.setframerate(44100)
    for i in range(44100 * 10):
        # A bit of noise so it's not perfectly zero? No, silent is fine.
        data = struct.pack('<hh', 0, 0)
        f.writeframesraw(data)

print(f"Testing separation on {test_file} (10s stereo)...")
try:
    result = separate_audio(
        test_file, 
        "test_output", 
        library='demucs', 
        model_name='htdemucs', 
        progress_callback=progress_cb
    )
    print(f"Result: {result}")
except Exception as e:
    print(f"Caught top-level exception: {e}")

if os.path.exists(test_file):
    os.remove(test_file)
