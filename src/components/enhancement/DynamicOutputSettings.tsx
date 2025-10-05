import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { AudioSettingsTooltip } from '@/components/AudioSettingsTooltip';

interface DynamicOutputSettingsProps {
  outputFormat: 'mp3' | 'wav' | 'flac';
  sampleRate: number;
  bitDepth: 16 | 24;
  bitrate?: number;
  onOutputFormatChange: (format: 'mp3' | 'wav' | 'flac') => void;
  onSampleRateChange: (rate: number) => void;
  onBitDepthChange: (depth: 16 | 24) => void;
  onBitrateChange?: (rate: number) => void;
}

export const DynamicOutputSettings = ({
  outputFormat,
  sampleRate,
  bitDepth,
  bitrate,
  onOutputFormatChange,
  onSampleRateChange,
  onBitDepthChange,
  onBitrateChange
}: DynamicOutputSettingsProps) => {
  
  const isLossless = outputFormat === 'wav' || outputFormat === 'flac';

  return (
    <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <Settings className="h-4 w-4" />
          Output Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white mb-2 flex items-center font-medium">
              Format
              <AudioSettingsTooltip setting="outputFormat" />
            </label>
            <select 
              value={outputFormat}
              onChange={(e) => onOutputFormatChange(e.target.value as 'mp3' | 'wav' | 'flac')}
              className="w-full bg-slate-800 dark:bg-black border border-slate-700 dark:border-slate-800 text-white rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="flac">FLAC</option>
            </select>
          </div>
          
          {/* Sample Rate - Hidden for MP3, visible for lossless */}
          {outputFormat !== 'mp3' && (
            <div>
              <label className="text-xs text-white mb-2 flex items-center font-medium">
                Sample Rate
                <AudioSettingsTooltip setting="sampleRate" />
              </label>
              <select 
                value={sampleRate}
                onChange={(e) => onSampleRateChange(parseInt(e.target.value))}
                className="w-full bg-slate-800 dark:bg-black border border-slate-700 dark:border-slate-800 text-white rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="44100">44.1 kHz</option>
                <option value="48000">48 kHz</option>
                <option value="96000">96 kHz</option>
              </select>
            </div>
          )}
        </div>

        {/* Bitrate for MP3, Bit Depth for lossless formats */}
        <div>
          {outputFormat === 'mp3' ? (
            <div>
              <label className="text-xs text-white mb-2 flex items-center font-medium">
                Bitrate
                <AudioSettingsTooltip setting="targetBitrate" />
              </label>
              <select 
                value={bitrate || 320}
                onChange={(e) => onBitrateChange?.(parseInt(e.target.value))}
                className="w-full bg-slate-800 dark:bg-black border border-slate-700 dark:border-slate-800 text-white rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="128">128 kbps</option>
                <option value="192">192 kbps</option>
                <option value="256">256 kbps</option>
                <option value="320">320 kbps</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Sample Rate: 44.1 kHz (locked for MP3)
              </p>
            </div>
          ) : (
            <div>
              <label className="text-xs text-white mb-2 flex items-center font-medium">
                Bit Depth
                <AudioSettingsTooltip setting="sampleRate" />
              </label>
              <select 
                value={bitDepth}
                onChange={(e) => onBitDepthChange(parseInt(e.target.value) as 16 | 24)}
                className="w-full bg-slate-800 dark:bg-black border border-slate-700 dark:border-slate-800 text-white rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="16">16-bit</option>
                <option value="24">24-bit</option>
              </select>
            </div>
          )}
        </div>

        {/* Format Info */}
        <div className="bg-slate-800/60 dark:bg-black/80 p-3 rounded border border-slate-700 dark:border-slate-800">
          <div className="text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Format:</span>
              <span className="text-white font-medium">{outputFormat.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quality:</span>
              <span className="text-white font-medium">
                {outputFormat === 'mp3' 
                  ? `${bitrate} kbps, 44.1 kHz` 
                  : `${bitDepth}-bit, ${(sampleRate / 1000).toFixed(1)} kHz`
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Type:</span>
              <span className="text-white font-medium">
                {isLossless ? 'Lossless' : 'Compressed'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};