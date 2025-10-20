/**
 * Global AudioContext Manager
 * Solves the 1-second audio playback bug caused by browser autoplay policies
 * Creates a singleton AudioContext and resumes it on first user interaction
 */

let audioContext: AudioContext | null = null;
let isResumed = false;

/**
 * Get the singleton AudioContext instance
 * Creates it if it doesn't exist
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported in this browser");
    }
    
    audioContext = new AudioContextClass();
    console.log("AudioContext created with state:", audioContext.state);
  }
  
  return audioContext;
}

/**
 * Resume the AudioContext if it's suspended
 * Must be called from a user interaction event (click, touch, etc.)
 */
export async function resumeAudioContext(): Promise<void> {
  if (isResumed) return;
  
  const context = getAudioContext();
  
  if (context.state === 'suspended') {
    try {
      await context.resume();
      isResumed = true;
      console.log("✅ AudioContext resumed successfully by user interaction");
    } catch (error) {
      console.error("❌ Failed to resume AudioContext:", error);
    }
  } else if (context.state === 'running') {
    isResumed = true;
    console.log("✅ AudioContext already running");
  }
}

/**
 * Initialize audio context on first user interaction
 * Call this once on app startup
 */
export function initAudioContextOnInteraction(): void {
  const handleInteraction = () => {
    resumeAudioContext();
    
    // Remove listeners after first interaction
    document.body.removeEventListener('click', handleInteraction);
    document.body.removeEventListener('touchstart', handleInteraction);
    document.body.removeEventListener('keydown', handleInteraction);
  };
  
  // Listen to multiple interaction types
  document.body.addEventListener('click', handleInteraction, { once: true });
  document.body.addEventListener('touchstart', handleInteraction, { once: true });
  document.body.addEventListener('keydown', handleInteraction, { once: true });
}

/**
 * Get the current state of the AudioContext
 */
export function getAudioContextState(): AudioContextState | null {
  return audioContext?.state || null;
}

/**
 * Close the AudioContext (cleanup)
 */
export async function closeAudioContext(): Promise<void> {
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
    isResumed = false;
    console.log("AudioContext closed");
  }
}
