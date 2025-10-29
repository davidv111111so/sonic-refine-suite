import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Music, Headphones, Mic, Radio, Guitar, Piano, Disc3, Waves, 
  Volume2, CheckCircle, XCircle, Loader2, Play
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getReferenceTrack, hasReferenceTrack, type ReferenceTrack } from '@/utils/referenceTrackStorage';
import { toast } from 'sonner';

// Genre definitions matching AdminReferenceManager
export const GENRE_PRESETS = [
  { id: 'jazz', name: 'Jazz', nameES: 'Jazz', icon: Music },
  { id: 'electronic', name: 'Electronic', nameES: 'Electrónica', icon: Disc3 },
  { id: 'podcast', name: 'Podcast', nameES: 'Podcast', icon: Mic },
  { id: 'reggae', name: 'Reggae', nameES: 'Reggae', icon: Waves },
  { id: 'latin', name: 'Latin', nameES: 'Latina', icon: Music },
  { id: 'rock', name: 'Rock', nameES: 'Rock', icon: Guitar },
  { id: 'classical', name: 'Classical', nameES: 'Clásica', icon: Piano },
  { id: 'vocal', name: 'Vocal', nameES: 'Vocal', icon: Mic },
  { id: 'bass-boost', name: 'Bass Boost', nameES: 'Graves Potentes', icon: Volume2 },
  { id: 'live', name: 'Live', nameES: 'En Vivo', icon: Headphones },
  { id: 'hip-hop', name: 'Hip-Hop', nameES: 'Hip-Hop', icon: Radio },
  { id: 'flat', name: 'Flat', nameES: 'Plano', icon: Music },
];

interface GenreReferenceSelectorProps {
  onReferenceSelect: (file: File, genreName: string) => void;
  selectedGenre: string | null;
}

export const GenreReferenceSelector: React.FC<GenreReferenceSelectorProps> = ({ 
  onReferenceSelect, 
  selectedGenre 
}) => {
  const { t, language } = useLanguage();
  const [genreStatus, setGenreStatus] = useState<Record<string, boolean>>({});
  const [loadingGenres, setLoadingGenres] = useState<Record<string, boolean>>({});
  const [loadedTrack, setLoadedTrack] = useState<ReferenceTrack | null>(null);

  // Check which genres have reference tracks on mount
  useEffect(() => {
    const checkGenreStatus = async () => {
      const statusMap: Record<string, boolean> = {};
      
      for (const genre of GENRE_PRESETS) {
        const exists = await hasReferenceTrack(genre.id);
        statusMap[genre.id] = exists;
      }
      
      setGenreStatus(statusMap);
    };

    checkGenreStatus();
  }, []);

  // Load selected genre's reference track
  const handleGenreSelect = async (genreId: string) => {
    if (!genreStatus[genreId]) {
      toast.error('No reference track available for this genre');
      return;
    }

    setLoadingGenres(prev => ({ ...prev, [genreId]: true }));

    try {
      const track = await getReferenceTrack(genreId);
      
      if (track) {
        setLoadedTrack(track);
        onReferenceSelect(track.file, track.genre);
        toast.success(`Loaded ${track.name} (${(track.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        toast.error('Failed to load reference track');
      }
    } catch (error) {
      console.error('Error loading reference track:', error);
      toast.error('Error loading reference track');
    } finally {
      setLoadingGenres(prev => ({ ...prev, [genreId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">
          {language === 'ES' ? '🎯 Elige un Preset de Género' : '🎯 Choose Genre Preset'}
        </h3>
        <p className="text-sm text-slate-300">
          {language === 'ES' 
            ? 'Selecciona un género para cargar la pista de referencia correspondiente' 
            : 'Select a genre to load the corresponding reference track'}
        </p>
      </div>

      {/* Genre Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {GENRE_PRESETS.map((genre) => {
          const Icon = genre.icon;
          const hasTrack = genreStatus[genre.id];
          const isLoading = loadingGenres[genre.id];
          const isSelected = selectedGenre === genre.id;
          const displayName = language === 'ES' ? genre.nameES : genre.name;

          return (
            <Card
              key={genre.id}
              className={`relative cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border-2 border-cyan-500 bg-cyan-900/30 scale-105'
                  : hasTrack
                  ? 'border border-slate-600 bg-slate-800/50 hover:border-cyan-400 hover:scale-102'
                  : 'border border-slate-700 bg-slate-900/30 opacity-60'
              }`}
              onClick={() => hasTrack && handleGenreSelect(genre.id)}
            >
              <CardContent className="p-4 flex flex-col items-center gap-2">
                {/* Status Indicator */}
                <div className="absolute top-2 right-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  ) : hasTrack ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-500" />
                  )}
                </div>

                {/* Genre Icon */}
                <div className={`p-3 rounded-full ${
                  hasTrack 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'bg-slate-700/50 text-slate-500'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Genre Name */}
                <span className={`text-sm font-medium text-center ${
                  hasTrack ? 'text-white' : 'text-slate-500'
                }`}>
                  {displayName}
                </span>

                {/* Status Text */}
                <span className="text-xs text-slate-400">
                  {hasTrack 
                    ? (language === 'ES' ? 'Disponible' : 'Available')
                    : (language === 'ES' ? 'No disponible' : 'Unavailable')
                  }
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Loaded Track Info */}
      {loadedTrack && (
        <Card className="bg-green-900/20 border-green-500/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Music className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-400">
                    {language === 'ES' ? 'Pista de Referencia Cargada' : 'Reference Track Loaded'}
                  </p>
                  <p className="text-sm text-slate-300">{loadedTrack.name}</p>
                  <p className="text-xs text-slate-400">
                    {(loadedTrack.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
