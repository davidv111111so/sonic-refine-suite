import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Music, Download, Clock, Cpu, Zap, Play, Pause, FileAudio, AlertTriangle } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { StemPlayer } from './StemPlayer';
import WaveSurfer from 'wavesurfer.js';
import { StemsGuide } from './StemsGuide';
import { saveAs } from 'file-saver';
import { masteringService } from '@/services/masteringService';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

interface StemsTabProps {
    audioFiles: AudioFile[];
    onFilesUploaded: (files: AudioFile[]) => void;
    isProcessing: boolean;
    setIsProcessing: (isProcessing: boolean) => void;
    onComplete?: () => void;
}

interface Stem {
    name: string;
    url: string;
    color: string;
    isMuted: boolean;
    isSoloed: boolean;
}

// Time estimates for each processing configuration
const TIME_ESTIMATES: Record<string, Record<string, { min: number; max: number; label: string }>> = {
    spleeter: {
        fastest: { min: 1, max: 3, label: '~1-3 min' },
        fast: { min: 2, max: 5, label: '~2-5 min' },
        normal: { min: 2, max: 5, label: '~2-5 min' },
    },
    demucs: {
        fastest: { min: 5, max: 10, label: '~5-10 min' },
        fast: { min: 5, max: 15, label: '~5-15 min' },
        normal: { min: 10, max: 20, label: '~10-20 min' },
    },
};

export const StemsTab = ({ audioFiles, onFilesUploaded, isProcessing, setIsProcessing, onComplete }: StemsTabProps) => {
    const { toast } = useToast();
    const { isPremium } = useAuth();
    const [selectedFileId, setSelectedFileId] = useState<string>('');
    const [stemCount, setStemCount] = useState<string>('4');
    const [speedMode, setSpeedMode] = useState<string>('fast');
    const [processingLibrary, setProcessingLibrary] = useState<string>(isPremium ? 'demucs' : 'spleeter');

    // Reset stem count to 4 if switching to Spleeter while 6 is selected
    useEffect(() => {
        if (processingLibrary === 'spleeter' && stemCount === '6') {
            setStemCount('4');
        }
    }, [processingLibrary, stemCount]);

    const currentEstimate = TIME_ESTIMATES[processingLibrary]?.[speedMode] || TIME_ESTIMATES.demucs.fast;
    const [processingStage, setProcessingStage] = useState('');
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<string | null>(null); // URL to zip
    const [stems, setStems] = useState<Stem[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);

    const pollingInterval = useRef<NodeJS.Timeout | null>(null);
    const wavesurfersRef = useRef<WaveSurfer[]>([]);

    // Dropzone logic
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const validFiles = acceptedFiles.filter(file => {
                if (file.size > 1024 * 1024 * 1024) {
                    toast({
                        title: "File too large",
                        description: `"${file.name}" exceeds the 1GB limit.`,
                        variant: "destructive"
                    });
                    return false;
                }
                return true;
            });

            if (validFiles.length > 0) {
                const newFiles: AudioFile[] = validFiles.map(file => ({
                    id: crypto.randomUUID(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    originalFile: file,
                    status: 'uploaded',
                }));
                onFilesUploaded(newFiles);
                // Auto-select the first uploaded file
                if (newFiles.length > 0) {
                    setSelectedFileId(newFiles[0].id);
                }
            }
        }
    }, [onFilesUploaded, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.ogg']
        },
        maxFiles: 1
    });

    const handleFileSelect = (fileId: string) => {
        setSelectedFileId(fileId);
        resetState();
    };

    const resetState = () => {
        setResults(null);
        setProgress(0);
        setProcessingStage('');
        setStems([]);
        setIsPlaying(false);
        wavesurfersRef.current = [];
    };

    const handleUnzip = async (blob: Blob) => {
        try {
            setProcessingStage('Extracting stems...');
            const zip = new JSZip();
            const contents = await zip.loadAsync(blob);
            const newStems: Stem[] = [];

            const getStemColor = (name: string) => {
                const n = name.toLowerCase();
                if (n.includes('vocals')) return '#22d3ee'; // Cyan
                if (n.includes('drums')) return '#3b82f6'; // Blue
                if (n.includes('bass')) return '#a855f7'; // Purple
                if (n.includes('other')) return '#ec4899'; // Pink
                if (n.includes('guitar')) return '#10b981'; // Green
                if (n.includes('piano')) return '#facc15'; // Yellow
                return '#94a3b8'; // Slate
            };

            for (const filename of Object.keys(contents.files)) {
                if (!contents.files[filename].dir && !filename.startsWith('__MACOSX') && !filename.includes('.DS_Store')) {
                    const fileData = await contents.files[filename].async('blob');
                    const url = URL.createObjectURL(fileData);
                    // Clean up filename (remove directory path if present)
                    const cleanName = filename.split('/').pop() || filename;

                    newStems.push({
                        name: cleanName,
                        url,
                        color: getStemColor(cleanName),
                        isMuted: false,
                        isSoloed: false
                    });
                }
            }

            // Sort stems for consistent order (Vocals, Drums, Bass, Other)
            const order = ['vocals', 'drums', 'bass', 'other'];
            newStems.sort((a, b) => {
                const aIndex = order.findIndex(o => a.name.toLowerCase().includes(o));
                const bIndex = order.findIndex(o => b.name.toLowerCase().includes(o));
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.name.localeCompare(b.name);
            });

            setStems(newStems);
        } catch (error) {
            console.error("Error unzipping:", error);
            toast({
                title: "Extraction Failed",
                description: "Could not extract stems from the result.",
                variant: "destructive"
            });
        }
    };

    const handleClearStems = () => {
        // Destroy WaveSurfer instances to free AudioContext & memory
        wavesurfersRef.current.forEach(ws => {
            try { ws.destroy(); } catch (e) { }
        });
        wavesurfersRef.current = [];

        // Revoke object URLs to free memory
        if (results) URL.revokeObjectURL(results);
        stems.forEach(stem => URL.revokeObjectURL(stem.url));

        // Reset State
        setResults(null);
        setStems([]);
        setProgress(0);
        setProcessingStage('');
        setIsPlaying(false);
    };

    // Retry counter for polling - survives across poll intervals
    const retryCountRef = useRef(0);
    const MAX_POLL_RETRIES = 5;

    const pollStatus = async (taskId: string, authToken: string) => {
        try {
            const data = await masteringService.getTaskStatus(taskId);

            // Reset retry count on success
            retryCountRef.current = 0;

            if (data.status === 'completed') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);

                // Get result
                const blob = await masteringService.getTaskResult(taskId);
                const url = URL.createObjectURL(blob);
                setResults(url);

                await handleUnzip(blob);

                setIsProcessing(false);
                setProcessingStage('Complete!');
                setProgress(100);

                toast({
                    title: "Separation Complete",
                    description: "Stems are ready for playback and download.",
                });
                if (onComplete) onComplete();
            } else if (data.status === 'failed') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                throw new Error(data.error || 'Separation failed');
            } else {
                // Update progress
                setProgress(data.progress || 0);
                setProcessingStage(`Processing... ${data.progress}%`);
            }
        } catch (error) {
            retryCountRef.current++;
            console.warn(`⚠️ Polling attempt ${retryCountRef.current}/${MAX_POLL_RETRIES} failed:`, error);

            if (retryCountRef.current >= MAX_POLL_RETRIES) {
                // Only stop after multiple consecutive failures
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                setIsProcessing(false);
                setProcessingStage('');
                console.error('Polling failed after max retries:', error);
                toast({
                    title: "Separation Failed",
                    description: "Connection lost. Please try again.",
                    variant: "destructive"
                });
            }
            // Otherwise, continue polling - don't clear interval
        }
    };

    const handleSeparate = async () => {
        const file = audioFiles.find(f => f.id === selectedFileId);
        if (!file) {
            toast({
                title: "No file selected",
                description: "Please select an audio file to separate.",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);
        setProcessingStage('Preparing file...');
        setProgress(0);
        setResults(null);
        setStems([]);

        try {
            // Get the file content
            let fileBlob: Blob;
            if (file.originalFile) {
                fileBlob = file.originalFile;
            } else if (file.originalUrl) {
                const response = await fetch(file.originalUrl);
                fileBlob = await response.blob();
            } else {
                throw new Error("File content not available");
            }

            // Size validation
            if (fileBlob.size > 1024 * 1024 * 1024) {
                throw new Error(`File is too large (${(fileBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 1GB.`);
            }

            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                if (localStorage.getItem("dev_bypass") !== "true") {
                    throw new Error('Please log in to use this feature');
                }
            }

            const authToken = session?.access_token || "dev-bypass-token";

            // Removal of duplicate blob fetching - moved to top
            const fileBlobToUse = fileBlob;

            const formData = new FormData();
            formData.append('file', fileBlob, file.name);
            formData.append('library', processingLibrary);
            formData.append('model_name', 'htdemucs');

            if (stemCount === '6') {
                formData.append('model_name', 'htdemucs_6s');
            }
            formData.append('stem_count', stemCount);

            const engineLabel = processingLibrary === 'spleeter' ? 'Spleeter' : 'Level Engine';
            toast({
                title: `🔬 ${engineLabel} Started (${speedMode.toUpperCase()} Mode)`,
                description: `Estimated time: ${currentEstimate.label}. Please keep this tab open.`,
            });

            setProcessingStage('Uploading and starting separation...');

            // Convert blob to proper File object with the correct name
            const fileToSend = fileBlob instanceof File
                ? fileBlob
                : new File([fileBlob], file.name || 'audio.wav', { type: fileBlob.type || 'audio/wav' });

            // Call backend via centralized service
            const data = await masteringService.separateAudio(fileToSend, stemCount, speedMode, processingLibrary);
            const taskId = data.task_id;

            // Start polling
            pollingInterval.current = setInterval(() => pollStatus(taskId, authToken), 1000);

        } catch (error) {
            console.error('Separation error:', error);
            setIsProcessing(false);
            setProcessingStage('');
            toast({
                title: "Separation Failed",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
            });
        }
    };

    // Cleanup polling and URLs on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            // Cleanup object URLs to prevent memory leaks if tab is unmounted
            if (results) URL.revokeObjectURL(results);
            stems.forEach(stem => URL.revokeObjectURL(stem.url));
            wavesurfersRef.current.forEach(ws => {
                try { ws.destroy(); } catch (e) { }
            });
        };
    }, [results, stems]);

    // Player Controls
    const togglePlay = () => {
        if (isPlaying) {
            wavesurfersRef.current.forEach(ws => ws.pause());
        } else {
            wavesurfersRef.current.forEach(ws => ws.play());
        }
        setIsPlaying(!isPlaying);
    };

    const handleMute = (index: number) => {
        const newStems = [...stems];
        newStems[index].isMuted = !newStems[index].isMuted;
        setStems(newStems);
    };

    const handleSolo = (index: number) => {
        const newStems = [...stems];
        const isCurrentlySoloed = newStems[index].isSoloed;

        if (isCurrentlySoloed) {
            // Unsolo: Unmute everything that wasn't manually muted? 
            // Simpler: Unsolo this, and if no other solos exist, unmute all non-manually muted.
            // For simplicity: Just clear solo state and restore mutes.
            // Actually, let's just toggle solo for this one.
            newStems[index].isSoloed = false;
        } else {
            // Solo this one.
            newStems[index].isSoloed = true;
        }

        // Recalculate effective mute state
        const anySolo = newStems.some(s => s.isSoloed);
        newStems.forEach(s => {
            if (anySolo) {
                // If any solo exists, mute if not soloed
                s.isMuted = !s.isSoloed;
            } else {
                // If no solo, unmute (unless we want to track manual mutes separately, but let's keep it simple for now)
                s.isMuted = false;
            }
        });

        setStems(newStems);
    };

    const handleWaveSurferReady = (ws: WaveSurfer) => {
        wavesurfersRef.current.push(ws);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Alert className="bg-cyan-950/20 border-cyan-500/50 text-cyan-200">
                <AlertCircle className="h-4 w-4 text-cyan-400" />
                <AlertTitle>Stems Upload Limit: 1GB</AlertTitle>
                <AlertDescription className="text-sm opacity-90">
                    High-quality stems separation supports audio files up to 1GB.
                </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Input & Options */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Music className="w-5 h-5 text-cyan-400" />
                                Input Audio
                            </CardTitle>
                            <StemsGuide />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer bg-slate-950/30 ${isDragActive ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-700 hover:border-cyan-500/50'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">
                                    {isDragActive ? "Drop the audio file here" : "Drag & drop or click to upload"}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">MAX 1GB • .WAV, .MP3, .FLAC</p>
                            </div>

                            {audioFiles.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Select File</Label>
                                    <Select value={selectedFileId} onValueChange={handleFileSelect}>
                                        <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                                            <SelectValue placeholder="Choose a file..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                            {audioFiles.map(file => (
                                                <SelectItem key={file.id} value={file.id}>
                                                    {file.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-purple-400" />
                                Processing Options
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Processing Engine */}
                            <div className="space-y-3">
                                <Label className="text-slate-300">Processing Engine</Label>
                                <Select value={processingLibrary} onValueChange={setProcessingLibrary}>
                                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                                        <SelectValue placeholder="Select engine" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                        <SelectItem value="spleeter">
                                            ⚡ Spleeter (Fast — 2-5 min)
                                        </SelectItem>
                                        <SelectItem value="demucs" disabled={!isPremium}>
                                            <div className="flex items-center gap-2">
                                                🎧 Level Stem Separation (High Quality)
                                                {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {!isPremium && (
                                    <p className="text-xs text-amber-500/90 font-medium">
                                        <Lock className="h-3 w-3 inline mr-1 -mt-0.5" />
                                        Upgrade to Premium to unlock Level Stem Separation for studio-quality results.
                                    </p>
                                )}
                                <p className="text-[10px] text-slate-500">
                                    {processingLibrary === 'spleeter'
                                        ? 'Spleeter is much faster but produces lower quality stems. Free tier.'
                                        : 'Level Stem Separation produces studio-quality stems. Premium processing.'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-300">Stem Count</Label>
                                <Select value={stemCount} onValueChange={setStemCount}>
                                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                                        <SelectValue placeholder="Select number of stems" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                        <SelectItem value="2">2 Stems (Vocals/Instrumental)</SelectItem>
                                        <SelectItem value="4">4 Stems (Vocals/Drums/Bass/Other)</SelectItem>
                                        {processingLibrary === 'demucs' && (
                                            <SelectItem value="6">6 Stems (Vocals/Drums/Bass/Guitar/Piano/Other)</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-300">Speed Mode</Label>
                                <Select value={speedMode} onValueChange={setSpeedMode}>
                                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                                        <SelectValue placeholder="Select speed mode" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                        <SelectItem value="fastest">
                                            🚀 Aggressive (5-10 min)
                                        </SelectItem>
                                        <SelectItem value="fast">
                                            ⚡ Fast (5-15 min)
                                        </SelectItem>
                                        <SelectItem value="normal">
                                            🔬 Standard (10-20 min)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dynamic Time Estimate Warning */}
                            <div className={`flex items-start gap-2 p-3 rounded-md border ${currentEstimate.max <= 5
                                ? 'bg-emerald-950/30 border-emerald-500/30'
                                : currentEstimate.max <= 25
                                    ? 'bg-amber-950/30 border-amber-500/30'
                                    : 'bg-red-950/20 border-red-500/30'
                                }`}>
                                <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${currentEstimate.max <= 5 ? 'text-emerald-400' : currentEstimate.max <= 25 ? 'text-amber-400' : 'text-red-400'
                                    }`} />
                                <div>
                                    <p className={`text-xs font-semibold ${currentEstimate.max <= 5 ? 'text-emerald-300' : currentEstimate.max <= 25 ? 'text-amber-300' : 'text-red-300'
                                        }`}>
                                        Estimated processing time: {currentEstimate.label}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {processingLibrary === 'demucs' && speedMode === 'normal'
                                            ? 'Normal mode uses test-time augmentation for maximum quality. Long tracks may take longer.'
                                            : 'Times vary based on track length and server load. Keep this tab open.'}
                                    </p>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20"
                                onClick={handleSeparate}
                                disabled={!selectedFileId || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Separate Audio
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Results */}
                <div className="md:col-span-2">
                    <Card className="bg-slate-950/80 border-cyan-500/30 backdrop-blur-md h-full min-h-[400px] shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white">Results</CardTitle>
                                <CardDescription className="text-slate-400">Separated stems will appear here</CardDescription>
                            </div>
                            {stems.length > 0 && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-700 text-slate-200 hover:bg-slate-800"
                                        onClick={handleClearStems}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-700 text-slate-200 hover:bg-slate-800"
                                        onClick={togglePlay}
                                    >
                                        {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                        {isPlaying ? "Pause All" : "Play All"}
                                    </Button>
                                    {results && (
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-500"
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(results);
                                                    const blob = await response.blob();
                                                    saveAs(blob, "stems.zip");
                                                } catch (error) {
                                                    console.error("Download failed:", error);
                                                    toast({
                                                        title: "Download Failed",
                                                        description: "Could not download stems.",
                                                        variant: "destructive"
                                                    });
                                                }
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download ZIP
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {isProcessing && (
                                <div className="space-y-4 mb-8 p-6 bg-slate-950/50 rounded-lg border border-slate-800">
                                    <div className="flex justify-between text-sm text-slate-300 mb-2">
                                        <span>{processingStage}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2 bg-slate-800" />
                                    <p className="text-xs text-slate-500 text-center mt-2">
                                        {processingLibrary === 'spleeter'
                                            ? 'Spleeter is processing your track. This should finish in a few minutes.'
                                            : `Level Engine is separating your track (${speedMode} mode). Estimated: ${currentEstimate.label}. Please keep this tab open.`}
                                    </p>
                                </div>
                            )}

                            {stems.length > 0 ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {stems.map((stem, index) => (
                                        <StemPlayer
                                            key={stem.name}
                                            {...stem}
                                            onMute={() => handleMute(index)}
                                            onSolo={() => handleSolo(index)}
                                            onReady={handleWaveSurferReady}
                                        />
                                    ))}
                                </div>
                            ) : !isProcessing && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 min-h-[300px]">
                                    <FileAudio className="w-24 h-24 mb-6" />
                                    <p className="text-lg">Select a file and click Separate to begin</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
