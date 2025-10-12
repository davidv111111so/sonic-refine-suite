import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Upload, Settings, Sparkles, Sliders, Save, Zap, Volume2, Headphones, Keyboard, Archive, Palette, Download, Music, Cpu } from 'lucide-react';
export const Guide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const features = [{
    name: "JSZip - Batch ZIP Downloads",
    description: "Download multiple enhanced files as a single ZIP archive for easy sharing",
    priority: "High",
    icon: <Archive className="h-4 w-4" />,
    howItWorks: "Automatically packages all enhanced files into a compressed ZIP file. Click 'Download All as ZIP' in the Perfect Audio tab to bundle all enhanced songs into one download.",
    howToUse: "1. Enhance multiple songs 2. Go to Perfect Audio tab 3. Click 'Download All as ZIP' button 4. Save the ZIP file containing all enhanced audio"
  }, {
    name: "music-metadata - Metadata Preservation",
    description: "Automatically preserve original song information (title, artist, album, artwork)",
    priority: "High",
    icon: <Music className="h-4 w-4" />,
    howItWorks: "Uses music-metadata library to read ID3 tags, album art, and other metadata from original files, then transfers this information to enhanced versions maintaining your music library organization.",
    howToUse: "Metadata is preserved automatically during enhancement. No user action required - your song titles, artists, albums, and cover art will be maintained in enhanced files."
  }, {
    name: "Web Audio API - Core Processing",
    description: "Browser-native real-time audio enhancement and frequency analysis",
    priority: "Essential",
    icon: <Volume2 className="h-4 w-4" />,
    howItWorks: "Uses your browser's built-in Web Audio API for professional-grade audio processing. Applies EQ, compression, noise reduction, and stereo widening without needing external software.",
    howToUse: "Works automatically when you click 'Perfect Audio Enhancement'. The Web Audio API processes your files locally in the browser for studio-quality results."
  }, {
    name: "Web Workers - Background Processing",
    description: "Prevent UI freezing during audio enhancement with parallel processing",
    priority: "High",
    icon: <Cpu className="h-4 w-4" />,
    howItWorks: "Processes audio in background threads, keeping the interface responsive during enhancement. Prevents browser crashes and allows you to continue using the app while files are being enhanced.",
    howToUse: "Automatically activated during enhancement. You can continue browsing tabs, adjusting settings, or uploading more files while audio processing happens in the background."
  }, {
    name: "Canvas API - Real-time Visualizations",
    description: "Dynamic waveform display and frequency spectrum analysis during playback",
    priority: "Medium",
    icon: <Sparkles className="h-4 w-4" />,
    howItWorks: "Creates real-time visual representations of audio during playback and enhancement process using HTML5 Canvas. Shows frequency spectrum and waveforms that respond to the music.",
    howToUse: "Visual elements appear automatically in media players. Watch the frequency bars move with the beat and see waveforms during audio preview."
  }, {
    name: "IndexedDB - Local Storage & Auto-Backup",
    description: "Store original files as automatic backups and save custom EQ presets locally",
    priority: "Medium",
    icon: <Save className="h-4 w-4" />,
    howItWorks: "Browser database stores backups of original files and user settings locally. Creates automatic backups before enhancement and saves custom EQ presets between sessions.",
    howToUse: "Backups are automatic. Save custom EQ presets by clicking 'Save Preset' in the EQ section. Access saved presets from the dropdown menu anytime."
  }, {
    name: "RequestAnimationFrame - Smooth Animations",
    description: "Fluid EQ adjustments and visual effects optimized for 60fps performance",
    priority: "Low",
    icon: <Palette className="h-4 w-4" />,
    howItWorks: "Optimizes all animations for 60fps performance using requestAnimationFrame. Creates smooth transitions for EQ sliders, neon effects, and visual feedback.",
    howToUse: "Animations work automatically. Experience smooth EQ adjustments, glowing effects on toggles, and fluid transitions throughout the interface."
  }, {
    name: "Keyboard Shortcuts - Quick Actions",
    description: "Keyboard shortcuts for common functions and faster workflow",
    priority: "Medium",
    icon: <Keyboard className="h-4 w-4" />,
    howItWorks: "Global keyboard event handling for common actions. Shortcuts work from any tab and provide quick access to frequently used features.",
    howToUse: "Ctrl+U (Upload files), Ctrl+E (Start enhancement), Space (Play/Pause audio), Ctrl+S (Save current EQ settings), Ctrl+R (Reset EQ to flat response)"
  }];
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Essential':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-600 dark:border-slate-600 light:border-gray-300 text-slate-950 bg-green-400 hover:bg-green-300">
          <HelpCircle className="h-4 w-4 mr-2" />
          Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-200 light:text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Spectrum - Complete User Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Quick Start Guide */}
          <Card className="bg-slate-800 border-slate-700 dark:bg-slate-800 dark:border-slate-700 light:bg-gray-50 light:border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400 dark:text-blue-400 light:text-blue-600">
                <Upload className="h-5 w-5" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-slate-700/50 dark:bg-slate-700/50 light:bg-white rounded-lg border border-slate-600 dark:border-slate-600 light:border-gray-200">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <h4 className="font-bold text-lg mb-2">1. Upload Audio Files</h4>
                  <p className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600 mb-4">Drag & drop up to 20 audio files (Max 100MB each)</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">Supports: MP3, WAV only (v2.0)</p>
                </div>
                <div className="text-center p-6 bg-slate-700/50 dark:bg-slate-700/50 light:bg-white rounded-lg border border-slate-600 dark:border-slate-600 light:border-gray-200">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <h4 className="font-bold text-lg mb-2">2. Configure & Enhance</h4>
                   <p className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600 mb-4">Save and load presets, adjust 5-band EQ, and enhance audio</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">Real-time preview with mini players</p>
                </div>
                <div className="text-center p-6 bg-slate-700/50 dark:bg-slate-700/50 light:bg-white rounded-lg border border-slate-600 dark:border-slate-600 light:border-gray-200">
                  <Download className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                  <h4 className="font-bold text-lg mb-2">3. Download Results</h4>
                  <p className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600 mb-4">Enhanced files auto-download individually</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">Batch download as ZIP available</p>
                </div>
              </div>
              
              <Separator className="bg-slate-700 dark:bg-slate-700 light:bg-gray-200" />
              
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-blue-400 dark:text-blue-400 light:text-blue-600">Key Features & Workflow:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <ul className="space-y-2 text-slate-300 dark:text-slate-300 light:text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <strong>Universal EQ:</strong> Single 5-band equalizer applies to all songs
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <strong>Custom Presets:</strong> Save and load presets for your own EQ settings
                    </li>
                     <li className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                       <strong>Stable Processing:</strong> One-at-a-time</li>
                  </ul>
                  <ul className="space-y-2 text-slate-300 dark:text-slate-300 light:text-gray-600">
                     <li className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                       <strong>Auto-Upload:</strong> All selected files will upload automatically</li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <strong>Smart Flow:</strong> Songs move between tabs as processed
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      <strong>Error Recovery:</strong> Failed files show trash icon for removal
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backend-Free Technologies */}
          <Card className="bg-slate-800 border-slate-700 dark:bg-slate-800 dark:border-slate-700 light:bg-gray-50 light:border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400 dark:text-purple-400 light:text-purple-600">
                <Sparkles className="h-5 w-5" />
                Backend-Free Technologies & How to Use Them
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {features.map((feature, index) => <Card key={index} className="bg-slate-700/50 border-slate-600 dark:bg-slate-700/50 dark:border-slate-600 light:bg-white light:border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {feature.icon}
                          <h4 className="font-bold text-lg">{feature.name}</h4>
                        </div>
                        <Badge className={getPriorityColor(feature.priority)}>
                          {feature.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 dark:text-slate-300 light:text-gray-600 mb-4">{feature.description}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-semibold text-blue-400 dark:text-blue-400 light:text-blue-600 text-sm mb-2">How It Works:</h5>
                          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">{feature.howItWorks}</p>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-green-400 dark:text-green-400 light:text-green-600 text-sm mb-2">How to Use:</h5>
                          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">{feature.howToUse}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card className="bg-slate-800 border-slate-700 dark:bg-slate-800 dark:border-slate-700 light:bg-gray-50 light:border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400 dark:text-cyan-400 light:text-cyan-600">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts for Power Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="bg-slate-700/50 dark:bg-slate-700/50 light:bg-white p-4 rounded text-center border border-slate-600 dark:border-slate-600 light:border-gray-200">
                  <kbd className="px-3 py-2 bg-slate-900 dark:bg-slate-900 light:bg-gray-800 light:text-white rounded font-mono text-sm block mb-2">Ctrl+U</kbd>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">Upload Files</p>
                </div>
                <div className="bg-slate-700/50 dark:bg-slate-700/50 light:bg-white p-4 rounded text-center border border-slate-600 dark:border-slate-600 light:border-gray-200">
                  <kbd className="px-3 py-2 bg-slate-900 dark:bg-slate-900 light:bg-gray-800 light:text-white rounded font-mono text-sm block mb-2">Ctrl+E</kbd>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">Start Enhancement</p>
                </div>
                <div className="bg-slate-700/50 dark:bg-slate-700/50 light:bg-white p-4 rounded text-center border border-slate-600 dark:border-slate-600 light:border-gray-200">
                  <kbd className="px-3 py-2 bg-slate-900 dark:bg-slate-900 light:bg-gray-800 light:text-white rounded font-mono text-sm block mb-2">Space</kbd>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">Play/Pause</p>
                </div>
                <div className="bg-slate-700/50 dark:bg-slate-700/50 light:bg-white p-4 rounded text-center border border-slate-600 dark:border-slate-600 light:border-gray-200">
                  <kbd className="px-3 py-2 bg-slate-900 dark:bg-slate-900 light:bg-gray-800 light:text-white rounded font-mono text-sm block mb-2">Ctrl+S</kbd>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">Save EQ Settings</p>
                </div>
                <div className="bg-slate-700/50 dark:bg-slate-700/50 light:bg-white p-4 rounded text-center border border-slate-600 dark:border-slate-600 light:border-gray-200">
                  <kbd className="px-3 py-2 bg-slate-900 dark:bg-slate-900 light:bg-gray-800 light:text-white rounded font-mono text-sm block mb-2">Ctrl+R</kbd>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">Reset EQ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance & Troubleshooting */}
          <Card className="bg-slate-800 border-slate-700 dark:bg-slate-800 dark:border-slate-700 light:bg-gray-50 light:border-gray-200">
            <CardHeader>
              <CardTitle className="text-yellow-400 dark:text-yellow-400 light:text-yellow-600">Performance Tips & Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-bold text-green-400 dark:text-green-400 light:text-green-600 mb-3">Optimal Performance:</h5>
                  <ul className="space-y-2 text-slate-300 dark:text-slate-300 light:text-gray-600">
                    <li>• <strong>File Limits:</strong> Max 20 files, 100MB each (free account)</li>
                    <li>• <strong>Processing:</strong> One file at a time prevents crashes</li>
                    <li>• <strong>Browser:</strong> Use Chrome/Edge for best Web Audio API support</li>
                    <li>• <strong>Memory:</strong> Close other tabs during large file processing</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-red-400 dark:text-red-400 light:text-red-600 mb-3">Troubleshooting:</h5>
                  <ul className="space-y-2 text-slate-300 dark:text-slate-300 light:text-gray-600">
                    <li>• <strong>Audio Stops:</strong> Automatic when leaving tab or refreshing</li>
                    <li>• <strong>Failed Files:</strong> Show trash icon - remove and retry</li>
                    <li>• <strong>Slow Processing:</strong> Reduce file size or use lower sample rate</li>
                    <li>• <strong>No Download:</strong> Check browser download permissions</li>
                  </ul>
                </div>
              </div>
              
              <Separator className="bg-slate-700 dark:bg-slate-700 light:bg-gray-200" />
              
              <div className="bg-blue-900/30 dark:bg-blue-900/30 light:bg-blue-50 p-4 rounded border border-blue-600/50 dark:border-blue-600/50 light:border-blue-200">
                <h5 className="font-bold text-blue-400 dark:text-blue-400 light:text-blue-600 mb-2">Privacy & Security:</h5>
                <p className="text-slate-300 dark:text-slate-300 light:text-gray-600 text-sm">All processing happens locally in your browser. Files never leave your device. No servers, no cloud processing, no data collection. Your audio files remain 100% private.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>;
};