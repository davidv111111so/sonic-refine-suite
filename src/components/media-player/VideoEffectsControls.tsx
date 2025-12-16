import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface VideoEffectsSettings {
    brightness: number;
    contrast: number;
    saturate: number;
    hueRotate: number;
    invert: number;
    sepia: number;
}

export const INITIAL_VIDEO_EFFECTS: VideoEffectsSettings = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hueRotate: 0,
    invert: 0,
    sepia: 0,
};

interface VideoEffectsControlsProps {
    settings: VideoEffectsSettings;
    onSettingsChange: (settings: Partial<VideoEffectsSettings>) => void;
    onReset: () => void;
}

export const VideoEffectsControls: React.FC<VideoEffectsControlsProps> = ({
    settings,
    onSettingsChange,
    onReset,
}) => {
    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-200">Video Effects</h3>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onReset}
                                className="h-8 px-2 text-slate-400 hover:text-white"
                            >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Reset
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                            <p>Reset all video effects</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="space-y-4">
                    {/* Brightness */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <Label className="text-slate-400 flex items-center gap-2 cursor-help">
                                Brightness
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs">
                                        <p>Adjust the brightness of the video</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <span className="text-slate-200">{settings.brightness}%</span>
                        </div>
                        <Slider
                            value={[settings.brightness]}
                            min={0}
                            max={200}
                            step={1}
                            onValueChange={([v]) => onSettingsChange({ brightness: v })}
                            className="[&_.range-thumb]:bg-cyan-500"
                        />
                    </div>

                    {/* Contrast */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <Label className="text-slate-400 flex items-center gap-2 cursor-help">
                                Contrast
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs">
                                        <p>Adjust the contrast of the video</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <span className="text-slate-200">{settings.contrast}%</span>
                        </div>
                        <Slider
                            value={[settings.contrast]}
                            min={0}
                            max={200}
                            step={1}
                            onValueChange={([v]) => onSettingsChange({ contrast: v })}
                            className="[&_.range-thumb]:bg-purple-500"
                        />
                    </div>

                    {/* Saturation */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <Label className="text-slate-400 flex items-center gap-2 cursor-help">
                                Saturation
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs">
                                        <p>Adjust the intensity of colors</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <span className="text-slate-200">{settings.saturate}%</span>
                        </div>
                        <Slider
                            value={[settings.saturate]}
                            min={0}
                            max={200}
                            step={1}
                            onValueChange={([v]) => onSettingsChange({ saturate: v })}
                            className="[&_.range-thumb]:bg-pink-500"
                        />
                    </div>

                    {/* Hue Rotate */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <Label className="text-slate-400 flex items-center gap-2 cursor-help">
                                Hue Rotate
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs">
                                        <p>Rotate the color spectrum</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <span className="text-slate-200">{settings.hueRotate}deg</span>
                        </div>
                        <Slider
                            value={[settings.hueRotate]}
                            min={0}
                            max={360}
                            step={1}
                            onValueChange={([v]) => onSettingsChange({ hueRotate: v })}
                            className="[&_.range-thumb]:bg-emerald-500"
                        />
                    </div>

                    {/* Invert */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <Label className="text-slate-400 flex items-center gap-2 cursor-help">
                                Invert
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs">
                                        <p>Invert the colors of the video</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <span className="text-slate-200">{settings.invert}%</span>
                        </div>
                        <Slider
                            value={[settings.invert]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([v]) => onSettingsChange({ invert: v })}
                            className="[&_.range-thumb]:bg-orange-500"
                        />
                    </div>

                    {/* Sepia */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <Label className="text-slate-400 flex items-center gap-2 cursor-help">
                                Sepia
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 p-2 text-xs">
                                        <p>Apply a vintage sepia tone</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <span className="text-slate-200">{settings.sepia}%</span>
                        </div>
                        <Slider
                            value={[settings.sepia]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([v]) => onSettingsChange({ sepia: v })}
                            className="[&_.range-thumb]:bg-yellow-500"
                        />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};
