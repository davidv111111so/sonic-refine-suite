import React, { useState, useRef } from 'react';
import { Music, Upload, Crown, Lock, Loader2 } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const AIMasteringTab = () => {
  const { t } = useLanguage();
  const { isPremium, loading, isAdmin } = useUserSubscription();
  const navigate = useNavigate();

  // Component states
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'preset' | 'custom'>('preset');
  const [isProcessing, setIsProcessing] = useState(false);
  const [masteredFile, setMasteredFile] = useState<{ name: string; url: string } | null>(null);

  const targetInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Preset definitions with strict naming convention (lowercase, no spaces)
  // These IDs must match exactly with the backend audio reference files
  const MASTERING_PRESETS = [
    { id: 'rock.wav', displayName: 'Rock' },
    { id: 'latin.wav', displayName: 'Latin' },
    { id: 'electronic.wav', displayName: 'Electronic' },
    { id: 'jazz.wav', displayName: 'Jazz' },
    { id: 'classical.wav', displayName: 'Classical' },
    { id: 'hiphop.wav', displayName: 'Hip-Hop' },
    { id: 'vocal.wav', displayName: 'Vocal' },
    { id: 'bassboost.wav', displayName: 'Bass Boost' }
  ] as const;

  /**
   * Fetches the reference audio file URL for a given preset
   * @param presetId - The preset ID (e.g., 'rock.wav')
   * @returns The URL to the reference audio file
   */
  const getReferenceAudioUrl = (presetId: string): string => {
    // Enforce naming convention: must be lowercase and contain no spaces
    if (presetId !== presetId.toLowerCase() || presetId.includes(' ')) {
      throw new Error(`Invalid preset ID: ${presetId}. Must be lowercase with no spaces.`);
    }
    // Construct URL endpoint for the audio asset
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/mastering-presets/${presetId}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handlePresetClick = (presetId: string) => {
    setSelectedPreset(presetId);
    setActiveMode('preset');
    setReferenceFile(null);
    // Optional: Validate the preset ID format
    try {
      getReferenceAudioUrl(presetId);
    } catch (error) {
      console.error('Invalid preset ID selected:', error);
      toast.error('Invalid preset selected');
    }
  };

  const handleCustomReferenceClick = () => {
    setActiveMode('custom');
    setSelectedPreset(null);
    referenceInputRef.current?.click();
  };

  const handleMastering = async () => {
    if (!targetFile) {
      toast.error('Please select a target file to master');
      return;
    }
    if (activeMode === 'custom' && !referenceFile) {
      toast.error('Please select a custom reference file');
      return;
    }
    if (activeMode === 'preset' && !selectedPreset) {
      toast.error('Please select a genre preset as reference');
      return;
    }

    setIsProcessing(true);
    setMasteredFile(null);

    try {
      const formData = new FormData();
      formData.append('target', targetFile);

      if (activeMode === 'custom') {
        formData.append('reference', referenceFile!);
      } else {
        // Use the preset ID directly (already in correct format)
        formData.append('preset_id', selectedPreset!);
      }

      const { data, error } = await supabase.functions.invoke('ai-mastering', {
        body: formData
      });

      if (error) throw error;

      setMasteredFile({
        name: data.fileName,
        url: data.downloadUrl
      });
      toast.success('Mastering completed successfully!');

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Mastering failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-background/90 border-border">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('status.loading')}...</p>
        </CardContent>
      </Card>
    );
  }

  // Premium access required
  if (!isPremium) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-400/40 shadow-xl">
        <CardContent className="p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Lock className="h-24 w-24 text-purple-400 animate-pulse" />
              <Crown className="h-12 w-12 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
              {t('aiMastering.premiumFeature')}
            </h2>
            <p className="text-slate-300 text-lg">
              {t('aiMastering.unlockMessage')}
            </p>
          </div>

          <Button 
            onClick={() => navigate('/auth')} 
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold py-6 px-12 rounded-xl shadow-2xl shadow-purple-500/50 text-lg" 
            size="lg"
          >
            <Crown className="h-6 w-6 mr-2" />
            {t('aiMastering.upgradeToPremium')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Premium content - Full mastering interface
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Premium Badge */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-primary">AI Audio Mastering</h1>
            <p className="text-muted-foreground">Upload your track and choose a reference to master your audio with AI.</p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            ✨ PREMIUM
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Target and Presets */}
          <div className="space-y-8">
            {/* Target Section */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">1. Upload Your Track (Target)</h2>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => targetInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Drag and drop or click to select</p>
                  <input
                    type="file"
                    ref={targetInputRef}
                    onChange={(e) => handleFileChange(e, setTargetFile)}
                    className="hidden"
                    accept=".wav,.mp3,.flac"
                  />
                </div>
                {targetFile && (
                  <div className="mt-4 flex items-center bg-muted p-3 rounded-md">
                    <Music className="h-6 w-6 mr-2 text-muted-foreground" />
                    <span className="truncate">{targetFile.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Presets Section */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">2. Choose a Genre Reference (Preset)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {MASTERING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetClick(preset.id)}
                      className={`p-3 rounded-md text-center font-medium transition-all text-sm ${
                        selectedPreset === preset.id && activeMode === 'preset'
                          ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {preset.displayName}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Custom Reference and Action */}
          <div className="space-y-8">
            <Card className="bg-card border-border h-full flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-4">... Or Use Your Own Reference</h2>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      activeMode === 'custom' ? 'border-primary' : 'border-border hover:border-primary'
                    }`}
                    onClick={handleCustomReferenceClick}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a custom reference file</p>
                    <input
                      type="file"
                      ref={referenceInputRef}
                      onChange={(e) => handleFileChange(e, setReferenceFile)}
                      className="hidden"
                      accept=".wav,.mp3,.flac"
                    />
                  </div>
                  {referenceFile && activeMode === 'custom' && (
                    <div className="mt-4 flex items-center bg-muted p-3 rounded-md">
                      <Music className="h-6 w-6 mr-2 text-muted-foreground" />
                      <span className="truncate">{referenceFile.name}</span>
                    </div>
                  )}
                </div>
                
                {/* Action and Results Section */}
                <div className="mt-8 space-y-4">
                  <Button
                    onClick={handleMastering}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
                    size="lg"
                  >
                    {isProcessing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {isProcessing ? 'Processing... Please wait' : '✨ Master My Track'}
                  </Button>

                  {masteredFile && (
                    <div className="text-center bg-muted p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-green-500 mb-4">Mastering Complete!</h3>
                      <a
                        href={masteredFile.url}
                        download={masteredFile.name}
                        className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-all"
                      >
                        Download: {masteredFile.name}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};