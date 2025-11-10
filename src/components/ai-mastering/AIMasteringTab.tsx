import React, { useState, useRef } from 'react';
import { Music, Upload, Crown, Lock, Loader2, Settings, BookOpen } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { MasteringAdvancedSettings, MasteringSettings } from './MasteringAdvancedSettings';
import { AdminReferenceManager } from './AdminReferenceManager';
import { mapSettingsToEnhancedBackend, validateBackendParams } from './AdvancedSettingsBackend';
import { AIMasteringGuide } from './AIMasteringGuide';
export const AIMasteringTab = () => {
  const {
    t
  } = useLanguage();
  const {
    isPremium,
    loading
  } = useUserSubscription();
  const navigate = useNavigate();
  
  // State with sessionStorage persistence for file metadata
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [targetFileInfo, setTargetFileInfo] = useState<{name: string; size: number} | null>(() => {
    try {
      const saved = sessionStorage.getItem('aiMastering_targetFile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceFileInfo, setReferenceFileInfo] = useState<{name: string; size: number} | null>(() => {
    try {
      const saved = sessionStorage.getItem('aiMastering_referenceFile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem('aiMastering_selectedPreset');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [activeMode, setActiveMode] = useState<'preset' | 'custom'>(() => {
    try {
      const saved = sessionStorage.getItem('aiMastering_activeMode');
      return saved ? JSON.parse(saved) : 'preset';
    } catch {
      return 'preset';
    }
  });
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [advancedSettings, setAdvancedSettings] = useState<MasteringSettings>(() => {
    try {
      const saved = sessionStorage.getItem('aiMastering_advancedSettings');
      return saved ? JSON.parse(saved) : {
        threshold: 0.998138,
        epsilon: 0.000001,
        max_piece_length: 30.0,
        bpm: 0.0,
        time_signature_numerator: 4,
        time_signature_denominator: 4,
        piece_length_bars: 8.0,
        resampling_method: 'FastSinc',
        spectrum_compensation: 'Frequency-Domain (Gain Envelope)',
        loudness_compensation: 'LUFS (Whole Signal)',
        analyze_full_spectrum: false,
        spectrum_smoothing_width: 3,
        smoothing_steps: 1,
        spectrum_correction_hops: 2,
        loudness_steps: 10,
        spectrum_bands: 32,
        fft_size: 4096,
        normalize_reference: false,
        normalize: false,
        limiter_method: 'True Peak',
        limiter_threshold_db: -1.0,
        loudness_correction_limiting: false,
        amplify: false,
        clipping: false,
        output_bits: '32 (IEEE float)',
        output_channels: 2,
        dithering_method: 'TPDF',
      };
    } catch {
      return {
        threshold: 0.998138,
        epsilon: 0.000001,
        max_piece_length: 30.0,
        bpm: 0.0,
        time_signature_numerator: 4,
        time_signature_denominator: 4,
        piece_length_bars: 8.0,
        resampling_method: 'FastSinc',
        spectrum_compensation: 'Frequency-Domain (Gain Envelope)',
        loudness_compensation: 'LUFS (Whole Signal)',
        analyze_full_spectrum: false,
        spectrum_smoothing_width: 3,
        smoothing_steps: 1,
        spectrum_correction_hops: 2,
        loudness_steps: 10,
        spectrum_bands: 32,
        fft_size: 4096,
        normalize_reference: false,
        normalize: false,
        limiter_method: 'True Peak',
        limiter_threshold_db: -1.0,
        loudness_correction_limiting: false,
        amplify: false,
        clipping: false,
        output_bits: '32 (IEEE float)',
        output_channels: 2,
        dithering_method: 'TPDF',
      };
    }
  });
  
  const targetInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const BACKEND_URL = 'https://spectrum-backend-857351913435.us-central1.run.app';
  
  // Save state to sessionStorage whenever it changes
  React.useEffect(() => {
    try {
      if (targetFileInfo) {
        sessionStorage.setItem('aiMastering_targetFile', JSON.stringify(targetFileInfo));
      } else {
        sessionStorage.removeItem('aiMastering_targetFile');
      }
    } catch (e) {
      console.error('Failed to save target file info:', e);
    }
  }, [targetFileInfo]);
  
  React.useEffect(() => {
    try {
      if (referenceFileInfo) {
        sessionStorage.setItem('aiMastering_referenceFile', JSON.stringify(referenceFileInfo));
      } else {
        sessionStorage.removeItem('aiMastering_referenceFile');
      }
    } catch (e) {
      console.error('Failed to save reference file info:', e);
    }
  }, [referenceFileInfo]);
  
  React.useEffect(() => {
    try {
      if (selectedPreset) {
        sessionStorage.setItem('aiMastering_selectedPreset', JSON.stringify(selectedPreset));
      } else {
        sessionStorage.removeItem('aiMastering_selectedPreset');
      }
    } catch (e) {
      console.error('Failed to save preset:', e);
    }
  }, [selectedPreset]);
  
  React.useEffect(() => {
    try {
      sessionStorage.setItem('aiMastering_activeMode', JSON.stringify(activeMode));
    } catch (e) {
      console.error('Failed to save mode:', e);
    }
  }, [activeMode]);
  
  React.useEffect(() => {
    try {
      sessionStorage.setItem('aiMastering_advancedSettings', JSON.stringify(advancedSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [advancedSettings]);
  const MASTERING_PRESETS = [{
    id: 'rock',
    displayName: 'Rock',
    icon: '🎸',
    gradient: 'from-red-500 to-orange-600'
  }, {
    id: 'indie-rock',
    displayName: 'Indie Rock',
    icon: '🎸',
    gradient: 'from-orange-500 to-red-500'
  }, {
    id: 'punk-rock',
    displayName: 'Punk Rock',
    icon: '🤘',
    gradient: 'from-red-600 to-black'
  }, {
    id: 'metal',
    displayName: 'Metal',
    icon: '⚡',
    gradient: 'from-gray-600 to-black'
  }, {
    id: 'dance-pop',
    displayName: 'Dance Pop',
    icon: '💃',
    gradient: 'from-pink-500 to-purple-500'
  }, {
    id: 'drum-bass',
    displayName: 'Drum & Bass',
    icon: '🥁',
    gradient: 'from-blue-600 to-purple-600'
  }, {
    id: 'dubstep',
    displayName: 'Dubstep',
    icon: '🔊',
    gradient: 'from-green-600 to-blue-600'
  }, {
    id: 'edm',
    displayName: 'EDM',
    icon: '🎛️',
    gradient: 'from-cyan-500 to-blue-600'
  }, {
    id: 'house',
    displayName: 'House',
    icon: '🏠',
    gradient: 'from-purple-500 to-pink-500'
  }, {
    id: 'techno',
    displayName: 'Techno',
    icon: '🤖',
    gradient: 'from-gray-500 to-blue-600'
  }, {
    id: 'hip-hop',
    displayName: 'Hip-Hop',
    icon: '🎤',
    gradient: 'from-yellow-600 to-red-600'
  }, {
    id: 'reggae',
    displayName: 'Reggae',
    icon: '🌴',
    gradient: 'from-green-500 to-yellow-500'
  }, {
    id: 'reggaeton',
    displayName: 'Reggaeton',
    icon: '🔥',
    gradient: 'from-red-500 to-yellow-500'
  }, {
    id: 'rnb-soul',
    displayName: 'Rnb/Soul',
    icon: '💜',
    gradient: 'from-purple-600 to-pink-600'
  }, {
    id: 'trap',
    displayName: 'Trap',
    icon: '💎',
    gradient: 'from-black to-red-600'
  }, {
    id: 'pop',
    displayName: 'Pop',
    icon: '🎵',
    gradient: 'from-pink-400 to-purple-400'
  }, {
    id: 'kpop-jpop',
    displayName: 'K-pop/J-pop',
    icon: '🌸',
    gradient: 'from-pink-300 to-blue-300'
  }, {
    id: 'latin-pop',
    displayName: 'Latin Pop',
    icon: '💃',
    gradient: 'from-yellow-500 to-red-600'
  }, {
    id: 'country',
    displayName: 'Country',
    icon: '🤠',
    gradient: 'from-amber-600 to-yellow-500'
  }, {
    id: 'jazz',
    displayName: 'Jazz',
    icon: '🎷',
    gradient: 'from-purple-500 to-indigo-600'
  }] as const;
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'target' | 'reference') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'target') {
        setTargetFile(file);
        setTargetFileInfo({ name: file.name, size: file.size });
      } else {
        setReferenceFile(file);
        setReferenceFileInfo({ name: file.name, size: file.size });
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  };
  const handlePresetClick = (presetId: string) => {
    setSelectedPreset(presetId);
    setActiveMode('preset');
    setReferenceFile(null);
    setReferenceFileInfo(null);
  };
  const handleCustomReferenceClick = () => {
    setActiveMode('custom');
    setSelectedPreset(null);
    referenceInputRef.current?.click();
  };
  const handleMastering = async () => {
    if (!targetFile) {
      setError("Please select a target audio file.");
      toast.error("Please select a target audio file.");
      return;
    }
    if (!referenceFile && !selectedPreset) {
      setError("Please select a reference file or choose a genre preset.");
      toast.error("Please select a reference file or choose a genre preset.");
      return;
    }
    setError('');
    setIsProcessing(true);
    
    try {
      toast.info('🎵 Starting AI mastering...');
      
      // Map UI settings to backend parameters and validate
      const backendParams = mapSettingsToEnhancedBackend(advancedSettings);
      const validationErrors = validateBackendParams(backendParams);
      
      if (validationErrors.length > 0) {
        toast.error('Invalid settings', {
          description: validationErrors.join(', ')
        });
        setIsProcessing(false);
        return;
      }

      // Step 1: Generate upload URL for target file
      toast.info('📤 Uploading target file...');
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication required', {
          description: 'Please log out and log in again to continue.'
        });
        setIsProcessing(false);
        return;
      }
      
      const { data: targetUploadData, error: targetUploadError } = await supabase.functions.invoke('generate-upload-url', {
        body: {
          fileName: targetFile.name,
          fileType: targetFile.type || 'audio/wav'
        }
      });

      if (targetUploadError) {
        console.error('Upload URL error:', targetUploadError);
        throw new Error(`Failed to generate upload URL: ${targetUploadError.message}`);
      }
      
      if (!targetUploadData?.uploadUrl) {
        throw new Error('Failed to generate upload URL for target file');
      }

      // Upload target file to GCS
      const targetUploadResponse = await fetch(targetUploadData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': targetFile.type || 'audio/wav',
        },
        body: targetFile
      });

      if (!targetUploadResponse.ok) {
        throw new Error('Failed to upload target file to cloud storage');
      }

      // Step 2: Handle reference file or preset
      let referenceGcsPath = null;
      
      if (activeMode === 'custom' && referenceFile) {
        toast.info('📤 Uploading reference file...');
        const { data: refUploadData, error: refUploadError } = await supabase.functions.invoke('generate-upload-url', {
          body: {
            fileName: referenceFile.name,
            fileType: referenceFile.type || 'audio/wav'
          }
        });

        if (refUploadError || !refUploadData?.uploadUrl) {
          throw new Error('Failed to generate upload URL for reference file');
        }

        // Upload reference file to GCS
        const refUploadResponse = await fetch(refUploadData.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': referenceFile.type || 'audio/wav',
          },
          body: referenceFile
        });

        if (!refUploadResponse.ok) {
          throw new Error('Failed to upload reference file to cloud storage');
        }

        referenceGcsPath = refUploadData.gcsPath;
      }

      // Step 3: Start mastering job
      toast.info('🎨 Starting mastering job...');
      const jobPayload: any = {
        targetGcsPath: targetUploadData.gcsPath,
        advancedSettings: backendParams
      };

      if (activeMode === 'custom' && referenceGcsPath) {
        jobPayload.referenceGcsPath = referenceGcsPath;
      } else if (activeMode === 'preset' && selectedPreset) {
        jobPayload.presetId = selectedPreset;
      }

      const { data: jobData, error: jobError } = await supabase.functions.invoke('start-mastering-job', {
        body: jobPayload
      });

      if (jobError || !jobData?.jobId) {
        throw new Error('Failed to start mastering job');
      }

      const jobId = jobData.jobId;
      toast.info(`🎫 Job started (ID: ${jobId.substring(0, 8)}...)`);

      // Step 4: Poll for job status
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes (5s intervals)
      
      const pollStatus = async (): Promise<void> => {
        attempts++;
        
        const { data: statusData, error: statusError } = await supabase.functions.invoke('get-job-status', {
          body: { jobId }
        });

        if (statusError) {
          throw new Error('Failed to check job status');
        }

        const status = statusData?.status;
        const progress = statusData?.progress || 0;

        if (status === 'completed') {
          // Job complete - download file
          if (!statusData.downloadUrl) {
            throw new Error('No download URL provided');
          }

          toast.success('✅ Mastering complete! Downloading...');
          
          const fileResponse = await fetch(statusData.downloadUrl);
          if (!fileResponse.ok) {
            throw new Error('Failed to download mastered file');
          }
          
          const blob = await fileResponse.blob();
          const filename = `mastered_${targetFile.name.replace(/\.[^/.]+$/, '')}.wav`;
          saveAs(blob, filename);
          
          toast.success('✅ File downloaded successfully!');
          
          // Clear session storage
          sessionStorage.removeItem('aiMastering_targetFile');
          sessionStorage.removeItem('aiMastering_referenceFile');
          setTargetFileInfo(null);
          setReferenceFileInfo(null);
          setIsProcessing(false);
          
        } else if (status === 'failed') {
          throw new Error(statusData.error || 'Mastering job failed');
          
        } else if (status === 'processing' || status === 'pending') {
          // Update progress
          toast.info(`⚙️ Processing... ${Math.round(progress)}%`, { id: 'mastering-progress' });
          
          if (attempts >= maxAttempts) {
            throw new Error('Job timeout - please try again');
          }
          
          // Continue polling
          await new Promise(resolve => setTimeout(resolve, 5000));
          await pollStatus();
          
        } else {
          throw new Error(`Unknown job status: ${status}`);
        }
      };

      await pollStatus();
      
    } catch (err) {
      let errorMsg = 'An error occurred during mastering';
      
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      
      console.error('Mastering error:', err);
      setError(errorMsg);
      setIsProcessing(false);
      toast.error(`❌ ${errorMsg}`);
    }
  };
  if (loading) {
    return <Card className="bg-background/90 border-border">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('status.loading')}...</p>
        </CardContent>
      </Card>;
  }
  if (!isPremium) {
    return <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-400/40 shadow-xl">
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

          <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold py-6 px-12 rounded-xl shadow-2xl shadow-purple-500/50 text-lg" size="lg">
            <Crown className="h-6 w-6 mr-2" />
            {t('aiMastering.upgradeToPremium')}
          </Button>
        </CardContent>
      </Card>;
  }
  return <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-primary">AI Audio Mastering</h1>
            <p className="text-muted-foreground">Upload your track and choose a reference to master your audio with AI.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowGuide(true)} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Help Guide
            </Button>
            <Button variant="outline" onClick={() => setShowAdvancedSettings(true)} className="flex items-center gap-2 text-sky-500">
              <Settings className="h-4 w-4" />
              Advanced Settings
            </Button>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs h-7 flex items-center px-3">
              ✨ Premium
            </Badge>
          </div>
        </div>

        {/* Advanced Settings Modal */}
        <MasteringAdvancedSettings open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings} settings={advancedSettings} onSettingsChange={setAdvancedSettings} />
        
        {/* Help Guide Modal */}
        <AIMasteringGuide open={showGuide} onOpenChange={setShowGuide} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Target and Presets */}
          <div className="space-y-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">1. Upload Your Track (Target)</h2>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => targetInputRef.current?.click()}>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Drag and drop or click to select</p>
                  <input type="file" ref={targetInputRef} onChange={e => handleFileChange(e, 'target')} className="hidden" accept=".wav,.mp3,.flac" />
                </div>
                {targetFileInfo && !targetFile && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-sm text-blue-400 mb-2">Previous session detected:</p>
                    <p className="text-xs text-muted-foreground">{targetFileInfo.name} ({(targetFileInfo.size / 1024 / 1024).toFixed(2)} MB)</p>
                    <p className="text-xs text-yellow-400 mt-2">⚠️ Please re-upload to process</p>
                  </div>
                )}
                {targetFile && <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-md">
                    <div className="flex items-center flex-1 min-w-0">
                      <Music className="h-6 w-6 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{targetFile.name}</span>
                    </div>
                    <Button onClick={() => {
                  setTargetFile(null);
                  setTargetFileInfo(null);
                  if (targetInputRef.current) {
                    targetInputRef.current.value = '';
                  }
                }} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 ml-2">
                      ✕
                    </Button>
                  </div>}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">2. Choose a Genre Reference (Preset)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {MASTERING_PRESETS.map(preset => <button key={preset.id} onClick={() => handlePresetClick(preset.id)} className={`relative p-3 rounded-xl text-center font-bold transition-all duration-300 overflow-hidden group ${selectedPreset === preset.id && activeMode === 'preset' ? `bg-gradient-to-br ${preset.gradient} text-white shadow-2xl scale-105 ring-4 ring-white/30` : `bg-gradient-to-br ${preset.gradient} opacity-70 hover:opacity-100 hover:scale-105 text-white shadow-lg`}`}>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-300" />
                      <div className="relative z-10 flex flex-col items-center gap-1.5">
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-xs drop-shadow-lg leading-tight">{preset.displayName}</span>
                      </div>
                    </button>)}
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
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${activeMode === 'custom' ? 'border-primary' : 'border-border hover:border-primary'}`} onClick={handleCustomReferenceClick}>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a custom reference file</p>
                    <input type="file" ref={referenceInputRef} onChange={e => handleFileChange(e, 'reference')} className="hidden" accept=".wav,.mp3,.flac" />
                  </div>
                  {referenceFileInfo && !referenceFile && activeMode === 'custom' && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <p className="text-sm text-blue-400 mb-2">Previous reference detected:</p>
                      <p className="text-xs text-muted-foreground">{referenceFileInfo.name} ({(referenceFileInfo.size / 1024 / 1024).toFixed(2)} MB)</p>
                      <p className="text-xs text-yellow-400 mt-2">⚠️ Please re-upload to process</p>
                    </div>
                  )}
                  {referenceFile && activeMode === 'custom' && <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-md">
                      <div className="flex items-center flex-1 min-w-0">
                        <Music className="h-6 w-6 mr-2 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{referenceFile.name}</span>
                      </div>
                      <Button onClick={() => {
                    setReferenceFile(null);
                    setReferenceFileInfo(null);
                    if (referenceInputRef.current) {
                      referenceInputRef.current.value = '';
                    }
                  }} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 ml-2">
                        ✕
                      </Button>
                    </div>}
                </div>

                <div className="mt-8">
                  <Button onClick={handleMastering} disabled={isProcessing} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 rounded-lg text-lg transition-all disabled:bg-slate-500 disabled:cursor-not-allowed">
                    {isProcessing ? <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing... This may take 30-60 seconds
                      </> : <>
                        ✨ Master My Track
                      </>}
                  </Button>

                  {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center text-red-400 text-sm">
                      {error}
                    </div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Admin Reference Manager - Only visible to admins */}
      <AdminReferenceManager />
      
    </div>;
};