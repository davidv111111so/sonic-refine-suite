# Project Rules & Guidelines

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI, Lucide React
- **State Management**: React Context, Custom Hooks
- **Routing**: React Router DOM
- **Audio Processing**: Web Audio API (Native), Tone.js (Scheduling), Electron (Drivers)
- **Backend (AI)**: Python (Flask), Librosa, Demucs (MIT Only)
- **Desktop Wrapper**: Electron (Required for ASIO/WASAPI)

## Licensing Constraints (STRICT)
- **Permissive Only**: MIT, Apache 2.0, BSD, ISC.
- **BANNED**: GPL, AGPL, Creative Commons Non-Commercial.
- **Audit**: All new libraries must be license-checked before install.

## Coding Standards
### TypeScript
- Use strict typing; avoid `any` whenever possible.
- Define interfaces for all component props and data structures.

### Components
- Use functional components with hooks.
- Keep components small and focused (Single Responsibility Principle).
- Place reusable components in `src/components/ui` or `src/components/shared`.

### Styling
- Use Tailwind CSS utility classes.
- Follow the project's dark theme color palette (Slate/Cyan/Purple).
- Ensure responsive design (mobile-first approach).

### State Management
- Use Context for global state (Auth, Audio, UI).
- Use local state (`useState`, `useReducer`) for component-specific logic.

## File Structure
- `src/components`: UI components and feature-specific components.
- `src/pages`: Route components (Index, Auth, NotFound).
- `src/hooks`: Custom React hooks.
- `src/contexts`: React Context providers.
- `src/lib`: Utility functions and helpers.

## Git Workflow
- Commit often with descriptive messages.
- Review code before merging.

## Antigravity Agent Guidelines
### Core Philosophy
- **Investigate & Review Options**: Thoroughly investigate issues and review all available options (including external research and internal code review) before taking action. Never guess.
- **Take the Best Approach**: After reviewing options, choose the most robust, scalable, and elegant solution. Prioritize long-term code health over quick hacks.
- **Refactor when Required**: If the existing code is brittle, messy, or does not meet modern standards, refactor it before or during the implementation of new features. Optimize for readability and performance.
- **Fix All Errors**: Proactively identify and fix all errors, including linting issues, console warnings, and logical bugs, even if they aren't the primary focus of the task. A clean console is a healthy app.
- **Automate Deployment Checks**: Always verify backend health and frontend builds after making significant infrastructure changes.

### Workflow
- **Verify First**: Before marking a task as complete, verify the implementation by reading the file or running the code.
- **Atomic Changes**: Make small, focused changes. Avoid massive file rewrites unless necessary.
- **Preserve Functionality**: Never remove existing features or logic unless explicitly requested. If a refactor is needed, ensure feature parity.

### UI & Design
- **Visual Consistency**: Always adhere to the `Slate-950` (background) and `Cyan-500`/`Purple-500` (accent) theme.
- **Responsive**: Ensure all new UI components are responsive and mobile-friendly.
- **Feedback**: Provide immediate visual feedback for user actions (loading states, toasts, hover effects).

### Error Handling
- **Graceful Degradation**: If a feature fails (e.g., 3D visualizer), fallback to a simpler version (e.g., 2D canvas) rather than crashing.
- **User Notification**: Use `sonner` toasts to inform users of errors or success states.

### Media Handling
- **Event-Driven State**: Always rely on media events (`play`, `pause`, `ended`, `timeupdate`) to update UI state (`isPlaying`, `currentTime`). Do not manually toggle state in handlers, as this leads to desync.
- **Robust Playback**: Always handle promises returned by `play()` and catch potential errors (e.g., "The play() request was interrupted").
- **Cleanup**: Ensure audio contexts and media elements are properly cleaned up or paused when components unmount.

### Layout & Responsiveness
- **Flexible Containers**: Use `flex-1` and `min-h-0` for main content areas to ensure they take up available space without overflowing.
- **Scrollable Areas**: Explicitly define scrollable areas with `overflow-y-auto` and constrained heights (e.g., `h-[300px]` or `flex-1`).


### Network & API Rules
- **Avoid 413 Errors**: Direct file uploads to the backend should be avoided for files larger than 20MB. Use cloud storage (Supabase/Firebase) as an intermediary.
- **CORS Management**: Never manually handle `OPTIONS` requests if using a CORS middleware (like `Flask-CORS`). Let the middleware handle preflight.
- **Robust Retries**: Implement exponential backoff for network requests that are prone to intermittent failure.

### Mixer Lab Rules (Strict)
1.  **Tempo Master Logic**:
    -   **Manual**: Assign via MASTER button on deck.
    -   **Auto**: If enabled (AUTO button), starting playback makes a deck Master. If current Master stops/ends,Sync deck becomes Master. If no Sync deck, Master Clock becomes Master.
    -   **Single Master**: Only one Tempo Master at a time.
2.  **UI Aesthetics**:
    -   **FX Knobs**: Dry/Wet knob must be large, stylish, and noticeable.
    -   **Decks**: Always show "Artist - Title" in header if known. "Unknown Artist" is acceptable fallback but try to parse metadata.
3.  **Real-Time Feedback**:
    -   VU Meters must be responsive and accurate.
