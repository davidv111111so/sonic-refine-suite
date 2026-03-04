import { useState, useCallback, useRef, useEffect } from 'react';

export interface MIDIMapping {
    id: string;             // Unique mapping ID
    parameterName: string;  // Human-readable name (e.g., "Deck A Volume")
    channel: number;        // MIDI channel (0-15)
    type: 'cc' | 'note';    // Type of MIDI message
    controlId: number;      // CC number (0-127) OR Note number (0-127)
    deviceName: string;     // Input device name
    min: number;            // Parameter min
    max: number;            // Parameter max
}

export interface MIDIDevice {
    id: string;
    name: string;
    manufacturer: string;
}

interface MIDILearnState {
    isLearning: boolean;
    learningParamId: string | null;
    learningParamName: string | null;
    mappings: MIDIMapping[];
    devices: MIDIDevice[];
    lastMessage: { channel: number; type: 'cc' | 'note'; controlId: number; value: number } | null;
}

const STORAGE_KEY = 'level-audio-midi-mappings';

// Load from localStorage
const loadMappings = (): MIDIMapping[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Save to localStorage
const saveMappings = (mappings: MIDIMapping[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    } catch { }
};

export const useMIDILearn = () => {
    const [state, setState] = useState<MIDILearnState>({
        isLearning: false,
        learningParamId: null,
        learningParamName: null,
        mappings: loadMappings(),
        devices: [],
        lastMessage: null,
    });

    // Callback registry: paramId -> (value: number) => void
    const callbacksRef = useRef<Map<string, (value: number) => void>>(new Map());
    const midiAccessRef = useRef<MIDIAccess | null>(null);

    // Register a parameter for MIDI control
    const registerParam = useCallback((paramId: string, callback: (value: number) => void) => {
        callbacksRef.current.set(paramId, callback);
    }, []);

    // Unregister a parameter
    const unregisterParam = useCallback((paramId: string) => {
        callbacksRef.current.delete(paramId);
    }, []);

    // Start learning mode for a specific parameter
    const startLearning = useCallback((paramId: string, paramName: string) => {
        setState(prev => ({
            ...prev,
            isLearning: true,
            learningParamId: paramId,
            learningParamName: paramName,
        }));
    }, []);

    // Cancel learning
    const cancelLearning = useCallback(() => {
        setState(prev => ({
            ...prev,
            isLearning: false,
            learningParamId: null,
            learningParamName: null,
        }));
    }, []);

    // Delete a mapping
    const deleteMapping = useCallback((mappingId: string) => {
        setState(prev => {
            const newMappings = prev.mappings.filter(m => m.id !== mappingId);
            saveMappings(newMappings);
            return { ...prev, mappings: newMappings };
        });
    }, []);

    // Clear all mappings
    const clearAllMappings = useCallback(() => {
        setState(prev => {
            saveMappings([]);
            return { ...prev, mappings: [] };
        });
    }, []);

    // Handle incoming MIDI message
    const handleMIDIMessage = useCallback((event: MIDIMessageEvent) => {
        const data = event.data;
        if (!data || data.length < 3) return;

        const status = data[0] & 0xf0;
        const channel = data[0] & 0x0f;
        const noteOrCC = data[1]; // Note number or CC number
        const velocityOrValue = data[2];

        let type: 'cc' | 'note' | null = null;
        let value = velocityOrValue;

        // Note On (0x90)
        if (status === 0x90 && velocityOrValue > 0) {
            type = 'note';
            value = velocityOrValue; // 0-127
        }
        // CC (0xB0)
        else if (status === 0xB0) {
            type = 'cc';
        }

        if (!type) return;

        const normalizedValue = value / 127;

        setState(prev => {
            // If learning, capture this CC/Note and create mapping
            if (prev.isLearning && prev.learningParamId) {
                const deviceName = (event.target as any)?.name || 'Unknown Device';
                const newMapping: MIDIMapping = {
                    id: `${prev.learningParamId}-${type}-${channel}-${noteOrCC}`,
                    parameterName: prev.learningParamName || prev.learningParamId,
                    channel,
                    type,
                    controlId: noteOrCC,
                    deviceName,
                    min: 0,
                    max: 1,
                };

                // Replace existing mapping for this param, or add new
                const filtered = prev.mappings.filter(m => m.id !== newMapping.id && m.parameterName !== newMapping.parameterName);
                const newMappings = [...filtered, newMapping];
                saveMappings(newMappings);

                return {
                    ...prev,
                    isLearning: false,
                    learningParamId: null,
                    learningParamName: null,
                    mappings: newMappings,
                    lastMessage: { channel, type, controlId: noteOrCC, value: normalizedValue },
                };
            }

            // Normal mode: dispatch to mapped callbacks
            let handled = false;
            for (const mapping of prev.mappings) {
                // Determine if this mapping matches the incoming event
                if (mapping.channel === channel && mapping.type === type && mapping.controlId === noteOrCC) {
                    const callback = callbacksRef.current.get(mapping.parameterName);
                    if (callback) {
                        const scaled = mapping.min + normalizedValue * (mapping.max - mapping.min);
                        callback(scaled);
                        handled = true;
                    }
                }
            }

            return {
                ...prev,
                lastMessage: { channel, type, controlId: noteOrCC, value: normalizedValue },
            };
        });
    }, []);

    // Initialize Web MIDI
    useEffect(() => {
        const initMIDI = async () => {
            try {
                if (!navigator.requestMIDIAccess) {
                    console.warn('Web MIDI API not supported in this browser');
                    return;
                }

                const access = await navigator.requestMIDIAccess({ sysex: false });
                midiAccessRef.current = access;

                // Enumerate devices
                const devices: MIDIDevice[] = [];
                access.inputs.forEach(input => {
                    devices.push({
                        id: input.id,
                        name: input.name || 'Unknown',
                        manufacturer: input.manufacturer || 'Unknown',
                    });
                    input.onmidimessage = handleMIDIMessage;
                });

                setState(prev => ({ ...prev, devices }));

                // Listen for device changes
                access.onstatechange = () => {
                    const updatedDevices: MIDIDevice[] = [];
                    access.inputs.forEach(input => {
                        updatedDevices.push({
                            id: input.id,
                            name: input.name || 'Unknown',
                            manufacturer: input.manufacturer || 'Unknown',
                        });
                        input.onmidimessage = handleMIDIMessage;
                    });
                    setState(prev => ({ ...prev, devices: updatedDevices }));
                };

                console.log(`🎹 MIDI Learn: ${devices.length} device(s) detected`);
            } catch (err) {
                console.warn('MIDI Learn init failed:', err);
            }
        };

        initMIDI();
    }, [handleMIDIMessage]);

    return {
        ...state,
        registerParam,
        unregisterParam,
        startLearning,
        cancelLearning,
        deleteMapping,
        clearAllMappings,
    };
};
