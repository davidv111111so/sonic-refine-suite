import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music2, Upload, Play, Pause, Settings2, HelpCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MasteringSettingsModal } from './MasteringSettingsModal';
const GENRE_PRESETS = [{
  name: 'Flat',
  icon: '⚡',
  gradient: 'from-slate-500 to-gray-600'
}, {
  name: 'Bass Boost',
  icon: '🔊',
  gradient: 'from-red-500 to-orange-600'
}, {
  name: 'Treble Boost',
  icon: '🎶',
  gradient: 'from-cyan-500 to-blue-600'
}, {
  name: 'Jazz',
  icon: '🎷',
  gradient: 'from-amber-500 to-yellow-600'
}, {
  name: 'Classical',
  icon: '🎻',
  gradient: 'from-purple-500 to-pink-600'
}, {
  name: 'Electronic',
  icon: '🎹',
  gradient: 'from-cyan-500 to-teal-600'
}, {
  name: 'V-Shape',
  icon: '📐',
  gradient: 'from-indigo-500 to-purple-600'
}, {
  name: 'Vocal',
  icon: '🎙️',
  gradient: 'from-fuchsia-500 to-purple-600'
}, {
  name: 'Rock',
  icon: '🎸',
  gradient: 'from-orange-500 to-red-600'
}, {
  name: 'Hip-Hop',
  icon: '🎤',
  gradient: 'from-green-500 to-emerald-600'
}, {
  name: 'Podcast',
  icon: '📻',
  gradient: 'from-pink-500 to-rose-600'
}, {
  name: 'Live',
  icon: '🎵',
  gradient: 'from-lime-500 to-green-600'
}];
export const PremiumMasteringUI = () => {
  const {
    t,
    language
  } = useLanguage();
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
  const handleProcess = () => {
    console.log('Processing with preset:', selectedPreset);
  };
  return <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-900/60 via-fuchsia-900/50 to-blue-900/60 border-2 border-purple-400/60 shadow-2xl shadow-purple-500/30">
        <CardContent className="pt-6 pb-4 bg-blue-900">
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse shadow-lg shadow-yellow-500/50">
              <Music2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
              AI Mastering Studio
            </h2>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg shadow-pink-500/50">
              <Music2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-blue-900/60 via-cyan-900/50 to-purple-900/60 border-2 border-cyan-400/60 shadow-xl">
        <CardContent className="pt-6 pb-4 bg-blue-900">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
                🔒 Local Processing - Your Privacy Matters
              </h3>
              <p className="text-base text-slate-200 leading-relaxed">
                {language === 'ES' ? 'Los datos de tu audio nunca se suben a ningún servidor, todo el procesamiento ocurre localmente en tu navegador. Esto garantiza que tu audio permanezca seguro y en tu computadora.' : 'Your audio data is never uploaded to any server, all processing happens locally in your browser. This ensures your audio remains secure and stays on your computer.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Target File Upload */}
        <Card className="bg-gradient-to-br from-slate-900/95 to-cyan-900/40 border-2 border-dashed border-cyan-500/60 hover:border-cyan-400 transition-all shadow-xl shadow-cyan-500/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-slate-50">
              {language === 'ES' ? '🎯 Archivo Objetivo' : '🎯 Target File'}
            </h3>
            
            <div className="text-center mb-4">
              <p className="text-slate-400 text-sm mb-2">
                {language === 'ES' ? 'Archivo Objetivo:' : 'Target File:'} {targetFile?.name || language === 'ES' ? 'Ningún archivo elegido' : 'No file chosen'}
              </p>
              <Button onClick={() => targetInputRef.current?.click()} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-cyan-500/50 hover:scale-105 transition-all">
                <Upload className="h-5 w-5 mr-2" />
                {language === 'ES' ? 'Elegir Archivo Objetivo' : 'Choose Target File'}
              </Button>
              <input ref={targetInputRef} type="file" accept=".wav" onChange={handleTargetFileChange} className="hidden" />
            </div>

            {/* Target Player */}
            {targetFile && <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={() => setIsPlayingTarget(!isPlayingTarget)} className="bg-slate-700 hover:bg-slate-600 rounded-lg text-indigo-950">
                    {isPlayingTarget ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-0"></div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">0:00 / 0:00</span>
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* Reference File Upload */}
        <Card className="bg-gradient-to-br from-slate-900/95 to-purple-900/40 border-2 border-dashed border-purple-500/60 hover:border-purple-400 transition-all shadow-xl shadow-purple-500/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-slate-50">
              {language === 'ES' ? '🎧 Archivo de Referencia' : '🎧 Reference File'}
            </h3>
            
            <div className="text-center mb-4">
              <p className="text-slate-400 text-sm mb-2">
                {language === 'ES' ? 'Archivo de Referencia:' : 'Reference File:'} {referenceFile?.name || language === 'ES' ? 'Ningún archivo elegido' : 'No file chosen'}
              </p>
              <Button onClick={() => referenceInputRef.current?.click()} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-500/50 hover:scale-105 transition-all">
                <Upload className="h-5 w-5 mr-2" />
                {language === 'ES' ? 'Elegir Archivo de Referencia' : 'Choose Reference File'}
              </Button>
              <input ref={referenceInputRef} type="file" accept=".wav" onChange={handleReferenceFileChange} className="hidden" />
            </div>

            {/* Reference Player */}
            {referenceFile && <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={() => setIsPlayingReference(!isPlayingReference)} className="bg-slate-700 hover:bg-slate-600 text-indigo-950">
                    {isPlayingReference ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-0"></div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">0:00 / 0:00</span>
                </div>
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Genre Presets */}
      <Card className="bg-gradient-to-br from-purple-900/60 to-pink-900/50 border-2 border-purple-400/60 shadow-2xl shadow-purple-500/30">
        <CardContent className="p-6">
          <h3 className="text-2xl font-black text-center mb-4 bg-gradient-to-r from-purple-200 via-pink-200 to-orange-200 bg-clip-text text-transparent">
            ✨ Genre Presets ✨
          </h3>
          <div className="grid grid-cols-6 gap-4">
            {GENRE_PRESETS.map(preset => {
            const isSelected = selectedPreset === preset.name;
            return <Button key={preset.name} onClick={() => setSelectedPreset(preset.name)} className={`
                    relative h-24 flex flex-col items-center justify-center gap-2
                    bg-gradient-to-br ${preset.gradient}
                    hover:scale-110 active:scale-95
                    border-2 transition-all duration-300
                    group overflow-hidden
                    ${isSelected ? 'border-white shadow-2xl shadow-white/50 animate-pulse scale-105' : 'border-white/30 hover:border-white/60 shadow-lg hover:shadow-2xl'}
                  `}>
                  {/* Animated background glow */}
                  <div className={`
                    absolute inset-0 bg-white/20 rounded-md opacity-0 
                    group-hover:opacity-100 transition-opacity blur-xl -z-10
                    ${isSelected ? 'opacity-50 animate-pulse' : ''}
                  `} />
                  
                  {/* Icon with scale animation */}
                  <span className="text-4xl group-hover:scale-125 transition-transform drop-shadow-2xl">
                    {preset.icon}
                  </span>
                  
                  {/* Text with bold styling */}
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {preset.name}
                  </span>
                  
                  {/* Selected indicator */}
                  {isSelected && <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                      <div className="w-3 h-3 bg-white rounded-full absolute top-0" />
                    </div>}
                </Button>;
          })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="bg-gradient-to-br from-slate-900/95 to-blue-900/50 border-2 border-blue-500/40 shadow-xl">
        <CardContent className="pt-6 pb-4">
          <div className="flex gap-4 justify-center">
            <Button onClick={handleProcess} disabled={!targetFile} className="
                bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 
                hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 
                text-white px-12 py-6 text-lg font-black
                shadow-2xl hover:shadow-purple-500/50
                hover:scale-105 active:scale-95
                transition-all duration-300
                animate-pulse hover:animate-none
                border-2 border-white/30
              " size="lg">
              <Music2 className="h-6 w-6 mr-2" />
              {language === 'ES' ? 'Procesar Audio' : 'Process Audio'}
            </Button>
            <Button onClick={() => setIsSettingsOpen(true)} className="
                bg-gradient-to-r from-blue-600 to-cyan-600
                hover:from-blue-700 hover:to-cyan-700
                text-white px-8 py-6 text-lg font-bold
                border-2 border-blue-400/50
                shadow-xl hover:shadow-blue-500/50
                hover:scale-105 transition-all duration-300
              " size="lg">
              <Settings2 className="h-5 w-5 mr-2" />
              {language === 'ES' ? 'Configuración' : 'Settings'}
            </Button>
            <Button className="
                bg-gradient-to-r from-green-600 to-emerald-600
                hover:from-green-700 hover:to-emerald-700
                text-white px-8 py-6 text-lg font-bold
                border-2 border-green-400/50
                shadow-xl hover:shadow-green-500/50
                hover:scale-105 transition-all duration-300
              " size="lg">
              <HelpCircle className="h-5 w-5 mr-2" />
              {language === 'ES' ? 'Registro' : 'Log'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 space-y-1">
        <p>
          {language === 'ES' ? 'Los usuarios conservan todos los derechos sobre su contenido de audio. Perfect Audio no reclama la propiedad de los archivos cargados o procesados.' : 'Users retain all rights to their audio content. Perfect Audio does not claim ownership of uploaded or processed files.'}
        </p>
      </div>

      {/* Settings Modal */}
      <MasteringSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>;
};