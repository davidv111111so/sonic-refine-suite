import { useEffect, useCallback, useRef } from 'react';
import { getAudioContext, resumeAudioContext } from '@/utils/audioContextManager';

/**
 * Custom hook for managing Web Audio API AudioContext
 * Ensures a single shared context across the entire app
 * Handles browser autoplay policies correctly
 */
export function useAudioContext() {
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Get the shared AudioContext instance
    contextRef.current = getAudioContext();

    return () => {
      // Don't close the context on unmount - it's shared!
      // The context will be managed globally
    };
  }, []);

  /**
   * Resume the AudioContext before playing audio
   * Must be called from a user interaction event
   */
  const ensureContextRunning = useCallback(async () => {
    await resumeAudioContext();
    return contextRef.current;
  }, []);

  /**
   * Create a MediaElementSourceNode from an audio element
   * Automatically resumes the context if needed
   */
  const createMediaElementSource = useCallback(async (audioElement: HTMLAudioElement) => {
    const context = await ensureContextRunning();
    if (!context) {
      throw new Error('AudioContext not available');
    }

    // Check if source already exists for this element
    // @ts-ignore - accessing internal property
    if (audioElement._sourceNode) {
      // @ts-ignore
      return audioElement._sourceNode as MediaElementAudioSourceNode;
    }

    const source = context.createMediaElementSource(audioElement);
    // @ts-ignore - store reference to prevent creating multiple sources
    audioElement._sourceNode = source;
    
    return source;
  }, [ensureContextRunning]);

  return {
    audioContext: contextRef.current,
    ensureContextRunning,
    createMediaElementSource,
  };
}
