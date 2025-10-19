import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Music, Sparkles, Settings, Upload, Download, Zap, Crown } from 'lucide-react';

interface RecapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecapModal = ({ isOpen, onClose }: RecapModalProps) => {
  const features = [
    {
      name: 'Spectrum Tab - Track Management',
      icon: <Music className="h-5 w-5" />,
      description: 'Upload, organize, and manage your audio files',
      howToUse: [
        'Upload up to 20 audio files (Max 100MB each) - MP3, WAV, FLAC supported',
        'View track list with file info, status, and metadata',
        'Play audio previews using the built-in mini player',
        'Key detection shows musical key and Camelot notation',
        'Download individual files or batch download as ZIP',
        'Convert between formats (MP3 ↔ WAV ↔ FLAC)'
      ],
      status: 'Working ✅'
    },
    {
      name: 'Enhance Tab - Audio Processing',
      icon: <Sparkles className="h-5 w-5" />,
      description: 'Professional audio enhancement with real-time settings',
      howToUse: [
        'Choose Batch Mode (all files) or Individual Mode (select specific files)',
        'In Individual Mode: Check boxes next to songs you want to process',
        'SPECTRUM button shows selected count in Individual Mode',
        'Adjust 5-Band Equalizer with customizable frequency ranges',
        'Use Professional Presets for instant EQ settings',
        'Configure output format, sample rate, bit depth, and bitrate',
        'Enable/disable noise reduction, normalization, compression',
        'Apply stereo widening for enhanced spatial audio',
        'Click SPECTRUM button to start enhancement'
      ],
      status: 'Working ✅'
    },
    {
      name: '5-Band Equalizer',
      icon: <Settings className="h-5 w-5" />,
      description: 'Professional EQ with adjustable frequency bands',
      howToUse: [
        'Each band has adjustable frequency range using ◀ ▶ buttons',
        'Low/Sub: 20-85 Hz (default 50 Hz) - Bass and rumble',
        'Mid Low/Punch: 85-356 Hz (default 145 Hz) - Body and warmth',
        'Mid: 356-2.2 kHz (default 874 Hz) - Vocal clarity',
        'Mid High/Presence: 2.2-9.8 kHz (default 5.56 kHz) - Definition',
        'High/Air: 9.8-20 kHz (default 17.2 kHz) - Brightness and detail',
        'Adjust sliders from -12dB to +12dB for each band',
        'Reset button returns both frequencies and values to defaults',
        'Professional Presets apply values and move sliders in real-time'
      ],
      status: 'Working ✅'
    },
    {
      name: 'Professional EQ Presets',
      icon: <Zap className="h-5 w-5" />,
      description: '10 studio-quality presets for different audio styles',
      howToUse: [
        'Modern Punch: +1.5, +1.0, -2.0, +0.5, +2.0 dB',
        'Vocal Presence: -1.5, -2.0, +1.5, +2.0, +0.5 dB',
        'Bass Foundation: +2.0, +1.0, -1.0, 0, -0.5 dB',
        'Clarity & Air: -0.5, 0, -1.0, +1.5, +2.5 dB',
        'De-Box/Clean Mid: -1.0, -1.5, -2.5, +1.0, +0.5 dB',
        'Warmth & Body: +0.5, +1.5, +1.0, -1.0, -1.5 dB',
        'Live Energy (Subtle V): +1.0, +0.5, -1.5, +0.5, +1.5 dB',
        'Acoustic/Orchestral: +0.5, -1.0, 0, +0.5, +1.0 dB',
        'Digital De-Harsh: 0, 0, +0.5, -1.5, -1.0 dB',
        'Voiceover/Podcast: -6.0, -2.5, +2.0, +2.5, -1.5 dB',
        'Click any preset to apply instantly - sliders move in real-time'
      ],
      status: 'Working ✅'
    },
    {
      name: 'AI Mastering Tab',
      icon: <Crown className="h-5 w-5" />,
      description: 'Premium AI-powered audio mastering (Premium users only)',
      howToUse: [
        'Upload your target audio file to master',
        'Choose from 8 genre presets (Rock, Latin, Electronic, Jazz, Classical, Hip-Hop, Vocal, Bass Boost)',
        'OR upload your own custom reference file',
        'Configure advanced mastering settings (threshold, FFT size, limiter, etc.)',
        'Click "Master My Track" to process',
        'File automatically downloads when complete',
        'Clear buttons (✕) to remove target and reference files',
        'View mastered file info and download again from results section'
      ],
      status: 'Working ✅ (Premium Only)'
    },
    {
      name: 'Audio Settings Applied',
      icon: <Settings className="h-5 w-5" />,
      description: 'All audio processing settings are functional',
      howToUse: [
        '✅ EQ Bands: All 5 bands apply correctly with proper gain values',
        '✅ Noise Reduction: Removes background noise when enabled',
        '✅ Normalization: Adjusts overall loudness to target level',
        '✅ Compression: Controls dynamic range with threshold and ratio',
        '✅ Stereo Widening: Enhances stereo image width',
        '✅ Output Format: MP3, WAV, FLAC conversion working',
        '✅ Sample Rate: 44.1kHz, 48kHz, 96kHz options functional',
        '✅ Bit Depth: 16-bit, 24-bit, 32-bit options working',
        '✅ Bitrate: 128-320 kbps for MP3 encoding',
        '✅ Key Detection: Musical key analysis with Camelot notation',
        '✅ Real-time Preview: Audio playback with applied settings'
      ],
      status: 'All Settings Working ✅'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Spectrum - Feature Recap & How-To Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-cyan-300">{feature.name}</h3>
                      <p className="text-sm text-slate-400">{feature.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {feature.status}
                  </Badge>
                </div>

                <Separator className="my-4 bg-slate-700" />

                <div>
                  <h4 className="text-sm font-bold text-purple-300 mb-3">How to Use:</h4>
                  <ul className="space-y-2">
                    {feature.howToUse.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-cyan-400 font-bold mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/40">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-cyan-300 mb-4">💡 Quick Tips</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Use <strong>Individual Mode</strong> when you only want to process specific songs</li>
                <li>• <strong>Professional Presets</strong> are great starting points - you can adjust after applying</li>
                <li>• <strong>Key Detection</strong> helps with harmonic mixing for DJs (Camelot notation)</li>
                <li>• <strong>Batch Mode</strong> processes all files with the same settings</li>
                <li>• <strong>Reset button</strong> in EQ returns all frequencies and values to defaults</li>
                <li>• File size in track list now displays in <strong>bright cyan</strong> for better visibility</li>
                <li>• Hover over songs in Individual Mode - text changes to <strong>black for readability</strong></li>
                <li>• SPECTRUM button shows <strong>selected count in real-time</strong> when using Individual Mode</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
