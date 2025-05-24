
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioFile } from '@/pages/Index';
import { Activity, BarChart4, FileAudio, Music } from 'lucide-react';

interface AudioAnalysisProps {
  file: AudioFile;
  analysisData?: {
    dynamicRange?: number;
    peakAmplitude?: number;
    averageRms?: number;
    noiseFloor?: number;
  };
}

export const AudioAnalysis = ({ file, analysisData = {} }: AudioAnalysisProps) => {
  // Default analysis values (in a real app these would be calculated)
  const defaultAnalysis = {
    dynamicRange: Math.floor(Math.random() * 20) + 10, // Simulate 10-30dB range
    peakAmplitude: -Math.floor(Math.random() * 6), // Simulate -0 to -6 dBFS
    averageRms: -Math.floor(Math.random() * 12) - 12, // Simulate -12 to -24 dBFS
    noiseFloor: -Math.floor(Math.random() * 20) - 60, // Simulate -60 to -80 dBFS
  };

  const analysis = {
    ...defaultAnalysis,
    ...analysisData
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="h-5 w-5" />
          Audio Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/50 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart4 className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Dynamic Range</span>
            </div>
            <div className="text-2xl font-bold text-white">{analysis.dynamicRange} dB</div>
            <p className="text-xs text-slate-400 mt-1">
              {analysis.dynamicRange > 20 ? "Excellent" : 
               analysis.dynamicRange > 14 ? "Good" : 
               analysis.dynamicRange > 10 ? "Average" : "Poor"} dynamic range
            </p>
          </div>
          
          <div className="bg-slate-700/50 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Peak Amplitude</span>
            </div>
            <div className="text-2xl font-bold text-white">{analysis.peakAmplitude} dBFS</div>
            <p className="text-xs text-slate-400 mt-1">
              {analysis.peakAmplitude > -1 ? "Warning: Potential clipping" : 
               analysis.peakAmplitude > -3 ? "Good headroom" : 
               "Significant headroom available"}
            </p>
          </div>
          
          <div className="bg-slate-700/50 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileAudio className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Average Level</span>
            </div>
            <div className="text-2xl font-bold text-white">{analysis.averageRms} dBFS</div>
            <p className="text-xs text-slate-400 mt-1">
              {analysis.averageRms > -12 ? "Potentially too loud" : 
               analysis.averageRms > -18 ? "Good loudness level" : 
               "Relatively quiet recording"}
            </p>
          </div>
          
          <div className="bg-slate-700/50 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Noise Floor</span>
            </div>
            <div className="text-2xl font-bold text-white">{analysis.noiseFloor} dBFS</div>
            <p className="text-xs text-slate-400 mt-1">
              {analysis.noiseFloor > -60 ? "High background noise" : 
               analysis.noiseFloor > -70 ? "Average noise level" : 
               "Very clean recording"}
            </p>
          </div>
        </div>
        
        <div className="text-xs text-slate-500 mt-2 text-center">
          Analysis is based on the original audio file
        </div>
      </CardContent>
    </Card>
  );
};
