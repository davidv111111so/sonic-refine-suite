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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Format</label>
          <select
            value={outputFormat}
            onChange={e => onOutputFormatChange(e.target.value as 'mp3' | 'wav' | 'flac')}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="flac">FLAC</option>
          </select>
        </div>

        {/* Sample Rate - Hidden for MP3, visible for lossless */}
        {outputFormat !== 'mp3' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Sample Rate</label>
            <select
              value={sampleRate}
              onChange={e => onSampleRateChange(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
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
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Bitrate</label>
            <select
              value={bitrate || 320}
              onChange={e => onBitrateChange?.(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
            >
              <option value="128">128 kbps</option>
              <option value="192">192 kbps</option>
              <option value="256">256 kbps</option>
              <option value="320">320 kbps</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Sample Rate: 44.1 kHz (locked for MP3)
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Bit Depth</label>
            <select
              value={bitDepth}
              onChange={e => onBitDepthChange(parseInt(e.target.value) as 16 | 24)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
            >
              <option value="16">16-bit</option>
              <option value="24">24-bit</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};