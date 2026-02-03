import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Activity, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PermissiveControlsProps {
    targetLufs: number;
    setTargetLufs: (val: number) => void;
    targetAnalysis: any;
    referenceAnalysis: any;
}

export const PermissiveControls: React.FC<PermissiveControlsProps> = ({
    targetLufs,
    setTargetLufs,
    targetAnalysis,
    referenceAnalysis
}) => {
    return (
        <Card className="bg-slate-900/80 border-slate-800 shadow-xl backdrop-blur-sm">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Activity className="h-5 w-5" />
                    </div>
                    3. Fine Tune (Permissive Engine)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Target LUFS Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-300 font-medium">Target Loudness</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-slate-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Set the integrated loudness target (LUFS).</p>
                                        <p>-14: Streaming (Spotify/Youtube)</p>
                                        <p>-9: CD / Club</p>
                                        <p>-6: Aggressive / EDM</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <span className="text-emerald-400 font-mono font-bold">{targetLufs.toFixed(1)} LUFS</span>
                    </div>

                    <Slider
                        value={[targetLufs]}
                        min={-14}
                        max={-6}
                        step={0.5}
                        onValueChange={(vals) => setTargetLufs(vals[0])}
                        className="py-4"
                    />

                    <div className="flex justify-between text-xs text-slate-600 font-mono">
                        <span>-14 (Dynamic)</span>
                        <span>-9 (Standard)</span>
                        <span>-6 (Loud)</span>
                    </div>
                </div>

                {/* Reference Curve Visualizer (Placeholder for Phase 2) */}
                <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-4 h-32 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

                    {referenceAnalysis ? (
                        <div className="w-full h-full flex items-end justify-between px-2 gap-1">
                            {/* Mock Visualizer Bars */}
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-emerald-500/30 w-full rounded-t-sm transition-all duration-500"
                                    style={{ height: `${30 + Math.random() * 50}%` }}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm italic">Analyze Reference to see Match Curve</p>
                    )}

                    <span className="absolute top-2 left-2 text-[10px] uppercase font-bold text-slate-600">Spectral Match Profile</span>
                </div>

            </CardContent>
        </Card>
    );
};
