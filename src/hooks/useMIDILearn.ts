import { useMIDI } from '@/contexts/MIDIContext';

/**
 * @deprecated Use useMIDI() from MIDIContext instead.
 * This hook is kept for backward compatibility.
 */
export const useMIDILearn = () => {
    return useMIDI();
};
