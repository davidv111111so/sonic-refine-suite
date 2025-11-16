import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AudioSettingsTooltip } from "@/components/AudioSettingsTooltip";

interface EqualizerSettingsProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
}

export const EqualizerSettings = ({
  settings,
  onSettingChange,
  onEQBandChange,
  onResetEQ,
}: EqualizerSettingsProps) => {
  const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Switch
          checked={settings.enableEQ}
          onCheckedChange={(checked) => onSettingChange("enableEQ", checked)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onResetEQ}
          className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-8"
        >
          Reset EQ
        </Button>
      </div>

      {settings.enableEQ && (
        <div className="relative bg-slate-900/50 rounded-lg p-6">
          <div className="flex justify-center items-end gap-3 py-4 relative z-10">
            {eqFrequencies.map((freq, index) => (
              <div key={freq} className="flex flex-col items-center">
                <div className="h-32 flex items-end justify-center mb-2 relative">
                  <Slider
                    orientation="vertical"
                    value={[settings.eqBands[index]]}
                    onValueChange={([value]) => onEQBandChange(index, value)}
                    min={-12}
                    max={12}
                    step={0.5}
                    className="h-28 w-6 relative z-10"
                  />
                </div>
                <div className="text-xs font-medium text-blue-400 mb-1">
                  {freq < 1000 ? `${freq}Hz` : `${freq / 1000}kHz`}
                </div>
                <div className="text-xs text-slate-300">
                  {settings.eqBands[index] > 0 ? "+" : ""}
                  {settings.eqBands[index]}dB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
