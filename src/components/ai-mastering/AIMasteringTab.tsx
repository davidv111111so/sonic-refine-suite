import React, { useState, useRef, useEffect } from 'react';
import { Music, Upload, Crown, Lock, Loader2, Settings } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MasteringSettingsModal, MasteringSettings } from './MasteringSettingsModal';

export const AIMasteringTab = () => {
  const { t } = useLanguage();
  const { isPremium, loading, isAdmin } = useUserSubscription();
  const navigate = useNavigate();

  // Component states with localStorage persistence
  const [targetFile, setTargetFile] = useState<File | null>(() => {
    const saved = localStorage.getItem('aiMastering_targetFile');
    return saved ? JSON.parse(saved) : null;
  });
  const [referenceFile, setReferenceFile] = useState<File | null>(() => {
    const saved = localStorage.getItem('aiMastering_referenceFile');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(() => {
    return localStorage.getItem('aiMastering_selectedPreset');
  });
  const [activeMode, setActiveMode] = useState<'preset' | 'custom'>(() => {
    return (localStorage.getItem('aiMastering_activeMode') as 'preset' | 'custom') || 'preset';
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [masteredFile, setMasteredFile] = useState<{ name: string; url: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [masteringSettings, setMasteringSettings] = useState<MasteringSettings>({
    threshold: 0.998138,
    epsilon: 0.000001,
    maxPieceLength: 30.0,
    bpm: 0.0,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    pieceLengthBars: 8.0,
    resamplingMethod: 'FastSinc',
    spectrumCompensation: 'Frequency-Domain (Gain Envelope)',
    loudnessCompensation: 'LUFS (Whole Signal)',
    analyzeFullSpectrum: false,
    spectrumSmoothingWidth: 3,
    smoothingSteps: 1,
    spectrumCorrectionHops: 2,
    loudnessSteps: 10,
    spectrumBands: 32,
    fftSize: 4096,
    normalizeReference: false,
    normalize: false,
    limiterMethod: 'True Peak',
    limiterThreshold: -1.0,
    loudnessCorrectionLimiting: false,
    amplify: false,
    clipping: false,
    outputBits: '32 (IEEE float)',
    outputChannels: 2,
    ditheringMethod: 'TPDF'
  });

  const targetInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Persist state to localStorage
  useEffect(() => {
    if (targetFile) {
      localStorage.setItem('aiMastering_targetFile', JSON.stringify({
        name: targetFile.name,
        size: targetFile.size,
        type: targetFile.type
      }));
    } else {
      localStorage.removeItem('aiMastering_targetFile');
    }
  }, [targetFile]);

  useEffect(() => {
    if (referenceFile) {
      localStorage.setItem('aiMastering_referenceFile', JSON.stringify({
        name: referenceFile.name,
        size: referenceFile.size,
        type: referenceFile.type
      }));
    } else {
      localStorage.removeItem('aiMastering_referenceFile');
    }
  }, [referenceFile]);

  useEffect(() => {
    if (selectedPreset) {
      localStorage.setItem('aiMastering_selectedPreset', selectedPreset);
    } else {
      localStorage.removeItem('aiMastering_selectedPreset');
    }
  }, [selectedPreset]);

  useEffect(() => {
    localStorage.setItem('aiMastering_activeMode', activeMode);
  }, [activeMode]);

  // Preset definitions with strict naming convention (lowercase, no spaces)
  // These IDs must match exactly with the backend audio reference files
  const MASTERING_PRESETS = [
    { id: 'rock.wav', displayName: 'Rock', icon: '🎸', gradient: 'from-red-500 to-orange-600' },
    { id: 'latin.wav', displayName: 'Latin', icon: '💃', gradient: 'from-yellow-500 to-red-600' },
    { id: 'electronic.wav', displayName: 'Electronic', icon: '⚡', gradient: 'from-cyan-500 to-blue-600' },
    { id: 'jazz.wav', displayName: 'Jazz', icon: '🎷', gradient: 'from-purple-500 to-indigo-600' },
    { id: 'classical.wav', displayName: 'Classical', icon: '🎻', gradient: 'from-amber-500 to-yellow-600' },
    { id: 'hiphop.wav', displayName: 'Hip-Hop', icon: '🎤', gradient: 'from-green-500 to-emerald-600' },
    { id: 'vocal.wav', displayName: 'Vocal', icon: '🎙️', gradient: 'from-pink-500 to-rose-600' },
    { id: 'bassboost.wav', displayName: 'Bass Boost', icon: '🔊', gradient: 'from-indigo-500 to-purple-600' }
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
    // Reset the input value to allow re-uploading the same file
    if (e.target) {
      e.target.value = '';
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

      const fileName = data.fileName;
      const downloadUrl = data.downloadUrl;
      
      setMasteredFile({
        name: fileName,
        url: downloadUrl
      });
      
      // Automatically trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`✅ Mastering complete! ${fileName} has been downloaded.`);

    } catch (err) {
      console.error('AI Mastering Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Mastering failed. Please try again.';
      toast.error(`❌ ${errorMessage}`);
      
      // Detailed error logging
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        console.error('Network error: Cannot reach edge function');
        toast.error('Network error: Please check your internet connection');
      }
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
        {/* Settings Modal */}
        <MasteringSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={masteringSettings}
          onSettingsChange={setMasteringSettings}
        />

        {/* Header with Premium Badge and Settings Button */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-primary">AI Audio Mastering</h1>
            <p className="text-muted-foreground">Upload your track and choose a reference to master your audio with AI.</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSettingsOpen(true)}
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs h-7 flex items-center px-3">
              ✨ Premium
            </Badge>
          </div>
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
                  <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-md">
                    <div className="flex items-center flex-1 min-w-0">
                      <Music className="h-6 w-6 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{targetFile.name}</span>
                    </div>
                    <Button
                      onClick={() => {
                        setTargetFile(null);
                        if (targetInputRef.current) {
                          targetInputRef.current.value = '';
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ✕
                    </Button>
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
                      className={`relative p-4 rounded-xl text-center font-bold transition-all duration-300 overflow-hidden group ${
                        selectedPreset === preset.id && activeMode === 'preset'
                          ? `bg-gradient-to-br ${preset.gradient} text-white shadow-2xl scale-105 ring-4 ring-white/30`
                          : `bg-gradient-to-br ${preset.gradient} opacity-70 hover:opacity-100 hover:scale-105 text-white shadow-lg`
                      }`}
                    >
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-300" />
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <span className="text-3xl">{preset.icon}</span>
                        <span className="text-sm drop-shadow-lg">{preset.displayName}</span>
                      </div>
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
                    <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-md">
                      <div className="flex items-center flex-1 min-w-0">
                        <Music className="h-6 w-6 mr-2 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{referenceFile.name}</span>
                      </div>
                      <Button
                        onClick={() => {
                          setReferenceFile(null);
                          setActiveMode('preset');
                          if (referenceInputRef.current) {
                            referenceInputRef.current.value = '';
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ✕
                      </Button>
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
                    <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/40">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-green-400 mb-2">✅ Mastering Complete!</h3>
                            <p className="text-sm text-muted-foreground">File downloaded: {masteredFile.name}</p>
                          </div>
                          <Button
                            onClick={() => {
                              setMasteredFile(null);
                              setTargetFile(null);
                              setReferenceFile(null);
                              setSelectedPreset(null);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕ Clear
                          </Button>
                        </div>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = masteredFile.url;
                            link.download = masteredFile.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Download Again
                        </Button>
                      </CardContent>
                    </Card>
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