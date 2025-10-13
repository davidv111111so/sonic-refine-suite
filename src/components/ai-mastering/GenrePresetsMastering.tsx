import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, Download, Loader2, CheckCircle2, AlertCircle, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const GENRES = ['Rock', 'Latin', 'Electronic', 'Hip Hop', 'Pop', 'Jazz', 'Classical', 'Country'];

const GENRE_PRESETS: Record<string, Array<{ id: string; name: string; artist: string }>> = {
  Rock: [
    { id: 'rock-1', name: 'Heavy Rock Master', artist: 'Studio Reference' },
    { id: 'rock-2', name: 'Alternative Rock', artist: 'Indie Sound' },
    { id: 'rock-3', name: 'Classic Rock', artist: 'Vintage Tone' },
  ],
  Latin: [
    { id: 'latin-1', name: 'Reggaeton Modern', artist: 'Urban Latin' },
    { id: 'latin-2', name: 'Salsa Classic', artist: 'Traditional' },
    { id: 'latin-3', name: 'Latin Pop', artist: 'Crossover' },
  ],
  Electronic: [
    { id: 'electronic-1', name: 'EDM Festival', artist: 'Big Room' },
    { id: 'electronic-2', name: 'House Deep', artist: 'Underground' },
    { id: 'electronic-3', name: 'Techno Industrial', artist: 'Dark Sound' },
  ],
  'Hip Hop': [
    { id: 'hiphop-1', name: 'Trap Modern', artist: '808 Heavy' },
    { id: 'hiphop-2', name: 'Boom Bap Classic', artist: 'Golden Era' },
    { id: 'hiphop-3', name: 'Lo-Fi Hip Hop', artist: 'Chill Beats' },
  ],
  Pop: [
    { id: 'pop-1', name: 'Modern Pop Hit', artist: 'Chart Topper' },
    { id: 'pop-2', name: 'Indie Pop', artist: 'Alternative' },
    { id: 'pop-3', name: 'Synth Pop', artist: 'Retro Wave' },
  ],
  Jazz: [
    { id: 'jazz-1', name: 'Smooth Jazz', artist: 'Contemporary' },
    { id: 'jazz-2', name: 'Bebop', artist: 'Classic Era' },
    { id: 'jazz-3', name: 'Fusion', artist: 'Modern Mix' },
  ],
  Classical: [
    { id: 'classical-1', name: 'Orchestral', artist: 'Symphony' },
    { id: 'classical-2', name: 'Chamber Music', artist: 'Intimate' },
    { id: 'classical-3', name: 'Contemporary Classical', artist: 'Modern' },
  ],
  Country: [
    { id: 'country-1', name: 'Modern Country', artist: 'Nashville' },
    { id: 'country-2', name: 'Traditional Country', artist: 'Classic' },
    { id: 'country-3', name: 'Country Rock', artist: 'Crossover' },
  ],
};

export const GenrePresetsMastering = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [masteredFile, setMasteredFile] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setTargetFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.wav', '.mp3', '.flac'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setSelectedPreset(null);
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
  };

  const handleMastering = async () => {
    if (!targetFile || !selectedPreset) return;

    setIsProcessing(true);
    setError(null);
    setMasteredFile(null);

    try {
      const formData = new FormData();
      formData.append('target', targetFile);
      formData.append('preset_id', selectedPreset);

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
        <CardTitle className="text-purple-400">
          {t('aiMastering.masterWithPresets')}
        </CardTitle>
        <p className="text-sm text-slate-400 mt-2">
          {t('aiMastering.genrePresetsDescription')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target File Upload */}
        <div>
          <label className="text-sm font-semibold text-white mb-2 block">
            {t('aiMastering.targetTrack')} *
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-purple-400 bg-purple-400/10'
                : 'border-slate-600 hover:border-purple-400/50 hover:bg-slate-800/50'
            }`}
          >
            <input {...getInputProps()} />
            {targetFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileAudio className="h-8 w-8 text-purple-400" />
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
                  {isDragActive
                    ? t('aiMastering.dropFile')
                    : t('aiMastering.dragOrClick')}
                </p>
                <p className="text-xs text-slate-500">WAV, MP3, FLAC</p>
              </div>
            )}
          </div>
        </div>

        {/* Genre Selection */}
        <div>
          <label className="text-sm font-semibold text-white mb-3 block">
            {t('aiMastering.selectGenre')} *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GENRES.map((genre) => (
              <Button
                key={genre}
                onClick={() => handleGenreSelect(genre)}
                variant={selectedGenre === genre ? 'default' : 'outline'}
                className={`${
                  selectedGenre === genre
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400'
                    : 'border-slate-600 text-slate-300 hover:border-purple-400 hover:text-white'
                }`}
              >
                <Music className="h-4 w-4 mr-2" />
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {/* Preset Selection */}
        {selectedGenre && (
          <div>
            <label className="text-sm font-semibold text-white mb-3 block">
              {t('aiMastering.selectPreset')} *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {GENRE_PRESETS[selectedGenre].map((preset) => (
                <Card
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`cursor-pointer transition-all ${
                    selectedPreset === preset.id
                      ? 'bg-gradient-to-br from-purple-900/60 to-pink-900/60 border-purple-400 shadow-lg shadow-purple-500/30'
                      : 'bg-slate-800 border-slate-600 hover:border-purple-400/50 hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <FileAudio className={`h-6 w-6 ${selectedPreset === preset.id ? 'text-purple-300' : 'text-slate-400'}`} />
                      {selectedPreset === preset.id && (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    <p className="font-semibold text-white text-sm mb-1">
                      {preset.name}
                    </p>
                    <p className="text-xs text-slate-400">{preset.artist}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Master Button */}
        <Button
          onClick={handleMastering}
          disabled={!targetFile || !selectedPreset || isProcessing}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          <Card className="bg-purple-900/20 border-purple-400/30">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-3" />
              <p className="text-purple-200 font-medium">{t('aiMastering.processing')}...</p>
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
