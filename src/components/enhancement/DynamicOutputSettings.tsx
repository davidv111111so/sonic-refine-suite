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
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-300">Target Format</label>
          <AudioSettingsTooltip setting="outputFormat" />
        </div>
        <div className="flex gap-2 p-1.5 bg-slate-950/50 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-inner">
          {(['wav', 'flac', 'mp3'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => onOutputFormatChange(fmt)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold uppercase transition-all duration-300 ${
                outputFormat === fmt 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quality Settings Based on Format */}
        {isLossless ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-300">Sample Rate</label>
                <AudioSettingsTooltip setting="sampleRate" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[44100, 48000, 96000].map(rate => (
                  <button
                    key={rate}
                    onClick={() => onSampleRateChange(rate)}
                    className={`flex-1 min-w-[30%] py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
                      sampleRate === rate
                        ? 'bg-slate-800/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {rate / 1000} kHz
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-300">Bit Depth</label>
                <AudioSettingsTooltip setting="bitDepth" />
              </div>
              <div className="flex gap-2 p-1.5 bg-slate-950/50 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-inner">
                {([16, 24] as const).map(depth => (
                  <button
                    key={depth}
                    onClick={() => onBitDepthChange(depth)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                      bitDepth === depth 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {depth}-bit
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-300">Bitrate (kbps)</label>
              <AudioSettingsTooltip setting="targetBitrate" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[128, 192, 256, 320].map(rate => (
                <button
                  key={rate}
                  onClick={() => onBitrateChange?.(rate)}
                  className={`flex-1 min-w-[20%] py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border ${
                    (bitrate || 320) === rate
                      ? 'bg-slate-800/80 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium tracking-wide">
              Sample rate is automatically locked to 44.1 kHz for MP3 encoding.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};