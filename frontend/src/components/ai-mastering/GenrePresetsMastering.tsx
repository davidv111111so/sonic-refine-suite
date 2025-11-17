import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Music,
  Headphones,
  Mic,
  Radio,
  Download,
  Loader2,
  Settings,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { MasteringSettings, MasteringSettingsData } from "./MasteringSettings";
import { masteringService } from "@/services/masteringService";
import { loadPresetReferenceFile } from "@/utils/presetReferences";

const defaultSettings: MasteringSettingsData = {
  threshold: 0.998138,
  epsilon: 0.000001,
  maxPieceLength: 30.0,
  bpm: 0.0,
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  pieceLengthBars: 8.0,
  resamplingMethod: "FastSinc",
  spectrumCompensation: "Frequency-Domain (Gain Envelope)",
  loudnessCompensation: "LUFS (Whole Signal)",
  analyzeFullSpectrum: false,
  spectrumSmoothingWidth: 3,
  smoothingSteps: 1,
  spectrumCorrectionHops: 2,
  loudnessSteps: 10,
  spectrumBands: 32,
  fftSize: 4096,
  normalizeReference: false,
  normalize: false,
  limiterMethod: "True Peak",
  limiterThreshold: -1.0,
  loudnessCorrectionLimiting: false,
  amplify: false,
  clipping: false,
  outputBits: "32 (IEEE float)",
  outputChannels: 2,
  ditheringMethod: "TPDF",
};

const genrePresets = [
  { id: "flat", name: "Flat", icon: Music },
  { id: "bass-boost", name: "Bass Boost", icon: Headphones },
  { id: "treble-boost", name: "Treble Boost", icon: Headphones },
  { id: "jazz", name: "Jazz", icon: Music },
  { id: "classical", name: "Classical", icon: Music },
  { id: "electronic", name: "Electronic", icon: Headphones },
  { id: "v-shape", name: "V-Shape", icon: Music },
  { id: "vocal", name: "Vocal", icon: Mic },
  { id: "rock", name: "Rock", icon: Music },
  { id: "hip-hop", name: "Hip-Hop", icon: Headphones },
  { id: "podcast", name: "Podcast", icon: Mic },
  { id: "live", name: "Live", icon: Radio },
];

export const GenrePresetsMastering = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [masteredUrl, setMasteredUrl] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] =
    useState<MasteringSettingsData>(defaultSettings);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.includes("audio") || file.name.match(/\.(wav|mp3|flac)$/i))
    ) {
      setTargetFile(file);
    }
  };

  const handleMaster = async () => {
    if (!targetFile || !selectedPreset) {
      toast({
        title: t("error"),
        description: "Please select a target file and a genre preset",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgressMessage("Loading preset reference...");
    setProgressPercent(0);
    
    try {
      console.log("🚀 Starting preset-based mastering...");
      console.log("📂 Target:", targetFile.name);
      console.log("🎵 Preset:", selectedPreset);
      
      // Load the preset reference file
      setProgressMessage(`Loading ${selectedPreset} reference...`);
      const referenceFile = await loadPresetReferenceFile(selectedPreset);
      console.log("📂 Reference loaded:", referenceFile.name);
      
      setProgressMessage("Starting mastering...");
      setProgressPercent(10);
      
      // Use the mastering service with job-based flow
      const resultBlob = await masteringService.masterAudio(
        targetFile,
        referenceFile,
        settings,
        (stage, percent) => {
          setProgressMessage(stage);
          setProgressPercent(10 + percent * 0.9); // Reserve first 10% for reference loading
          console.log(`Progress: ${stage} - ${percent.toFixed(0)}%`);
        }
      );

      // Create download URL
      const url = URL.createObjectURL(resultBlob);
      setMasteredUrl(url);

      toast({
        title: t("success"),
        description: `✅ Your track has been mastered with ${selectedPreset} preset!`,
      });
      
      console.log("✅ Preset mastering complete!");
    } catch (error: any) {
      console.error("❌ Preset mastering error:", error);
      toast({
        title: t("error"),
        description: error.message || "Mastering failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
      setProgressPercent(0);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Target File Upload */}
        <Card className="bg-card border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("aiMastering.targetTrack")}
          </h3>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-cyan-500/50 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer bg-cyan-500/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">
              {targetFile
                ? targetFile.name
                : "Drag and drop your WAV reference file here, or use the file chooser below."}
            </p>
            <p className="text-sm text-muted-foreground">
              Reference File: {targetFile ? "File chosen" : "No file chosen"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.flac"
              className="hidden"
              onChange={(e) => setTargetFile(e.target.files?.[0] || null)}
            />
          </div>
          {targetFile && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Choose Reference File
            </Button>
          )}
        </Card>

        {/* Right: Genre Presets */}
        <Card className="bg-card border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Select Genre Preset
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {genrePresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                      : "border-border hover:border-cyan-500/50 hover:bg-cyan-500/5"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 mb-2 ${isSelected ? "text-cyan-400" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-sm font-medium ${isSelected ? "text-cyan-400" : "text-foreground"}`}
                  >
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{progressMessage}</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-6 justify-center">
        <Button
          onClick={handleMaster}
          disabled={!targetFile || !selectedPreset || isProcessing}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg font-semibold"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {progressMessage || "Processing..."}
            </>
          ) : (
            "Master with AI Preset"
          )}
        </Button>

        <Button
          onClick={() => setSettingsOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg font-semibold"
        >
          <Settings className="h-5 w-5 mr-2" />
          Settings
        </Button>

        {masteredUrl && (
          <Button
            onClick={() => {
              const a = document.createElement("a");
              a.href = masteredUrl;
              a.download = `mastered_${targetFile?.name || "audio"}.wav`;
              a.click();
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold"
          >
            <Download className="h-5 w-5 mr-2" />
            Download
          </Button>
        )}
      </div>

      <MasteringSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </>
  );
};
