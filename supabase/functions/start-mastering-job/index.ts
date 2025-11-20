import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BACKEND_URL = 'https://mastering-backend-azkp62xtaq-uc.a.run.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract user's JWT from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const userJWT = authHeader.replace('Bearer ', '').trim()
    if (!userJWT) throw new Error('Token is empty')

    // 2. Verify user is authenticated using Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(userJWT)
    if (authError || !user) {
      console.error('Auth verification failed:', authError)
      throw new Error('Unauthorized: Invalid user token')
    }

    console.log('✅ User authenticated:', user.id)

    // 3. Get backend API token
    const BACKEND_API_TOKEN = Deno.env.get('SPECTRUM_BACKEND_API_TOKEN')
    if (!BACKEND_API_TOKEN) {
      throw new Error('SPECTRUM_BACKEND_API_TOKEN not configured')
    }

    // 4. Get request body
    const body = await req.json()
    console.log('📥 Starting mastering job with paths:', {
      target: body.targetGcsPath,
      reference: body.referenceGcsPath
    })

    // 5. Load GCS configuration to generate signed URLs
    const bucketName = Deno.env.get('GOOGLE_CLOUD_BUCKET_NAME')
    const credentialsJSON = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    
    if (!bucketName || !credentialsJSON) {
      throw new Error('Missing Google Cloud Storage configuration')
    }

    const credentials = JSON.parse(credentialsJSON)
    console.log('✅ GCS credentials loaded')

    // 6. Generate signed URLs for target and reference files
    console.log('🔑 Generating signed URLs for GCS files...')
    
    const targetSignedUrl = await generateSignedUrl({
      bucketName,
      fileName: body.targetGcsPath,
      method: 'GET',
      contentType: 'audio/wav',
      expirationMinutes: 60,
      credentials
    })

    const referenceSignedUrl = await generateSignedUrl({
      bucketName,
      fileName: body.referenceGcsPath,
      method: 'GET',
      contentType: 'audio/wav',
      expirationMinutes: 60,
      credentials
    })

    console.log('✅ Signed URLs generated')

    // 7. Prepare backend payload with signed URLs
    const backendPayload = {
      targetUrl: targetSignedUrl,
      referenceUrl: referenceSignedUrl,
      fileName: body.targetGcsPath?.split('/').pop() || 'output.wav',
      settings: body.settings || {}
    }

    console.log('🚀 Calling backend /api/master-audio')

    // 8. Call backend with signed URLs
    const response = await fetch(`${BACKEND_URL}/api/master-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BACKEND_API_TOKEN}`
      },
      body: JSON.stringify(backendPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Backend error:', response.status, errorText)
      throw new Error(`Backend error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Backend response:', data)
    
    // Map backend response to expected frontend format
    const frontendResponse = {
      jobId: data.jobId,
      status: 'completed',
      downloadUrl: data.masteredUrl
    }
    
    console.log('✅ Mastering complete, returning result')
    
    return new Response(JSON.stringify(frontendResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('💥 Edge Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Generate a signed URL for Google Cloud Storage using V4 signing
 */
async function generateSignedUrl(params: {
  bucketName: string
  fileName: string
  method: string
  contentType: string
  expirationMinutes: number
  credentials: any
}): Promise<string> {
  const { bucketName, fileName, method, contentType, expirationMinutes, credentials } = params

  try {
    console.log('🔐 Generating signed URL using V4 signing...')
    console.log(`   Bucket: ${bucketName}`)
    console.log(`   File: ${fileName}`)
    console.log(`   Method: ${method}`)
    
    // 1. Prepare signing parameters
    const expirationSeconds = expirationMinutes * 60
    const now = new Date()
    const nowISO = now.toISOString().split('.')[0] + 'Z'
    const datestamp = now.toISOString().split('T')[0].replace(/-/g, '')
    
    // 2. Create credential scope
    const credentialScope = `${datestamp}/auto/storage/goog4_request`
    const credential = `${credentials.client_email}/${credentialScope}`
    
    // 3. Build canonical request
    const canonicalUri = `/${bucketName}/${fileName}`
    const canonicalQueryString = [
      `X-Goog-Algorithm=GOOG4-RSA-SHA256`,
      `X-Goog-Credential=${encodeURIComponent(credential)}`,
      `X-Goog-Date=${datestamp}T${now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '')}Z`,
      `X-Goog-Expires=${expirationSeconds}`,
      `X-Goog-SignedHeaders=host`
    ].join('&')
    
    const canonicalHeaders = `host:storage.googleapis.com\n`
    const signedHeaders = 'host'
    
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD'
    ].join('\n')
    
    console.log('📝 Canonical request created')
    
    // 4. Create string to sign
    const canonicalRequestHash = await sha256(canonicalRequest)
    const stringToSign = [
      'GOOG4-RSA-SHA256',
      `${datestamp}T${now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '')}Z`,
      credentialScope,
      canonicalRequestHash
    ].join('\n')
    
    console.log('🔑 String to sign created')
    
    // 5. Sign the string
    const privateKey = credentials.private_key
    const keyData = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(privateKey),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )
    
    const encoder = new TextEncoder()
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyData,
      encoder.encode(stringToSign)
    )
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    console.log('✅ Signature generated')
    
    // 6. Build final signed URL
    const signedUrl = `https://storage.googleapis.com${canonicalUri}?${canonicalQueryString}&X-Goog-Signature=${signatureHex}`
    
    console.log('✅ Signed URL generated successfully')
    return signedUrl

  } catch (error) {
    console.error('❌ Error generating signed URL:', error)
    throw error
  }
}

/**
 * SHA256 hash function
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert PEM private key to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  try {
    // Remove PEM headers and footers, and all whitespace
    const pemContents = pem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
      .replace(/-----END RSA PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '')  // Remove all whitespace including \n, \r, spaces, tabs
      .trim()
    
    console.log('🔐 Processing private key...')
    console.log(`   Key length after cleanup: ${pemContents.length} chars`)
    
    // Decode base64 to binary
    const binaryString = atob(pemContents)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    console.log('✅ Private key converted to ArrayBuffer successfully')
    return bytes.buffer
    
  } catch (error) {
    console.error('❌ Error converting PEM to ArrayBuffer:', error)
    throw new Error(`Failed to process private key: ${error.message}`)
  }
}
