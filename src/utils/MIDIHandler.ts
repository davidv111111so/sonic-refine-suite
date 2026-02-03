import { WebMidi } from 'webmidi';
import { DeckControls } from '../hooks/useDJDeck';

export class MIDIHandler {
    private static instance: MIDIHandler | null = null;
    private decks: { A: DeckControls; B: DeckControls } | null = null;

    private constructor() { }

    static getInstance() {
        if (!MIDIHandler.instance) {
            MIDIHandler.instance = new MIDIHandler();
        }
        return MIDIHandler.instance;
    }

    setDecks(decks: { A: DeckControls; B: DeckControls }) {
        this.decks = decks;
    }

    async init() {
        try {
            await WebMidi.enable();
            console.log("WebMidi enabled!");

            WebMidi.inputs.forEach(input => {
                console.log(`MIDI Input detected: ${input.name}`);

                // Generic Mapping Example (DDJ style)
                input.addListener("noteon", (e) => {
                    if (!this.decks) return;
                    console.log(`MIDI Note: ${e.note.number}, Velocity: ${e.velocity}`);

                    // Deck A Play (Note 60 = C4)
                    if (e.note.number === 60) this.decks.A.play();
                    // Deck B Play (Note 62 = D4)
                    if (e.note.number === 62) this.decks.B.play();
                });

                input.addListener("controlchange", (e) => {
                    if (!this.decks) return;
                    const val = e.value as number / 127;
                    console.log(`MIDI CC: ${e.controller.number}, Value: ${val}`);

                    // Deck A Volume (CC 7)
                    if (e.controller.number === 7) this.decks.A.setVolume(val);
                    // Deck B Volume (CC 8)
                    if (e.controller.number === 8) this.decks.B.setVolume(val);

                    // EQ Mapping Example
                    if (e.controller.number === 10) this.decks.A.setEQ('low', val);
                    if (e.controller.number === 11) this.decks.A.setEQ('mid', val);
                    if (e.controller.number === 12) this.decks.A.setEQ('high', val);
                });
            });

        } catch (err) {
            console.error("MIDI Init Failed:", err);
        }
    }
}
