import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, FileAudio, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AudioFile } from '@/types/audio';
import { toast } from 'sonner';

interface LevelUploadProps {
    onFilesUploaded: (files: AudioFile[]) => void;
    maxFiles?: number;
    maxSize?: number; // in bytes
}

export const LevelUpload = ({
    onFilesUploaded,
    maxFiles = 20,
    maxSize = 100 * 1024 * 1024 // 100MB
}: LevelUploadProps) => {
    const [hasConsented, setHasConsented] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setIsDragActive(false);

        if (!hasConsented) {
            toast.error("Please accept the Terms and Conditions to upload files");
            return;
        }

        if (acceptedFiles.length === 0) return;

        if (acceptedFiles.length > maxFiles) {
            toast.error(`Please upload maximum ${maxFiles} files at a time`);
            return;
        }

        const newAudioFiles: AudioFile[] = acceptedFiles.map(file => ({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            originalFile: file,
            originalUrl: URL.createObjectURL(file),
            status: 'uploaded',
            progress: 0,
            createdAt: new Date(),
            processingStage: 'Ready for enhancement'
        }));

        onFilesUploaded(newAudioFiles);
        toast.success(`${newAudioFiles.length} files added to queue`);
    }, [maxFiles, onFilesUploaded, hasConsented]);

    const { getRootProps, getInputProps, isDragReject } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
        accept: {
            'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.aiff']
        },
        maxSize,
        maxFiles,
        disabled: !hasConsented
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer transition-all duration-500 ease-out",
                    "border-2 border-dashed rounded-2xl p-6 mt-8",
                    "flex flex-row items-center justify-center gap-6",
                    "bg-slate-900/40 backdrop-blur-sm",
                    !hasConsented && "opacity-50 cursor-not-allowed",
                    isDragActive
                        ? "border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                        : "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50",
                    isDragReject && "border-red-500 bg-red-950/30"
                )}
            >
                <input {...getInputProps()} disabled={!hasConsented} />

                {/* Animated Icon Container - Smaller */}
                <div className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                    "bg-gradient-to-br from-cyan-500/20 to-blue-600/20",
                    "border border-cyan-500/30",
                    isDragActive ? "scale-110 shadow-[0_0_20px_rgba(34,211,238,0.3)]" : "group-hover:scale-105"
                )}>
                    <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse-slow" />
                    <Upload className={cn(
                        "w-5 h-5 text-cyan-400 transition-all duration-500",
                        isDragActive ? "scale-110 text-cyan-300" : "group-hover:scale-110"
                    )} />
                </div>

                {/* Text Content - Compact */}
                <div className="text-left space-y-1">
                    <h3 className={cn(
                        "text-lg font-bold tracking-tight transition-colors duration-300",
                        isDragActive ? "text-cyan-300" : "text-white group-hover:text-cyan-100"
                    )}>
                        {isDragActive ? "Drop files here" : "Drag & Drop or Click to Upload"}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium">
                        MP3, WAV, FLAC (Max 100MB)
                    </p>
                </div>
            </div>

            {/* Consent Checkbox */}
            <div className="mt-4 flex items-start justify-center gap-3 px-4">
                <input
                    type="checkbox"
                    id="level-upload-consent"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="level-upload-consent" className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    Notification; I agree to the Terms and Conditions and acknowledge the Copyright Disclaimer. I confirm that I own or have proper authorization for all audio files I upload and process through this service.
                </label>
            </div>
        </div>
    );
};
