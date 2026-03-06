import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BetaGate } from "@/components/BetaGate";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { FloatingMiniPlayer } from "@/components/FloatingMiniPlayer";
import Index from "./pages/Index";
import PlayerPage from "./pages/Player";
import Auth from "./pages/Auth";
import { TermsAndConditions } from "./pages/TermsAndConditions";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import { ProMixer } from "@/components/mixer/ProMixer";
import { initAudioContextOnInteraction } from "@/utils/audioContextManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HelmetProvider } from 'react-helmet-async';
import { TrialLimitListener } from "@/components/TrialLimitListener";

const queryClient = new QueryClient();

// Initialize AudioContext on first user interaction to fix 1-second playback bug
const AudioContextInitializer = () => {
  useEffect(() => {
    initAudioContextOnInteraction();
    console.log("🎵 AudioContext initializer mounted");
  }, []);
  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              {/* <AudioContextInitializer /> Removed to prevent conflict with Tone.js */}
              <Toaster />
              <Sonner />
              <PlayerProvider>
                <ErrorBoundary>
                  <BrowserRouter>
                    <FloatingMiniPlayer />
                    <TrialLimitListener />
                    <Routes>
                      <Route path="/player" element={<PlayerPage />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/terms" element={<TermsAndConditions />} />
                      <Route path="/admin" element={
                        <BetaGate>
                          <Admin />
                        </BetaGate>
                      } />
                      <Route path="/app" element={
                        <BetaGate>
                          <Index />
                        </BetaGate>
                      } />
                      <Route path="/" element={<Landing />} />
                      <Route path="/mixer" element={<ProMixer />} />
                      <Route path="*" element={
                        <BetaGate>
                          <NotFound />
                        </BetaGate>
                      } />
                    </Routes>
                  </BrowserRouter>
                </ErrorBoundary>
              </PlayerProvider>
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
