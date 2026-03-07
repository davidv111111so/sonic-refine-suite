import { useEffect } from 'react';
import { DeckControls } from './useDJDeck';

export const useKeyboardShortcuts = (deckA: DeckControls, deckB: DeckControls) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.code) {
                // Transport Controls
                case 'Space':
                    e.preventDefault();
                    if (e.shiftKey) {
                        deckB.state.isPlaying ? deckB.pause() : deckB.play();
                    } else {
                        deckA.state.isPlaying ? deckA.pause() : deckA.play();
                    }
                    break;
                case 'KeyQ':
                    e.preventDefault();
                    deckA.cue();
                    break;
                case 'KeyW':
                    e.preventDefault();
                    deckB.cue();
                    break;

                // Pitch Bend (KeyDown starts bend)
                case 'ArrowLeft':
                    e.preventDefault();
                    e.shiftKey ? deckB.setTempoBend(-1) : deckA.setTempoBend(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    e.shiftKey ? deckB.setTempoBend(1) : deckA.setTempoBend(1);
                    break;

                // EQ Kills Deck A (1, 2, 3)
                case 'Digit1':
                    e.preventDefault();
                    deckA.toggleEQKill('low');
                    break;
                case 'Digit2':
                    e.preventDefault();
                    deckA.toggleEQKill('mid');
                    break;
                case 'Digit3':
                    e.preventDefault();
                    deckA.toggleEQKill('high');
                    break;

                // EQ Kills Deck B (8, 9, 0)
                case 'Digit8':
                    e.preventDefault();
                    deckB.toggleEQKill('low');
                    break;
                case 'Digit9':
                    e.preventDefault();
                    deckB.toggleEQKill('mid');
                    break;
                case 'Digit0':
                    e.preventDefault();
                    deckB.toggleEQKill('high');
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.code) {
                // Pitch Bend (KeyUp ends bend)
                case 'ArrowLeft':
                case 'ArrowRight':
                    e.preventDefault();
                    // Reset both decks temporary bend to 0 just to be safe
                    deckA.setTempoBend(0);
                    deckB.setTempoBend(0);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [deckA, deckB]);
};
