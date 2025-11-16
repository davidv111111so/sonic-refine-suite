import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";

interface MasteringSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MasteringSettingsData;
  onSettingsChange: (settings: MasteringSettingsData) => void;
}

export interface MasteringSettingsData {
  threshold: number;
  epsilon: number;
  maxPieceLength: number;
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  pieceLengthBars: number;
  resamplingMethod: string;
  spectrumCompensation: string;
  loudnessCompensation: string;
  analyzeFullSpectrum: boolean;
  spectrumSmoothingWidth: number;
  smoothingSteps: number;
  spectrumCorrectionHops: number;
  loudnessSteps: number;
  spectrumBands: number;
  fftSize: number;
  normalizeReference: boolean;
  normalize: boolean;
  limiterMethod: string;
  limiterThreshold: number;
  loudnessCorrectionLimiting: boolean;
  amplify: boolean;
  clipping: boolean;
  outputBits: string;
  outputChannels: number;
  ditheringMethod: string;
}

export const MasteringSettings: React.FC<MasteringSettingsProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}) => {
  const { t } = useLanguage();

  const updateSetting = (key: keyof MasteringSettingsData, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t("aiMastering.settings")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          {/* Threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold">{t("aiMastering.threshold")}</Label>
            <Input
              id="threshold"
              type="number"
              step="0.000001"
              value={settings.threshold}
              onChange={(e) =>
                updateSetting("threshold", parseFloat(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* Epsilon */}
          <div className="space-y-2">
            <Label htmlFor="epsilon">{t("aiMastering.epsilon")}</Label>
            <Input
              id="epsilon"
              type="number"
              step="0.000001"
              value={settings.epsilon}
              onChange={(e) =>
                updateSetting("epsilon", parseFloat(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* Max Piece Length */}
          <div className="space-y-2">
            <Label htmlFor="maxPieceLength">
              {t("aiMastering.maxPieceLength")}
            </Label>
            <Input
              id="maxPieceLength"
              type="number"
              step="0.1"
              value={settings.maxPieceLength}
              onChange={(e) =>
                updateSetting("maxPieceLength", parseFloat(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* BPM */}
          <div className="space-y-2">
            <Label htmlFor="bpm">{t("aiMastering.bpm")}</Label>
            <Input
              id="bpm"
              type="number"
              value={settings.bpm}
              onChange={(e) => updateSetting("bpm", parseFloat(e.target.value))}
              className="bg-background border-border"
            />
          </div>

          {/* Time Signature Numerator */}
          <div className="space-y-2">
            <Label htmlFor="timeSignatureNumerator">
              {t("aiMastering.timeSignatureNumerator")}
            </Label>
            <Input
              id="timeSignatureNumerator"
              type="number"
              value={settings.timeSignatureNumerator}
              onChange={(e) =>
                updateSetting(
                  "timeSignatureNumerator",
                  parseInt(e.target.value),
                )
              }
              className="bg-background border-border"
            />
          </div>

          {/* Time Signature Denominator */}
          <div className="space-y-2">
            <Label htmlFor="timeSignatureDenominator">
              {t("aiMastering.timeSignatureDenominator")}
            </Label>
            <Input
              id="timeSignatureDenominator"
              type="number"
              value={settings.timeSignatureDenominator}
              onChange={(e) =>
                updateSetting(
                  "timeSignatureDenominator",
                  parseInt(e.target.value),
                )
              }
              className="bg-background border-border"
            />
          </div>

          {/* Piece Length (bars) */}
          <div className="space-y-2">
            <Label htmlFor="pieceLengthBars">
              {t("aiMastering.pieceLengthBars")}
            </Label>
            <Input
              id="pieceLengthBars"
              type="number"
              step="0.1"
              value={settings.pieceLengthBars}
              onChange={(e) =>
                updateSetting("pieceLengthBars", parseFloat(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* Resampling Method */}
          <div className="space-y-2">
            <Label htmlFor="resamplingMethod">
              {t("aiMastering.resamplingMethod")}
            </Label>
            <Select
              value={settings.resamplingMethod}
              onValueChange={(v) => updateSetting("resamplingMethod", v)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FastSinc">FastSinc</SelectItem>
                <SelectItem value="MediumSinc">MediumSinc</SelectItem>
                <SelectItem value="BestSinc">BestSinc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spectrum Compensation */}
          <div className="space-y-2">
            <Label htmlFor="spectrumCompensation">
              {t("aiMastering.spectrumCompensation")}
            </Label>
            <Select
              value={settings.spectrumCompensation}
              onValueChange={(v) => updateSetting("spectrumCompensation", v)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Frequency-Domain (Gain Envelope)">
                  Frequency-Domain (Gain Envelope)
                </SelectItem>
                <SelectItem value="Time-Domain (Parametric EQ)">
                  Time-Domain (Parametric EQ)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loudness Compensation */}
          <div className="space-y-2">
            <Label htmlFor="loudnessCompensation">
              {t("aiMastering.loudnessCompensation")}
            </Label>
            <Select
              value={settings.loudnessCompensation}
              onValueChange={(v) => updateSetting("loudnessCompensation", v)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LUFS (Whole Signal)">
                  LUFS (Whole Signal)
                </SelectItem>
                <SelectItem value="RMS (Whole Signal)">
                  RMS (Whole Signal)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spectrum Smoothing Width */}
          <div className="space-y-2">
            <Label htmlFor="spectrumSmoothingWidth">
              {t("aiMastering.spectrumSmoothingWidth")}
            </Label>
            <Input
              id="spectrumSmoothingWidth"
              type="number"
              value={settings.spectrumSmoothingWidth}
              onChange={(e) =>
                updateSetting(
                  "spectrumSmoothingWidth",
                  parseInt(e.target.value),
                )
              }
              className="bg-background border-border"
            />
          </div>

          {/* Smoothing Steps */}
          <div className="space-y-2">
            <Label htmlFor="smoothingSteps">
              {t("aiMastering.smoothingSteps")}
            </Label>
            <Input
              id="smoothingSteps"
              type="number"
              value={settings.smoothingSteps}
              onChange={(e) =>
                updateSetting("smoothingSteps", parseInt(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* Spectrum Correction Hops */}
          <div className="space-y-2">
            <Label htmlFor="spectrumCorrectionHops">
              {t("aiMastering.spectrumCorrectionHops")}
            </Label>
            <Input
              id="spectrumCorrectionHops"
              type="number"
              value={settings.spectrumCorrectionHops}
              onChange={(e) =>
                updateSetting(
                  "spectrumCorrectionHops",
                  parseInt(e.target.value),
                )
              }
              className="bg-background border-border"
            />
          </div>

          {/* Loudness Steps */}
          <div className="space-y-2">
            <Label htmlFor="loudnessSteps">
              {t("aiMastering.loudnessSteps")}
            </Label>
            <Input
              id="loudnessSteps"
              type="number"
              value={settings.loudnessSteps}
              onChange={(e) =>
                updateSetting("loudnessSteps", parseInt(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* Spectrum Bands */}
          <div className="space-y-2">
            <Label htmlFor="spectrumBands">
              {t("aiMastering.spectrumBands")}
            </Label>
            <Input
              id="spectrumBands"
              type="number"
              value={settings.spectrumBands}
              onChange={(e) =>
                updateSetting("spectrumBands", parseInt(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* FFT Size */}
          <div className="space-y-2">
            <Label htmlFor="fftSize">{t("aiMastering.fftSize")}</Label>
            <Input
              id="fftSize"
              type="number"
              value={settings.fftSize}
              onChange={(e) =>
                updateSetting("fftSize", parseInt(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* Limiter Method */}
          <div className="space-y-2">
            <Label htmlFor="limiterMethod">
              {t("aiMastering.limiterMethod")}
            </Label>
            <Select
              value={settings.limiterMethod}
              onValueChange={(v) => updateSetting("limiterMethod", v)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="True Peak">True Peak</SelectItem>
                <SelectItem value="Sample Peak">Sample Peak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limiter Threshold dB */}
          <div className="space-y-2">
            <Label htmlFor="limiterThreshold">
              {t("aiMastering.limiterThreshold")}
            </Label>
            <Input
              id="limiterThreshold"
              type="number"
              step="0.1"
              value={settings.limiterThreshold}
              onChange={(e) =>
                updateSetting("limiterThreshold", parseFloat(e.target.value))
              }
              className="bg-background border-border"
            />
          </div>

          {/* Output Bits */}
          <div className="space-y-2">
            <Label htmlFor="outputBits">{t("aiMastering.outputBits")}</Label>
            <Select
              value={settings.outputBits}
              onValueChange={(v) => updateSetting("outputBits", v)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="32 (IEEE float)">32 (IEEE float)</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="16">16</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Output Channels */}
          <div className="space-y-2">
            <Label htmlFor="outputChannels">
              {t("aiMastering.outputChannels")}
            </Label>
            <Select
              value={settings.outputChannels.toString()}
              onValueChange={(v) =>
                updateSetting("outputChannels", parseInt(v))
              }
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dithering Method */}
          <div className="space-y-2">
            <Label htmlFor="ditheringMethod">
              {t("aiMastering.ditheringMethod")}
            </Label>
            <Select
              value={settings.ditheringMethod}
              onValueChange={(v) => updateSetting("ditheringMethod", v)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TPDF">TPDF</SelectItem>
                <SelectItem value="RPDF">RPDF</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4 col-span-full">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="analyzeFullSpectrum"
                checked={settings.analyzeFullSpectrum}
                onCheckedChange={(checked) =>
                  updateSetting("analyzeFullSpectrum", checked)
                }
              />
              <Label htmlFor="analyzeFullSpectrum" className="cursor-pointer">
                {t("aiMastering.analyzeFullSpectrum")}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="normalizeReference"
                checked={settings.normalizeReference}
                onCheckedChange={(checked) =>
                  updateSetting("normalizeReference", checked)
                }
              />
              <Label htmlFor="normalizeReference" className="cursor-pointer">
                {t("aiMastering.normalizeReference")}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="normalize"
                checked={settings.normalize}
                onCheckedChange={(checked) =>
                  updateSetting("normalize", checked)
                }
              />
              <Label htmlFor="normalize" className="cursor-pointer">
                {t("aiMastering.normalize")}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="loudnessCorrectionLimiting"
                checked={settings.loudnessCorrectionLimiting}
                onCheckedChange={(checked) =>
                  updateSetting("loudnessCorrectionLimiting", checked)
                }
              />
              <Label
                htmlFor="loudnessCorrectionLimiting"
                className="cursor-pointer"
              >
                {t("aiMastering.loudnessCorrectionLimiting")}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="amplify"
                checked={settings.amplify}
                onCheckedChange={(checked) => updateSetting("amplify", checked)}
              />
              <Label htmlFor="amplify" className="cursor-pointer">
                {t("aiMastering.amplify")}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="clipping"
                checked={settings.clipping}
                onCheckedChange={(checked) =>
                  updateSetting("clipping", checked)
                }
              />
              <Label htmlFor="clipping" className="cursor-pointer">
                {t("aiMastering.clipping")}
              </Label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
