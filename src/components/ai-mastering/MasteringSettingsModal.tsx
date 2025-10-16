import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

interface MasteringSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasteringSettingsModal = ({ isOpen, onClose }: MasteringSettingsModalProps) => {
  const { language } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-cyan-500/30">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white">
              {language === 'ES' ? 'Configuración' : 'Settings'}
            </DialogTitle>
            <Button 
              onClick={onClose}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {language === 'ES' ? 'Cerrar' : 'Close'}
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-4 mt-6">
          {/* Row 1 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Umbral' : 'Threshold'}
            </Label>
            <Input 
              type="number" 
              defaultValue="0.988138"
              step="0.000001"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">Epsilon</Label>
            <Input 
              type="number" 
              defaultValue="0.000001"
              step="0.000001"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Duración Máxima de Pieza (segundos)' : 'Max Piece Length (seconds)'}
            </Label>
            <Input 
              type="number" 
              defaultValue="30.0"
              step="0.1"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">BPM</Label>
            <Input 
              type="number" 
              defaultValue="0.0"
              step="0.1"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Numerador de Compás' : 'Time Signature Numerator'}
            </Label>
            <Input 
              type="number" 
              defaultValue="4"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          {/* Row 2 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Denominador de Compás' : 'Time Signature Denominator'}
            </Label>
            <Input 
              type="number" 
              defaultValue="4"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Longitud de Pieza (compases)' : 'Piece Length (bars)'}
            </Label>
            <Input 
              type="number" 
              defaultValue="8.0"
              step="0.1"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Método de Remuestreo' : 'Resampling Method'}
            </Label>
            <Select defaultValue="fastsinc">
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="fastsinc">FastSinc</SelectItem>
                <SelectItem value="sinc">Sinc</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Compensación de Espectro' : 'Spectrum Compensation'}
            </Label>
            <Select defaultValue="gain">
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="gain">Frequency-Domain (Gain Envelope)</SelectItem>
                <SelectItem value="time">Time-Domain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Compensación de Volumen' : 'Loudness Compensation'}
            </Label>
            <Select defaultValue="lufs">
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="lufs">LUFS (Whole Signal)</SelectItem>
                <SelectItem value="rms">RMS</SelectItem>
                <SelectItem value="peak">Peak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 3 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Analizar Espectro Completo' : 'Analyze Full Spectrum'}
            </Label>
            <div className="flex items-center h-10 pl-2">
              <Checkbox defaultChecked className="border-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Ancho de Suavizado de Espectro' : 'Spectrum Smoothing Width'}
            </Label>
            <Input 
              type="number" 
              defaultValue="3"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Pasos de Suavizado' : 'Smoothing Steps'}
            </Label>
            <Input 
              type="number" 
              defaultValue="1"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Saltos de Corrección de Espectro' : 'Spectrum Correction Hops'}
            </Label>
            <Input 
              type="number" 
              defaultValue="2"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Pasos de Volumen' : 'Loudness Steps'}
            </Label>
            <Input 
              type="number" 
              defaultValue="10"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          {/* Row 4 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Bandas de Espectro' : 'Spectrum Bands'}
            </Label>
            <Input 
              type="number" 
              defaultValue="32"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Tamaño FFT' : 'FFT Size'}
            </Label>
            <Input 
              type="number" 
              defaultValue="4096"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Normalizar Referencia' : 'Normalize Reference'}
            </Label>
            <div className="flex items-center h-10 pl-2">
              <Checkbox defaultChecked className="border-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Normalizar' : 'Normalize'}
            </Label>
            <div className="flex items-center h-10 pl-2">
              <Checkbox defaultChecked className="border-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Método Limitador' : 'Limiter Method'}
            </Label>
            <Select defaultValue="truepeak">
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="truepeak">True Peak</SelectItem>
                <SelectItem value="sample">Sample Peak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 5 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Umbral del Limitador dB' : 'Limiter Threshold dB'}
            </Label>
            <Input 
              type="number" 
              defaultValue="-1.0"
              step="0.1"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Limitación de Corrección de Volumen' : 'Loudness Correction Limiting'}
            </Label>
            <div className="flex items-center h-10 pl-2">
              <Checkbox defaultChecked className="border-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Amplificar' : 'Amplify'}
            </Label>
            <div className="flex items-center h-10 pl-2">
              <Checkbox defaultChecked className="border-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Recorte' : 'Clipping'}
            </Label>
            <div className="flex items-center h-10 pl-2">
              <Checkbox defaultChecked className="border-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Bits de Salida' : 'Output Bits'}
            </Label>
            <Select defaultValue="32float">
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="32float">32 (IEEE float)</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="16">16</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 6 */}
          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Canales de Salida' : 'Output Channels'}
            </Label>
            <Select defaultValue="2">
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="1">1 (Mono)</SelectItem>
                <SelectItem value="2">2 (Stereo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">
              {language === 'ES' ? 'Método de Dithering' : 'Dithering Method'}
            </Label>
            <Select defaultValue="tpdf">
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="tpdf">TPDF</SelectItem>
                <SelectItem value="rpdf">RPDF</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
