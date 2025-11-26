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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { TermsAndConditions } from "./pages/TermsAndConditions";
import NotFound from "./pages/NotFound";
import { initAudioContextOnInteraction } from "@/utils/audioContextManager";

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
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <AudioContextInitializer />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/" element={
                  <BetaGate>
                    <Index />
                  </BetaGate>
                } />
                <Route path="*" element={
                  <BetaGate>
                    <NotFound />
                  </BetaGate>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
