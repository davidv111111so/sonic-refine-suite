import React from 'react';
import { Knob } from './Knob';
import { cn } from '@/lib/utils';

interface EQKnobWithKillProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
    kill: boolean;
    onToggleKill: () => void;
    color: string;
    size?: number;
}

export const EQKnobWithKill = ({
    label, value, onChange, kill, onToggleKill, color, size = 32
}: EQKnobWithKillProps) => {
    return (
        <div className="flex flex-col items-center gap-1">
            <Knob
                label={label}
                value={value}
                min={-12}
                max={12}
                onChange={onChange}
                color={kill ? "white" : color}
                size={size}
            />
            <button
                className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    kill ? "bg-neutral-800 border border-neutral-700" : "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]"
                )}
                onClick={onToggleKill}
                title={`Kill ${label}`}
            />
        </div>
    );
};
