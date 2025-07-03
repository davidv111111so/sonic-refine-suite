
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle, Upload, Settings, Download, Music, Sliders } from 'lucide-react';

export const Guide = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-400">Perfect Audio - User Guide</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-400" />
                1. Upload Tab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-slate-300">• Drag & drop or click to upload audio files (MP3, WAV, FLAC, M4A)</p>
              <p className="text-slate-300">• Maximum 20 files, 50MB each</p>
              <p className="text-slate-300">• EQ settings apply only to the last uploaded song</p>
              <p className="text-slate-300">• Preview uploaded songs with mini player</p>
              <p className="text-slate-300">• Remove unwanted files with the X button</p>
            </CardContent>
          </Card>

          {/* Enhancement Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-400" />
                2. Enhance Tab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-slate-300">• View all uploaded songs ready for enhancement</p>
              <p className="text-slate-300">• Toggle quick settings with circle buttons:</p>
              <div className="ml-4 space-y-1">
                <p className="text-slate-400">- Green: Noise Reduction</p>
                <p className="text-slate-400">- Yellow: Compression</p>
                <p className="text-slate-400">- Purple: Stereo Widening</p>
              </div>
              <p className="text-slate-300">• Adjust 10-band EQ for precise frequency control</p>
              <p className="text-slate-300">• Use presets for different music genres</p>
              <p className="text-slate-300">• Click "Enhance Audio" to process all uploaded songs</p>
            </CardContent>
          </Card>

          {/* Enhanced Songs Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5 text-purple-400" />
                3. Enhanced Tab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-slate-300">• View all successfully enhanced songs</p>
              <p className="text-slate-300">• Compare file sizes (original vs enhanced)</p>
              <p className="text-slate-300">• Download individual enhanced songs</p>
              <p className="text-slate-300">• Delete enhanced songs you don't need</p>
              <p className="text-slate-300">• Songs maintain original BPM and tempo</p>
            </CardContent>
          </Card>

          {/* Queue Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Music className="h-5 w-5 text-yellow-400" />
                4. Queue Tab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-slate-300">• Monitor processing queue with progress bars</p>
              <p className="text-slate-300">• View uploaded files waiting for enhancement</p>
              <p className="text-slate-300">• Track processing stages and completion status</p>
            </CardContent>
          </Card>

          {/* Enhancement Presets */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="h-5 w-5 text-orange-400" />
                Enhancement Presets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-slate-300">• Music: Balanced enhancement</p>
                <p className="text-slate-300">• Podcast: Voice clarity</p>
                <p className="text-slate-300">• Electronic: Bass & treble boost</p>
                <p className="text-slate-300">• Jazz: Warm, natural sound</p>
                <p className="text-slate-300">• Latin: Rhythmic enhancement</p>
                <p className="text-slate-300">• Radio: Broadcast ready</p>
                <p className="text-slate-300">• Hip Hop: Heavy bass</p>
                <p className="text-slate-300">• Rock: Dynamic range</p>
                <p className="text-slate-300">• Classical: Subtle improvement</p>
                <p className="text-slate-300">• Pop: Commercial sound</p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-400">Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-slate-300">• Start with presets, then fine-tune with EQ</p>
              <p className="text-slate-300">• Higher quality source files produce better results</p>
              <p className="text-slate-300">• Processing maintains original audio tempo</p>
              <p className="text-slate-300">• Desktop notifications alert when processing completes</p>
              <p className="text-slate-300">• Files are automatically downloaded after enhancement</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
