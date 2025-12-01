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
import { BookOpen, Cpu, Music, HardDrive, AlertTriangle } from 'lucide-react';

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
                        Stems Separation Guide
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Everything you need to know about separating audio into stems with Level.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6">

                        {/* Section 1: Introduction */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-purple-400" />
                                How it Works
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Level uses advanced AI models (powered by Hybrid Transformer Demucs) to analyze your audio and surgically separate it into distinct tracks (stems). This process happens locally on your machine or via our dedicated processing server, ensuring high fidelity and privacy.
                            </p>
                        </div>

                        {/* Section 2: System Requirements */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <HardDrive className="w-5 h-5 text-emerald-400" />
                                System Requirements
                            </h3>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-slate-200">Minimum RAM:</span>
                                        <p className="text-slate-400">8GB (16GB recommended)</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-200">Processor:</span>
                                        <p className="text-slate-400">Multi-core CPU (Intel i5/Ryzen 5 or better)</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-200">GPU (Optional):</span>
                                        <p className="text-slate-400">NVIDIA GPU with CUDA for faster processing</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-200">Storage:</span>
                                        <p className="text-slate-400">~500MB per song for temporary files</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Supported Formats */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Supported Formats</h3>
                            <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 ml-2">
                                <li><span className="text-cyan-400">Input:</span> MP3, WAV, FLAC, M4A, OGG</li>
                                <li><span className="text-purple-400">Output:</span> High-quality WAV (32-bit float)</li>
                            </ul>
                        </div>

                        {/* Section 4: Best Practices */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Best Practices</h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-cyan-400 font-bold">•</span>
                                    Use high-quality input files (WAV/FLAC) for the best separation results.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-cyan-400 font-bold">•</span>
                                    Avoid files that are already heavily compressed or distorted.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-cyan-400 font-bold">•</span>
                                    Processing time varies by song length and hardware. A 3-minute song typically takes 2-5 minutes on a CPU.
                                </li>
                            </ul>
                        </div>

                        {/* Section 5: Troubleshooting */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                Troubleshooting
                            </h3>
                            <div className="bg-amber-950/20 p-4 rounded-lg border border-amber-900/30 text-sm text-slate-300">
                                <p className="mb-2"><span className="font-semibold text-amber-400">Processing Failed?</span></p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Ensure you have a stable internet connection if using cloud processing.</li>
                                    <li>Check that your file is not corrupted and is in a supported format.</li>
                                    <li>If the app freezes, try processing a shorter file to test system stability.</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
