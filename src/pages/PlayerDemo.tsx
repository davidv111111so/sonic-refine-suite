/**
 * Demo page for the Advanced Audio Player
 * Shows the player with example audio files
 */

import React, { useState } from 'react';
import { AdvancedAudioPlayer } from '@/components/AdvancedAudioPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, Music2 } from 'lucide-react';
import { AudioFile } from '@/types/audio';

const PlayerDemo = () => {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const newAudioFile: AudioFile = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploaded',
        originalFile: file,
        originalUrl: URL.createObjectURL(file),
      };
      setAudioFile(newAudioFile);
    }
  };

  const handleEQChange = (bandIndex: number, value: number) => {
    const newBands = [...eqBands];
    newBands[bandIndex] = value;
    setEqBands(newBands);
  };

  const EQ_FREQUENCIES = [60, 250, 1000, 4000, 12000];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Advanced Audio Player Demo
          </h1>
          <p className="text-slate-400">
            Real-time audio enhancement with EQ and dynamics processing
          </p>
        </div>

        {/* File Upload */}
        {!audioFile && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-12">
              <label className="flex flex-col items-center justify-center cursor-pointer group">
                <Upload className="h-16 w-16 text-slate-500 group-hover:text-cyan-400 transition-colors mb-4" />
                <span className="text-lg text-slate-400 group-hover:text-white transition-colors">
                  Upload an audio file to get started
                </span>
                <span className="text-sm text-slate-500 mt-2">
                  Supports MP3, WAV, FLAC
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </CardContent>
          </Card>
        )}

        {/* Advanced Player */}
        {audioFile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AdvancedAudioPlayer
                audioFile={audioFile}
                eqBands={eqBands}
                onEQChange={handleEQChange}
              />
            </div>

            <div className="space-y-6">
              {/* 5-Band Equalizer */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Music2 className="h-5 w-5" />
                    5-Band Equalizer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {EQ_FREQUENCIES.map((freq, index) => (
                    <div key={freq} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">
                          {freq < 1000 ? `${freq}Hz` : `${freq / 1000}kHz`}
                        </span>
                        <span className="text-sm text-cyan-400 font-mono">
                          {eqBands[index] > 0 ? '+' : ''}
                          {eqBands[index].toFixed(1)}dB
                        </span>
                      </div>
                      <Slider
                        value={[eqBands[index]]}
                        min={-12}
                        max={12}
                        step={0.5}
                        onValueChange={(v) => handleEQChange(index, v[0])}
                      />
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEqBands([0, 0, 0, 0, 0])}
                  >
                    Reset EQ
                  </Button>
                </CardContent>
              </Card>

              {/* Change File */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAudioFile(null)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Change File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDemo;
