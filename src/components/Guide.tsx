
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Upload, Settings, Sparkles, Music, Zap, Volume2, Headphones, Save, BarChart3 } from 'lucide-react';

export const Guide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white">
          <HelpCircle className="h-4 w-4 mr-2" />
          Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            Perfect Audio - Complete User Guide
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
            <TabsTrigger value="enhance" className="text-xs">Enhance</TabsTrigger>
            <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Welcome to Perfect Audio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <p>Perfect Audio is a professional desktop audio enhancement application that uses advanced Web Audio API processing to improve your music quality.</p>
                
                <div className="space-y-2">
                  <h4 className="text-white font-semibold">Key Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>10-Band Professional Equalizer</li>
                    <li>Real-time Noise Reduction</li>
                    <li>Dynamic Range Compression</li>
                    <li>Stereo Widening Enhancement</li>
                    <li>A/B Audio Comparison Testing</li>
                    <li>Custom EQ Preset Saving</li>
                    <li>Batch Processing (up to 20 files)</li>
                    <li>Multiple Output Formats (WAV, MP3, FLAC)</li>
                  </ul>
                </div>

                <div className="bg-blue-900/20 border border-blue-600/50 rounded p-3">
                  <p className="text-blue-200 text-sm">
                    <strong>One-Time License:</strong> Buy once, use forever. No subscriptions or cloud dependencies required.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-400" />
                  Upload Tab Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300">
                <div className="space-y-3">
                  <h4 className="text-white font-semibold">How to Upload Files:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Drag and drop audio files into the upload zone</li>
                    <li>Or click to select files from your computer</li>
                    <li>Supported formats: MP3, WAV, FLAC, M4A (Max 50MB each)</li>
                    <li>Upload up to 20 files at once</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Perfect Audio EQ:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>One EQ controls all uploaded songs</li>
                    <li>10 frequency bands from 31Hz to 16kHz</li>
                    <li>Adjust each band from -12dB to +12dB</li>
                    <li>Real-time preview on the last uploaded song</li>
                    <li>Reset button to clear all EQ settings</li>
                  </ul>
                </div>

                <div className="bg-green-900/20 border border-green-600/50 rounded p-3">
                  <p className="text-green-200 text-sm">
                    <strong>Tip:</strong> The EQ applies to the most recently uploaded song for preview, but will enhance all uploaded files when processing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enhance" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Enhancement Tab Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300">
                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Enhancement Toggle Controls:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="text-white text-sm font-medium">Noise Reduction</p>
                        <p className="text-xs text-slate-400">Removes background noise and hiss</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-white text-sm font-medium">Compression</p>
                        <p className="text-xs text-slate-400">Balances dynamic range</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-white text-sm font-medium">Stereo Widening</p>
                        <p className="text-xs text-slate-400">Expands stereo image</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Enhancement Presets:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Rock:</strong> Enhanced mids and highs for rock music</li>
                    <li><strong>Pop:</strong> Balanced enhancement for mainstream music</li>
                    <li><strong>Classical:</strong> Natural enhancement preserving dynamics</li>
                    <li><strong>Hip Hop:</strong> Enhanced bass and clarity for rap/hip-hop</li>
                    <li><strong>Vocal Boost:</strong> Enhanced mid-range for vocal clarity</li>
                  </ul>
                </div>

                <div className="bg-purple-900/20 border border-purple-600/50 rounded p-3">
                  <p className="text-purple-200 text-sm">
                    <strong>Processing:</strong> Files are processed one at a time to prevent crashes. Queue up to 20 files for batch processing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300">
                <div className="space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    A/B Audio Comparison
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Compare original vs enhanced audio side-by-side</li>
                    <li>Click the comparison button on any enhanced file</li>
                    <li>Play both versions to hear the difference</li>
                    <li>Perfect for fine-tuning your enhancement settings</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Save className="h-4 w-4 text-purple-400" />
                    Custom EQ Presets
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Save your custom EQ settings as presets</li>
                    <li>Name and organize your favorite configurations</li>
                    <li>Apply saved presets instantly to new projects</li>
                    <li>Presets are saved locally on your computer</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Output Options:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>WAV:</strong> Uncompressed, highest quality</li>
                    <li><strong>FLAC:</strong> Lossless compression, smaller files</li>
                    <li><strong>MP3:</strong> Compressed, configurable bitrate</li>
                    <li>Sample rates: 44.1kHz, 48kHz, 96kHz</li>
                    <li>Automatic file downloading after enhancement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music className="h-5 w-5 text-green-400" />
                  Pro Tips & Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-300">
                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Getting the Best Results:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Start with high-quality source files (lossless preferred)</li>
                    <li>Use subtle EQ adjustments (±3dB) for natural enhancement</li>
                    <li>Enable A/B comparison to hear the difference</li>
                    <li>Save successful EQ settings as custom presets</li>
                    <li>Process similar songs with consistent settings</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Performance Tips:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Upload files in batches of 5-10 for optimal performance</li>
                    <li>Close other applications during heavy processing</li>
                    <li>Use WAV format for fastest processing</li>
                    <li>Keep original files as backup</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-600/50 rounded p-3">
                    <h5 className="text-green-200 font-semibold text-sm mb-2">Do:</h5>
                    <ul className="text-green-200 text-xs space-y-1">
                      <li>• Test different presets</li>
                      <li>• Use A/B comparison</li>
                      <li>• Save custom settings</li>
                      <li>• Process one genre at a time</li>
                    </ul>
                  </div>
                  <div className="bg-red-900/20 border border-red-600/50 rounded p-3">
                    <h5 className="text-red-200 font-semibold text-sm mb-2">Don't:</h5>
                    <ul className="text-red-200 text-xs space-y-1">
                      <li>• Over-enhance (+12dB on all bands)</li>
                      <li>• Process already compressed files</li>
                      <li>• Rush the enhancement process</li>
                      <li>• Ignore the original quality</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t border-slate-700">
          <Button onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-700">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
