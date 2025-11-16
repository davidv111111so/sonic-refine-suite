import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Trash2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomEQPresetsProps {
  currentEQBands: number[];
  onApplyPreset: (eqBands: number[]) => void;
}

interface CustomPreset {
  id: string;
  name: string;
  eqBands: number[];
  createdAt: string;
}

export const CustomEQPresets = ({
  currentEQBands,
  onApplyPreset,
}: CustomEQPresetsProps) => {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [isNaming, setIsNaming] = useState(false);
  const { toast } = useToast();

  // Load custom presets from localStorage on component mount
  useEffect(() => {
    const savedPresets = localStorage.getItem("perfectAudio_customEQPresets");
    if (savedPresets) {
      try {
        setCustomPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error("Error loading custom presets:", error);
      }
    }
  }, []);

  // Save presets to localStorage whenever customPresets changes
  useEffect(() => {
    localStorage.setItem(
      "perfectAudio_customEQPresets",
      JSON.stringify(customPresets),
    );
  }, [customPresets]);

  const saveCurrentPreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Preset name required",
        description: "Please enter a name for your custom preset",
        variant: "destructive",
      });
      return;
    }

    const newPreset: CustomPreset = {
      id: Math.random().toString(36).substring(7),
      name: presetName.trim(),
      eqBands: [...currentEQBands],
      createdAt: new Date().toISOString(),
    };

    setCustomPresets((prev) => [...prev, newPreset]);
    setPresetName("");
    setIsNaming(false);

    toast({
      title: "Custom preset saved!",
      description: `"${newPreset.name}" has been saved to your custom presets`,
    });
  };

  const deletePreset = (id: string) => {
    const presetToDelete = customPresets.find((p) => p.id === id);
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));

    toast({
      title: "Preset deleted",
      description: `"${presetToDelete?.name}" has been removed from your custom presets`,
    });
  };

  const applyPreset = (preset: CustomPreset) => {
    onApplyPreset(preset.eqBands);
    toast({
      title: "Custom preset applied!",
      description: `"${preset.name}" EQ settings have been applied`,
    });
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 dark:from-black/90 dark:to-slate-950/80 border-slate-700 dark:border-slate-800 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Music className="h-5 w-5 text-purple-400" />
          Custom EQ Presets
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Save/Load Preset Buttons - Vertically Stacked */}
        <div className="flex flex-col gap-2">
          {isNaming ? (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Save className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-white font-medium">
                  Save Current EQ
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-xs h-8"
                  onKeyPress={(e) => e.key === "Enter" && saveCurrentPreset()}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={saveCurrentPreset}
                  className="bg-purple-600 hover:bg-purple-700 h-8 px-3 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsNaming(false)}
                  className="border-slate-600 h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => setIsNaming(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs"
              >
                <Save className="h-3 w-3 mr-2" />
                Save Preset
              </Button>
            </>
          )}
        </div>

        {/* Custom Presets List */}
        {customPresets.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300">
              Your Custom Presets
            </h4>
            {customPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700"
              >
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {preset.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Created: {new Date(preset.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyPreset(preset)}
                    className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white text-xs px-2 py-1 h-7"
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePreset(preset.id)}
                    className="bg-red-900/50 border-red-600 hover:bg-red-800 text-red-200 text-xs px-2 py-1 h-7"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Music className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No custom presets yet</p>
            <p className="text-slate-500 text-xs">
              Create your first custom EQ preset above
            </p>
          </div>
        )}

        {customPresets.length > 0 && (
          <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
            {customPresets.length} custom preset
            {customPresets.length !== 1 ? "s" : ""} saved locally
          </div>
        )}
      </CardContent>
    </Card>
  );
};
