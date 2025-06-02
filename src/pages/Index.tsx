
import { useState, useCallback, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AudioEnhancementBanner } from '@/components/AudioEnhancementBanner';
import { StatsCards } from '@/components/StatsCards';
import { MainTabs } from '@/components/MainTabs';
import { useToast } from '@/hooks/use-toast';
import { useFileManagement } from '@/hooks/useFileManagement';
import { useAudioEnhancement } from '@/hooks/useAudioEnhancement';
import { useEnhancementHistory } from '@/hooks/useEnhancementHistory';
import { AudioFile, AudioStats } from '@/types/audio';

const Index = () => {
  console.log('Index component render started');
  
  const [activeTab, setActiveTab] = useState('upload');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();
  
  const {
    audioFiles,
    setAudioFiles,
    handleFilesUploaded,
    handleRemoveFile,
    handleUpdateFile
  } = useFileManagement();

  const {
    handleEnhanceFiles,
    saveLocation,
    setSaveLocation,
    isProcessing
  } = useAudioEnhancement(audioFiles, setAudioFiles, notificationsEnabled);

  const { history, clearHistory } = useEnhancementHistory();

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    }
  }, []);

  const handleSelectPreset = useCallback((preset: any) => {
    setActiveTab('enhance');
    toast({
      title: "Preset selected",
      description: `${preset.smartFolder} preset has been applied to the settings`,
    });
  }, [toast]);

  const handleClearHistory = () => {
    clearHistory();
    toast({
      title: "History cleared",
      description: "Your enhancement history has been cleared"
    });
  };

  const stats: AudioStats = {
    total: audioFiles.length,
    uploaded: audioFiles.filter(f => f.status === 'uploaded').length,
    processing: audioFiles.filter(f => f.status === 'processing').length,
    enhanced: audioFiles.filter(f => f.status === 'enhanced').length,
  };

  console.log('Index component render - activeTab:', activeTab);
  console.log('Index component render - stats:', stats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header with Banner */}
        <div className="flex items-center justify-end mb-4">
          <ThemeToggle />
        </div>
        <AudioEnhancementBanner />

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Main Content */}
        <MainTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          audioFiles={audioFiles}
          onFilesUploaded={handleFilesUploaded}
          onRemoveFile={handleRemoveFile}
          onUpdateFile={handleUpdateFile}
          onEnhanceFiles={handleEnhanceFiles}
          isProcessing={isProcessing}
          hasFiles={stats.uploaded > 0}
          onSaveLocationChange={setSaveLocation}
          history={history}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
};

export default Index;
