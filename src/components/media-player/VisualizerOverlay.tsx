import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { X, Maximize2, Minimize2, Activity } from "lucide-react"
import { VisualizerDisplay, VisualizerMode } from "./VisualizerDisplay"

interface VisualizerOverlayProps {
    isOpen: boolean
    onClose: () => void
    analyserNode: AnalyserNode | null
    isPlaying: boolean
}

export const VisualizerOverlay: React.FC<VisualizerOverlayProps> = ({
    isOpen,
    onClose,
    analyserNode,
    isPlaying,
}) => {
    const [mode, setMode] = useState<VisualizerMode>('bars')
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Level Visualizer</h2>
                        <p className="text-sm text-slate-400">Real-time Audio Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Mode Selector */}
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
                        {(['bars', 'wave', 'circular', 'spectrogram', 'particles'] as VisualizerMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === m
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="text-slate-400 hover:text-white hover:bg-white/10"
                    >
                        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="flex-1 relative p-6 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full max-w-7xl mx-auto rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative bg-black">
                    {/* We reuse VisualizerDisplay but ensure it takes full height/width of container */}
                    <VisualizerDisplay
                        analyserNode={analyserNode}
                        isPlaying={isPlaying}
                        mode={mode}
                        onModeChange={setMode}
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}
