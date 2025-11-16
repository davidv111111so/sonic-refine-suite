import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedEQPresetsProps {
  eqBands: number[];
  onLoadPreset: (preset: number[]) => void;
  processingSettings: any;
  onLoadProcessingSettings?: (settings: any) => void;
}

export const EnhancedEQPresets = ({
  eqBands,
  onLoadPreset,
  processingSettings,
  onLoadProcessingSettings,
}: EnhancedEQPresetsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaveActive, setIsSaveActive] = useState(false);
  const [isLoadActive, setIsLoadActive] = useState(false);
  const [loadedPresetName, setLoadedPresetName] = useState<string>("");
  const { toast } = useToast();

  const handleSavePreset = () => {
    setIsSaveActive(true);
    setTimeout(() => setIsSaveActive(false), 300);

    // Create comprehensive preset data
    const presetData = {
      name: `Spectrum Preset ${new Date().toLocaleDateString()}`,
      version: "2.0",
      timestamp: new Date().toISOString(),
      eqBands: eqBands,
      processingSettings: processingSettings,
      metadata: {
        createdBy: "Spectrum Audio Processor",
        description:
          "Complete audio processing preset including EQ and effects",
      },
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(presetData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spectrum-preset-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Preset Saved",
      description: "Audio settings preset has been saved to your computer.",
    });
  };

  const handleLoadPreset = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast({
        title: "Invalid File",
        description: "Please select a valid JSON preset file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadActive(true);
    setTimeout(() => setIsLoadActive(false), 300);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const presetData = JSON.parse(result);

        if (presetData.eqBands && Array.isArray(presetData.eqBands)) {
          onLoadPreset(presetData.eqBands);

          if (presetData.processingSettings && onLoadProcessingSettings) {
            onLoadProcessingSettings(presetData.processingSettings);
          }

          setLoadedPresetName(presetData.name || file.name);

          toast({
            title: "Preset Loaded",
            description: `Successfully loaded: ${presetData.name || file.name}`,
          });
        } else {
          throw new Error("Invalid preset format - missing EQ bands");
        }
      } catch (error) {
        toast({
          title: "Load Failed",
          description:
            "Failed to parse preset file. Please check the file format.",
          variant: "destructive",
        });
        console.error("Preset load error:", error);
      }
    };

    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadPreset}
          className={`transition-all duration-300 h-7 text-xs px-2 ${
            isLoadActive
              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/50 scale-95"
              : "bg-slate-800 dark:bg-black border-slate-600 dark:border-slate-700 hover:bg-slate-700 dark:hover:bg-slate-900 text-white hover:border-blue-400"
          }`}
        >
          <FolderOpen className="h-3 w-3 mr-1" />
          Load
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSavePreset}
          className={`transition-all duration-300 h-7 text-xs px-2 ${
            isSaveActive
              ? "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/50 scale-95"
              : "bg-slate-800 dark:bg-black border-slate-600 dark:border-slate-700 hover:bg-slate-700 dark:hover:bg-slate-900 text-white hover:border-green-400"
          }`}
        >
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>

      {/* Hidden file input for preset loading */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        className="hidden"
      />

      {/* Show loaded preset name */}
      {loadedPresetName && (
        <div className="text-[10px] text-slate-300 dark:text-slate-400 bg-slate-800/50 dark:bg-black/70 px-2 py-1 rounded border border-slate-600 dark:border-slate-700">
          <span className="text-blue-400 dark:text-blue-300 font-medium">
            Active:
          </span>{" "}
          {loadedPresetName}
        </div>
      )}
    </div>
  );
};
