import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'EN' | 'ES';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  EN: {
    // Header
    'header.title': 'Spectrum Audio Processor',
    'header.upload': 'Upload',
    'header.enhance': 'Enhance',
    'header.settings': 'Settings',
    // Upload
    'upload.title': 'Upload Audio Files',
    'upload.dragDrop': 'Drag & drop your audio files here',
    'upload.clickSelect': 'or click to select files',
    'upload.supportedFormats': 'MP3, WAV, FLAC, OGG, M4A, AAC',
    'upload.limits': 'Max 20 files • 100MB each',
    // Player
    'player.title': 'Audio Player',
    'player.noTrack': 'No track selected',
    'player.play': 'Play',
    'player.pause': 'Pause',
    'player.stop': 'Stop',
    // Settings
    'settings.title': 'Audio Settings',
    'settings.save': 'Save',
    'settings.load': 'Load',
    'settings.outputFormat': 'Output Format',
    'settings.sampleRate': 'Sample Rate',
    'settings.noiseReduction': 'Noise Reduction',
    'settings.normalization': 'Audio Normalization',
    'settings.compression': 'Compression Ratio',
    'settings.stereoWidth': 'Stereo Width',
    'settings.bassBoost': 'Bass Boost',
    'settings.trebleEnhancement': 'Treble Enhancement',
    // Equalizer
    'eq.title': '10-Band Equalizer',
    'eq.reset': 'Reset',
    'eq.presets': 'Quick Presets',
    'eq.flat': 'Flat',
    'eq.bassBoost': 'Bass Boost',
    'eq.trebleBoost': 'Treble Boost',
    'eq.vShape': 'V-Shape',
    'eq.vocalBoost': 'Vocal Boost',
    'eq.warmth': 'Warmth',
    // Track List
    'tracks.title': 'Track List',
    'tracks.noTracks': 'No tracks uploaded yet',
    'tracks.uploadToStart': 'Upload audio files to get started',
    'tracks.trackName': 'Track Name',
    'tracks.duration': 'Duration',
    'tracks.size': 'Size',
    'tracks.status': 'Status',
    'tracks.actions': 'Actions',
    // Status
    'status.loading': 'Loading',
    'status.ready': 'Ready',
    'status.processing': 'Processing',
    'status.error': 'Error',
    'status.completed': 'Completed'
  },
  ES: {
    // Header
    'header.title': 'Procesador de Audio Spectrum',
    'header.upload': 'Subir',
    'header.enhance': 'Mejorar',
    'header.settings': 'Configuración',
    // Upload
    'upload.title': 'Subir Archivos de Audio',
    'upload.dragDrop': 'Arrastra archivos de audio aquí',
    'upload.clickSelect': 'o haz clic para seleccionar archivos',
    'upload.supportedFormats': 'MP3, WAV, FLAC, OGG, M4A, AAC',
    'upload.limits': 'Máx 20 archivos • 100MB cada uno',
    // Player
    'player.title': 'Reproductor de Audio',
    'player.noTrack': 'Ninguna pista seleccionada',
    'player.play': 'Reproducir',
    'player.pause': 'Pausar',
    'player.stop': 'Detener',
    // Settings
    'settings.title': 'Configuración de Audio',
    'settings.save': 'Guardar',
    'settings.load': 'Cargar',
    'settings.outputFormat': 'Formato de Salida',
    'settings.sampleRate': 'Frecuencia de Muestreo',
    'settings.noiseReduction': 'Reducción de Ruido',
    'settings.normalization': 'Normalización de Audio',
    'settings.compression': 'Ratio de Compresión',
    'settings.stereoWidth': 'Ancho Estéreo',
    'settings.bassBoost': 'Realce de Graves',
    'settings.trebleEnhancement': 'Realce de Agudos',
    // Equalizer
    'eq.title': 'Ecualizador de 10 Bandas',
    'eq.reset': 'Restablecer',
    'eq.presets': 'Preajustes Rápidos',
    'eq.flat': 'Plano',
    'eq.bassBoost': 'Realce Graves',
    'eq.trebleBoost': 'Realce Agudos',
    'eq.vShape': 'Forma V',
    'eq.vocalBoost': 'Realce Vocal',
    'eq.warmth': 'Calidez',
    // Track List
    'tracks.title': 'Lista de Pistas',
    'tracks.noTracks': 'No hay pistas subidas',
    'tracks.uploadToStart': 'Sube archivos de audio para comenzar',
    'tracks.trackName': 'Nombre de Pista',
    'tracks.duration': 'Duración',
    'tracks.size': 'Tamaño',
    'tracks.status': 'Estado',
    'tracks.actions': 'Acciones',
    // Status
    'status.loading': 'Cargando',
    'status.ready': 'Listo',
    'status.processing': 'Procesando',
    'status.error': 'Error',
    'status.completed': 'Completado'
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