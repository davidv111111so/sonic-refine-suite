import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Music, Download, Clock, Cpu, Zap } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface StemsTabProps {
    audioFiles: AudioFile[];
    onFilesUploaded: (files: AudioFile[]) => void;
}

export const StemsTab = ({ audioFiles, onFilesUploaded }: StemsTabProps) => {
    const { toast } = useToast();
    const [selectedFileId, setSelectedFileId] = useState<string>('');
    // Library is now always demucs
    const [stemCount, setStemCount] = useState<string>('4');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState('');
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<string | null>(null); // URL to zip
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    const handleFileSelect = (fileId: string) => {
        setSelectedFileId(fileId);
        setResults(null);
        setProgress(0);
        setProcessingStage('');
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            // Convert File objects to AudioFile objects
            const newFiles: AudioFile[] = Array.from(files).map(file => ({
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                type: file.type,
                originalFile: file,
                status: 'uploaded',
            }));
            onFilesUploaded(newFiles);
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
                setIsProcessing(false);
                setProcessingStage('Complete!');
                setProgress(100);

                toast({
                    title: "Separation Complete",
                    description: "Stems are ready for download.",
                });
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

        try {
            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                // Check for dev bypass
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Input & Options */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Music className="w-5 h-5 text-cyan-400" />
                                Input Audio
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer bg-slate-950/30"
                                onClick={handleUploadClick}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    multiple
                                />
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Click to upload audio</p>
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
                                        <span className="font-medium text-white">Demucs (High Quality)</span>
                                    </div>
                                    <p className="text-xs text-slate-400">State-of-the-art separation powered by AI.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-slate-300">Stems</Label>
                                <Select value={stemCount} onValueChange={setStemCount}>
                                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                        <SelectItem value="2">2 Stems (Vocals + Instrumental)</SelectItem>
                                        <SelectItem value="4">4 Stems (Vocals, Drums, Bass, Other)</SelectItem>
                                        <SelectItem value="6">6 Stems (+ Guitar, Piano)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/50 p-2 rounded">
                                    <Clock className="w-3 h-3" />
                                    <span>Est. time: ~2-5 mins (CPU)</span>
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
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full min-h-[400px]">
                        <CardHeader>
                            <CardTitle className="text-white">Results</CardTitle>
                            <CardDescription className="text-slate-400">Separated stems will appear here</CardDescription>
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

                            {results ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="p-8 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-center">
                                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                                            <Download className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Separation Complete!</h3>
                                        <p className="text-slate-400 mb-8">Your stems have been successfully separated and are ready for download.</p>

                                        <a href={results} download="stems.zip">
                                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
                                                <Download className="w-5 h-5 mr-2" />
                                                Download Stems (ZIP)
                                            </Button>
                                        </a>
                                    </div>

                                    <div className="text-center text-sm text-slate-500">
                                        <p>Individual stem playback coming soon.</p>
                                    </div>
                                </div>
                            ) : !isProcessing && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 min-h-[300px]">
                                    <Music className="w-24 h-24 mb-6" />
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
