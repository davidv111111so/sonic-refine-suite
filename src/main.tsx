import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initAudioContextOnInteraction } from './utils/audioContextManager'
import { registerSW } from 'virtual:pwa-register'

// Initialize Service Worker for PWA (Offline Support)
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New content available. Reload?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("PWA is ready to work offline.");
  },
});

// Initialize audio context on first user interaction
// This solves the 1-second playback bug caused by browser autoplay policies
initAudioContextOnInteraction();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
