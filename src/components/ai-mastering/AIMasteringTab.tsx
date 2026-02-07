import React, { useState, useRef, useEffect } from "react";
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
  TrendingUp,
  Sparkles,
  X,
  CheckCircle,
  Zap,
  FileAudio,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { saveAs } from 'file-saver';
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  MasteringAdvancedSettings,
  MasteringSettings,
} from "./MasteringAdvancedSettings";
import {
  mapSettingsToEnhancedBackend,
  validateBackendParams,
} from "./AdvancedSettingsBackend";
import { AIMasteringGuide } from "./AIMasteringGuide";
import { saveReferenceTrack, getReferenceTrack } from "@/utils/referenceTrackStorage";
import { masteringService } from "@/services/masteringService";
import { LUFSDisplay, AudioAnalysisData } from "./LUFSDisplay";
import { PermissiveControls } from "./PermissiveControls";

interface AIMasteringTabProps {
  isProcessing?: boolean;
  setIsProcessing?: (isProcessing: boolean) => void;
}

export const AIMasteringTab = ({ isProcessing: propIsProcessing, setIsProcessing: propSetIsProcessing }: AIMasteringTabProps) => {
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysisData | null>(null);

  const handleAnalyze = async (type: 'target' | 'reference') => {
    const file = type === 'target' ? targetFile : referenceFile;
    if (!file) return;

    console.log(`🧪 Starting analysis for ${type}:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setIsAnalyzing(true);
    try {
      const analysis = await masteringService.analyzeAudio(file);
      setAudioAnalysis(prev => ({
        ...prev,
        [type]: analysis
      } as AudioAnalysisData));
      toast.success(`${type === 'target' ? 'Target' : 'Reference'} analyzed successfully`);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error(`${type === 'target' ? 'Target' : 'Reference'} analysis failed. Check console for details.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  // Local state fallback if props are not provided
  const [localIsProcessing, setLocalIsProcessing] = useState(false);
  const isProcessing = propIsProcessing !== undefined ? propIsProcessing : localIsProcessing;
  const setIsProcessing = propSetIsProcessing || setLocalIsProcessing;

  const [progress, setProgress] = useState(0);
  const [masteredBlob, setMasteredBlob] = useState<Blob | null>(null);
  const [masteredFileName, setMasteredFileName] = useState<string>("mastered_track.wav");
  const [isMasteringComplete, setIsMasteringComplete] = useState(false);

  // Admin state
  const [presetStatuses, setPresetStatuses] = useState<Record<string, boolean>>({});
  const adminInputRef = useRef<HTMLInputElement>(null);
  const [adminTargetPreset, setAdminTargetPreset] = useState<string | null>(null);

  // Permissive Engine State
  const [targetLufs, setTargetLufs] = useState<number>(-9.0);

  const checkPresetStatuses = async () => {
    const statuses: Record<string, boolean> = {};
    for (const preset of MASTERING_PRESETS) {
      const track = await getReferenceTrack(preset.id);
      statuses[preset.id] = !!track;
    }
    setPresetStatuses(statuses);
  };

  useEffect(() => {
    checkPresetStatuses();
  }, []);

  const handleAdminUploadClick = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    setAdminTargetPreset(presetId);
    adminInputRef.current?.click();
  };

  const handleAdminFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && adminTargetPreset) {
      try {
        await saveReferenceTrack(adminTargetPreset, file);
        toast.success(`Reference saved for ${adminTargetPreset}`);
        checkPresetStatuses();
      } catch (error) {
        console.error("Failed to save reference:", error);
        toast.error("Failed to save reference track");
      }
    }
    if (e.target) e.target.value = "";
    setAdminTargetPreset(null);
  };

  // Helper function to trigger file download using file-saver
  const downloadMasteredFile = (blob: Blob, fileName: string) => {
    console.log(`⬇️ Downloading file: ${fileName}, size: ${blob.size}, type: ${blob.type}`);

    // Force audio/wav type if missing or incorrect
    const wavBlob = blob.type === 'audio/wav' ? blob : new Blob([blob], { type: 'audio/wav' });

    saveAs(wavBlob, fileName);
    console.log("✅ Download triggered via file-saver");
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
          output_format: "wav"
        };
      }
    }
  );
  const targetInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (targetFileInfo) {
        sessionStorage.setItem("aiMastering_targetFile", JSON.stringify(targetFileInfo));
      } else {
        sessionStorage.removeItem("aiMastering_targetFile");
      }
    } catch (e) { console.error(e); }
  }, [targetFileInfo]);

  useEffect(() => {
    try {
      if (referenceFileInfo) {
        sessionStorage.setItem("aiMastering_referenceFile", JSON.stringify(referenceFileInfo));
      } else {
        sessionStorage.removeItem("aiMastering_referenceFile");
      }
    } catch (e) { console.error(e); }
  }, [referenceFileInfo]);

  useEffect(() => {
    try {
      if (selectedPreset) {
        sessionStorage.setItem("aiMastering_selectedPreset", JSON.stringify(selectedPreset));
      } else {
        sessionStorage.removeItem("aiMastering_selectedPreset");
      }
    } catch (e) { console.error(e); }
  }, [selectedPreset]);

  useEffect(() => {
    try {
      sessionStorage.setItem("aiMastering_activeMode", JSON.stringify(activeMode));
    } catch (e) { console.error(e); }
  }, [activeMode]);

  useEffect(() => {
    try {
      sessionStorage.setItem("aiMastering_advancedSettings", JSON.stringify(advancedSettings));
    } catch (e) { console.error(e); }
  }, [advancedSettings]);

  const MASTERING_PRESETS = [
    { id: "rock", displayName: "Rock", icon: "🎸", gradient: "from-red-500 to-orange-600" },
    { id: "indie-rock", displayName: "Indie Rock", icon: "🎸", gradient: "from-orange-500 to-red-500" },
    { id: "punk-rock", displayName: "Punk Rock", icon: "🤘", gradient: "from-red-600 to-black" },
    { id: "metal", displayName: "Metal", icon: "⚡", gradient: "from-gray-600 to-black" },
    { id: "dance-pop", displayName: "Dance Pop", icon: "💃", gradient: "from-pink-500 to-purple-500" },
    { id: "drum-bass", displayName: "Drum & Bass", icon: "🥁", gradient: "from-blue-600 to-purple-600" },
    { id: "dubstep", displayName: "Dubstep", icon: "🔊", gradient: "from-green-600 to-blue-600" },
    { id: "edm", displayName: "EDM", icon: "🎛️", gradient: "from-cyan-500 to-blue-600" },
    { id: "house", displayName: "House", icon: "🏠", gradient: "from-purple-500 to-pink-500" },
    { id: "techno", displayName: "Techno", icon: "🤖", gradient: "from-gray-500 to-blue-600" },
    { id: "hip-hop", displayName: "Hip-Hop", icon: "🎤", gradient: "from-yellow-600 to-red-600" },
    { id: "reggae", displayName: "Reggae", icon: "🌴", gradient: "from-green-500 to-yellow-500" },
    { id: "reggaeton", displayName: "Reggaeton", icon: "🔥", gradient: "from-red-500 to-yellow-500" },
    { id: "rnb-soul", displayName: "Rnb/Soul", icon: "💜", gradient: "from-purple-600 to-pink-600" },
    { id: "trap", displayName: "Trap", icon: "💎", gradient: "from-black to-red-600" },
    { id: "pop", displayName: "Pop", icon: "🎵", gradient: "from-pink-400 to-purple-400" },
    { id: "kpop-jpop", displayName: "K-pop/J-pop", icon: "🌸", gradient: "from-pink-300 to-blue-300" },
    { id: "latin-pop", displayName: "Latin Pop", icon: "💃", gradient: "from-yellow-500 to-red-600" },
    { id: "country", displayName: "Country", icon: "🤠", gradient: "from-amber-600 to-yellow-500" },
    { id: "jazz", displayName: "Jazz", icon: "🎷", gradient: "from-purple-500 to-indigo-600" },
  ] as const;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "target" | "reference"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1024) {
        toast.error("File is too large", {
          description: `The maximum allowed file size is 1GB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
        });
        if (e.target) e.target.value = "";
        return;
      }

      if (type === "target") {
        setTargetFile(file);
        setTargetFileInfo({ name: file.name, size: file.size });
      } else {
        setReferenceFile(file);
        setReferenceFileInfo({ name: file.name, size: file.size });
      }
    }
    if (e.target) e.target.value = "";
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
        setReferenceFileInfo({ name: track.name, size: track.size });
        toast.success("Reference track loaded", { description: `Using saved reference for ${presetId}` });
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

  // Refs for tracking state in async functions
  const isMounted = useRef(true);
  const isProcessingRef = useRef(isProcessing);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const handleMastering = async () => {
    if (!targetFile) {
      setError("Please select a target audio file.");
      toast.error("Please select a target audio file.");
      return;
    }

    let referenceFileToUse: File | null = null;

    if (activeMode === "preset" && selectedPreset) {
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
      const backendParams = mapSettingsToEnhancedBackend(advancedSettings);
      const validationErrors = validateBackendParams(backendParams);
      if (validationErrors.length > 0) console.warn('⚠️ Settings validation warnings:', validationErrors);

      const convertedSettings = convertSettingsFormat(advancedSettings);
      const result = await masteringService.masterAudio(
        targetFile,
        referenceFileToUse,
        { ...convertedSettings, target_lufs: targetLufs }, // Pass Target LUFS override
        (stage, percent) => {
          if (!isMounted.current || !isProcessingRef.current) return;
          setProgress(percent);
          console.log(`Progress: ${stage} - ${percent.toFixed(0)}%`);
        }
      );

      // Check if we should still proceed
      if (!isMounted.current || !isProcessingRef.current) {
        console.log("🛑 Mastering cancelled or component unmounted");
        return;
      }

      const { blob: resultBlob, analysis } = result;
      if (analysis) setAudioAnalysis(analysis);

      // Sanitize filename: ensure .wav extension
      const originalName = targetFile.name;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      const fileName = `mastered_${nameWithoutExt}.wav`;

      setMasteredFileName(fileName);
      setMasteredBlob(resultBlob);

      downloadMasteredFile(resultBlob, fileName);
      toast.success("✅ Your track has been mastered with Matchering!");
      setIsMasteringComplete(true);
    } catch (err) {
      if (!isMounted.current || !isProcessingRef.current) return;
      let errorMsg = "An error occurred during mastering";
      if (err instanceof Error) errorMsg = err.message;
      else if (typeof err === "string") errorMsg = err;
      console.error("Mastering error:", err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      if (isMounted.current) {
        setIsProcessing(false);
        setProgress(0);
      }
    }
  };

  const handleClear = () => {
    setTargetFile(null);
    setTargetFileInfo(null);
    setReferenceFile(null);
    setReferenceFileInfo(null);
    setSelectedPreset(null);
    setActiveMode("preset");
    setMasteredBlob(null);
    setIsMasteringComplete(false);
    setAudioAnalysis(null);
    sessionStorage.removeItem("aiMastering_targetFile");
    sessionStorage.removeItem("aiMastering_referenceFile");
    sessionStorage.removeItem("aiMastering_selectedPreset");
  };

  if (loading) {
    return (
      <Card className="bg-slate-950 border-slate-800">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-cyan-500" />
          <p className="text-slate-400">{t("status.loading")}...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isPremium) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30 shadow-2xl backdrop-blur-sm">
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
            <p className="text-slate-300 text-lg">{t("aiMastering.unlockMessage")}</p>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold py-6 px-12 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.5)] text-lg transition-all hover:scale-105"
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
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-transparent text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              AI Audio Mastering
            </h1>
            <p className="text-slate-400 mt-1 font-light tracking-wide">
              Professional mastering powered by neural networks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowGuide(true)}
              className="border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition-all"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guide
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSettings(true)}
              className="border-slate-700 hover:border-purple-500/50 text-slate-400 hover:text-purple-400 hover:bg-purple-950/30 transition-all"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-[0_0_15px_rgba(245,158,11,0.4)] px-3 py-1">
              ✨ PRO
            </Badge>
          </div>
        </div>

        <MasteringAdvancedSettings
          open={showAdvancedSettings}
          onOpenChange={setShowAdvancedSettings}
          settings={advancedSettings}
          onSettingsChange={setAdvancedSettings}
        />

        <Alert className="bg-blue-950/20 border-blue-500/50 text-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertTitle>AI Mastering Limit: 1GB</AlertTitle>
          <AlertDescription className="text-sm opacity-90">
            Professional system supports high-fidelity audio files up to 1GB.
          </AlertDescription>
        </Alert>
        <AIMasteringGuide open={showGuide} onOpenChange={setShowGuide} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Target & Presets */}
          <div className="space-y-8">
            {/* Target Upload Card */}
            <Card className="bg-slate-900/80 border-slate-800 shadow-xl backdrop-blur-sm overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Music className="h-5 w-5" />
                  </div>
                  1. Upload Target Track
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${targetFile
                    ? "border-cyan-500/50 bg-cyan-500/5"
                    : "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50"
                    }`}
                  onClick={() => targetInputRef.current?.click()}
                >
                  {targetFile ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
                        <FileAudio className="h-8 w-8 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-cyan-100">{targetFile.name}</p>
                        <p className="text-sm text-cyan-400/60">{(targetFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="flex justify-center gap-3 pt-2">
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleAnalyze('target'); }}
                          disabled={isAnalyzing}
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
                        >
                          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                          Analyze
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetFile(null);
                          setTargetFileInfo(null);
                          if (targetInputRef.current) targetInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-slate-900/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-8 w-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="text-slate-300 font-medium text-lg">Drop your mix here</p>
                      <p className="text-slate-500 text-sm mt-1">WAV, MP3, FLAC (Max 150MB)</p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={targetInputRef}
                    onChange={(e) => handleFileChange(e, "target")}
                    className="hidden"
                    accept=".wav,.mp3,.flac"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Presets Grid */}
            <Card className="bg-slate-900/80 border-slate-800 shadow-xl backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  2. Choose Style
                </CardTitle>
                {isAdmin && <Badge variant="outline" className="border-purple-500/30 text-purple-400">Admin</Badge>}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {MASTERING_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.id && activeMode === "preset";
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset.id)}
                        className={`relative group p-4 rounded-xl transition-all duration-300 border ${isSelected
                          ? "bg-slate-800 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-105"
                          : "bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-900"
                          }`}
                      >
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${preset.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                        <div className="text-2xl mb-2 transform group-hover:scale-110 transition-transform">{preset.icon}</div>
                        <div className={`text-sm font-medium ${isSelected ? "text-purple-300" : "text-slate-400 group-hover:text-slate-200"}`}>
                          {preset.displayName}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle className="h-4 w-4 text-purple-500" />
                          </div>
                        )}
                        {isAdmin && (
                          <div className="absolute top-2 right-2 z-20 flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-full bg-slate-900/50 hover:bg-purple-500 hover:text-white"
                              onClick={(e) => handleAdminUploadClick(e, preset.id)}
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {presetStatuses[preset.id] && (
                          <div className={`absolute ${isAdmin ? 'top-2 left-2' : 'top-2 right-2'} z-10`}>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Reference & Actions */}
          <div className="space-y-8">
            {/* Custom Reference Card */}
            {/* Custom Reference Card */}
            <Card className="bg-slate-900/80 border-slate-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-600 opacity-50" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  ...Or Custom Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${activeMode === "custom" && referenceFile
                    ? "border-pink-500/50 bg-pink-500/5"
                    : activeMode === "preset" && selectedPreset
                      ? "border-purple-500/50 bg-purple-500/5"
                      : "border-slate-700 hover:border-pink-500/50 hover:bg-slate-800/50"
                    }`}
                  onClick={handleCustomReferenceClick}
                >
                  {activeMode === "custom" && referenceFile ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center animate-pulse">
                        <Music className="h-8 w-8 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-pink-100">{referenceFile.name}</p>
                        <p className="text-sm text-pink-400/60">{(referenceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="flex justify-center gap-3 pt-2">
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleAnalyze('reference'); }}
                          disabled={isAnalyzing}
                          className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30"
                        >
                          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                          Analyze
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReferenceFile(null);
                          setReferenceFileInfo(null);
                          if (referenceInputRef.current) referenceInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-slate-900/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : activeMode === "preset" && selectedPreset ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
                        <Zap className="h-8 w-8 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-purple-100">
                          {MASTERING_PRESETS.find(p => p.id === selectedPreset)?.displayName || selectedPreset}
                        </p>
                        <p className="text-sm text-purple-400/60">Genre Preset Selected</p>
                      </div>

                      {referenceFile && (
                        <div className="flex justify-center gap-3 pt-2">
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleAnalyze('reference'); }}
                            disabled={isAnalyzing}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                          >
                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            {audioAnalysis?.reference ? "Re-analyze Style" : "Analyze Style"}
                          </Button>
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPreset(null);
                        }}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-slate-900/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Upload className="h-8 w-8 text-slate-500" />
                      <p className="text-slate-400 font-medium">Upload Reference Track</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">MAX 1GB • .WAV, .MP3, .FLAC</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={referenceInputRef}
                    onChange={(e) => handleFileChange(e, "reference")}
                    className="hidden"
                    accept=".wav,.mp3,.flac"
                  />
                  <input
                    type="file"
                    ref={adminInputRef}
                    onChange={handleAdminFileSelect}
                    className="hidden"
                    accept=".wav,.mp3,.flac"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Permissive Controls (Fine Tune) */}
            <PermissiveControls
              targetLufs={targetLufs}
              setTargetLufs={setTargetLufs}
              targetAnalysis={audioAnalysis?.target}
              referenceAnalysis={audioAnalysis?.reference}
            />

            {/* Action Area */}
            <div className="space-y-6">
              {isMasteringComplete ? (
                <Button
                  onClick={handleClear}
                  className="w-full h-24 text-2xl font-black tracking-widest uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-lg transition-all duration-300 rounded-2xl border-2 border-slate-600"
                >
                  <RotateCcw className="mr-3 h-8 w-8" />
                  Start New Mastering
                </Button>
              ) : (
                <Button
                  onClick={handleMastering}
                  disabled={isProcessing || !targetFile || (!selectedPreset && !referenceFile)}
                  className="w-full h-24 text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all duration-300 rounded-2xl border-2 border-white/10 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                  <span className="relative z-10 flex items-center justify-center gap-4 group-hover:scale-105 transition-transform">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span>Processing... {progress.toFixed(0)}%</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-8 w-8 fill-yellow-300 text-yellow-300 animate-pulse" />
                        <span>Master Track</span>
                      </>
                    )}
                  </span>

                  {/* Progress Bar Overlay */}
                  {isProcessing && (
                    <div
                      className="absolute bottom-0 left-0 h-2 bg-white/50 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </Button>
              )}
            </div>

            {/* Progress & Status */}
            {isProcessing && (
              <Card className="bg-slate-900/90 border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between text-sm font-medium text-cyan-400">
                    <span>Processing...</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-3 bg-slate-800" indicatorClassName="bg-gradient-to-r from-cyan-500 to-purple-500" />
                  <p className="text-xs text-center text-slate-500 font-mono">
                    {progress < 30 && "Uploading to secure cloud..."}
                    {progress >= 30 && progress < 50 && "Analyzing audio spectrum..."}
                    {progress >= 50 && progress < 80 && "Applying AI mastering chain..."}
                    {progress >= 80 && "Finalizing and downloading..."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Analysis & Results */}
            {(audioAnalysis || masteredBlob) && (
              <Card className="bg-slate-900/90 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
                    <ActivityIcon className="h-5 w-5 text-emerald-400" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <LUFSDisplay analysis={audioAnalysis || { target: null, reference: null, output: null }} />

                  {masteredBlob && (
                    <Button
                      onClick={() => downloadMasteredFile(masteredBlob, masteredFileName)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Mastered Track Again
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-sm text-center animate-in fade-in">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for icon
const ActivityIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
