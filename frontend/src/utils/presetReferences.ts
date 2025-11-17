/**
 * Genre Preset Reference File Loader
 * 
 * This module handles loading reference audio files for genre-based presets
 * from Google Cloud Storage.
 */

const BUCKET_NAME = 'level-audio-mastering';
const REFERENCES_PATH = 'references';

// Mapping of preset IDs to their reference file names
const PRESET_REFERENCES: Record<string, string> = {
  'flat': 'flat-reference.wav',
  'bass-boost': 'bass-boost-reference.wav',
  'treble-boost': 'treble-boost-reference.wav',
  'jazz': 'jazz-reference.wav',
  'classical': 'classical-reference.wav',
  'electronic': 'electronic-reference.wav',
  'v-shape': 'v-shape-reference.wav',
  'vocal': 'vocal-reference.wav',
  'rock': 'rock-reference.wav',
  'hip-hop': 'hip-hop-reference.wav',
  'podcast': 'podcast-reference.wav',
  'live': 'live-reference.wav',
};

// Cache for downloaded reference files
const referenceCache = new Map<string, File>();

/**
 * Load a preset reference file from Google Cloud Storage
 * @param presetId The preset identifier (e.g., 'rock', 'jazz')
 * @returns Promise<File> The reference audio file
 */
export async function loadPresetReferenceFile(presetId: string): Promise<File> {
  // Check cache first
  if (referenceCache.has(presetId)) {
    console.log(`✅ Using cached reference for preset: ${presetId}`);
    return referenceCache.get(presetId)!;
  }

  // Get reference file name
  const fileName = PRESET_REFERENCES[presetId];
  if (!fileName) {
    throw new Error(`Unknown preset: ${presetId}. Please select a valid genre preset.`);
  }

  try {
    // Construct GCS public URL
    const gcsUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${REFERENCES_PATH}/${fileName}`;
    
    console.log(`📥 Downloading reference for preset: ${presetId}`);
    console.log(`   URL: ${gcsUrl}`);

    // Download reference file
    const response = await fetch(gcsUrl);
    
    if (!response.ok) {
      // If public access fails, provide helpful error
      if (response.status === 404) {
        throw new Error(
          `Reference file not found: ${fileName}\n\n` +
          `The genre preset reference files need to be uploaded to Google Cloud Storage.\n` +
          `Please see PRESET_REFERENCE_UPLOAD_GUIDE.md for instructions.`
        );
      } else if (response.status === 403) {
        throw new Error(
          `Access denied to reference file: ${fileName}\n\n` +
          `The reference files may need to be made public or use signed URLs.\n` +
          `Please see PRESET_REFERENCE_UPLOAD_GUIDE.md for instructions.`
        );
      }
      throw new Error(`Failed to download reference: ${response.statusText}`);
    }

    // Convert to blob then File
    const blob = await response.blob();
    const file = new File([blob], fileName, { 
      type: 'audio/wav',
      lastModified: Date.now()
    });

    // Cache for future use
    referenceCache.set(presetId, file);
    console.log(`✅ Reference loaded and cached: ${presetId}`);

    return file;
  } catch (error) {
    console.error(`❌ Error loading preset reference:`, error);
    throw error;
  }
}

/**
 * Preload all reference files for faster access
 * (Optional - call this on app initialization)
 */
export async function preloadAllReferences(): Promise<void> {
  const presetIds = Object.keys(PRESET_REFERENCES);
  console.log(`🔄 Preloading ${presetIds.length} reference files...`);

  const promises = presetIds.map(async (presetId) => {
    try {
      await loadPresetReferenceFile(presetId);
    } catch (error) {
      console.warn(`⚠️ Could not preload reference: ${presetId}`, error);
    }
  });

  await Promise.allSettled(promises);
  console.log(`✅ Reference preloading complete`);
}

/**
 * Clear the reference cache
 */
export function clearReferenceCache(): void {
  referenceCache.clear();
  console.log('🗑️ Reference cache cleared');
}

/**
 * Get list of available presets
 */
export function getAvailablePresets(): string[] {
  return Object.keys(PRESET_REFERENCES);
}

/**
 * Check if a preset exists
 */
export function isValidPreset(presetId: string): boolean {
  return presetId in PRESET_REFERENCES;
}

