import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EQPresetButtonsProps {
  eqBands: number[];
  onLoadPreset: (preset: number[]) => void;
}

export const EQPresetButtons = ({
  eqBands,
  onLoadPreset,
}: EQPresetButtonsProps) => {
  const [isSaveActive, setIsSaveActive] = useState(false);
  const [isLoadActive, setIsLoadActive] = useState(false);
  const { toast } = useToast();

  const handleSavePreset = () => {
    setIsSaveActive(true);
    setTimeout(() => setIsSaveActive(false), 200);

    // Save to localStorage
    localStorage.setItem("spectrum_eq_preset", JSON.stringify(eqBands));

    toast({
      title: "Preset Saved",
      description: "EQ settings have been saved successfully.",
    });
  };

  const handleLoadPreset = () => {
    setIsLoadActive(true);
    setTimeout(() => setIsLoadActive(false), 200);

    // Load from localStorage
    const savedPreset = localStorage.getItem("spectrum_eq_preset");
    if (savedPreset) {
      const preset = JSON.parse(savedPreset);
      onLoadPreset(preset);
      toast({
        title: "Preset Loaded",
        description: "EQ settings have been loaded successfully.",
      });
    } else {
      toast({
        title: "No Preset Found",
        description: "No saved EQ preset found.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSavePreset}
        className={`transition-all duration-200 ${
          isSaveActive
            ? "bg-green-600 border-green-500 text-white"
            : "bg-slate-700 border-slate-500 hover:bg-slate-600 text-white"
        }`}
      >
        <Save className="h-4 w-4 mr-2" />
        Save Preset
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLoadPreset}
        className={`transition-all duration-200 ${
          isLoadActive
            ? "bg-blue-600 border-blue-500 text-white"
            : "bg-slate-700 border-slate-500 hover:bg-slate-600 text-white"
        }`}
      >
        <Upload className="h-4 w-4 mr-2" />
        Load Preset
      </Button>
    </div>
  );
};
