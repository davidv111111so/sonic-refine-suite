import React, { useState, useRef } from "react";
import {
  Music,
  Upload,
  Crown,
  Lock,
  Loader2,
  Settings,
  BookOpen,
  Plus,
  Download,
} from "lucide-react";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";
import {
  MasteringAdvancedSettings,
  MasteringSettings,
} from "./MasteringAdvancedSettings";
// AdminReferenceManager removed - use genre selector to upload references
import {
  mapSettingsToEnhancedBackend,
  validateBackendParams,
} from "./AdvancedSettingsBackend";
import { AIMasteringGuide } from "./AIMasteringGuide";
import { saveReferenceTrack, getReferenceTrack } from "@/utils/referenceTrackStorage";
import { masteringService } from "@/services/masteringService";
import { LUFSDisplay, AudioAnalysisData } from "./LUFSDisplay";

export const AIMasteringTab = () => {
  const { t } = useLanguage();
  const { isPremium, isAdmin, loading } = useUserSubscription();
  const navigate = useNavigate();

  // State with sessionStorage persistence for file metadata
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [targetFileInfo, setTargetFileInfo] = useState<{
    name: string;
    size: number;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem("aiMastering_targetFile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceFileInfo, setReferenceFileInfo] = useState<{
    name: string;
    size: number;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem("aiMastering_referenceFile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem("aiMastering_selectedPreset");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeMode, setActiveMode] = useState<"preset" | "custom">(() => {
    try {
      const saved = sessionStorage.getItem("aiMastering_activeMode");
      return saved ? JSON.parse(saved) : "preset";
    } catch {
      return "preset";
    }
  });
  const [error, setError] = useState<string>("");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysisData | null>(null);
  const [masteredBlob, setMasteredBlob] = useState<Blob | null>(null);

  // Helper function to trigger file download
  const downloadMasteredFile = (blob: Blob, fileName: string) => {
    // Ensure blob is audio/wav
    const wavBlob = new Blob([blob], { type: 'audio/wav' });

    try {
      saveAs(wavBlob, fileName);
    } catch (e) {
      console.warn("FileSaver failed, falling back to anchor tag", e);
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Helper function to convert MasteringSettings to MasteringSettingsData
  const convertSettingsFormat = (settings: MasteringSettings): any => {
    return {
      threshold: settings.threshold,
      epsilon: settings.epsilon,
      maxPieceLength: settings.max_piece_length,
      bpm: settings.bpm,
      timeSignatureNumerator: settings.time_signature_numerator,
      timeSignatureDenominator: settings.time_signature_denominator,
      pieceLengthBars: settings.piece_length_bars,
      resamplingMethod: settings.resampling_method,
      spectrumCompensation: settings.spectrum_compensation,
      loudnessCompensation: settings.loudness_compensation,
      analyzeFullSpectrum: settings.analyze_full_spectrum,
      spectrumSmoothingWidth: settings.spectrum_smoothing_width,
      smoothingSteps: settings.smoothing_steps,
      spectrumCorrectionHops: settings.spectrum_correction_hops,
      loudnessSteps: settings.loudness_steps,
      spectrumBands: settings.spectrum_bands,
      fftSize: settings.fft_size,
      normalizeReference: settings.normalize_reference,
      normalize: settings.normalize,
      limiterMethod: settings.limiter_method,
      limiterThreshold: settings.limiter_threshold_db,
      loudnessCorrectionLimiting: settings.loudness_correction_limiting,
      amplify: settings.amplify,
      clipping: settings.clipping,
      outputBits: settings.output_bits,
      outputChannels: settings.output_channels,
      ditheringMethod: settings.dithering_method,
    };
  };
  const [advancedSettings, setAdvancedSettings] = useState<MasteringSettings>(
    () => {
      try {
        const saved = sessionStorage.getItem("aiMastering_advancedSettings");
        return saved
          ? JSON.parse(saved)
          : {
            threshold: 0.998138,
            epsilon: 0.000001,
            max_piece_length: 30.0,
            bpm: 0.0,
            time_signature_numerator: 4,
            time_signature_denominator: 4,
            piece_length_bars: 8.0,
            resampling_method: "FastSinc",
            spectrum_compensation: "Frequency-Domain (Gain Envelope)",
            loudness_compensation: "LUFS (Whole Signal)",
            analyze_full_spectrum: false,
            spectrum_smoothing_width: 3,
            smoothing_steps: 1,
            spectrum_correction_hops: 2,
            loudness_steps: 10,
            spectrum_bands: 32,
            fft_size: 4096,
            normalize_reference: false,
            normalize: false,
            limiter_method: "True Peak",
            limiter_threshold_db: -1.0,
            loudness_correction_limiting: false,
            amplify: false,
            clipping: false,
            output_bits: "32 (IEEE float)",
            output_channels: 2,
            dithering_method: "TPDF",
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
          resampling_method: "FastSinc",
          spectrum_compensation: "Frequency-Domain (Gain Envelope)",
          loudness_compensation: "LUFS (Whole Signal)",
          analyze_full_spectrum: false,
          spectrum_smoothing_width: 3,
          smoothing_steps: 1,
          spectrum_correction_hops: 2,
          loudness_steps: 10,
          spectrum_bands: 32,
          fft_size: 4096,
          normalize_reference: false,
          normalize: false,
          limiter_method: "True Peak",
          limiter_threshold_db: -1.0,
          loudness_correction_limiting: false,
          amplify: false,
          clipping: false,
          output_bits: "32 (IEEE float)",
          output_channels: 2,
          dithering_method: "TPDF",
        };
      }
    }
  );
  const targetInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const BACKEND_URL =
    "https://spectrum-backend-857351913435.us-central1.run.app";

  // Save state to sessionStorage whenever it changes
  React.useEffect(() => {
    try {
      if (targetFileInfo) {
        sessionStorage.setItem(
          "aiMastering_targetFile",
          JSON.stringify(targetFileInfo)
        );
      } else {
        sessionStorage.removeItem("aiMastering_targetFile");
      }
    } catch (e) {
      console.error("Failed to save target file info:", e);
    }
  }, [targetFileInfo]);
  React.useEffect(() => {
    try {
      if (referenceFileInfo) {
        sessionStorage.setItem(
          "aiMastering_referenceFile",
          JSON.stringify(referenceFileInfo)
        );
      } else {
        sessionStorage.removeItem("aiMastering_referenceFile");
      }
    } catch (e) {
      console.error("Failed to save reference file info:", e);
    }
  }, [referenceFileInfo]);
  React.useEffect(() => {
    try {
      if (selectedPreset) {
        sessionStorage.setItem(
          "aiMastering_selectedPreset",
          JSON.stringify(selectedPreset)
        );
      } else {
        sessionStorage.removeItem("aiMastering_selectedPreset");
      }
    } catch (e) {
      console.error("Failed to save preset:", e);
    }
  }, [selectedPreset]);
  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        "aiMastering_activeMode",
        JSON.stringify(activeMode)
      );
    } catch (e) {
      console.error("Failed to save mode:", e);
    }
  }, [activeMode]);
  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        "aiMastering_advancedSettings",
        JSON.stringify(advancedSettings)
      );
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [advancedSettings]);
  const MASTERING_PRESETS = [
    {
      id: "rock",
      displayName: "Rock",
      icon: "🎸",
      gradient: "from-red-500 to-orange-600",
    },
    {
      id: "indie-rock",
      displayName: "Indie Rock",
      icon: "🎸",
      gradient: "from-orange-500 to-red-500",
    },
    {
      id: "punk-rock",
      displayName: "Punk Rock",
      icon: "🤘",
      gradient: "from-red-600 to-black",
    },
    {
      id: "metal",
      displayName: "Metal",
      icon: "⚡",
      gradient: "from-gray-600 to-black",
    },
    {
      id: "dance-pop",
      displayName: "Dance Pop",
      icon: "💃",
      gradient: "from-pink-500 to-purple-500",
    },
    {
      id: "drum-bass",
      displayName: "Drum & Bass",
      icon: "🥁",
      gradient: "from-blue-600 to-purple-600",
    },
    {
      id: "dubstep",
      displayName: "Dubstep",
      icon: "🔊",
      gradient: "from-green-600 to-blue-600",
    },
    {
      id: "edm",
      displayName: "EDM",
      icon: "🎛️",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      id: "house",
      displayName: "House",
      icon: "🏠",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "techno",
      displayName: "Techno",
      icon: "🤖",
      gradient: "from-gray-500 to-blue-600",
    },
    {
      id: "hip-hop",
      displayName: "Hip-Hop",
      icon: "🎤",
      gradient: "from-yellow-600 to-red-600",
    },
    {
      id: "reggae",
      displayName: "Reggae",
      icon: "🌴",
      gradient: "from-green-500 to-yellow-500",
    },
    {
      id: "reggaeton",
      displayName: "Reggaeton",
      icon: "🔥",
      gradient: "from-red-500 to-yellow-500",
    },
    {
      id: "rnb-soul",
      displayName: "Rnb/Soul",
      icon: "💜",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      id: "trap",
      displayName: "Trap",
      icon: "💎",
      gradient: "from-black to-red-600",
    },
    {
      id: "pop",
      displayName: "Pop",
      icon: "🎵",
      gradient: "from-pink-400 to-purple-400",
    },
    {
      id: "kpop-jpop",
      displayName: "K-pop/J-pop",
      icon: "🌸",
      gradient: "from-pink-300 to-blue-300",
    },
    {
      id: "latin-pop",
      displayName: "Latin Pop",
      icon: "💃",
      gradient: "from-yellow-500 to-red-600",
    },
    {
      id: "country",
      displayName: "Country",
      icon: "🤠",
      gradient: "from-amber-600 to-yellow-500",
    },
    {
      id: "jazz",
      displayName: "Jazz",
      icon: "🎷",
      gradient: "from-purple-500 to-indigo-600",
    },
  ] as const;
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "target" | "reference"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "target") {
        setTargetFile(file);
        setTargetFileInfo({
          name: file.name,
          size: file.size,
        });
      } else {
        setReferenceFile(file);
        setReferenceFileInfo({
          name: file.name,
          size: file.size,
        });
      }
    }
    if (e.target) {
      e.target.value = "";
    }
  };
  const handlePresetClick = async (presetId: string) => {
    setSelectedPreset(presetId);
    setActiveMode("preset");
    setReferenceFile(null);
    setReferenceFileInfo(null);

    try {
      const track = await getReferenceTrack(presetId);
      if (track) {
        setReferenceFile(track.file);
        setReferenceFileInfo({
          name: track.name,
          size: track.size
        });
        toast.success("Reference track loaded", {
          description: `Using saved reference for ${presetId}`
        });
      }
    } catch (e) {
      console.error("Failed to load reference track:", e);
    }
  };
  const handleCustomReferenceClick = () => {
    setActiveMode("custom");
    setSelectedPreset(null);
    referenceInputRef.current?.click();
  };
  const handleMastering = async () => {
    // Validate TARGET file
    if (!targetFile) {
      setError("Please select a target audio file.");
      toast.error("Please select a target audio file.");
      return;
    }

    // Validate REFERENCE file (preset or custom)
    let referenceFileToUse: File | null = null;

    if (activeMode === "preset" && selectedPreset) {
      // For presets, use the uploaded reference file if available
      if (!referenceFile) {
        setError(`Please upload a reference file for the ${selectedPreset} preset first.`);
        toast.error("Reference track required for mastering");
        return;
      }
      referenceFileToUse = referenceFile;
    } else if (activeMode === "custom" && referenceFile) {
      referenceFileToUse = referenceFile;
    }

    if (!referenceFileToUse) {
      setError("Please select a reference: Choose a genre preset or upload custom reference.");
      toast.error("Reference track required for mastering");
      return;
    }

    setError("");
    setIsProcessing(true);
    setProgress(0);

    try {
      console.log("🚀 Starting Matchering AI Mastering...");
      console.log("📂 Target:", targetFile.name);
      console.log("📂 Reference:", referenceFileToUse.name);

      // Map advanced settings to Matchering parameters
      const backendParams = mapSettingsToEnhancedBackend(advancedSettings);
      const validationErrors = validateBackendParams(backendParams);

      if (validationErrors.length > 0) {
        console.warn('⚠️ Settings validation warnings:', validationErrors);
      }

      // Use masteringService with progress tracking
      const convertedSettings = convertSettingsFormat(advancedSettings);
      const result = await masteringService.masterAudio(
        targetFile,
        referenceFileToUse,
        convertedSettings,
        (stage, percent) => {
          setProgress(percent);
          console.log(`Progress: ${stage} - ${percent.toFixed(0)}%`);
        }
      );

      // Extract blob and analysis from response
      const { blob: resultBlob, analysis } = result;

      // Store analysis for display
      if (analysis) {
        setAudioAnalysis(analysis);
        console.log('📊 Audio Analysis received:', analysis);
      }

      const baseName = targetFile.name.substring(0, targetFile.name.lastIndexOf('.')) || targetFile.name;
      const fileName = `mastered_${baseName}.wav`;

      // Store blob for manual download
      setMasteredBlob(resultBlob);

      // Attempt auto-download
      downloadMasteredFile(resultBlob, fileName);
      toast.success("✅ Your track has been mastered with Matchering!");

      // Clear files after success
      setTargetFile(null);
      setTargetFileInfo(null);
      setReferenceFile(null);
      setReferenceFileInfo(null);
      sessionStorage.removeItem("aiMastering_targetFile");
      sessionStorage.removeItem("aiMastering_referenceFile");
    } catch (err) {
      let errorMsg = "An error occurred during mastering";
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "string") {
        errorMsg = err;
      }
      console.error("Mastering error:", err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };
  if (loading) {
    return (
      <Card className="bg-background/90 border-border">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t("status.loading")}...</p>
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
              {t("aiMastering.premiumFeature")}
            </h2>
            <p className="text-slate-300 text-lg">
              {t("aiMastering.unlockMessage")}
            </p>
          </div>

          <Button
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold py-6 px-12 rounded-xl shadow-2xl shadow-purple-500/50 text-lg"
            size="lg"
          >
            <Crown className="h-6 w-6 mr-2" />
            {t("aiMastering.upgradeToPremium")}
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
            <h1 className="text-3xl font-bold mb-2 text-primary">
              AI Audio Mastering
            </h1>
            <p className="text-muted-foreground">
              Upload your track and choose a reference to master your audio with
              AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 text-stone-300"
            >
              <BookOpen className="h-4 w-4" />
              Help Guide
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSettings(true)}
              className="flex items-center gap-2 text-sky-500"
            >
              <Settings className="h-4 w-4" />
              Advanced Settings
            </Button>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs h-7 flex items-center px-3">
              ✨ Premium
            </Badge>
          </div>
        </div>

        {/* Advanced Settings Modal */}
        {/* Advanced Settings Modal */}
        <MasteringAdvancedSettings
          open={showAdvancedSettings}
          onOpenChange={setShowAdvancedSettings}
          settings={advancedSettings}
          onSettingsChange={setAdvancedSettings}
        />

        {/* Help Guide Modal */}
        <AIMasteringGuide open={showGuide} onOpenChange={setShowGuide} />

        {/* Setup Checker - Temporary for debugging */}
        <AIMasteringSetupChecker />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Target and Presets */}
          <div className="space-y-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  1. Upload Your Track (Target)
                </h2>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => targetInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Drag and drop or click to select
                  </p>
                  <input
                    type="file"
                    ref={targetInputRef}
                    onChange={(e) => handleFileChange(e, "target")}
                    className="hidden"
                    accept=".wav,.mp3,.flac"
                  />
                </div>
                {targetFileInfo && !targetFile && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-sm text-blue-400 mb-2">
                      Previous session detected:
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {targetFileInfo.name} (
                      {(targetFileInfo.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    <p className="text-xs text-yellow-400 mt-2">
                      ⚠️ Please re-upload to process
                    </p>
                  </div>
                )}
                {targetFile && (
                  <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-md">
                    <div className="flex items-center flex-1 min-w-0">
                      <Music className="h-6 w-6 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{targetFile.name}</span>
                    </div>
                    <Button
                      onClick={() => {
                        setTargetFile(null);
                        setTargetFileInfo(null);
                        if (targetInputRef.current) {
                          targetInputRef.current.value = "";
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
            </Card >

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    2. Choose a Genre Reference (Preset)
                  </h2>
                  {isAdmin && (
                    <Badge
                      variant="outline"
                      className="bg-purple-500/20 text-purple-300 border-purple-400"
                    >
                      Admin Mode
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {MASTERING_PRESETS.map((preset) => {
                    const handlePresetUpload = async (
                      e: React.ChangeEvent<HTMLInputElement>
                    ) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!file.type.startsWith("audio/")) {
                        toast.error("Invalid file", {
                          description:
                            "Please upload an audio file (WAV recommended)",
                        });
                        return;
                      }

                      if (file.size > 100 * 1024 * 1024) {
                        toast.error("File too large", {
                          description: "Maximum file size is 100MB",
                        });
                        return;
                      }

                      try {
                        await saveReferenceTrack(preset.id, file);
                        toast.success("Reference uploaded", {
                          description: `${preset.displayName} reference track saved successfully`,
                        });
                      } catch (error) {
                        console.error("Upload failed:", error);
                        toast.error("Upload failed", {
                          description: "Failed to save reference track",
                        });
                      }

                      if (e.target) {
                        e.target.value = "";
                      }
                    };

                    const inputId = `preset-upload-${preset.id}`;

                    return (
                      <div key={preset.id} className="relative group">
                        <button
                          onClick={() => handlePresetClick(preset.id)}
                          className={`relative w-full p-3 rounded-xl text-center font-bold transition-all duration-300 overflow-hidden ${selectedPreset === preset.id &&
                            activeMode === "preset"
                            ? `bg-gradient-to-br ${preset.gradient} text-white shadow-2xl scale-105 ring-4 ring-white/30`
                            : `bg-gradient-to-br ${preset.gradient} opacity-70 hover:opacity-100 hover:scale-105 text-white shadow-lg`
                            }`}
                        >
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-300" />
                          <div className="relative z-10 flex flex-col items-center gap-1.5">
                            <span className="text-2xl">{preset.icon}</span>
                            <span className="text-xs drop-shadow-lg leading-tight">
                              {preset.displayName}
                            </span>
                          </div>
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() =>
                                document.getElementById(inputId)?.click()
                              }
                              className="absolute -top-2 -right-2 z-20 p-1.5 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg border-2 border-white/50 transition-all hover:scale-110"
                              title={`Upload reference for ${preset.displayName}`}
                            >
                              <Plus className="h-3 w-3 text-white" />
                            </button>
                            <input
                              id={inputId}
                              type="file"
                              accept="audio/*"
                              onChange={handlePresetUpload}
                              className="hidden"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div >

          {/* Right Column: Custom Reference and Action */}
          < div className="space-y-8" >
            <Card className="bg-card border-border h-full flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    ... Or Use Your Own Reference
                  </h2>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${activeMode === "custom"
                      ? "border-primary"
                      : "border-border hover:border-primary"
                      }`}
                    onClick={handleCustomReferenceClick}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select a custom reference file
                    </p>
                    <input
                      type="file"
                      ref={referenceInputRef}
                      onChange={(e) => handleFileChange(e, "reference")}
                      className="hidden"
                      accept=".wav,.mp3,.flac"
                    />
                  </div>
                  {referenceFileInfo &&
                    !referenceFile &&
                    activeMode === "custom" && (
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                        <p className="text-sm text-blue-400 mb-2">
                          Previous reference detected:
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {referenceFileInfo.name} (
                          {(referenceFileInfo.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                        </p>
                        <p className="text-xs text-yellow-400 mt-2">
                          ⚠️ Please re-upload to process
                        </p>
                      </div>
                    )}
                  {referenceFile && activeMode === "custom" && (
                    <div className="mt-4 flex items-center justify-between bg-muted p-3 rounded-md">
                      <div className="flex items-center flex-1 min-w-0">
                        <Music className="h-6 w-6 mr-2 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{referenceFile.name}</span>
                      </div>
                      <Button
                        onClick={() => {
                          setReferenceFile(null);
                          setReferenceFileInfo(null);
                          if (referenceInputRef.current) {
                            referenceInputRef.current.value = "";
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

                <div className="mt-8 space-y-4">
                  <Button
                    onClick={handleMastering}
                    disabled={isProcessing || !targetFile}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 rounded-lg text-lg transition-all disabled:bg-slate-500 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing... {progress}%
                      </>
                    ) : (
                      <>✨ Master My Track</>
                    )}
                  </Button>

                  {/* Progress Bar */}
                  {isProcessing && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Processing...</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-center text-muted-foreground">
                        {progress < 30 && "Uploading to cloud storage..."}
                        {progress >= 30 &&
                          progress < 50 &&
                          "File uploaded, starting AI processing..."}
                        {progress >= 50 &&
                          progress < 80 &&
                          "AI is mastering your audio..."}
                        {progress >= 80 &&
                          progress < 100 &&
                          "Downloading mastered file..."}
                        {progress === 100 && "Complete!"}
                      </p>
                    </div>
                  )}

                  {/* LUFS Analysis Display */}
                  {audioAnalysis && !isProcessing && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                      <LUFSDisplay analysis={audioAnalysis} />

                      {masteredBlob && (
                        <Button
                          onClick={() => {
                            const baseName = targetFile?.name ? (targetFile.name.substring(0, targetFile.name.lastIndexOf('.')) || targetFile.name) : 'track';
                            const fileName = `mastered_${baseName}.wav`;
                            downloadMasteredFile(masteredBlob, fileName);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          variant="default"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Mastered Track
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in slide-in-from-bottom-2">
                      {error}
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
