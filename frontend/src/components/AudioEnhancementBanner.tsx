import { FileAudio, AudioWaveform, Zap } from "lucide-react";

export const AudioEnhancementBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-4 mb-6">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-4 animate-pulse">
          <AudioWaveform className="h-6 w-6 text-white" />
        </div>
        <div className="absolute bottom-4 right-8 animate-pulse delay-300">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="absolute top-6 right-12 animate-pulse delay-700">
          <FileAudio className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <FileAudio className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Audio Enhancer
            <span className="ml-2 text-xl font-light text-blue-200">Pro</span>
          </h1>
        </div>
        <p className="text-blue-100 text-base font-medium">
          Transform your music collection with professional-grade audio
          enhancement
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm text-blue-200">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            AI-Powered
          </span>
          <span className="flex items-center gap-1">
            <AudioWaveform className="h-3 w-3" />
            Studio Quality
          </span>
          <span className="flex items-center gap-1">
            <FileAudio className="h-3 w-3" />
            Multiple Formats
          </span>
        </div>
      </div>
    </div>
  );
};
