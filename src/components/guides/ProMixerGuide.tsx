import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Play, RotateCw, AlignVerticalJustifyCenter, Sliders, ListMusic } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ProMixerGuide = ({ children }: { children: React.ReactNode }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-950 border-cyan-500/30">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                        Pro Mixer Lab Workflow
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-lg">
                        Master live mashups with our dual-deck interface offline.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-8 text-slate-300">
                    <section className="space-y-3">
                        <div className="flex items-center gap-3 text-cyan-400">
                            <AlignVerticalJustifyCenter className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">1. Phase & Beat Sync</h3>
                        </div>
                        <p className="leading-relaxed">
                            The Pro Mixer Lab uses advanced Web Audio offline nodes to analyze BPM grids.
                            When you drop a track onto Deck A, it automatically calculates the tempo. 
                            Pressing the <strong className="text-cyan-400">SYNC</strong> button on Deck B will instantly snap the tempo and phase to match the Master Deck. 
                        </p>
                        <Card className="bg-slate-900 border-white/5 p-4 mt-2">
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                                <li><strong>Phase Sync:</strong> Aligns the exact position of the waveforms to avoid off-beat timing.</li>
                                <li><strong>Tempo Sync:</strong> Adjusts the Pitch seamlessly independent of vocals using our pitch-shift engine.</li>
                            </ul>
                        </Card>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-3 text-purple-400">
                            <Sliders className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">2. EQ, Effects & Curves</h3>
                        </div>
                        <p className="leading-relaxed">
                            Use the 3-band EQ (Low, Mid, High) in the center of the mixer to isolate frequencies.
                            Cutting the Lows entirely on an incoming track prevents muddy bass clashes.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-3 text-green-400">
                            <RotateCw className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">3. Auto Loops</h3>
                        </div>
                        <p className="leading-relaxed">
                            Need more time to transition? Select <strong className="text-green-400">4</strong> or <strong className="text-green-400">8</strong> bars on the loop controls. The mixer will automatically cycle the beat perfectly on grid, giving you infinite mixing time.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center gap-3 text-orange-400">
                            <ListMusic className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">4. Offline Playlists (Desktop)</h3>
                        </div>
                        <p className="leading-relaxed">
                            If you are running the Desktop Pro or Solo DJ tier, your crates are scanned locally. There is no need to upload files—just drag them from your integrated playlist completely offline.
                        </p>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
};
