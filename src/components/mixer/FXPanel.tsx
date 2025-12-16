import React from 'react';
import { FXChainControls, FXType } from '@/hooks/useFXChain';
import { cn } from '@/lib/utils';
import { Power } from 'lucide-react';
import { Knob } from './Knob';

interface FXPanelProps {
    fx: FXChainControls;
    color: 'cyan' | 'purple';
}

export const FXPanel = ({ fx, color }: FXPanelProps) => {
    const isCyan = color === 'cyan';
    const activeColor = isCyan ? 'text-cyan-500' : 'text-purple-500';
    const activeBorder = isCyan ? 'border-cyan-500' : 'border-purple-500';
    const activeBg = isCyan ? 'bg-cyan-500' : 'bg-purple-500';

    return (
        <div className="flex-1 bg-[#121212] p-2 flex flex-col gap-1 h-full">
            {/* Header */}
            <div className="flex items-center justify-between text-[9px] font-bold text-neutral-500 mb-1">
                <div className="flex items-center gap-1">
                    <span className={cn("transition-colors", fx.state.active && activeColor)}>FX UNIT</span>
                </div>
                <Power
                    className={cn(
                        "w-3 h-3 cursor-pointer transition-colors",
                        fx.state.active ? activeColor : "text-neutral-600 hover:text-neutral-400"
                    )}
                    onClick={fx.toggleActive}
                />
            </div>

            <div className="flex gap-2 h-full">
                {/* Effect Selector */}
                <div className="flex flex-col gap-1 w-12">
                    {(['filter', 'delay', 'reverb'] as FXType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => fx.setEffect(type)}
                            className={cn(
                                "text-[8px] uppercase py-1 rounded-[2px] border border-[#333] bg-[#1a1a1a] transition-all",
                                fx.state.activeEffect === type
                                    ? `${activeBorder} ${activeBg} text-black font-bold`
                                    : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Knobs */}
                <div className="flex-1 flex items-center justify-around bg-[#161616] rounded-sm border border-[#222] px-1">
                    <Knob
                        label="DRY/WET"
                        value={fx.state.amount}
                        min={0}
                        max={1}
                        onChange={fx.setAmount}
                        color={isCyan ? 'cyan' : 'purple'}
                        size={32}
                    />

                    <div className="w-[1px] h-8 bg-[#222]" />

                    <Knob
                        label="PARAM"
                        value={fx.state.parameter}
                        min={0}
                        max={1}
                        onChange={fx.setParameter}
                        color={isCyan ? 'cyan' : 'purple'}
                        size={32}
                    />
                </div>
            </div>
        </div>
    );
};
