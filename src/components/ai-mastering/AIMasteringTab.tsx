import React, { useState, useRef, useEffect } from 'react';
import { Music, Upload, Crown, Lock, Loader2, Settings, Download, CheckCircle } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const AIMasteringTab = () => {
  const { t } = useLanguage();
  const { isPremium, loading } = useUserSubscription();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'preset' | 'custom'>('preset');

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const poller = useRef<NodeJS.Timeout | null>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const MASTERING_PRESETS = [
    { id: 'rock', displayName: 'Rock', icon: '🎸', gradient: 'from-red-500 to-orange-600' },
    { id: 'indie-rock', displayName: 'Indie Rock', icon: '🎸', gradient: 'from-orange-500 to-red-500' },
    { id: 'punk-rock', displayName: 'Punk Rock', icon: '🤘', gradient: 'from-red-600 to-black' },
    { id: 'metal', displayName: 'Metal', icon: '⚡', gradient: 'from-gray-600 to-black' },
    { id: 'dance-pop', displayName: 'Dance Pop', icon: '💃', gradient: 'from-pink-500 to-purple-500' },
    { id: 'drum-bass', displayName: 'Drum & Bass', icon: '🥁', gradient: 'from-blue-600 to-purple-600' },
    { id: 'dubstep', displayName: 'Dubstep', icon: '🔊', gradient: 'from-green-600 to-blue-600' },
    { id: 'edm', displayName: 'EDM', icon: '🎛️', gradient: 'from-cyan-500 to-blue-600' },
    { id: 'house', displayName: 'House', icon: '🏠', gradient: 'from-purple-500 to-pink-500' },
    { id: 'techno', displayName: 'Techno', icon: '🤖', gradient: 'from-gray-500 to-blue-600' },
    { id: 'hip-hop', displayName: 'Hip-Hop', icon: '🎤', gradient: 'from-yellow-600 to-red-600' },
    { id: 'reggae', displayName: 'Reggae', icon: '🌴', gradient: 'from-green-500 to-yellow-500' },
    { id: 'reggaeton', displayName: 'Reggaeton', icon: '🔥', gradient: 'from-red-500 to-yellow-500' },
    { id: 'rnb-soul', displayName: 'Rnb/Soul', icon: '💜', gradient: 'from-purple-600 to-pink-600' },
    { id: 'trap', displayName: 'Trap', icon: '💎', gradient: 'from-black to-red-600' },
    { id: 'pop', displayName: 'Pop', icon: '🎵', gradient: 'from-pink-400 to-purple-400' },
    { id: 'kpop-jpop', displayName: 'K-pop/J-pop', icon: '🌸', gradient: 'from-pink-300 to-blue-300' },
    { id: 'latin-pop', displayName: 'Latin Pop', icon: '💃', gradient: 'from-yellow-500 to-red-600' },
    { id: 'country', displayName: 'Country', icon: '🤠', gradient: 'from-amber-600 to-yellow-500' },
    { id: 'jazz', displayName: 'Jazz', icon: '🎷', gradient: 'from-purple-500 to-indigo-600' }
  ] as const;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePresetClick = (presetId: string) => {
    setSelectedPreset(presetId);
    setActiveMode('preset');
    setReferenceFile(null);
  };

  const handleCustomReferenceClick = () => {
    setActiveMode('custom');
    setSelectedPreset(null);
    referenceInputRef.current?.click();
  };

  const uploadFileDirectly = async (file: File): Promise<string> => {
    setStatusMessage(`Uploading ${file.name}...`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const { data, error } = await supabase.functions.invoke('generate-upload-url', {
      body: formData,
    });
    
    if (error || !data?.path) {
      throw new Error(error?.message || "File upload failed.");
    }
    
    toast.success(`✅ ${file.name} uploaded successfully`);
    return data.path;
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
    setJobStatus('uploading');
    setDownloadUrl(null);

    try {
      // Upload target file to backend
      const targetPath = await uploadFileDirectly(targetFile);
      
      let referencePath: string | undefined;
      
      // Upload reference file if custom reference mode
      if (activeMode === 'custom' && referenceFile) {
        referencePath = await uploadFileDirectly(referenceFile);
      }

      setStatusMessage('Starting AI mastering process...');
      toast.info('🎵 Starting AI mastering...');
      
      const requestBody: any = { 
        target_path: targetPath
      };
      
      // Add preset_id or reference_path based on mode
      if (activeMode === 'preset' && selectedPreset) {
        requestBody.preset_id = selectedPreset;
      } else if (activeMode === 'custom' && referencePath) {
        requestBody.reference_path = referencePath;
      }
      
      // Call backend via edge function
      const { data, error } = await supabase.functions.invoke('start-mastering-job', {
        body: requestBody,
      });
      
      if (error || !data?.jobId) {
        throw new Error(error?.message || "Could not start the mastering job.");
      }
      
      setJobId(data.jobId);
      setJobStatus('processing');
      setStatusMessage('Processing audio... This may take a few minutes.');
      toast.info('🎵 Processing your audio... This may take a few minutes.');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      setJobStatus(null);
      toast.error(`❌ ${errorMsg}`);
    }
  };

  // Poll for job status
  useEffect(() => {
    if (jobStatus === 'processing' && jobId) {
      poller.current = setInterval(async () => {
        const { data, error } = await supabase.functions.invoke('get-job-status', {
          body: { jobId },
        });

        if (error) {
          setError("Could not get job status.");
          clearInterval(poller.current!);
          setJobStatus('failed');
          toast.error("Could not get job status.");
          return;
        }

        if (data.status === 'completed') {
          setJobStatus('completed');
          setStatusMessage('Mastering complete!');
          const fullDownloadUrl = `https://mastering-backend-857351913435.us-central1.run.app${data.downloadUrl}`;
          setDownloadUrl(fullDownloadUrl);
          clearInterval(poller.current!);
          toast.success('✅ Mastering complete! Downloading your file...');
          
          // Auto-download the mastered file
          const link = document.createElement('a');
          link.href = fullDownloadUrl;
          link.download = data.outputFile || `mastered_${targetFile?.name || 'audio.wav'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (data.status === 'failed') {
          setJobStatus('failed');
          setError(data.error || 'The mastering job failed on the server.');
          setStatusMessage('An error occurred during mastering.');
          clearInterval(poller.current!);
          toast.error('❌ Mastering failed. Please try again.');
        }
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (poller.current) clearInterval(poller.current);
    };
  }, [jobStatus, jobId]);

  const isProcessing = jobStatus === 'uploading' || jobStatus === 'processing';

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

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-primary">AI Audio Mastering</h1>
            <p className="text-muted-foreground">Upload your track and choose a reference to master your audio with AI.</p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs h-7 flex items-center px-3">
            ✨ Premium
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Target and Presets */}
          <div className="space-y-8">
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

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">2. Choose a Genre Reference (Preset)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {MASTERING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetClick(preset.id)}
                      className={`relative p-3 rounded-xl text-center font-bold transition-all duration-300 overflow-hidden group ${
                        selectedPreset === preset.id && activeMode === 'preset'
                          ? `bg-gradient-to-br ${preset.gradient} text-white shadow-2xl scale-105 ring-4 ring-white/30`
                          : `bg-gradient-to-br ${preset.gradient} opacity-70 hover:opacity-100 hover:scale-105 text-white shadow-lg`
                      }`}
                    >
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-300" />
                      <div className="relative z-10 flex flex-col items-center gap-1.5">
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-xs drop-shadow-lg leading-tight">{preset.displayName}</span>
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

                <div className="mt-8">
                  <Button
                    onClick={handleMastering}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 rounded-lg text-lg transition-all disabled:bg-slate-500 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {statusMessage}
                      </>
                    ) : (
                      <>
                        ✨ Master My Track
                      </>
                    )}
                  </Button>

                  {error && (
                    <div className="mt-4 text-center text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {jobStatus === 'completed' && downloadUrl && (
                    <div className="mt-6 text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        <h3 className="text-xl font-semibold text-green-400">Mastering Complete!</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">Your mastered file has been downloaded automatically.</p>
                      <a 
                        href={downloadUrl}
                        download
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                      >
                        <Download className="h-5 w-5" />
                        Download Mastered File
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
