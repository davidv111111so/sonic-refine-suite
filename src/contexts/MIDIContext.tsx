import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

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

interface MIDIContextState {
    isLearning: boolean;
    learningParamId: string | null;
    learningParamName: string | null;
    mappings: MIDIMapping[];
    devices: MIDIDevice[];
    lastMessage: { channel: number; type: 'cc' | 'note'; controlId: number; value: number } | null;
    registerParam: (paramId: string, callback: (value: number) => void) => void;
    unregisterParam: (paramId: string) => void;
    startLearning: (paramId: string, paramName: string) => void;
    cancelLearning: () => void;
    deleteMapping: (mappingId: string) => void;
    clearAllMappings: () => void;
    loadMappingPreset: (presetName: string) => Promise<void>;
}

export const MIDI_PRESETS: Record<string, string> = {
    'Pioneer DDJ-400': '/src/assets/midi-mappings/pioneer_ddj_400.json',
    'Traktor Kontrol S2': '/src/assets/midi-mappings/traktor_s2.json',
};

const MIDIContext = createContext<MIDIContextState | undefined>(undefined);

const STORAGE_KEY = 'level-audio-midi-mappings';

const loadMappings = (): MIDIMapping[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveMappings = (mappings: MIDIMapping[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    } catch { }
};

export const MIDIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLearning, setIsLearning] = useState(false);
    const [learningParamId, setLearningParamId] = useState<string | null>(null);
    const [learningParamName, setLearningParamName] = useState<string | null>(null);
    const [mappings, setMappings] = useState<MIDIMapping[]>(loadMappings());
    const [devices, setDevices] = useState<MIDIDevice[]>([]);
    const [lastMessage, setLastMessage] = useState<{ channel: number; type: 'cc' | 'note'; controlId: number; value: number } | null>(null);

    const callbacksRef = useRef<Map<string, (value: number) => void>>(new Map());
    const midiAccessRef = useRef<MIDIAccess | null>(null);

    const registerParam = useCallback((paramId: string, callback: (value: number) => void) => {
        callbacksRef.current.set(paramId, callback);
    }, []);

    const unregisterParam = useCallback((paramId: string) => {
        callbacksRef.current.delete(paramId);
    }, []);

    const startLearning = useCallback((paramId: string, paramName: string) => {
        setIsLearning(true);
        setLearningParamId(paramId);
        setLearningParamName(paramName);
    }, []);

    const cancelLearning = useCallback(() => {
        setIsLearning(false);
        setLearningParamId(null);
        setLearningParamName(null);
    }, []);

    const deleteMapping = useCallback((mappingId: string) => {
        setMappings(prev => {
            const next = prev.filter(m => m.id !== mappingId);
            saveMappings(next);
            return next;
        });
    }, []);

    const clearAllMappings = useCallback(() => {
        saveMappings([]);
        setMappings([]);
    }, []);

    const loadMappingPreset = useCallback(async (presetName: string) => {
        const path = MIDI_PRESETS[presetName];
        if (!path) return;
        try {
            const response = await fetch(path);
            const presetMappings = await response.json();
            // Assign unique IDs to preset mappings if missing
            const mappingsWithIds = presetMappings.map((m: any) => ({
                ...m,
                id: m.id || `${m.parameterName}-${m.type}-${m.channel}-${m.controlId}`
            }));
            setMappings(mappingsWithIds);
            saveMappings(mappingsWithIds);
        } catch (e) {
            console.error(`Failed to load MIDI preset ${presetName}:`, e);
        }
    }, []);

    const handleMIDIMessage = useCallback((event: MIDIMessageEvent) => {
        const data = event.data;
        if (!data || data.length < 3) return;

        const status = data[0] & 0xf0;
        const channel = data[0] & 0x0f;
        const noteOrCC = data[1];
        const velocityOrValue = data[2];

        let type: 'cc' | 'note' | null = null;
        let value = velocityOrValue;

        if (status === 0x90 && velocityOrValue > 0) {
            type = 'note';
        } else if (status === 0xb0) {
            type = 'cc';
        }

        if (!type) return;

        const normalizedValue = value / 127;
        setLastMessage({ channel, type, controlId: noteOrCC, value: normalizedValue });

        // If learning, capture this CC/Note and create mapping
        // We use refs for learning status to avoid re-mounting callback dependencies which would be complex
    }, []);

    // We need a ref for the current state to use in the event listener without re-binding
    const stateRef = useRef({ isLearning, learningParamId, learningParamName, mappings });
    useEffect(() => {
        stateRef.current = { isLearning, learningParamId, learningParamName, mappings };
    }, [isLearning, learningParamId, learningParamName, mappings]);

    const handleIncomingMIDI = useCallback((event: MIDIMessageEvent) => {
        const data = event.data;
        if (!data || data.length < 3) return;

        const status = data[0] & 0xf0;
        const channel = data[0] & 0x0f;
        const noteOrCC = data[1];
        const velocityOrValue = data[2];

        let type: 'cc' | 'note' | null = null;
        if (status === 0x90 && velocityOrValue > 0) type = 'note';
        else if (status === 0xb0) type = 'cc';

        if (!type) return;

        const norm = velocityOrValue / 127;
        const { isLearning: learning, learningParamId: pId, learningParamName: pName, mappings: currentMappings } = stateRef.current;

        if (learning && pId) {
            const deviceName = (event.target as any)?.name || 'Unknown';
            const newMapping: MIDIMapping = {
                id: `${pId}-${type}-${channel}-${noteOrCC}`,
                parameterName: pName || pId,
                channel,
                type,
                controlId: noteOrCC,
                deviceName,
                min: 0,
                max: 1
            };
            const filtered = currentMappings.filter(m => m.id !== newMapping.id && m.parameterName !== newMapping.parameterName);
            const next = [...filtered, newMapping];
            setMappings(next);
            saveMappings(next);
            setIsLearning(false);
            setLearningParamId(null);
            setLearningParamName(null);
            return;
        }

        // Execute mappings
        for (const m of currentMappings) {
            if (m.channel === channel && m.type === type && m.controlId === noteOrCC) {
                const cb = callbacksRef.current.get(m.parameterName);
                if (cb) {
                    cb(m.min + norm * (m.max - m.min));
                }
            }
        }
    }, [setMappings, setIsLearning, setLearningParamId, setLearningParamName]);

    useEffect(() => {
        const init = async () => {
            if (!navigator.requestMIDIAccess) return;
            try {
                const access = await navigator.requestMIDIAccess();
                midiAccessRef.current = access;
                const updateDevices = () => {
                    const devList: MIDIDevice[] = [];
                    access.inputs.forEach(input => {
                        devList.push({ id: input.id, name: input.name || 'Unknown', manufacturer: input.manufacturer || 'Unknown' });
                        input.onmidimessage = handleIncomingMIDI;
                    });
                    setDevices(devList);
                };
                updateDevices();
                access.onstatechange = updateDevices;
            } catch (e) { console.warn('MIDI init failed', e); }
        };
        init();
    }, [handleIncomingMIDI]);

    return (
        <MIDIContext.Provider value={{
            isLearning, learningParamId, learningParamName, mappings, devices, lastMessage,
            registerParam, unregisterParam, startLearning, cancelLearning, deleteMapping, clearAllMappings,
            loadMappingPreset
        }}>
            {children}
        </MIDIContext.Provider>
    );
};

export const useMIDI = () => {
    const context = useContext(MIDIContext);
    if (!context) throw new Error('useMIDI must be used within MIDIProvider');
    return context;
};
