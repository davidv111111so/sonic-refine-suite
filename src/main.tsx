import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initAudioContextOnInteraction } from './utils/audioContextManager'

// Initialize audio context on first user interaction
// This solves the 1-second playback bug caused by browser autoplay policies
initAudioContextOnInteraction();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
