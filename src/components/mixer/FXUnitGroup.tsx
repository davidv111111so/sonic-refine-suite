import React from 'react';
import { Knob } from './Knob';
import { cn } from '@/lib/utils';
import { ChevronDown, Save, Power } from 'lucide-react';
import { FXType } from '@/hooks/useGroupFXChain';

interface FXUnitGroupProps {
    label: string;
    masterMix: number;
    setMasterMix: (val: number) => void;
    masterOn: boolean;
    setMasterOn: (val: boolean) => void;
    slots: { type: FXType; amount: number; isOn: boolean }[];
    setSlotType: (index: number, type: FXType) => void;
    setSlotAmount: (index: number, val: number) => void;
    setSlotOn: (index: number, val: boolean) => void;
}

const FX_OPTIONS: { label: string; value: FXType }[] = [
    { label: 'No Effect', value: 'none' },
    { label: 'Filter: Highpass', value: 'filter' },
    { label: 'Filter: LFO', value: 'filter-lfo' },
    { label: 'Delay: Digital', value: 'delay' },
    { label: 'Delay: Tape', value: 'tape-delay' },
    { label: 'Reverb: Plate', value: 'reverb' },
    { label: 'Flanger', value: 'flanger' },
    { label: 'Phaser', value: 'phaser' },
    { label: 'Tremolo', value: 'tremolo' },
    { label: 'Ring Modulator', value: 'ringmod' },
    { label: 'Distortion (Mulholland)', value: 'distortion' },
    { label: 'Gater', value: 'gater' },
];

const FXSlot = ({
    index, type, amount, isOn, setType, setAmount, setOn
}: {
    index: number;
    type: FXType;
    amount: number;
    isOn: boolean;
    setType: (t: FXType) => void;
    setAmount: (v: number) => void;
    setOn: (v: boolean) => void;
}) => {
    return (
        <div className="flex flex-col items-center justify-between gap-1 flex-1 border-r border-[#27272a] last:border-r-0 px-3 py-2">
            {/* FX Selector */}
            <div className="relative w-full">
                <select
                    className="w-full bg-[#18181b] text-xs font-medium text-neutral-300 border border-[#27272a] rounded-sm px-2 py-1.5 appearance-none outline-none focus:border-cyan-500/50"
                    value={type}
                    onChange={(e) => setType(e.target.value as FXType)}
                >
                    {FX_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2 top-2 pointer-events-none" />
            </div>

            {/* Amount Knob */}
            <div className="flex-1 flex items-center justify-center">
                <Knob
                    label=""
                    value={amount}
                    min={0}
                    max={1}
                    onChange={setAmount}
                    color={isOn ? "cyan" : "white"}
                    size={48}
                />
            </div>

            {/* On/Off Button */}
            <button
                className={cn(
                    "w-full h-6 rounded-sm border text-[10px] font-bold tracking-wider transition-all flex items-center justify-center",
                    isOn
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                        : "border-[#3f3f46] bg-[#18181b] text-[#71717a] hover:border-[#52525b]"
                )}
                onClick={() => setOn(!isOn)}
            >
                ON
            </button>
        </div>
    );
};

export const FXUnitGroup = ({
    label,
    masterMix, setMasterMix,
    masterOn, setMasterOn,
    slots, setSlotType, setSlotAmount, setSlotOn
}: FXUnitGroupProps) => {
    return (
        <div className="flex flex-col h-full bg-[#09090b] border border-[#27272a] rounded-md w-full">
            {/* Header */}
            <div className="h-10 border-b border-[#27272a] bg-[#121212] grid grid-cols-3 items-center px-3 shrink-0 relative">
                {/* 1. Label (Left) */}
                <div className="flex items-center gap-2 justify-start">
                    <span className="text-cyan-500 font-bold text-sm tracking-widest shadow-cyan-glow">{label}</span>
                </div>

                {/* 2. D/W Knob (Center) */}
                <div className="flex items-center justify-center gap-2">
                    <span className="text-[9px] text-neutral-500 font-bold">D/W</span>
                    <Knob
                        label=""
                        value={masterMix}
                        min={0}
                        max={1}
                        onChange={setMasterMix}
                        color="white"
                        size={32}
                    />
                </div>

                {/* 3. Power Button (Right) */}
                <div className="flex items-center justify-end gap-2">
                    <button className="text-neutral-500 hover:text-white mr-2">
                        <Save className="w-4 h-4" />
                    </button>
                    <button
                        className={cn(
                            "w-8 h-6 rounded border flex items-center justify-center transition-all shadow-sm",
                            masterOn
                                ? "border-cyan-500 bg-cyan-500/20 text-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                                : "border-[#3f3f46] bg-[#18181b] text-[#71717a] hover:border-[#52525b]"
                        )}
                        onClick={() => setMasterOn(!masterOn)}
                        title="Toggle FX Unit"
                    >
                        <Power className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Slots Grid */}
            <div className="flex flex-1 min-h-0">
                {slots.map((slot, i) => (
                    <FXSlot
                        key={i}
                        index={i}
                        type={slot.type}
                        amount={slot.amount}
                        isOn={slot.isOn}
                        setType={(t) => setSlotType(i, t)}
                        setAmount={(v) => setSlotAmount(i, v)}
                        setOn={(v) => setSlotOn(i, v)}
                    />
                ))}
            </div>
        </div>
    );
};
