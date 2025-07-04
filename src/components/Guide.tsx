
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Upload, Settings, Sparkles, Sliders, Save, Zap, Volume2, Headphones, Keyboard, Archive, Palette } from 'lucide-react';

export const Guide = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const features = [
    {
      name: "JSZip - Batch Export",
      description: "Download multiple enhanced files as a single ZIP archive",
      priority: "High",
      icon: <Archive className="h-4 w-4" />,
      howItWorks: "Automatically packages all enhanced files into a compressed ZIP file for easy download and sharing"
    },
    {
      name: "music-metadata - Metadata Preservation", 
      description: "Preserve original song information (title, artist, album, etc.)",
      priority: "High",
      icon: <Settings className="h-4 w-4" />,
      howItWorks: "Reads and transfers all metadata from original files to enhanced versions, maintaining your music library organization"
    },
    {
      name: "Web Audio API - Core Processing",
      description: "Real-time audio enhancement and frequency analysis",
      priority: "Essential",
      icon: <Volume2 className="h-4 w-4" />,
      howItWorks: "Browser-native audio processing for studio-quality enhancement without server dependencies"
    },
    {
      name: "Canvas API - Visualizations",
      description: "Real-time waveform display and frequency spectrum analysis",
      priority: "Medium",
      icon: <Sparkles className="h-4 w-4" />,
      howItWorks: "Creates dynamic visual representations of audio during playback and enhancement process"
    },
    {
      name: "IndexedDB - Local Storage",
      description: "Store original files as automatic backups and custom EQ presets",
      priority: "Medium",
      icon: <Save className="h-4 w-4" />,
      howItWorks: "Browser database stores backups and user settings locally - no data leaves your device"
    },
    {
      name: "Web Workers - Background Processing",
      description: "Prevent UI freezing during audio enhancement",
      priority: "High",
      icon: <Zap className="h-4 w-4" />,
      howItWorks: "Processes audio in background threads, keeping the interface responsive during enhancement"
    },
    {
      name: "RequestAnimationFrame - Smooth Animations",
      description: "Fluid EQ adjustments and visual effects",
      priority: "Low",
      icon: <Palette className="h-4 w-4" />,
      howItWorks: "Optimizes animations for 60fps performance, creating smooth transitions and effects"
    },
    {
      name: "Keyboard Shortcuts",
      description: "Quick access to common functions",
      priority: "Medium", 
      icon: <Keyboard className="h-4 w-4" />,
      howItWorks: "Ctrl+U (Upload), Ctrl+E (Enhance), Space (Play/Pause), Ctrl+S (Save Settings)"
    }
  ];
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Essential': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Perfect Audio - Complete Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* How to Use */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Upload className="h-5 w-5" />
                How to Use Perfect Audio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <h4 className="font-semibold mb-1">1. Upload</h4>
                  <p className="text-sm text-slate-300">Drag & drop up to 20 audio files (Max 100MB each)</p>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <h4 className="font-semibold mb-1">2. Enhance</h4>
                  <p className="text-sm text-slate-300">Configure settings and apply EQ presets</p>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <h4 className="font-semibold mb-1">3. Download</h4>
                  <p className="text-sm text-slate-300">Enhanced files auto-download individually</p>
                </div>
              </div>
              
              <Separator className="bg-slate-700" />
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-400">Key Features:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• <strong>One EQ for All:</strong> Single 10-band equalizer applies to all songs</li>
                  <li>• <strong>Custom Presets:</strong> Save and load your own EQ settings</li>
                  <li>• <strong>One-at-a-Time Processing:</strong> Prevents crashes, ensures quality</li>
                  <li>• <strong>Auto-Download:</strong> Enhanced files download automatically</li>
                  <li>• <strong>Smart Organization:</strong> Songs move between tabs as they're processed</li>
                  <li>• <strong>Error Recovery:</strong> Failed files show trash icon for easy removal</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Enhancement Controls */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Sliders className="h-5 w-5" />
                Enhancement Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <Volume2 className="h-8 w-8 mx-auto mb-2" style={{ color: '#10b981' }} />
                  <h4 className="font-semibold mb-1">Noise Reduction</h4>
                  <p className="text-sm text-slate-300">Removes background noise and hiss. Toggle shows neon green glow when active.</p>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <Zap className="h-8 w-8 mx-auto mb-2" style={{ color: '#f59e0b' }} />
                  <h4 className="font-semibold mb-1">Compression</h4>
                  <p className="text-sm text-slate-300">Balances volume levels. Toggle shows neon orange glow when active.</p>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <Headphones className="h-8 w-8 mx-auto mb-2" style={{ color: '#a855f7' }} />
                  <h4 className="font-semibold mb-1">Stereo Widening</h4>
                  <p className="text-sm text-slate-300">Expands stereo image. Toggle shows neon purple glow when active.</p>
                </div>
              </div>
              
              <div className="text-sm text-slate-400">
                <strong>Note:</strong> When toggles are OFF, corresponding sliders are grayed out and disabled.
              </div>
            </CardContent>
          </Card>

          {/* Backend-Free Features */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Sparkles className="h-5 w-5" />
                Backend-Free Technologies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <Card key={index} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {feature.icon}
                          <h4 className="font-semibold text-sm">{feature.name}</h4>
                        </div>
                        <Badge className={getPriorityColor(feature.priority)}>
                          {feature.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">{feature.description}</p>
                      <p className="text-xs text-slate-400">{feature.howItWorks}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-700/50 p-3 rounded text-center">
                  <kbd className="px-2 py-1 bg-slate-900 rounded font-mono text-xs">Ctrl+U</kbd>
                  <p className="mt-1 text-xs text-slate-400">Upload Files</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded text-center">
                  <kbd className="px-2 py-1 bg-slate-900 rounded font-mono text-xs">Ctrl+E</kbd>
                  <p className="mt-1 text-xs text-slate-400">Start Enhancement</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded text-center">
                  <kbd className="px-2 py-1 bg-slate-900 rounded font-mono text-xs">Space</kbd>
                  <p className="mt-1 text-xs text-slate-400">Play/Pause</p>
                </div>
                <div className="bg-slate-700/50 p-3 rounded text-center">
                  <kbd className="px-2 py-1 bg-slate-900 rounded font-mono text-xs">Ctrl+S</kbd>
                  <p className="mt-1 text-xs text-slate-400">Save Settings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Tips */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-yellow-400">Performance & Stability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>• <strong>File Limit:</strong> 20 files max, 100MB each for optimal performance</p>
              <p>• <strong>Processing:</strong> One file at a time prevents crashes and ensures quality</p>
              <p>• <strong>Audio Stops:</strong> Playback automatically stops when leaving tab or refreshing</p>
              <p>• <strong>Error Handling:</strong> Failed files show trash icon - remove and try again</p>
              <p>• <strong>Local Storage:</strong> All data stays on your device - no server required</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
