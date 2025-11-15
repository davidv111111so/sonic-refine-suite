/**
 * AI Mastering Integration Tests
 * 
 * Este archivo contiene tests y funciones helper para validar
 * la integración completa del sistema de AI Mastering con GCS.
 * 
 * Uso:
 * 1. En desarrollo: Usa el componente <MasteringDebugPanel />
 * 2. En browser console: Ejecuta las funciones test individuales
 * 3. Automated testing: Importa y ejecuta los tests
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: number;
}

interface UploadUrlResponse {
  uploadUrl: string;
  downloadUrl: string;
  fileName: string;
  bucket: string;
  metadata: {
    originalFileName: string;
    fileType: string;
    userId: string;
    timestamp: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function logStep(emoji: string, message: string, data?: any) {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log('   Data:', data);
  }
}

function createTestResult(
  success: boolean,
  message: string,
  data?: any,
  error?: string
): TestResult {
  return {
    success,
    message,
    data,
    error,
    timestamp: Date.now(),
  };
}

// ============================================================================
// TEST 1: Generar Upload URL (Edge Function)
// ============================================================================

export async function testGenerateUploadUrl(): Promise<TestResult> {
  try {
    logStep('🧪', 'Test: Generate Upload URL');
    
    // Step 1: Verificar autenticación
    logStep('🔐', 'Checking authentication...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      throw new Error('User not authenticated. Please login first.');
    }
    
    logStep('✅', 'User authenticated', {
      userId: sessionData.session.user.id,
      email: sessionData.session.user.email,
    });
    
    // Step 2: Llamar a la Edge Function
    logStep('📡', 'Calling generate-upload-url Edge Function...');
    
    const testFileName = `test-audio-${Date.now()}.wav`;
    const { data, error } = await supabase.functions.invoke<UploadUrlResponse>(
      'generate-upload-url',
      {
        body: {
          fileName: testFileName,
          fileType: 'audio/wav',
          fileSize: 1024000, // 1MB
        },
      }
    );
    
    if (error) {
      throw new Error(`Edge Function error: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from Edge Function');
    }
    
    // Step 3: Validar respuesta
    logStep('🔍', 'Validating response...');
    
    const requiredFields = ['uploadUrl', 'downloadUrl', 'fileName', 'bucket'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields in response: ${missingFields.join(', ')}`);
    }
    
    if (!data.uploadUrl.startsWith('https://storage.googleapis.com/')) {
      throw new Error('Invalid uploadUrl format');
    }
    
    if (!data.downloadUrl.startsWith('https://storage.googleapis.com/')) {
      throw new Error('Invalid downloadUrl format');
    }
    
    logStep('✅', 'Upload URL generated successfully', {
      fileName: data.fileName,
      bucket: data.bucket,
      uploadUrlLength: data.uploadUrl.length,
      downloadUrlLength: data.downloadUrl.length,
    });
    
    return createTestResult(true, 'Generate Upload URL test passed', data);
    
  } catch (error) {
    logStep('❌', 'Test failed', error);
    return createTestResult(
      false,
      'Generate Upload URL test failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// TEST 2: Upload a GCS
// ============================================================================

export async function testUploadToGCS(): Promise<TestResult> {
  try {
    logStep('🧪', 'Test: Upload to GCS');
    
    // Step 1: Generar upload URL
    logStep('📡', 'Generating upload URL...');
    const urlResult = await testGenerateUploadUrl();
    
    if (!urlResult.success || !urlResult.data) {
      throw new Error('Failed to generate upload URL');
    }
    
    const { uploadUrl } = urlResult.data as UploadUrlResponse;
    
    // Step 2: Crear un archivo de prueba (blob de audio falso)
    logStep('📝', 'Creating test audio file...');
    
    // Crear un WAV header mínimo válido (44 bytes header + algunos datos)
    const createTestWav = () => {
      const numChannels = 2;
      const sampleRate = 44100;
      const bitsPerSample = 16;
      const duration = 1; // 1 segundo
      const numSamples = sampleRate * duration;
      const dataSize = numSamples * numChannels * (bitsPerSample / 8);
      
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);
      
      // RIFF header
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + dataSize, true); // File size - 8
      view.setUint32(8, 0x57415645, false); // "WAVE"
      
      // fmt chunk
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true); // Chunk size
      view.setUint16(20, 1, true); // Audio format (PCM)
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // Byte rate
      view.setUint16(32, numChannels * (bitsPerSample / 8), true); // Block align
      view.setUint16(34, bitsPerSample, true);
      
      // data chunk
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, dataSize, true);
      
      // Fill with silence (zeros)
      for (let i = 44; i < buffer.byteLength; i++) {
        view.setUint8(i, 0);
      }
      
      return new Blob([buffer], { type: 'audio/wav' });
    };
    
    const testAudioBlob = createTestWav();
    logStep('✅', 'Test audio file created', {
      size: testAudioBlob.size,
      type: testAudioBlob.type,
    });
    
    // Step 3: Subir a GCS
    logStep('☁️', 'Uploading to Google Cloud Storage...');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'audio/wav',
      },
      body: testAudioBlob,
    });
    
    if (!uploadResponse.ok) {
      throw new Error(
        `Upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`
      );
    }
    
    logStep('✅', 'File uploaded successfully to GCS', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
    });
    
    return createTestResult(true, 'Upload to GCS test passed', {
      fileSize: testAudioBlob.size,
      uploadStatus: uploadResponse.status,
    });
    
  } catch (error) {
    logStep('❌', 'Test failed', error);
    return createTestResult(
      false,
      'Upload to GCS test failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// TEST 3: Backend Connection
// ============================================================================

export async function testBackendConnection(
  backendUrl?: string
): Promise<TestResult> {
  try {
    logStep('🧪', 'Test: Backend Connection');
    
    // Usar URL del environment o fallback
    const url =
      backendUrl ||
      import.meta.env.VITE_PYTHON_BACKEND_URL ||
      'https://spectrum-backend-857351913435.us-central1.run.app';
    
    logStep('🌐', 'Testing backend URL:', url);
    
    // Step 1: Test de health check (si existe)
    logStep('💓', 'Checking backend health...');
    
    try {
      const healthResponse = await fetch(`${url}/health`, {
        method: 'GET',
      });
      
      logStep('✅', 'Health check endpoint exists', {
        status: healthResponse.status,
      });
    } catch (error) {
      logStep('⚠️', 'Health check endpoint not found (optional)');
    }
    
    // Step 2: Test de endpoint de mastering (con datos de prueba)
    logStep('📡', 'Testing /api/master-audio endpoint...');
    
    const testPayload = {
      inputUrl: 'https://storage.googleapis.com/spectrum-mastering-files-857351913435/audio-uploads/test/test.wav',
      fileName: 'test-file.wav',
      settings: {
        targetLoudness: -14,
        compressionRatio: 4,
        eqProfile: 'neutral',
        stereoWidth: 100,
      },
    };
    
    const masterResponse = await fetch(`${url}/api/master-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    
    // Nota: Es posible que falle porque el archivo de prueba no existe,
    // pero lo importante es que el endpoint responda
    logStep('📊', 'Backend responded', {
      status: masterResponse.status,
      statusText: masterResponse.statusText,
    });
    
    if (masterResponse.status === 404) {
      throw new Error('Backend endpoint /api/master-audio not found');
    }
    
    // Si responde con 500, es probable que el archivo de prueba no exista,
    // pero el endpoint sí existe
    if (masterResponse.status >= 400 && masterResponse.status < 500) {
      const errorData = await masterResponse.json();
      logStep('⚠️', 'Backend responded with error (expected for test data)', errorData);
    }
    
    logStep('✅', 'Backend is accessible and /api/master-audio endpoint exists');
    
    return createTestResult(true, 'Backend connection test passed', {
      backendUrl: url,
      status: masterResponse.status,
    });
    
  } catch (error) {
    logStep('❌', 'Test failed', error);
    return createTestResult(
      false,
      'Backend connection test failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// TEST 4: Full Mastering Flow (End-to-End)
// ============================================================================

export async function testFullMasteringFlow(): Promise<TestResult> {
  try {
    logStep('🧪', 'Test: Full Mastering Flow (End-to-End)');
    
    // Step 1: Generate upload URL
    logStep('1️⃣', 'Step 1: Generating upload URL...');
    const urlResult = await testGenerateUploadUrl();
    
    if (!urlResult.success || !urlResult.data) {
      throw new Error('Failed to generate upload URL');
    }
    
    const { uploadUrl, downloadUrl, fileName } = urlResult.data as UploadUrlResponse;
    logStep('✅', 'Upload URL generated');
    
    // Step 2: Upload test file to GCS
    logStep('2️⃣', 'Step 2: Uploading test file to GCS...');
    const uploadResult = await testUploadToGCS();
    
    if (!uploadResult.success) {
      throw new Error('Failed to upload file to GCS');
    }
    
    logStep('✅', 'File uploaded to GCS');
    
    // Step 3: Call backend for mastering
    logStep('3️⃣', 'Step 3: Calling backend for mastering...');
    
    const backendUrl =
      import.meta.env.VITE_PYTHON_BACKEND_URL ||
      'https://spectrum-backend-857351913435.us-central1.run.app';
    
    const masteringPayload = {
      inputUrl: downloadUrl,
      fileName: fileName,
      settings: {
        targetLoudness: -14,
        compressionRatio: 4,
        eqProfile: 'neutral' as const,
        stereoWidth: 100,
      },
    };
    
    const masteringResponse = await fetch(`${backendUrl}/api/master-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(masteringPayload),
    });
    
    if (!masteringResponse.ok) {
      const errorText = await masteringResponse.text();
      throw new Error(`Mastering failed: ${masteringResponse.status} - ${errorText}`);
    }
    
    const masteringData = await masteringResponse.json();
    logStep('✅', 'Mastering completed', masteringData);
    
    // Step 4: Verify mastered file URL
    logStep('4️⃣', 'Step 4: Verifying mastered file URL...');
    
    if (!masteringData.success || !masteringData.masteredUrl) {
      throw new Error('Backend did not return a valid mastered URL');
    }
    
    // Opcional: Intentar descargar el archivo masterizado (HEAD request)
    const headResponse = await fetch(masteringData.masteredUrl, {
      method: 'HEAD',
    });
    
    if (!headResponse.ok) {
      throw new Error('Mastered file URL is not accessible');
    }
    
    logStep('✅', 'Mastered file is accessible', {
      contentType: headResponse.headers.get('content-type'),
      contentLength: headResponse.headers.get('content-length'),
    });
    
    logStep('🎉', 'Full mastering flow completed successfully!');
    
    return createTestResult(true, 'Full mastering flow test passed', {
      originalFile: fileName,
      masteredUrl: masteringData.masteredUrl,
      jobId: masteringData.jobId,
      processingTime: masteringData.processingTime,
    });
    
  } catch (error) {
    logStep('❌', 'Test failed', error);
    return createTestResult(
      false,
      'Full mastering flow test failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// TEST RUNNER: Ejecutar todos los tests
// ============================================================================

export async function runAllTests(): Promise<TestResult[]> {
  logStep('🚀', '=== Starting All Tests ===');
  
  const results: TestResult[] = [];
  
  // Test 1
  logStep('', '');
  results.push(await testGenerateUploadUrl());
  
  // Test 2
  logStep('', '');
  results.push(await testUploadToGCS());
  
  // Test 3
  logStep('', '');
  results.push(await testBackendConnection());
  
  // Test 4 (solo si todos los anteriores pasaron)
  const allPassed = results.every(r => r.success);
  if (allPassed) {
    logStep('', '');
    results.push(await testFullMasteringFlow());
  } else {
    logStep('⚠️', 'Skipping full flow test due to previous failures');
  }
  
  // Summary
  logStep('', '');
  logStep('📊', '=== Test Summary ===');
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  
  logStep(
    passed === results.length ? '✅' : '⚠️',
    `Tests passed: ${passed}/${results.length}`
  );
  
  if (failed > 0) {
    logStep('❌', `Tests failed: ${failed}/${results.length}`);
    results.forEach((result, index) => {
      if (!result.success) {
        logStep('  ', `Test ${index + 1}: ${result.message}`, result.error);
      }
    });
  }
  
  return results;
}

// ============================================================================
// EXPORT FOR BROWSER CONSOLE
// ============================================================================

// Para usar en browser console:
if (typeof window !== 'undefined') {
  (window as any).aiMasteringTests = {
    testGenerateUploadUrl,
    testUploadToGCS,
    testBackendConnection,
    testFullMasteringFlow,
    runAllTests,
  };
  
  console.log('✅ AI Mastering tests loaded!');
  console.log('Usage in console:');
  console.log('  aiMasteringTests.testGenerateUploadUrl()');
  console.log('  aiMasteringTests.testUploadToGCS()');
  console.log('  aiMasteringTests.testBackendConnection()');
  console.log('  aiMasteringTests.testFullMasteringFlow()');
  console.log('  aiMasteringTests.runAllTests()');
}
