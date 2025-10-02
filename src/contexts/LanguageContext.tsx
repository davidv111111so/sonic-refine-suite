import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    'header.title': 'Spectrum Audio Processor',
    'header.upload': 'Upload',
    'header.enhance': 'Enhance',
    'header.settings': 'Settings',
    
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
    'stats.enhanced': 'Completed'
  },
  ES: {
    // Header & Navigation
    'header.title': 'Procesador de Audio Spectrum',
    'header.upload': 'Subir',
    'header.enhance': 'Mejorar',
    'header.settings': 'Configuración',
    
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
    'button.enhanceAll': 'Mejorar Todos los Archivos',
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
    'stats.enhanced': 'Completados'
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