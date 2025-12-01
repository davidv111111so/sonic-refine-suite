# Sonic Refine Suite Roadmap

## Phase 1: Core Stability & UI Polish (Completed)
- [x] Fix Authentication Flow
- [x] Restore Index.tsx Integrity
- [x] Implement Logout Cleanup
- [x] Polish Auth Page UI
- [x] Fix Visualizer Fullscreen Bug
- [x] Refine Enhance Tab Layout

## Phase 2: Advanced Audio Features (Current)
### Stems Separation Tab
- [x] Drag and drop interface for stem separation
- [x] Backend integration (Python/Demucs)
- [x] Waveform visualization for separated stems
- [x] Solo/Mute controls for each stem
- [x] Export individual stems

### External Media Player
- [ ] Standalone player page (`/player`)
- [ ] Independent playlist management
- [ ] Persistent state (localStorage)

## Phase 3: Cloud & Collaboration
- [ ] Cloud storage for projects
- [ ] Shareable links for enhanced audio
- [ ] Real-time collaboration features

## Phase 4: Standalone App & Integration (Future)
- [ ] **PWA Implementation**: Make the web app installable.
- [ ] **Electron Wrapper**: Wrap the `/player` route in an Electron container for a native desktop experience.
- [ ] **Deep Linking**: Implement custom protocol handling (e.g., `sonic-refine://open-player?track=...`) to open the player from the main app.
- [ ] **Mobile Adaptation**: Responsive design optimization.
