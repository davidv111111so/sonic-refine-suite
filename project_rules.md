# Project Rules & Guidelines

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI, Lucide React
- **State Management**: React Context, Custom Hooks
- **Routing**: React Router DOM
- **Audio Processing**: Web Audio API

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

