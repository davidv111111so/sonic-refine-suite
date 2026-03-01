import React, { useState } from 'react';
import { X, Usb, Trash2, Zap, Sliders, Music, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MIDIMapping, MIDIDevice } from '@/hooks/useMIDILearn';
import { CrossfaderCurve } from '@/hooks/useWebAudio';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    // MIDI Learn
    midiDevices: MIDIDevice[];
    midiMappings: MIDIMapping[];
    isLearning: boolean;
    learningParamName: string | null;
    onStartLearning: (paramId: string, paramName: string) => void;
    onCancelLearning: () => void;
    onDeleteMapping: (id: string) => void;
    onClearAllMappings: () => void;
    // Crossfader
    crossfaderCurve: CrossfaderCurve;
    onSetCrossfaderCurve: (curve: CrossfaderCurve) => void;
    // Audio Routing
    routingMode: 'stereo' | 'split' | 'multichannel';
    onSetRoutingMode: (mode: 'stereo' | 'split' | 'multichannel') => void;
}

type SettingsTab = 'midi' | 'mixer' | 'audio';

// Mappable parameters for MIDI Learn
const LEARNABLE_PARAMS = [
    { id: 'deck-a-volume', name: 'Deck A Volume', group: 'Deck A' },
    { id: 'deck-a-eq-low', name: 'Deck A EQ Low', group: 'Deck A' },
    { id: 'deck-a-eq-mid', name: 'Deck A EQ Mid', group: 'Deck A' },
    { id: 'deck-a-eq-high', name: 'Deck A EQ High', group: 'Deck A' },
    { id: 'deck-a-filter', name: 'Deck A Filter', group: 'Deck A' },
    { id: 'deck-a-trim', name: 'Deck A Trim', group: 'Deck A' },
    { id: 'deck-b-volume', name: 'Deck B Volume', group: 'Deck B' },
    { id: 'deck-b-eq-low', name: 'Deck B EQ Low', group: 'Deck B' },
    { id: 'deck-b-eq-mid', name: 'Deck B EQ Mid', group: 'Deck B' },
    { id: 'deck-b-eq-high', name: 'Deck B EQ High', group: 'Deck B' },
    { id: 'deck-b-filter', name: 'Deck B Filter', group: 'Deck B' },
    { id: 'deck-b-trim', name: 'Deck B Trim', group: 'Deck B' },
    { id: 'crossfader', name: 'Crossfader', group: 'Mixer' },
    { id: 'headphone-mix', name: 'Headphone Mix', group: 'Mixer' },
    { id: 'headphone-vol', name: 'Headphone Volume', group: 'Mixer' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    midiDevices,
    midiMappings,
    isLearning,
    learningParamName,
    onStartLearning,
    onCancelLearning,
    onDeleteMapping,
    onClearAllMappings,
    crossfaderCurve,
    onSetCrossfaderCurve,
    routingMode,
    onSetRoutingMode,
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('midi');

    if (!isOpen) return null;

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'midi', label: 'MIDI Learn', icon: <Usb className="w-3.5 h-3.5" /> },
        { id: 'mixer', label: 'Mixer', icon: <Sliders className="w-3.5 h-3.5" /> },
        { id: 'audio', label: 'Audio', icon: <Radio className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[560px] max-h-[80vh] bg-[#0d0d0d] border border-[#27272a] rounded-lg shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-12 flex items-center justify-between px-4 border-b border-[#27272a] bg-[#18181b] shrink-0">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-black text-white uppercase tracking-wider">Settings</span>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#27272a] text-neutral-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#27272a] bg-[#121212] shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={cn(
                                "flex-1 h-9 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                                activeTab === tab.id
                                    ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/5"
                                    : "text-neutral-500 hover:text-neutral-300 border-b-2 border-transparent"
                            )}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {activeTab === 'midi' && (
                        <div className="space-y-4">
                            {/* Devices */}
                            <div>
                                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Connected Devices</h3>
                                {midiDevices.length === 0 ? (
                                    <div className="text-xs text-neutral-600 bg-[#18181b] rounded border border-[#27272a] p-3">
                                        No MIDI devices detected. Connect a controller and refresh.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {midiDevices.map(d => (
                                            <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded bg-[#18181b] border border-[#27272a]">
                                                <Usb className="w-3 h-3 text-cyan-500" />
                                                <span className="text-xs font-medium text-white">{d.name}</span>
                                                <span className="text-[9px] text-neutral-500">{d.manufacturer}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Learning Indicator */}
                            {isLearning && (
                                <div className="flex items-center gap-3 px-3 py-2 rounded bg-cyan-500/10 border border-cyan-500/30 animate-pulse">
                                    <Music className="w-4 h-4 text-cyan-400" />
                                    <div className="flex-1">
                                        <span className="text-xs font-bold text-cyan-400">Move a knob or fader on your controller...</span>
                                        <div className="text-[9px] text-cyan-400/60">Mapping: {learningParamName}</div>
                                    </div>
                                    <button onClick={onCancelLearning} className="text-[9px] font-bold text-neutral-400 hover:text-white px-2 py-1 rounded border border-[#3f3f46]">Cancel</button>
                                </div>
                            )}

                            {/* Mappable Parameters */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Mappings</h3>
                                    {midiMappings.length > 0 && (
                                        <button onClick={onClearAllMappings} className="text-[8px] font-bold text-red-400 hover:text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                    {LEARNABLE_PARAMS.map(param => {
                                        const mapping = midiMappings.find(m => m.parameterName === param.name);
                                        return (
                                            <div key={param.id} className="flex items-center justify-between px-3 py-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-bold text-neutral-600 w-12">{param.group}</span>
                                                    <span className="text-xs text-neutral-300">{param.name.replace(`${param.group} `, '')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {mapping ? (
                                                        <>
                                                            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                                                CC{mapping.cc} Ch{mapping.channel + 1}
                                                            </span>
                                                            <button onClick={() => onDeleteMapping(mapping.id)} className="text-neutral-600 hover:text-red-400 transition-colors">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => onStartLearning(param.id, param.name)}
                                                            className="text-[8px] font-bold text-neutral-500 hover:text-cyan-400 px-2 py-0.5 rounded border border-[#3f3f46] hover:border-cyan-500/40 transition-all"
                                                            disabled={isLearning}
                                                        >
                                                            LEARN
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'mixer' && (
                        <div className="space-y-4">
                            {/* Crossfader Curve */}
                            <div>
                                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Crossfader Curve</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {([
                                        { value: 'smooth' as CrossfaderCurve, label: 'Smooth', desc: 'Constant power (default)' },
                                        { value: 'sharp' as CrossfaderCurve, label: 'Sharp', desc: 'Linear fade' },
                                        { value: 'constantPower' as CrossfaderCurve, label: 'C.PWR', desc: 'Additive (no dip)' },
                                        { value: 'cut' as CrossfaderCurve, label: 'Cut', desc: 'Battle/scratch' },
                                    ]).map(curve => (
                                        <button
                                            key={curve.value}
                                            className={cn(
                                                "flex flex-col items-center gap-1 p-3 rounded border transition-all",
                                                crossfaderCurve === curve.value
                                                    ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                                                    : "bg-[#18181b] border-[#27272a] text-neutral-400 hover:border-[#3f3f46]"
                                            )}
                                            onClick={() => onSetCrossfaderCurve(curve.value)}
                                        >
                                            <span className="text-xs font-bold">{curve.label}</span>
                                            <span className="text-[8px] text-neutral-600">{curve.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audio' && (
                        <div className="space-y-4">
                            {/* Output Routing */}
                            <div>
                                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Output Routing</h3>
                                <div className="space-y-2">
                                    {([
                                        { value: 'stereo' as const, label: 'Stereo (Default)', desc: 'Master + Cue → Same Output' },
                                        { value: 'split' as const, label: 'Split Mono', desc: 'Master → Left, Cue → Right' },
                                        { value: 'multichannel' as const, label: 'Multichannel (4ch)', desc: 'Master 1-2, Cue 3-4 (requires 4+ outputs)' },
                                    ]).map(mode => (
                                        <button
                                            key={mode.value}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded border transition-all text-left",
                                                routingMode === mode.value
                                                    ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                                                    : "bg-[#18181b] border-[#27272a] text-neutral-400 hover:border-[#3f3f46]"
                                            )}
                                            onClick={() => onSetRoutingMode(mode.value)}
                                        >
                                            <Radio className={cn("w-4 h-4", routingMode === mode.value ? "text-cyan-500" : "text-neutral-600")} />
                                            <div>
                                                <div className="text-xs font-bold">{mode.label}</div>
                                                <div className="text-[9px] text-neutral-600">{mode.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-10 flex items-center justify-between px-4 border-t border-[#27272a] bg-[#18181b] text-[9px] text-neutral-600 shrink-0">
                    <span>Level Audio Mixer Lab v2.0</span>
                    <span>{midiDevices.length} MIDI device(s) • {midiMappings.length} mapping(s)</span>
                </div>
            </div>
        </div>
    );
};
