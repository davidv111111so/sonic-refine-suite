# Level Audio - Professional Audio Enhancement Platform

A professional-grade audio enhancement, mastering, and DJ mixing platform.

## Features

- 🎵 **AI Mastering** - Reference-based AI audio mastering with spectral analysis
- 🎚️ **Professional DJ Mixer** - Full-featured dual-deck mixing with sync, loops, and FX
- 📈 **Spectrum Enhancement** - Advanced audio processing and visualization
- 🎧 **Media Player** - High-fidelity playback with waveform display

## Technology Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Audio Engine**: Tone.js + Web Audio API
- **Backend**: Python (FastAPI) on Google Cloud Run
- **Storage**: Google Cloud Storage
- **Database & Auth**: Supabase

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.9+ (for backend)

### Quick Start

```bash
# Install dependencies
npm install

# Run development server  
npm run dev
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Electron (Desktop App)

```bash
# Development with Electron
npm run electron:dev

# Build desktop app
npm run electron:build
```

## Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_PYTHON_BACKEND_URL=your_backend_url
```

## License

Proprietary - All Rights Reserved

© 2025 Level Audio
