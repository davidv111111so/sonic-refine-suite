import numpy as np
import wave
import os
import struct

def generate_sample(filename, genre):
    # Parameters
    duration = 5.0  # seconds
    sample_rate = 44100
    num_samples = int(duration * sample_rate)
    
    # Generate audio data
    t = np.linspace(0, duration, num_samples, endpoint=False)
    
    if genre == "rock" or genre == "indie-rock" or genre == "punk-rock" or genre == "metal":
        # Distorted sound (Square wave + noise)
        audio = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.3
        audio += np.sign(np.sin(2 * np.pi * 220 * t)) * 0.2
        audio += (np.random.rand(num_samples) - 0.5) * 0.1
    elif genre == "dance-pop" or genre == "edm" or genre == "house" or genre == "techno" or genre == "drum-bass" or genre == "dubstep":
        # Synth sound (Sawtooth + Sine sub)
        audio = (2 * (t * 130 % 1) - 1) * 0.3
        audio += np.sin(2 * np.pi * 65 * t) * 0.4
    elif genre == "hip-hop" or genre == "trap" or genre == "reggaeton":
        # Bass heavy (Sine sub + click)
        audio = np.sin(2 * np.pi * 60 * t) * 0.6
        # Add a "kick" every beat (120 bpm)
        for i in range(int(duration * 2)):
            start = int(i * 0.5 * sample_rate)
            end = start + int(0.1 * sample_rate)
            if end < num_samples:
                audio[start:end] *= (1 + np.exp(-np.linspace(0, 10, end-start)))
    elif genre == "jazz" or genre == "rnb-soul":
        # Smooth (Sine + harmonics)
        audio = np.sin(2 * np.pi * 440 * t) * 0.4
        audio += np.sin(2 * np.pi * 880 * t) * 0.1
    else:
        # Default (Sine)
        audio = np.sin(2 * np.pi * 440 * t) * 0.5

    # Normalize and convert to 16-bit PCM
    audio = np.clip(audio, -1, 1)
    audio_int = (audio * 32767).astype(np.int16)
    
    # Write to WAV
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        f.writeframes(audio_int.tobytes())

presets = [
    "rock", "indie-rock", "punk-rock", "metal", 
    "dance-pop", "drum-bass", "dubstep", "edm", 
    "house", "techno", "hip-hop", "reggae", 
    "reggaeton", "rnb-soul", "trap", "pop", 
    "kpop-jpop", "latin-pop", "country", "jazz"
]

output_dir = "public/samples/genres"
for preset in presets:
    filepath = f"{output_dir}/{preset}.wav"
    print(f"Generating {filepath}...")
    generate_sample(filepath, preset)

print("Done!")
