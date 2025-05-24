
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AudioWaveform } from '@/components/AudioWaveform';
import { SpectrumAnalyzer } from '@/components/SpectrumAnalyzer';
import { AudioFile } from '@/pages/Index';
import { Play, Pause, SwitchCamera, PanelLeftClose, PanelRightClose } from 'lucide-react';

interface AudioComparisonProps {
  file: AudioFile;
}

export const AudioComparison = ({ file }: AudioComparisonProps) => {
  const [isPlaying, setIsPlaying] = useState<'original' | 'enhanced' | null>(null);
  const [showSpectrum, setShowSpectrum] = useState(false);

  const togglePlay = (type: 'original' | 'enhanced') => {
    if (isPlaying === type) {
      setIsPlaying(null);
    } else {
      setIsPlaying(type);
    }
  };

  const switchPlaying = () => {
    if (isPlaying === 'original') {
      setIsPlaying('enhanced');
    } else if (isPlaying === 'enhanced') {
      setIsPlaying('original');
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">A/B Comparison</h3>
        
        <div className="flex justify-end mb-4">
          <Button
            variant="outline" 
            size="sm" 
            onClick={() => setShowSpectrum(!showSpectrum)}
            className="bg-slate-700 border-slate-600 text-white"
          >
            {showSpectrum ? "Show Waveform" : "Show Spectrum"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Audio */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-300">Original</h4>
            
            {showSpectrum ? (
              <SpectrumAnalyzer 
                audioUrl={file.originalUrl} 
                playing={isPlaying === 'original'}
                height={80}
              />
            ) : (
              <AudioWaveform 
                audioUrl={file.originalUrl || ''} 
                color="#6366f1"
                playing={isPlaying === 'original'}
              />
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => togglePlay('original')}
                className="bg-slate-700 border-slate-600 text-white"
              >
                {isPlaying === 'original' ? (
                  <><Pause className="h-4 w-4 mr-2" /> Pause</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" /> Play</>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400"
                disabled={!file.enhancedUrl}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Audio */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-300">Enhanced</h4>
            
            {showSpectrum ? (
              <SpectrumAnalyzer 
                audioUrl={file.enhancedUrl || file.originalUrl} 
                playing={isPlaying === 'enhanced'}
                height={80}
              />
            ) : (
              <AudioWaveform 
                audioUrl={file.enhancedUrl || file.originalUrl || ''} 
                color="#3b82f6"
                playing={isPlaying === 'enhanced'}
              />
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => togglePlay('enhanced')}
                disabled={!file.enhancedUrl}
                className="bg-slate-700 border-slate-600 text-white"
              >
                {isPlaying === 'enhanced' ? (
                  <><Pause className="h-4 w-4 mr-2" /> Pause</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" /> Play</>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400"
                disabled={!file.enhancedUrl}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Switch Button */}
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={switchPlaying}
            disabled={!file.enhancedUrl || isPlaying === null}
            className="bg-slate-700 border-slate-600 text-white"
          >
            <SwitchCamera className="h-4 w-4 mr-2" />
            Switch Playing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
