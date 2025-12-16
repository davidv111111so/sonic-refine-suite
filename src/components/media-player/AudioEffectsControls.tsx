import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Zap, Timer, Music, Waves, MoveHorizontal, Sliders, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AudioEffectsSettings {
    reverbMix: number; // 0 to 1
    delayTime: number; // 0 to 1 seconds
    delayFeedback: number; // 0 to 0.9
    delayMix: number; // 0 to 1
    pitch: number; // 0.5 to 2
    preservesPitch: boolean;
    distortionAmount: number; // 0 to 100
    filterType: 'lowpass' | 'highpass' | 'none';
    filterFreq: number; // 20 to 20000
    filterQ: number; // 0.1 to 10
    pan: number; // -1 to 1
    enabled: boolean;
}

interface AudioEffectsControlsProps {
    settings: AudioEffectsSettings;
    onSettingsChange: (settings: Partial<AudioEffectsSettings>) => void;
}

export const AudioEffectsControls: React.FC<AudioEffectsControlsProps> = ({
    settings,
    onSettingsChange,
}) => {
    return (
        <TooltipProvider>
            <Card className="bg-slate-900/90 border-slate-800">
                <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-400" />
                        Audio Effects
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">
                            {settings.enabled ? "ON" : "OFF"}
                        </span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Switch
                                    checked={settings.enabled}
                                    onCheckedChange={(v) => onSettingsChange({ enabled: v })}
                                    className="data-[state=checked]:bg-purple-500"
                                />
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                                <p>Enable/Disable All Effects</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </CardHeader>
                <CardContent className={`space-y-6 transition-opacity duration-300 ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    {/* Distortion */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                                <Waves className="w-4 h-4 text-orange-500" /> Distortion
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                                        Adds grit and harmonics to the sound.
                                    </TooltipContent>
                                </Tooltip>
                            </label>
                            <span className="text-xs font-mono text-orange-500">{settings.distortionAmount.toFixed(0)}%</span>
                        </div>
                        <Slider
                            value={[settings.distortionAmount]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([v]) => onSettingsChange({ distortionAmount: v })}
                            className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-600"
                        />
                    </div>

                    {/* Filter */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                                <Sliders className="w-4 h-4 text-green-400" /> Filter
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                                        Remove low or high frequencies.
                                    </TooltipContent>
                                </Tooltip>
                            </label>
                            <Select
                                value={settings.filterType}
                                onValueChange={(v: any) => onSettingsChange({ filterType: v })}
                            >
                                <SelectTrigger className="h-6 w-[100px] text-xs bg-slate-800 border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="lowpass">Low Pass</SelectItem>
                                    <SelectItem value="highpass">High Pass</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {settings.filterType !== 'none' && (
                            <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Frequency</span>
                                        <span className="font-mono text-green-400">{settings.filterFreq}Hz</span>
                                    </div>
                                    <Slider
                                        value={[settings.filterFreq]}
                                        min={20}
                                        max={20000}
                                        step={10}
                                        onValueChange={([v]) => onSettingsChange({ filterFreq: v })}
                                        className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-green-400 [&_[role=slider]]:border-green-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Resonance (Q)</span>
                                        <span className="font-mono text-green-400">{settings.filterQ.toFixed(1)}</span>
                                    </div>
                                    <Slider
                                        value={[settings.filterQ]}
                                        min={0.1}
                                        max={10}
                                        step={0.1}
                                        onValueChange={([v]) => onSettingsChange({ filterQ: v })}
                                        className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-green-400 [&_[role=slider]]:border-green-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panner */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                                <MoveHorizontal className="w-4 h-4 text-blue-400" /> Stereo Pan
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                                        Adjusts the balance between Left and Right channels.
                                    </TooltipContent>
                                </Tooltip>
                            </label>
                            <span className="text-xs font-mono text-blue-400">{settings.pan.toFixed(2)}</span>
                        </div>
                        <Slider
                            value={[settings.pan]}
                            min={-1}
                            max={1}
                            step={0.01}
                            onValueChange={([v]) => onSettingsChange({ pan: v })}
                            className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-blue-400 [&_[role=slider]]:border-blue-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 px-1">
                            <span>L</span>
                            <span>C</span>
                            <span>R</span>
                        </div>
                    </div>

                    {/* Reverb */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                                <Music className="w-4 h-4 text-purple-400" /> Reverb Mix
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                                        Adds space and ambience to the sound.
                                    </TooltipContent>
                                </Tooltip>
                            </label>
                            <span className="text-xs font-mono text-purple-400">{(settings.reverbMix * 100).toFixed(0)}%</span>
                        </div>
                        <Slider
                            value={[settings.reverbMix]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={([v]) => onSettingsChange({ reverbMix: v })}
                            className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-500"
                        />
                    </div>

                    {/* Delay */}
                    <div className="space-y-4 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                                <Timer className="w-4 h-4 text-cyan-400" /> Delay
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                                        Creates repeating echoes.
                                    </TooltipContent>
                                </Tooltip>
                            </label>
                        </div>

                        <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Time</span>
                                    <span className="font-mono text-cyan-400">{settings.delayTime.toFixed(2)}s</span>
                                </div>
                                <Slider
                                    value={[settings.delayTime]}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onValueChange={([v]) => onSettingsChange({ delayTime: v })}
                                    className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Feedback</span>
                                    <span className="font-mono text-cyan-400">{(settings.delayFeedback * 100).toFixed(0)}%</span>
                                </div>
                                <Slider
                                    value={[settings.delayFeedback]}
                                    min={0}
                                    max={0.9}
                                    step={0.01}
                                    onValueChange={([v]) => onSettingsChange({ delayFeedback: v })}
                                    className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Mix</span>
                                    <span className="font-mono text-cyan-400">{(settings.delayMix * 100).toFixed(0)}%</span>
                                </div>
                                <Slider
                                    value={[settings.delayMix]}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onValueChange={([v]) => onSettingsChange({ delayMix: v })}
                                    className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pitch */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-help">
                                <Zap className="w-4 h-4 text-yellow-400" /> Pitch / Speed
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs max-w-[200px]">
                                        Change the speed or pitch of the audio.
                                    </TooltipContent>
                                </Tooltip>
                            </label>
                            <span className="text-xs font-mono text-yellow-400">{settings.pitch.toFixed(2)}x</span>
                        </div>
                        <Slider
                            value={[settings.pitch]}
                            min={0.5}
                            max={2}
                            step={0.05}
                            onValueChange={([v]) => onSettingsChange({ pitch: v })}
                            className="[&_.relative]:bg-slate-800 [&_[role=slider]]:bg-yellow-400 [&_[role=slider]]:border-yellow-500"
                        />
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-slate-400">Preserve Pitch</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Switch
                                        checked={settings.preservesPitch}
                                        onCheckedChange={(v) => onSettingsChange({ preservesPitch: v })}
                                        className="scale-75 data-[state=checked]:bg-yellow-500"
                                    />
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs">
                                    <p>Keep original pitch when changing speed</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
};
