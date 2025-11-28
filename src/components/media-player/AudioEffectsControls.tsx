import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Wand2, Zap, Timer, Music } from 'lucide-react';

export interface AudioEffectsSettings {
    reverbMix: number; // 0 to 1
    delayTime: number; // 0 to 1 seconds
    delayFeedback: number; // 0 to 0.9
    delayMix: number; // 0 to 1
    pitch: number; // 0.5 to 2
    preservesPitch: boolean;
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
        <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    Audio Effects
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Reverb */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Music className="w-4 h-4 text-purple-400" /> Reverb Mix
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
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Timer className="w-4 h-4 text-cyan-400" /> Delay
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
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" /> Pitch / Speed
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
                        <Switch
                            checked={settings.preservesPitch}
                            onCheckedChange={(v) => onSettingsChange({ preservesPitch: v })}
                            className="scale-75 data-[state=checked]:bg-yellow-500"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
