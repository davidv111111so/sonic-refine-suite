/**
 * Harmonic Mixing Utility
 * Implements the Camelot Wheel for key compatibility analysis.
 * Used by Traktor, Serato, and professional DJs worldwide.
 */

// Camelot Wheel: Each key maps to a number (1-12) and mode (A=minor, B=major)
const CAMELOT_WHEEL: Record<string, string> = {
    // Standard notation → Camelot
    'C': '8B', 'Am': '8A',
    'G': '9B', 'Em': '9A',
    'D': '10B', 'Bm': '10A',
    'A': '11B', 'F#m': '11A',
    'E': '12B', 'C#m': '12A',
    'B': '1B', 'G#m': '1A',
    'F#': '2B', 'Ebm': '2A', 'D#m': '2A',
    'Db': '3B', 'Bbm': '3A', 'A#m': '3A',
    'Ab': '4B', 'Fm': '4A',
    'Eb': '5B', 'Cm': '5A',
    'Bb': '6B', 'Gm': '6A',
    'F': '7B', 'Dm': '7A',
    // Camelot self-mapping
    '1A': '1A', '1B': '1B', '2A': '2A', '2B': '2B',
    '3A': '3A', '3B': '3B', '4A': '4A', '4B': '4B',
    '5A': '5A', '5B': '5B', '6A': '6A', '6B': '6B',
    '7A': '7A', '7B': '7B', '8A': '8A', '8B': '8B',
    '9A': '9A', '9B': '9B', '10A': '10A', '10B': '10B',
    '11A': '11A', '11B': '11B', '12A': '12A', '12B': '12B',
};

export interface CompatibilityResult {
    isCompatible: boolean;
    matchType: 'perfect' | 'harmonic' | 'energy_boost' | 'none';
    label: string;
    color: string;
}

/**
 * Normalize a key string to Camelot notation
 */
export function toCamelot(key: string | undefined | null): string | null {
    if (!key) return null;
    const cleaned = key.trim();
    return CAMELOT_WHEEL[cleaned] || null;
}

/**
 * Parse Camelot notation into number and mode
 */
function parseCamelot(camelot: string): { num: number; mode: 'A' | 'B' } | null {
    const match = camelot.match(/^(\d+)([AB])$/);
    if (!match) return null;
    return { num: parseInt(match[1]), mode: match[2] as 'A' | 'B' };
}

/**
 * Check harmonic compatibility between two keys (Camelot Wheel rules)
 * Compatible moves:
 * 1. Same key (perfect match)
 * 2. ±1 on the wheel (adjacent, same mode)
 * 3. Same number, switch mode (A↔B, energy boost/mood change)
 */
export function getKeyCompatibility(keyA: string | null | undefined, keyB: string | null | undefined): CompatibilityResult {
    const camA = toCamelot(keyA ?? undefined);
    const camB = toCamelot(keyB ?? undefined);

    if (!camA || !camB) {
        return { isCompatible: false, matchType: 'none', label: '', color: '' };
    }

    const a = parseCamelot(camA);
    const b = parseCamelot(camB);

    if (!a || !b) {
        return { isCompatible: false, matchType: 'none', label: '', color: '' };
    }

    // 1. Perfect match
    if (a.num === b.num && a.mode === b.mode) {
        return { isCompatible: true, matchType: 'perfect', label: 'Perfect', color: '#22c55e' }; // Green
    }

    // 2. Adjacent key (±1 on wheel, wrapping 12→1)
    const diff = Math.abs(a.num - b.num);
    const isAdjacent = (diff === 1 || diff === 11) && a.mode === b.mode;
    if (isAdjacent) {
        return { isCompatible: true, matchType: 'harmonic', label: 'Harmonic', color: '#06b6d4' }; // Cyan
    }

    // 3. Same number, different mode (energy boost)
    if (a.num === b.num && a.mode !== b.mode) {
        return { isCompatible: true, matchType: 'energy_boost', label: 'Energy', color: '#f59e0b' }; // Amber
    }

    return { isCompatible: false, matchType: 'none', label: '', color: '' };
}

/**
 * Calculate BPM compatibility score (0-1)
 * Tracks within ±3% BPM are considered compatible.
 */
export function getBpmCompatibility(bpmA: number | undefined, bpmB: number | undefined): number {
    if (!bpmA || !bpmB) return 0;

    const ratio = bpmA / bpmB;
    // Check direct match OR double/half time
    const candidates = [ratio, ratio * 2, ratio / 2];

    let bestScore = 0;
    for (const r of candidates) {
        const deviation = Math.abs(1 - r);
        if (deviation < 0.05) { // Within 5%
            bestScore = Math.max(bestScore, 1 - (deviation / 0.05));
        }
    }
    return bestScore;
}

/**
 * Calculate RMS energy for an AudioBuffer, returning an energy curve
 * Used for the energy level analysis overlay.
 */
export function calculateEnergyCurve(buffer: AudioBuffer, segments: number = 200): number[] {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / segments);
    const curve: number[] = [];

    for (let i = 0; i < segments; i++) {
        const start = i * blockSize;
        let sumSquares = 0;
        let count = 0;

        for (let j = 0; j < blockSize; j += 8) {
            const sample = channelData[start + j];
            sumSquares += sample * sample;
            count++;
        }

        const rms = Math.sqrt(sumSquares / count);
        curve.push(rms);
    }

    // Normalize to 0-1
    const maxEnergy = Math.max(...curve, 0.001);
    return curve.map(v => v / maxEnergy);
}
