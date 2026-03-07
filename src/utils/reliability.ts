/**
 * Reliability Utilities — App Crash Prevention
 * 
 * Based on NotebookLM research from Level Mixer (66 sources):
 * - Memory leak prevention (URL.revokeObjectURL tracking)
 * - Storage quota monitoring before IndexedDB writes
 * - Memory pressure warnings (performance.memory API)
 * - Safe Tone.js disposal with error boundaries
 * - Graceful degradation for Web Audio failures
 */

// ─── Blob URL Tracker (prevents memory leaks) ───
const activeBlobUrls = new Set<string>();

export function createTrackedBlobUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    activeBlobUrls.add(url);
    return url;
}

export function revokeTrackedBlobUrl(url: string): void {
    if (activeBlobUrls.has(url)) {
        URL.revokeObjectURL(url);
        activeBlobUrls.delete(url);
    }
}

export function revokeAllBlobUrls(): void {
    activeBlobUrls.forEach(url => {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    });
    activeBlobUrls.clear();
    console.log(`[Reliability] Revoked ${activeBlobUrls.size} blob URLs`);
}

export function getActiveBlobCount(): number {
    return activeBlobUrls.size;
}

// ─── Storage Quota Check ───
export async function checkStorageQuota(): Promise<{
    available: boolean;
    usage: number;
    quota: number;
    percentUsed: number;
}> {
    try {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

            return {
                available: percentUsed < 90, // Block if >90% used
                usage,
                quota,
                percentUsed,
            };
        }
    } catch (e) {
        console.warn('[Reliability] Storage API not available');
    }

    return { available: true, usage: 0, quota: 0, percentUsed: 0 };
}

export async function canSaveToStorage(sizeBytes: number): Promise<boolean> {
    const quota = await checkStorageQuota();
    if (!quota.available) {
        console.warn(`[Reliability] Storage nearly full (${quota.percentUsed.toFixed(1)}%)`);
        return false;
    }
    // Check if the new data would push us over 90%
    if (quota.quota > 0) {
        const newPercent = ((quota.usage + sizeBytes) / quota.quota) * 100;
        return newPercent < 90;
    }
    return true;
}

// ─── Memory Pressure Monitor ───
interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

export type MemoryPressureLevel = 'normal' | 'warning' | 'critical';

export function getMemoryPressure(): { level: MemoryPressureLevel; percent: number; details: string } {
    const perf = performance as any;
    if (!perf.memory) {
        return { level: 'normal', percent: 0, details: 'Memory API not available' };
    }

    const mem: MemoryInfo = perf.memory;
    const percent = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;

    let level: MemoryPressureLevel = 'normal';
    let details = '';

    if (percent > 85) {
        level = 'critical';
        details = `CRITICAL: ${percent.toFixed(1)}% heap used (${formatBytes(mem.usedJSHeapSize)} / ${formatBytes(mem.jsHeapSizeLimit)})`;
    } else if (percent > 70) {
        level = 'warning';
        details = `WARNING: ${percent.toFixed(1)}% heap used`;
    } else {
        details = `${percent.toFixed(1)}% heap used`;
    }

    return { level, percent, details };
}

// ─── Safe Tone.js Disposal ───
export function safeDispose(node: any, label: string = 'unknown'): void {
    if (!node) return;
    try {
        if (typeof node.dispose === 'function') {
            node.dispose();
        }
    } catch (error) {
        console.warn(`[Reliability] Failed to dispose ${label}:`, error);
    }
}

export function safeDisconnect(node: any, label: string = 'unknown'): void {
    if (!node) return;
    try {
        if (typeof node.disconnect === 'function') {
            node.disconnect();
        }
    } catch (error) {
        console.warn(`[Reliability] Failed to disconnect ${label}:`, error);
    }
}

// ─── Graceful Audio Context Recovery ───
export async function ensureAudioContext(context: AudioContext): Promise<boolean> {
    if (!context) return false;

    if (context.state === 'suspended') {
        try {
            await context.resume();
            return true;
        } catch (e) {
            console.error('[Reliability] Cannot resume AudioContext:', e);
            return false;
        }
    }

    if (context.state === 'closed') {
        console.error('[Reliability] AudioContext is closed. Creating new one.');
        return false; // Caller should create a new context
    }

    return true;
}

// ─── HTML5 Audio Fallback ───
export function createFallbackAudio(src: string): HTMLAudioElement {
    console.warn('[Reliability] Falling back to HTML5 <audio> element');
    const audio = new Audio(src);
    audio.crossOrigin = 'anonymous';
    return audio;
}

// ─── GPU Job Priority Queue Types ───
export type JobPriority = 'studio' | 'pro' | 'trial' | 'basic';

export interface GPUJob {
    id: string;
    userId: string;
    type: 'mastering' | 'stem_separation' | 'enhancement';
    priority: JobPriority;
    createdAt: Date;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    fileUrl: string;
    resultUrl?: string;
    estimatedDuration?: number; // seconds
}

export function getJobPriorityWeight(priority: JobPriority): number {
    switch (priority) {
        case 'studio': return 4;
        case 'pro': return 3;
        case 'trial': return 2;
        case 'basic': return 1;
    }
}

export function sortJobsByPriority(jobs: GPUJob[]): GPUJob[] {
    return [...jobs].sort((a, b) => {
        const weightDiff = getJobPriorityWeight(b.priority) - getJobPriorityWeight(a.priority);
        if (weightDiff !== 0) return weightDiff;
        return a.createdAt.getTime() - b.createdAt.getTime(); // FIFO within same priority
    });
}

// ─── Helpers ───
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
    return `${(bytes / 1073741824).toFixed(1)}GB`;
}

// ─── Cleanup Registry ───
// Use this in React components to register cleanup functions
const cleanupRegistry = new Map<string, Array<() => void>>();

export function registerCleanup(componentId: string, cleanup: () => void): void {
    if (!cleanupRegistry.has(componentId)) {
        cleanupRegistry.set(componentId, []);
    }
    cleanupRegistry.get(componentId)!.push(cleanup);
}

export function runCleanup(componentId: string): void {
    const cleanups = cleanupRegistry.get(componentId);
    if (cleanups) {
        cleanups.forEach(fn => {
            try { fn(); } catch { /* ignore */ }
        });
        cleanupRegistry.delete(componentId);
    }
}

export function runAllCleanups(): void {
    cleanupRegistry.forEach((cleanups, id) => {
        cleanups.forEach(fn => {
            try { fn(); } catch { /* ignore */ }
        });
    });
    cleanupRegistry.clear();
}
