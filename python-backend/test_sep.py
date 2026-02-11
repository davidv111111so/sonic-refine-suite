
import os
import sys
from pathlib import Path

# Add python-backend to path
sys.path.append(str(Path(__file__).parent))

from stems_separation import separate_audio

def progress_cb(p):
    print(f"Progress: {p}%")

# Create a dummy silent wav for testing if needed, 
# but better to use a real one if I can find one.
# Let's just try to separate a file if it exists.

test_file = "test_audio.wav"
# Create a 1 sec silent wav using wave
import wave
import struct

with wave.open(test_file, 'w') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(44100)
    for i in range(44100):
        value = 0
        data = struct.pack('<h', value)
        f.writeframesraw(data)

print(f"Testing separation on {test_file}...")
result = separate_audio(
    test_file, 
    "test_output", 
    library='demucs', 
    model_name='htdemucs', 
    progress_callback=progress_cb
)

print(f"Result: {result}")
if os.path.exists(test_file):
    os.remove(test_file)
