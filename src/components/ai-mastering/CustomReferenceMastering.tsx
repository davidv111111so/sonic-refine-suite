import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

export const CustomReferenceMastering = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [masteredFile, setMasteredFile] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDropTarget = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setTargetFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const onDropReference = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setReferenceFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const targetDropzone = useDropzone({
    onDrop: onDropTarget,
    accept: { 'audio/*': ['.wav', '.mp3', '.flac'] },
    maxFiles: 1,
    multiple: false,
  });

  const referenceDropzone = useDropzone({
    onDrop: onDropReference,
    accept: { 'audio/*': ['.wav', '.mp3', '.flac'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleMastering = async () => {
    if (!targetFile || !referenceFile) return;

    setIsProcessing(true);
    setError(null);
    setMasteredFile(null);

    try {
      const formData = new FormData();
      formData.append('target', targetFile);
      formData.append('reference', referenceFile);

      // Call the AI mastering edge function
      const { data, error: functionError } = await supabase.functions.invoke('ai-mastering', {
        body: formData,
      });

      if (functionError) throw functionError;

      if (data.error) {
        throw new Error(data.error);
      }

      setMasteredFile({
        name: data.fileName,
        url: data.downloadUrl,
      });

      toast({
        title: t('aiMastering.success'),
        description: t('aiMastering.successMessage'),
      });
    } catch (err: any) {
      console.error('Mastering error:', err);
      setError(err.message || t('aiMastering.error'));
      toast({
        title: t('aiMastering.error'),
        description: err.message || t('aiMastering.errorMessage'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (masteredFile) {
      const a = document.createElement('a');
      a.href = masteredFile.url;
      a.download = masteredFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card className="bg-slate-900/90 border-slate-600">
      <CardHeader>
        <CardTitle className="text-cyan-400">
          {t('aiMastering.masterWithReference')}
        </CardTitle>
        <p className="text-sm text-slate-400 mt-2">
          {t('aiMastering.customReferenceDescription')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target File Upload */}
        <div>
          <label className="text-sm font-semibold text-white mb-2 block">
            {t('aiMastering.targetTrack')} *
          </label>
          <div
            {...targetDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              targetDropzone.isDragActive
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-600 hover:border-cyan-400/50 hover:bg-slate-800/50'
            }`}
          >
            <input {...targetDropzone.getInputProps()} />
            {targetFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileAudio className="h-8 w-8 text-cyan-400" />
                <div className="text-left">
                  <p className="text-white font-medium">{targetFile.name}</p>
                  <p className="text-sm text-slate-400">
                    {(targetFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                <p className="text-slate-300">
                  {targetDropzone.isDragActive
                    ? t('aiMastering.dropFile')
                    : t('aiMastering.dragOrClick')}
                </p>
                <p className="text-xs text-slate-500">WAV, MP3, FLAC</p>
              </div>
            )}
          </div>
        </div>

        {/* Reference File Upload */}
        <div>
          <label className="text-sm font-semibold text-white mb-2 block">
            {t('aiMastering.referenceTrack')} *
          </label>
          <div
            {...referenceDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              referenceDropzone.isDragActive
                ? 'border-purple-400 bg-purple-400/10'
                : 'border-slate-600 hover:border-purple-400/50 hover:bg-slate-800/50'
            }`}
          >
            <input {...referenceDropzone.getInputProps()} />
            {referenceFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileAudio className="h-8 w-8 text-purple-400" />
                <div className="text-left">
                  <p className="text-white font-medium">{referenceFile.name}</p>
                  <p className="text-sm text-slate-400">
                    {(referenceFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                <p className="text-slate-300">
                  {referenceDropzone.isDragActive
                    ? t('aiMastering.dropFile')
                    : t('aiMastering.dragOrClick')}
                </p>
                <p className="text-xs text-slate-500">WAV, MP3, FLAC</p>
              </div>
            )}
          </div>
        </div>

        {/* Master Button */}
        <Button
          onClick={handleMastering}
          disabled={!targetFile || !referenceFile || isProcessing}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {t('aiMastering.processing')}
            </>
          ) : (
            t('aiMastering.masterTrack')
          )}
        </Button>

        {/* Processing/Results Area */}
        {isProcessing && (
          <Card className="bg-blue-900/20 border-blue-400/30">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-blue-200 font-medium">{t('aiMastering.processing')}...</p>
              <p className="text-sm text-slate-400 mt-1">
                {t('aiMastering.processingMessage')}
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="bg-red-900/20 border-red-400/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 font-medium">{t('aiMastering.error')}</p>
                  <p className="text-sm text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {masteredFile && (
          <Card className="bg-green-900/20 border-green-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-green-200 font-bold text-lg">
                      {t('aiMastering.complete')}
                    </p>
                    <p className="text-sm text-slate-300">{masteredFile.name}</p>
                  </div>
                </div>
                <Button
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {t('button.download')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
