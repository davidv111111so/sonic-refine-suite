import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Music, Download, Clock, Cpu, Zap, Play, Pause, FileAudio } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { StemPlayer } from './StemPlayer';
import WaveSurfer from 'wavesurfer.js';
import { StemsGuide } from './StemsGuide';
import { saveAs } from 'file-saver';

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

export const StemsTab = ({ audioFiles, onFilesUploaded, isProcessing, setIsProcessing, onComplete }: StemsTabProps) => {
    const { toast } = useToast();
    const [selectedFileId, setSelectedFileId] = useState<string>('');
    const [stemCount, setStemCount] = useState<string>('4');
    // isProcessing state is now passed as prop
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
            const newFiles: AudioFile[] = acceptedFiles.map(file => ({
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
    }, [onFilesUploaded]);

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

    const pollStatus = async (taskId: string, authToken: string) => {
        try {
            const response = await fetch(`http://localhost:8001/api/task-status/${taskId}`);

            if (response.status === 404) {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                throw new Error('Task expired. Please try again.');
            }

            if (!response.ok) {
                throw new Error('Server error');
            }

            const data = await response.json();

            if (data.status === 'completed') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);

                // Get result
                const resultResponse = await fetch(`http://localhost:8001/api/task-result/${taskId}`);
                const blob = await resultResponse.blob();
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
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            setIsProcessing(false);
            setProcessingStage('');
            console.error('Polling error:', error);
            toast({
                title: "Separation Failed",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
            });
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
            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                if (localStorage.getItem("dev_bypass") !== "true") {
                    throw new Error('Please log in to use this feature');
                }
            }

            const authToken = session?.access_token || "dev-bypass-token";

            // 1. Get the file blob
            let fileBlob: Blob;
            if (file.originalFile) {
                fileBlob = file.originalFile;
            } else if (file.originalUrl) {
                const response = await fetch(file.originalUrl);
                fileBlob = await response.blob();
            } else {
                throw new Error("File content not available");
            }

            const formData = new FormData();
            formData.append('file', fileBlob, file.name);
            formData.append('library', 'demucs');
            formData.append('model_name', 'htdemucs');

            if (stemCount === '6') {
                formData.append('model_name', 'htdemucs_6s');
            }
            formData.append('stem_count', stemCount);

            // Time Estimation Toast
            const duration = file.duration || 180; // Default to 3 mins if unknown
            const estimatedTime = Math.ceil(duration * (stemCount === '6' ? 0.4 : 0.3)); // Rough heuristic
            toast({
                title: "Separation Started",
                description: `Estimated time: ~${Math.floor(estimatedTime / 60)}m ${estimatedTime % 60}s`,
            });

            setProcessingStage('Uploading and starting separation...');

            // Call backend to start task
            const backendUrl = 'http://localhost:8001/api/separate-audio';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Separation failed to start');
            }

            const data = await response.json();
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

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

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
                            <div className="space-y-3">
                                <Label className="text-slate-300">Engine</Label>
                                <div className="p-3 rounded-lg border bg-purple-950/30 border-purple-500/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Music className="w-4 h-4 text-purple-400" />
                                        <span className="font-medium text-white">Level (High Quality)</span>
                                    </div>
                                    <p className="text-xs text-slate-400">State-of-the-art separation powered by AI.</p>
                                </div>
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
                                        <SelectItem value="6">6 Stems (Vocals/Drums/Bass/Guitar/Piano/Other)</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                        Please wait while our AI separates your track. This may take a few minutes.
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
