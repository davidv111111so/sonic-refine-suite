import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { MasteringSettings, MasteringSettingsData } from "./MasteringSettings";
import { masteringService } from "@/services/masteringService";

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

export const CustomReferenceMastering = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [masteredUrl, setMasteredUrl] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] =
    useState<MasteringSettingsData>(defaultSettings);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const targetInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const handleTargetDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.includes("audio") || file.name.match(/\.(wav|mp3|flac)$/i))
    ) {
      setTargetFile(file);
    }
  };

  const handleReferenceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.includes("audio") || file.name.match(/\.(wav|mp3|flac)$/i))
    ) {
      setReferenceFile(file);
    }
  };

  const handleMaster = async () => {
    if (!targetFile || !referenceFile) {
      toast({
        title: t("error"),
        description: "Please select both target and reference files",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgressMessage("Initializing...");
    setProgressPercent(0);
    
    try {
      console.log("🚀 Starting real Matchering mastering...");
      console.log("📂 Target:", targetFile.name);
      console.log("📂 Reference:", referenceFile.name);
      
      // Use the new mastering service with job-based flow
      const resultBlob = await masteringService.masterAudio(
        targetFile,
        referenceFile,
        settings,
        (stage, percent) => {
          setProgressMessage(stage);
          setProgressPercent(percent);
          console.log(`Progress: ${stage} - ${percent.toFixed(0)}%`);
        }
      );

      // Create download URL
      const url = URL.createObjectURL(resultBlob);
      setMasteredUrl(url);

      toast({
        title: t("success"),
        description: "✅ Your track has been mastered with real Matchering AI!",
      });
      
      console.log("✅ Mastering complete!");
    } catch (error: any) {
      console.error("❌ Mastering error:", error);
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
      <Card className="bg-card border-border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("aiMastering.targetTrack")}
            </h3>
            <div
              onDrop={handleTargetDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-cyan-500/50 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer bg-cyan-500/5"
              onClick={() => targetInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">
                {targetFile
                  ? targetFile.name
                  : "Drag and drop your WAV target file here, or use the file chooser below."}
              </p>
              <p className="text-sm text-muted-foreground">
                Target File: {targetFile ? "File chosen" : "No file chosen"}
              </p>
              <input
                ref={targetInputRef}
                type="file"
                accept=".wav,.mp3,.flac"
                className="hidden"
                onChange={(e) => setTargetFile(e.target.files?.[0] || null)}
              />
            </div>
            {targetFile && (
              <Button
                onClick={() => targetInputRef.current?.click()}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Choose Target File
              </Button>
            )}
          </div>

          {/* Reference File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("aiMastering.referenceTrack")}
            </h3>
            <div
              onDrop={handleReferenceDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-cyan-500/50 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer bg-cyan-500/5"
              onClick={() => referenceInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">
                {referenceFile
                  ? referenceFile.name
                  : "Drag and drop your WAV reference file here, or use the file chooser below."}
              </p>
              <p className="text-sm text-muted-foreground">
                Reference File:{" "}
                {referenceFile ? "File chosen" : "No file chosen"}
              </p>
              <input
                ref={referenceInputRef}
                type="file"
                accept=".wav,.mp3,.flac"
                className="hidden"
                onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
              />
            </div>
            {referenceFile && (
              <Button
                onClick={() => referenceInputRef.current?.click()}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Choose Reference File
              </Button>
            )}
          </div>
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
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          <Button
            onClick={handleMaster}
            disabled={!targetFile || !referenceFile || isProcessing}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg font-semibold"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {progressMessage || "Processing..."}
              </>
            ) : (
              "Master with AI"
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
      </Card>

      <MasteringSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </>
  );
};
