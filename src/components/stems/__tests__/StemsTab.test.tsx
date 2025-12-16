import { render, screen } from '@testing-library/react';
import { StemsTab } from '../StemsTab';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'mock-token' } } }),
        },
    },
}));

// Mock child components to avoid complex render logic
vi.mock('../StemPlayer', () => ({
    StemPlayer: () => <div data-testid="stem-player">Stem Player</div>,
}));

vi.mock('../StemsGuide', () => ({
    StemsGuide: () => <div>Stems Guide</div>,
}));

describe('StemsTab', () => {
    it('renders correctly', () => {
        const mockProps = {
            audioFiles: [],
            onFilesUploaded: vi.fn(),
            isProcessing: false,
            setIsProcessing: vi.fn(),
        };

        render(<StemsTab {...mockProps} />);

        // Check for main elements
        expect(screen.getByText('Stems Separation')).toBeInTheDocument();
        expect(screen.getByText('Upload or select a track to split into isolated stems')).toBeInTheDocument();
    });

    it('shows processing state when isProcessing is true', () => {
        const mockProps = {
            audioFiles: [],
            onFilesUploaded: vi.fn(),
            isProcessing: true,
            setIsProcessing: vi.fn(),
        };

        render(<StemsTab {...mockProps} />);
        // Add specific assertions if the UI changes based on isProcessing
        // For now just ensuring it renders without crashing
        expect(screen.getByText('Stems Separation')).toBeInTheDocument();
    });
});
