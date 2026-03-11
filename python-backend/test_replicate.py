import os
import sys
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.dirname(__file__))

import numpy as np
import soundfile as sf
import tempfile
from stems_separation import separate_audio

# Create dummy audio
temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False).name
data = np.random.uniform(-1, 1, (44100, 2))
sf.write(temp_wav, data, 44100)

print(f"Testing local stems_separation.py on dummy file...")
os.environ["REPLICATE_API_TOKEN"] = "" # Turn off replicate to test demucs directly
result = separate_audio(temp_wav, "stems_out", speed_mode="fastest")
print("RESULT:", result)
os.unlink(temp_wav)
