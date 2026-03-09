import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Cpu, Music, Zap, AlertTriangle, Clock, Shield } from 'lucide-react';

export const StemsGuide = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                    <BookOpen className="w-4 h-4" />
                    Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] bg-slate-950 border-slate-800 text-slate-200 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                        <Music className="w-6 h-6 text-cyan-400" />
                        Level Stem Separation Guide
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Everything you need to know about separating audio into stems.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6">

                        {/* How it Works */}
                        <div className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 p-5 rounded-xl border border-slate-800/50 space-y-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-purple-400" />
                                How it Works
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Level uses the <span className="text-cyan-400 font-semibold">Level Stem Engine</span>, powered by advanced AI on dedicated NVIDIA A100 GPU clusters. Your track is uploaded, processed in the cloud with lightning speed, and the separated stems are delivered back to you in seconds.
                            </p>
                        </div>

                        {/* Processing Speed */}
                        <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-5 rounded-xl border border-slate-800/50 space-y-3">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Zap className="w-5 h-5 text-emerald-400" />
                                Processing Speed
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Level Engine (Premium)</p>
                                    <p className="text-lg font-bold text-emerald-400">~15–90 sec ⚡</p>
                                    <p className="text-xs text-slate-400">GPU-accelerated cloud processing</p>
                                </div>
                                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Spleeter (Free)</p>
                                    <p className="text-lg font-bold text-blue-400">~1–5 min</p>
                                    <p className="text-xs text-slate-400">CPU cloud processing</p>
                                </div>
                            </div>
                        </div>

                        {/* What You Get */}
                        <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-5 rounded-xl border border-slate-800/50 space-y-3">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-400" />
                                What You Get
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                    Vocals (isolated)
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                    Drums
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                                    Bass
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    Other instruments
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">6-stem mode also separates guitar and piano. Output: high-quality WAV (32-bit float).</p>
                        </div>

                        {/* Supported Formats */}
                        <div className="bg-gradient-to-br from-pink-500/5 to-rose-500/5 p-5 rounded-xl border border-slate-800/50 space-y-2">
                            <h3 className="text-lg font-semibold text-white">Supported Formats</h3>
                            <div className="flex gap-2 flex-wrap">
                                {['MP3', 'WAV', 'FLAC', 'M4A', 'OGG'].map(fmt => (
                                    <span key={fmt} className="px-3 py-1 bg-slate-800/60 text-cyan-300 text-xs font-mono rounded-full border border-slate-700/40">
                                        {fmt}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Security */}
                        <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-5 rounded-xl border border-slate-800/50 space-y-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-teal-400" />
                                Privacy & Security
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Your audio files are uploaded to our secure processing servers, separated, and then immediately deleted from our servers. We never store, share, or listen to your music. All transfers are encrypted via HTTPS.
                            </p>
                        </div>

                        {/* Tips */}
                        <div className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 p-5 rounded-xl border border-amber-900/30 space-y-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                Tips & Troubleshooting
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                                    Use high-quality input files (WAV/FLAC) for the best separation results.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                                    Avoid heavily compressed or distorted files.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                                    Ensure a stable internet connection during processing.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                                    If processing fails, check your file format and try again.
                                </li>
                            </ul>
                        </div>

                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
