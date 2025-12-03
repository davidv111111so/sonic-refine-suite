import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'EN' | 'ES';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Comprehensive Translation Dictionary for Full i18n Support
const translations = {
  EN: {
    // Header & Navigation
    'header.title': 'Level Audio Processor',
    'header.upload': 'Upload',
    'header.enhance': 'Enhance',
    'header.settings': 'Settings',

    // EQ Presets
    'eq.preset.flat': 'Flat',
    'eq.preset.bassBoost': 'Bass Boost',
    'eq.preset.vocalEnhance': 'Vocal Enhance',
    'eq.preset.bright': 'Bright',
    'eq.preset.warm': 'Warm',
    'eq.preset.club': 'Club',
    'eq.preset.rock': 'Rock',
    'eq.preset.jazz': 'Jazz',

    // Upload Section
    'upload.title': 'Upload Audio Files',
    'upload.dragDrop': 'Drag & drop your audio files here',
    'upload.clickSelect': 'or click to select files',
    'upload.supportedFormats': 'MP3, WAV, FLAC, OGG, M4A, AAC',
    'upload.limits': 'Max 20 files • 100MB each',

    // Track List
    'tracks.title': 'Track List',
    'tracks.noTracks': 'No tracks uploaded yet',
    'tracks.uploadToStart': 'Upload audio files to get started',
    'tracks.songName': 'Song Name',
    'tracks.fileSize': 'File Size',
    'tracks.status': 'Status',
    'tracks.conversion': 'Conversion',
    'tracks.fileInfo': 'File Info',
    'tracks.download': 'Download',
    'tracks.totalFiles': 'Total Files',
    'tracks.inQueue': 'In Queue',
    'tracks.processing': 'Processing',
    'tracks.completed': 'Completed',

    // Buttons & Actions
    'button.spectrum': 'Spectrum',
    'button.enhance': 'Enhance',
    'button.enhanceAll': 'Enhance All Files',
    'button.downloadAll': 'Download All',
    'button.clear': 'Clear',
    'button.clearDownloaded': 'Clear Downloaded',
    'button.download': 'Download',
    'button.info': 'Info',
    'button.reset': 'Reset',
    'button.save': 'Save',
    'button.load': 'Load',
    'button.cancel': 'Cancel',
    'button.ok': 'OK',

    // Status Messages
    'status.loading': 'Loading',
    'status.ready': 'Ready',
    'status.processing': 'Processing',
    'status.error': 'Error',
    'status.enhanced': 'Enhanced',
    'status.queue': 'Queue',

    // Enhancement Settings
    'enhance.title': 'Advanced Audio Enhancement',
    'enhance.format': 'Format',
    'enhance.quality': 'Quality',
    'enhance.outputSize': 'Output Size',
    'enhance.outputSettings': 'Output Settings',
    'enhance.processingOptions': 'Processing Options',
    'enhance.equalizer': 'Equalizer & Presets',

    // Audio Settings
    'settings.outputFormat': 'Output Format',
    'settings.sampleRate': 'Sample Rate',
    'settings.bitDepth': 'Bit Depth',
    'settings.bitrate': 'Bitrate',
    'settings.noiseReduction': 'Noise Reduction',
    'settings.normalization': 'Audio Normalization',
    'settings.compression': 'Dynamic Compression',
    'settings.stereoWidening': 'Stereo Widening',
    'settings.bassBoost': 'Bass Boost',
    'settings.trebleEnhancement': 'Treble Enhancement',
    'settings.gainAdjustment': 'Gain Adjustment',

    // Equalizer
    'eq.title': '10-Band Equalizer',
    'eq.enable': 'Enable Equalizer',
    'eq.presets': 'EQ Presets',
    'eq.enableEqualizer': 'Enable Equalizer',
    'eq.tenBandEqualizer': '10-Band Equalizer',
    'eq.eqPresets': 'EQ Presets',
    'eq.reset': 'Reset',

    // Conversion
    'conversion.source': 'Source',
    'conversion.output': 'Output',
    'conversion.size': 'Size',
    'conversion.noConversion': 'No conversion',

    // Dialogs & Modals
    'dialog.downloadAll.title': 'Download Multiple Files',
    'dialog.downloadAll.message': 'Do you want to download {count} files?',
    'dialog.downloadAll.confirm': 'Yes, download all',

    // Toast Messages
    'toast.noFiles': 'No files to process',
    'toast.uploadFirst': 'Please upload some audio files first',
    'toast.enhancementComplete': 'Enhancement Complete!',
    'toast.enhancementFailed': 'Enhancement failed',
    'toast.downloadComplete': 'Download Complete',
    'toast.downloadFailed': 'Download Failed',
    'toast.filesCleared': 'Files cleared',

    // Stats
    'stats.total': 'Total Files',
    'stats.uploaded': 'Queue',
    'stats.processing': 'Processing',
    'stats.enhanced': 'Completed',

    // AI Mastering
    'aiMastering.title': 'AI Audio Mastering',
    'aiMastering.description': 'Professional-grade mastering powered by AI technology',
    'aiMastering.premiumFeature': 'Premium Feature',
    'aiMastering.unlockMessage': 'Unlock AI-powered mastering to take your tracks to the next level',
    'aiMastering.feature1': 'AI-powered audio analysis and enhancement',
    'aiMastering.feature2': 'Match your reference tracks perfectly',
    'aiMastering.feature3': 'Professional genre-specific presets',
    'aiMastering.upgradeToPremium': 'Upgrade to Premium',
    'aiMastering.admin': 'ADMIN',
    'aiMastering.premium': 'PREMIUM',
    'aiMastering.customReference': 'Custom Reference',
    'aiMastering.genrePresets': 'Genre Presets',
    'aiMastering.targetTrack': 'Target Track',
    'aiMastering.referenceTrack': 'Reference Track',
    'aiMastering.selectGenre': 'Select Genre',
    'aiMastering.selectPreset': 'Select Preset',
    'aiMastering.masterTrack': 'Master My Track',
    'aiMastering.processing': 'Processing',
    'aiMastering.processingMessage': 'This may take a few minutes depending on file size',
    'aiMastering.infoBanner': 'Your audio data is never uploaded to any server, all processing happens locally in your browser. This ensures your audio remains secure and stays on your computer. The optimal processing sample rate is 48 kHz.',
    'aiMastering.settings': 'Settings',
    'aiMastering.threshold': 'Threshold',
    'aiMastering.epsilon': 'Epsilon',
    'aiMastering.maxPieceLength': 'Max Piece Length (seconds)',
    'aiMastering.bpm': 'BPM',
    'aiMastering.timeSignatureNumerator': 'Time Signature Numerator',
    'aiMastering.timeSignatureDenominator': 'Time Signature Denominator',
    'aiMastering.pieceLengthBars': 'Piece Length (bars)',
    'aiMastering.resamplingMethod': 'Resampling Method',
    'aiMastering.spectrumCompensation': 'Spectrum Compensation',
    'aiMastering.loudnessCompensation': 'Loudness Compensation',
    'aiMastering.analyzeFullSpectrum': 'Analyze Full Spectrum',
    'aiMastering.spectrumSmoothingWidth': 'Spectrum Smoothing Width',
    'aiMastering.smoothingSteps': 'Smoothing Steps',
    'aiMastering.spectrumCorrectionHops': 'Spectrum Correction Hops',
    'aiMastering.loudnessSteps': 'Loudness Steps',
    'aiMastering.spectrumBands': 'Spectrum Bands',
    'aiMastering.fftSize': 'FFT Size',
    'aiMastering.normalizeReference': 'Normalize Reference',
    'aiMastering.normalize': 'Normalize',
    'aiMastering.limiterMethod': 'Limiter Method',
    'aiMastering.limiterThreshold': 'Limiter Threshold dB',
    'aiMastering.loudnessCorrectionLimiting': 'Loudness Correction Limiting',
    'aiMastering.amplify': 'Amplify',
    'aiMastering.clipping': 'Clipping',
    'aiMastering.outputBits': 'Output Bits',
    'aiMastering.outputChannels': 'Output Channels',
    'aiMastering.ditheringMethod': 'Dithering Method',
    'aiMastering.success': 'Mastering Complete!',
    'aiMastering.successMessage': 'Your track has been mastered successfully',
    'aiMastering.error': 'Mastering Failed',
    'aiMastering.errorMessage': 'Failed to process your track. Please try again.',
    'aiMastering.complete': 'Mastering Complete!',
    'aiMastering.dragOrClick': 'Drag & drop or click to select',
    'aiMastering.dropFile': 'Drop your file here',

    // Processing Options - Phase 1 & 2
    'processing.options': 'Processing Options',
    'processing.batchMode': 'Batch Mode',
    'processing.individualMode': 'Individual Mode',
    'processing.compressionRatio': 'Compression Ratio',
    'processing.threshold': 'Threshold',
    'processing.thresholdInfo': 'Controls when compression is applied to the signal',
    'processing.normalizationInfo': 'Limited to 0dB to -3dB for optimal stability in live/broadcast scenarios',
    'processing.width': 'Width',
    'processing.stereoWideningInfo': 'Subtle stereo enhancement. Values >70% may cause phase issues.',
    'processing.antiPhaseWarning': '⚠️ Anti-phase territory! Risk of phase cancellation.',
    'processing.premiumRequired': 'Premium subscription required for this feature',

    // EQ Presets - Phase 3
    'eq.professionalPresets': 'Professional EQ Presets',
    'eq.autoGainCompensation': 'Auto Gain Compensation',
    'eq.gainComp': 'Gain Comp',
    'eq.compensationExplanation': 'All presets include automatic gain compensation for objective A/B comparison at equal perceived loudness',

    // Real-time Audio Player
    'player.realtimePreview': 'Real-time Audio Preview',
    'player.noAudioLoaded': 'No audio file loaded',
    'player.realtimeProcessing': '⚡ Real-time processing active - hear changes instantly',

    // EQ Band Names (5-Band with specific frequencies)
    'eq.band1': 'Low / Sub',
    'eq.band1Freq': '50 Hz',
    'eq.band1Range': '20-85 Hz',
    'eq.band2': 'Mid Low / Punch',
    'eq.band2Freq': '145 Hz',
    'eq.band2Range': '85-356 Hz',
    'eq.band3': 'Mid',
    'eq.band3Freq': '874 Hz',
    'eq.band3Range': '356-2.2k Hz',
    'eq.band4': 'Mid High / Presence',
    'eq.band4Freq': '5.56 kHz',
    'eq.band4Range': '2.2k-9.8k Hz',
    'eq.band5': 'High / Air',
    'eq.band5Freq': '17.2 kHz',
    'eq.band5Range': '9.8k-20k Hz',
    'eq.psychoacousticInfo': 'The default range has selected frequencies that are psychoacoustically pleasing to the human ear, naturally highlighting the most embellishing tones in the audio.',
  },
  ES: {
    // Navigation
    'header.title': 'Procesador de Audio Level',
    'header.upload': 'Subir',
    'header.enhance': 'Mejorar',
    'header.settings': 'Configuración',

    // EQ Presets
    'eq.preset.flat': 'Plano',
    'eq.preset.bassBoost': 'Realce de Graves',
    'eq.preset.vocalEnhance': 'Mejora Vocal',
    'eq.preset.bright': 'Brillante',
    'eq.preset.warm': 'Cálido',
    'eq.preset.club': 'Club',
    'eq.preset.rock': 'Rock',
    'eq.preset.jazz': 'Jazz',

    // Upload Section
    'upload.title': 'Subir Archivos de Audio',
    'upload.dragDrop': 'Arrastra tus archivos de audio aquí',
    'upload.clickSelect': 'o haz clic para seleccionar archivos',
    'upload.supportedFormats': 'MP3, WAV, FLAC, OGG, M4A, AAC',
    'upload.limits': 'Máx 20 archivos • 100MB cada uno',

    // Track List
    'tracks.title': 'Lista de Pistas',
    'tracks.noTracks': 'No hay pistas subidas',
    'tracks.uploadToStart': 'Sube archivos de audio para comenzar',
    'tracks.songName': 'Nombre de Canción',
    'tracks.fileSize': 'Tamaño de Archivo',
    'tracks.status': 'Estado',
    'tracks.conversion': 'Conversión',
    'tracks.fileInfo': 'Info de Archivo',
    'tracks.download': 'Descargar',
    'tracks.totalFiles': 'Archivos Totales',
    'tracks.inQueue': 'En Cola',
    'tracks.processing': 'Procesando',
    'tracks.completed': 'Completados',

    // Buttons & Actions
    'button.spectrum': 'Spectrum',
    'button.enhance': 'Mejorar',
    'button.enhanceAll': 'Mejorar Todos',
    'button.downloadAll': 'Descargar Todos',
    'button.clear': 'Limpiar',
    'button.clearDownloaded': 'Limpiar Descargados',
    'button.download': 'Descargar',
    'button.info': 'Info',
    'button.reset': 'Restablecer',
    'button.save': 'Guardar',
    'button.load': 'Cargar',
    'button.cancel': 'Cancelar',
    'button.ok': 'Aceptar',

    // Status Messages
    'status.loading': 'Cargando',
    'status.ready': 'Listo',
    'status.processing': 'Procesando',
    'status.error': 'Error',
    'status.enhanced': 'Mejorado',
    'status.queue': 'Cola',

    // Enhancement Settings
    'enhance.title': 'Mejora de Audio Avanzada',
    'enhance.format': 'Formato',
    'enhance.quality': 'Calidad',
    'enhance.outputSize': 'Tamaño de Salida',
    'enhance.outputSettings': 'Configuración de Salida',
    'enhance.processingOptions': 'Opciones de Procesamiento',
    'enhance.equalizer': 'Ecualizador y Preajustes',

    // Audio Settings
    'settings.outputFormat': 'Formato de Salida',
    'settings.sampleRate': 'Frecuencia de Muestreo',
    'settings.bitDepth': 'Profundidad de Bits',
    'settings.bitrate': 'Tasa de Bits',
    'settings.noiseReduction': 'Reducción de Ruido',
    'settings.normalization': 'Normalización de Audio',
    'settings.compression': 'Compresión Dinámica',
    'settings.stereoWidening': 'Ampliación Estéreo',
    'settings.bassBoost': 'Realce de Graves',
    'settings.trebleEnhancement': 'Realce de Agudos',
    'settings.gainAdjustment': 'Ajuste de Ganancia',

    // Equalizer
    'eq.title': 'Ecualizador de 10 Bandas',
    'eq.enable': 'Activar Ecualizador',
    'eq.presets': 'Preajustes EQ',
    'eq.enableEqualizer': 'Activar Ecualizador',
    'eq.tenBandEqualizer': 'Ecualizador de 10 Bandas',
    'eq.eqPresets': 'Preajustes EQ',
    'eq.reset': 'Restablecer',

    // Conversion
    'conversion.source': 'Origen',
    'conversion.output': 'Salida',
    'conversion.size': 'Tamaño',
    'conversion.noConversion': 'Sin conversión',

    // Dialogs & Modals
    'dialog.downloadAll.title': 'Descargar Múltiples Archivos',
    'dialog.downloadAll.message': '¿Desea descargar {count} archivos?',
    'dialog.downloadAll.confirm': 'Sí, descargar todos',

    // Toast Messages
    'toast.noFiles': 'No hay archivos para procesar',
    'toast.uploadFirst': 'Por favor sube algunos archivos de audio primero',
    'toast.enhancementComplete': '¡Mejora Completa!',
    'toast.enhancementFailed': 'Mejora fallida',
    'toast.downloadComplete': 'Descarga Completa',
    'toast.downloadFailed': 'Descarga Fallida',
    'toast.filesCleared': 'Archivos limpiados',

    // Stats
    'stats.total': 'Archivos Totales',
    'stats.uploaded': 'Cola',
    'stats.processing': 'Procesando',
    'stats.enhanced': 'Completados',

    // AI Mastering
    'aiMastering.title': 'Masterización de Audio con IA',
    'aiMastering.description': 'Masterización de nivel profesional impulsada por tecnología IA',
    'aiMastering.premiumFeature': 'Función Premium',
    'aiMastering.unlockMessage': 'Desbloquea la masterización con IA para llevar tus pistas al siguiente nivel',
    'aiMastering.feature1': 'Análisis y mejora de audio con IA',
    'aiMastering.feature2': 'Coincide perfectamente con tus pistas de referencia',
    'aiMastering.feature3': 'Presets profesionales específicos por género',
    'aiMastering.upgradeToPremium': 'Actualizar a Premium',
    'aiMastering.admin': 'ADMIN',
    'aiMastering.premium': 'PREMIUM',
    'aiMastering.customReference': 'Referencia Personalizada',
    'aiMastering.genrePresets': 'Presets de Género',
    'aiMastering.targetTrack': 'Pista Objetivo',
    'aiMastering.referenceTrack': 'Pista de Referencia',
    'aiMastering.selectGenre': 'Seleccionar Género',
    'aiMastering.selectPreset': 'Seleccionar Preset',
    'aiMastering.masterTrack': 'Masterizar Mi Pista',
    'aiMastering.processing': 'Procesando',
    'aiMastering.processingMessage': 'Esto puede tomar unos minutos dependiendo del tamaño del archivo',
    'aiMastering.infoBanner': 'Tus datos de audio nunca se suben a ningún servidor, todo el procesamiento ocurre localmente en tu navegador. Esto garantiza que tu audio permanezca seguro y en tu computadora. La tasa de muestreo óptima es de 48 kHz.',
    'aiMastering.settings': 'Configuración',
    'aiMastering.threshold': 'Umbral',
    'aiMastering.epsilon': 'Epsilon',
    'aiMastering.maxPieceLength': 'Longitud Máxima de Pieza (segundos)',
    'aiMastering.bpm': 'BPM',
    'aiMastering.timeSignatureNumerator': 'Numerador de Compás',
    'aiMastering.timeSignatureDenominator': 'Denominador de Compás',
    'aiMastering.pieceLengthBars': 'Longitud de Pieza (compases)',
    'aiMastering.resamplingMethod': 'Método de Remuestreo',
    'aiMastering.spectrumCompensation': 'Compensación de Espectro',
    'aiMastering.loudnessCompensation': 'Compensación de Volumen',
    'aiMastering.analyzeFullSpectrum': 'Analizar Espectro Completo',
    'aiMastering.spectrumSmoothingWidth': 'Ancho de Suavizado de Espectro',
    'aiMastering.smoothingSteps': 'Pasos de Suavizado',
    'aiMastering.spectrumCorrectionHops': 'Saltos de Corrección de Espectro',
    'aiMastering.loudnessSteps': 'Pasos de Volumen',
    'aiMastering.spectrumBands': 'Bandas de Espectro',
    'aiMastering.fftSize': 'Tamaño FFT',
    'aiMastering.normalizeReference': 'Normalizar Referencia',
    'aiMastering.normalize': 'Normalizar',
    'aiMastering.limiterMethod': 'Método Limitador',
    'aiMastering.limiterThreshold': 'Umbral Limitador dB',
    'aiMastering.loudnessCorrectionLimiting': 'Limitación de Corrección de Volumen',
    'aiMastering.amplify': 'Amplificar',
    'aiMastering.clipping': 'Recorte',
    'aiMastering.outputBits': 'Bits de Salida',
    'aiMastering.outputChannels': 'Canales de Salida',
    'aiMastering.ditheringMethod': 'Método de Dithering',
    'aiMastering.success': '¡Masterización Completa!',
    'aiMastering.successMessage': 'Tu pista ha sido masterizada exitosamente',
    'aiMastering.error': 'Masterización Fallida',
    'aiMastering.errorMessage': 'Fallo al procesar tu pista. Por favor intenta de nuevo.',
    'aiMastering.complete': '¡Masterización Completa!',
    'aiMastering.dragOrClick': 'Arrastra y suelta o haz clic para seleccionar',
    'aiMastering.dropFile': 'Suelta tu archivo aquí',

    // Processing Options
    'processing.options': 'Opciones de Procesamiento',
    'processing.batchMode': 'Modo Lote',
    'processing.individualMode': 'Modo Individual',
    'processing.compressionRatio': 'Relación de Compresión',
    'processing.threshold': 'Umbral',
    'processing.thresholdInfo': 'Controla cuándo se aplica la compresión a la señal',
    'processing.normalizationInfo': 'Limitado a 0dB a -3dB para estabilidad óptima en escenarios en vivo/transmisión',
    'processing.width': 'Ancho',
    'processing.stereoWideningInfo': 'Mejora estéreo sutil. Valores >70% pueden causar problemas de fase.',
    'processing.antiPhaseWarning': '⚠️ ¡Territorio de antifase! Riesgo de cancelación de fase.',
    'processing.premiumRequired': 'Se requiere suscripción premium para esta función',

    // EQ Presets
    'eq.professionalPresets': 'Presets Profesionales de EQ',
    'eq.autoGainCompensation': 'Compensación Automática de Ganancia',
    'eq.gainComp': 'Comp. Ganancia',
    'eq.compensationExplanation': 'Todos los presets incluyen compensación automática de ganancia para comparación A/B objetiva a volumen percibido igual',

    // Real-time Audio Player
    'player.realtimePreview': 'Vista Previa de Audio en Tiempo Real',
    'player.noAudioLoaded': 'No hay archivo de audio cargado',
    'player.realtimeProcessing': '⚡ Procesamiento en tiempo real activo - escucha los cambios instantáneamente',

    // EQ Band Names
    'eq.band1': 'Graves / Sub',
    'eq.band1Freq': '50 Hz',
    'eq.band1Range': '20-85 Hz',
    'eq.band2': 'Medios Bajos / Pegada',
    'eq.band2Freq': '145 Hz',
    'eq.band2Range': '85-356 Hz',
    'eq.band3': 'Medios',
    'eq.band3Freq': '874 Hz',
    'eq.band3Range': '356-2.2k Hz',
    'eq.band4': 'Medios Altos / Presencia',
    'eq.band4Freq': '5.56 kHz',
    'eq.band4Range': '2.2k-9.8k Hz',
    'eq.band5': 'Agudos / Aire',
    'eq.band5Freq': '17.2 kHz',
    'eq.band5Range': '9.8k-20k Hz',
    'eq.psychoacousticInfo': 'El rango predeterminado ha seleccionado frecuencias que son psicoacústicamente agradables al oído humano, resaltando naturalmente los tonos más embellecedores en el audio.',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('EN');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'EN' ? 'ES' : 'EN');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Header component example using the context
export const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="bg-slate-800 border-b border-slate-600 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          {t('header.title')}
        </h1>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <a href="#upload" className="text-slate-300 hover:text-white">
              {t('header.upload')}
            </a>
            <a href="#enhance" className="text-slate-300 hover:text-white">
              {t('header.enhance')}
            </a>
            <a href="#settings" className="text-slate-300 hover:text-white">
              {t('header.settings')}
            </a>
          </nav>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {language}
          </button>
        </div>
      </div>
    </header>
  );
};