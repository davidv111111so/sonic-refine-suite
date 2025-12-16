# Audio Engine Architecture

## FX Chain Topology
The application uses a **Parallel Split / Series Chain** topology inspired by professional DJ hardware (e.g., Traktor).

### Signal Flow
1. **Source Node** (Deck Player) -> **Splitter Node**
2. **Path A (Dry)**: Splitter -> `DryGain` -> Output
3. **Path B (Wet)**: Splitter -> `Slot 1` -> `Slot 2` -> `Slot 3` -> `WetGain` -> Output

### Mixing Logic
- **Equal Power Crossfade**: The Dry/Wet knob uses a trigonometric curve (`cos`/`sin`) to ensure constant power during crossfading.
  - `Dry = cos(mix * PI / 2)`
  - `Wet = sin(mix * PI / 2)`
- **Smoothing**: All parameter changes are smoothed using `linearRampToValueAtTime(target, t + 0.05)` (50ms) to eliminate digital artifacts ("zipper noise").

## FX Slot System
- **Dynamic Swapping**: Slots are hot-swappable. The audio graph dynamically disconnects and reconnects nodes when effect types change.
- **Bypass**: Bypassed slots pass the signal directly from Input to Output (Hard Bypass).

## Parameter Mappings
| Effect | Parameter | Range | Curve | Notes |
|--------|-----------|-------|-------|-------|
| **Filter** | Cutoff | 20Hz - 20kHz | Exponential | Highpass (Sweeps Open) |
| **Filter LFO** | LFO Rate | 0.1Hz - 10Hz | Linear | Auto-Wah style |
| **Delay** | Feedback | 0 - 0.95 | Linear | Digital precise repeats |
| **Tape Delay** | Feedback | 0 - 0.95 | Linear | Darker tone (LPF 2.5kHz) |
| **Reverb** | Wet Mix | 0 - 1.0 | Linear | Plate-style impulse |
| **Flanger** | LFO Rate | 0.1Hz - 5Hz | Linear | Jet-engine sweep |
| **Phaser** | LFO Rate | 0.1Hz - 8Hz | Linear | Dual All-pass filter sweep |
| **Tremolo** | LFO Rate | 1Hz - 20Hz | Linear | Amplitude Modulation |
| **Ring Mod** | Carrier | 100Hz - 2kHz | Linear | Metallic/Robotic FM |
| **Distortion** | Drive | 1 - 20 | Linear | WaveShaper (Mulholland curve) |
| **Gater** | LFO Rate | 1Hz - 20Hz | Linear | Square wave chopping |
