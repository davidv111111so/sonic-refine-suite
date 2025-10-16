import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, Upload, Play, Pause, Settings2, HelpCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const GENRE_PRESETS = [
  { name: 'Flat', icon: Music2 },
  { name: 'Bass Boost', icon: Music2 },
  { name: 'Treble Boost', icon: Music2 },
  { name: 'Jazz', icon: Music2 },
  { name: 'Classical', icon: Music2 },
  { name: 'Electronic', icon: Music2 },
  { name: 'V-Shape', icon: Music2 },
  { name: 'Vocal', icon: Music2 },
  { name: 'Rock', icon: Music2 },
  { name: 'Hip-Hop', icon: Music2 },
  { name: 'Podcast', icon: Music2 },
  { name: 'Live', icon: Music2 },
];

export const PremiumMasteringUI = () => {
  const { t, language } = useLanguage();
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  const targetInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const handleTargetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTargetFile(e.target.files[0]);
    }
  };

  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReferenceFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 justify-center">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <p className="text-cyan-400 text-sm text-center">
            {language === 'ES' 
              ? 'Los datos de tu audio nunca se suben a ningún servidor, todo el procesamiento ocurre localmente en tu navegador. Esto garantiza que tu audio permanezca seguro y en tu computadora. La tasa de muestreo de procesamiento óptima es 48 kHz.'
              : 'Your audio data is never uploaded to any server, all processing happens locally in your browser. This ensures your audio remains secure and stays on your computer. The optimal processing sample rate is 48 kHz.'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Target File Upload */}
        <Card className="bg-slate-900/90 border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 transition-colors">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              {language === 'ES' ? 'Arrastra y suelta tu archivo WAV objetivo aquí, o usa el selector de archivos abajo.' : 'Drag and drop your WAV target file here, or use the file chooser below.'}
            </h3>
            
            <div className="text-center mb-4">
              <p className="text-slate-400 text-sm mb-2">
                {language === 'ES' ? 'Archivo Objetivo:' : 'Target File:'} {targetFile?.name || language === 'ES' ? 'Ningún archivo elegido' : 'No file chosen'}
              </p>
              <Button
                onClick={() => targetInputRef.current?.click()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {language === 'ES' ? 'Elegir Archivo Objetivo' : 'Choose Target File'}
              </Button>
              <input
                ref={targetInputRef}
                type="file"
                accept=".wav"
                onChange={handleTargetFileChange}
                className="hidden"
              />
            </div>

            {/* Target Player */}
            {targetFile && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => setIsPlayingTarget(!isPlayingTarget)}
                    className="bg-slate-700 hover:bg-slate-600"
                  >
                    {isPlayingTarget ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-0"></div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">0:00 / 0:00</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reference File Upload */}
        <Card className="bg-slate-900/90 border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 transition-colors">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              {language === 'ES' ? 'Arrastra y suelta tu archivo WAV de referencia aquí, o usa el selector de archivos abajo.' : 'Drag and drop your WAV reference file here, or use the file chooser below.'}
            </h3>
            
            <div className="text-center mb-4">
              <p className="text-slate-400 text-sm mb-2">
                {language === 'ES' ? 'Archivo de Referencia:' : 'Reference File:'} {referenceFile?.name || language === 'ES' ? 'Ningún archivo elegido' : 'No file chosen'}
              </p>
              <Button
                onClick={() => referenceInputRef.current?.click()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {language === 'ES' ? 'Elegir Archivo de Referencia' : 'Choose Reference File'}
              </Button>
              <input
                ref={referenceInputRef}
                type="file"
                accept=".wav"
                onChange={handleReferenceFileChange}
                className="hidden"
              />
            </div>

            {/* Reference Player */}
            {referenceFile && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => setIsPlayingReference(!isPlayingReference)}
                    className="bg-slate-700 hover:bg-slate-600"
                  >
                    {isPlayingReference ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-0"></div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">0:00 / 0:00</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Genre Presets */}
      <Card className="bg-slate-900/90 border-slate-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-6 gap-3">
            {GENRE_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                onClick={() => setSelectedPreset(preset.name)}
                className={`h-20 flex flex-col items-center justify-center gap-2 transition-all ${
                  selectedPreset === preset.name
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <preset.icon className="h-6 w-6" />
                <span className="text-xs">{preset.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          disabled={!targetFile || !referenceFile}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-cyan-500/50"
        >
          {language === 'ES' ? 'Procesar Audio' : 'Process Audio'}
        </Button>
        <Button variant="outline" className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white px-6">
          <Settings2 className="h-5 w-5 mr-2" />
          {language === 'ES' ? 'Configuración' : 'Settings'}
        </Button>
        <Button variant="outline" className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white px-6">
          <HelpCircle className="h-5 w-5 mr-2" />
          {language === 'ES' ? 'Registro' : 'Log'}
        </Button>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 space-y-1">
        <p>
          {language === 'ES' 
            ? 'Los usuarios conservan todos los derechos sobre su contenido de audio. Perfect Audio no reclama la propiedad de los archivos cargados o procesados.'
            : 'Users retain all rights to their audio content. Perfect Audio does not claim ownership of uploaded or processed files.'}
        </p>
      </div>
    </div>
  );
};
