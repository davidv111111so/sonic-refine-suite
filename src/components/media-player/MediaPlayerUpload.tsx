import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, AlertCircle, ExternalLink } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface MediaPlayerUploadProps {
  onFilesAdded: (files: AudioFile[]) => void;
}

export const MediaPlayerUpload: React.FC<MediaPlayerUploadProps> = ({ onFilesAdded }) => {
  const [hasConsented, setHasConsented] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFiles = useCallback(async (files: File[]) => {
    const toastId = toast.loading(`Analyzing ${files.length} file${files.length > 1 ? 's' : ''}...`, {
      description: 'Detecting BPM and key signatures',
    });

    // Import analysis utilities
    const { detectKeyFromFile } = await import('@/utils/keyDetector');
    const { detectBPMFromFile } = await import('@/utils/bpmDetector');

    const audioFiles: AudioFile[] = await Promise.all(
      files.map(async (file, idx) => {
        let harmonicKey = 'N/A';
        let bpm: number | undefined = undefined;

        console.log(`\n📝 [${idx + 1}/${files.length}] Analyzing: ${file.name}`);

        // Analyze in parallel with timeouts
        const [keyResult, bpmResult] = await Promise.allSettled([
          Promise.race([
            detectKeyFromFile(file),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Key timeout')), 5000))
          ]),
          Promise.race([
            detectBPMFromFile(file),
            new Promise((_, reject) => setTimeout(() => reject(new Error('BPM timeout')), 5000))
          ])
        ]);

        if (keyResult.status === 'fulfilled') {
          const keyAnalysis = keyResult.value as any;
          harmonicKey = keyAnalysis.camelot;
          console.log(`✅ Key: ${harmonicKey}`);
        }

        if (bpmResult.status === 'fulfilled') {
          const bpmAnalysis = bpmResult.value as any;
          bpm = bpmAnalysis.bpm;
          console.log(`✅ BPM: ${bpm}`);
        }

        return {
          id: `${Date.now()}-${idx}-${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type,
          originalFile: file,
          originalUrl: URL.createObjectURL(file),
          status: 'uploaded' as const,
          fileType: file.name.split('.').pop()?.toLowerCase() as 'mp3' | 'wav' | 'flac' | 'unsupported',
          harmonicKey,
          bpm,
          duration: 0,
        };
      })
    );

    const detectedBPM = audioFiles.filter(f => f.bpm).length;
    const detectedKey = audioFiles.filter(f => f.harmonicKey && f.harmonicKey !== 'N/A').length;

    if (detectedKey === 0 && detectedBPM === 0) {
      toast.error('Analysis failed', {
        id: toastId,
        description: 'Could not detect BPM or Key',
      });
    } else {
      toast.success('Analysis complete!', {
        id: toastId,
        description: `BPM: ${detectedBPM}/${files.length} • Key: ${detectedKey}/${files.length}`,
      });
    }

    onFilesAdded(audioFiles);
    setPendingFiles([]);
  }, [onFilesAdded]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setErrorMessage(null);

    // Always require consent - don't bypass terms and conditions
    if (!hasConsented) {
      setPendingFiles(acceptedFiles);
      setErrorMessage('Please accept the Terms and Conditions before uploading files.');
      return;
    }

    processFiles(acceptedFiles);
  }, [hasConsented, processFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac']
    },
    multiple: true,
  });

  const handleConsentChange = (checked: boolean) => {
    setHasConsented(checked);
    setErrorMessage(null);

    if (checked && pendingFiles.length > 0) {
      processFiles(pendingFiles);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <div
        {...getRootProps()}
        className={`p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800/50'
          }`}
      >
        <input {...getInputProps()} disabled={!hasConsented} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-8 w-8 text-cyan-400" />
          <div>
            <p className="text-sm font-semibold mb-1 text-cyan-300">
              {isDragActive
                ? 'Drop files here...'
                : hasConsented
                  ? 'Drop audio files here or click to browse'
                  : 'Accept Terms and Conditions to upload'}
            </p>
            <p className="text-xs text-slate-400">
              Supports MP3, WAV, FLAC
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Consent */}
      <div className="mt-6 pt-4 border-t border-slate-600">
        <div className="flex items-start gap-3">
          <Checkbox
            id="media-player-consent"
            checked={hasConsented}
            onCheckedChange={handleConsentChange}
            className="mt-1"
          />
          <div className="flex-1">
            <label
              htmlFor="media-player-consent"
              className="text-sm cursor-pointer leading-relaxed text-cyan-200 font-semibold"
            >
              I agree to the{' '}
              <Link
                to="/terms"
                className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
                target="_blank"
              >
                Terms and Conditions
                <ExternalLink className="h-3 w-3" />
              </Link>
              {' '}and acknowledge the Copyright Disclaimer. I confirm that I own or have proper authorization
              for all audio files I upload and process.
            </label>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-md bg-red-900/50 border border-red-600/50 text-red-200 flex items-center text-sm">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Upload Status */}
      {!hasConsented && (
        <div className="mt-4 p-3 rounded-md bg-yellow-900/50 border border-yellow-600/50 text-yellow-200 flex items-center text-sm">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          Please accept the Terms and Conditions to enable file uploads.
        </div>
      )}
    </Card>
  );
};
