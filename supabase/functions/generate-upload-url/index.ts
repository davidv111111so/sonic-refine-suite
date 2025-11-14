import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting generate-upload-url function')

    // 1. Authenticate user with Supabase
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Missing Authorization header')
      throw new Error('Missing Authorization header')
    }

    const userJWT = authHeader.replace('Bearer ', '').trim()
    if (!userJWT) {
      console.error('❌ Empty JWT token')
      throw new Error('Empty JWT token')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(userJWT)
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message)
      throw new Error(`Unauthorized: ${authError?.message || 'Invalid user token'}`)
    }

    console.log('✅ User authenticated:', user.id)

    // 2. Parse and validate request body
    const body = await req.json()
    const { fileName, fileType, fileSize } = body

    if (!fileName || !fileType) {
      console.error('❌ Missing required parameters:', { fileName, fileType })
      throw new Error('Missing required parameters: fileName and fileType are required')
    }

    console.log('📝 Request parameters:', { fileName, fileType, fileSize })

    // 3. Load Google Cloud credentials
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')
    const bucketName = Deno.env.get('GOOGLE_CLOUD_BUCKET_NAME')
    const credentialsJSON = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS_JSON')

    if (!projectId || !bucketName || !credentialsJSON) {
      console.error('❌ Missing Google Cloud configuration')
      console.error('Available env vars:', {
        hasProjectId: !!projectId,
        hasBucketName: !!bucketName,
        hasCredentials: !!credentialsJSON
      })
      throw new Error('Server configuration error: Missing Google Cloud credentials')
    }

    console.log('✅ GCS Configuration loaded:', { 
      projectId, 
      bucketName,
      credentialsLength: credentialsJSON.length 
    })

    // 4. Parse credentials JSON
    let credentials
    try {
      credentials = JSON.parse(credentialsJSON)
      console.log('✅ Credentials parsed successfully')
      console.log('   Client email:', credentials.client_email)
    } catch (error) {
      console.error('❌ Failed to parse credentials JSON:', error)
      throw new Error('Invalid Google Cloud credentials format')
    }

    // 5. Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFileName = `audio-uploads/${user.id}/${timestamp}-${sanitizedFileName}`

    console.log('📁 Generated unique filename:', uniqueFileName)

    // 6. Generate signed URLs using Google Cloud Storage REST API
    console.log('🔑 Generating signed URLs...')
    
    const uploadUrl = await generateSignedUrl({
      bucketName,
      fileName: uniqueFileName,
      method: 'PUT',
      contentType: fileType,
      expirationMinutes: 60,
      credentials
    })

    console.log('✅ Upload URL generated (valid for 1 hour)')

    const downloadUrl = await generateSignedUrl({
      bucketName,
      fileName: uniqueFileName,
      method: 'GET',
      contentType: fileType,
      expirationMinutes: 1440, // 24 hours
      credentials
    })

    console.log('✅ Download URL generated (valid for 24 hours)')

    // 7. Prepare response
    const response = {
      uploadUrl,
      downloadUrl,
      fileName: uniqueFileName,
      bucket: bucketName,
      expiresIn: {
        upload: '1 hour',
        download: '24 hours'
      },
      metadata: {
        originalFileName: fileName,
        fileType,
        fileSize,
        userId: user.id,
        timestamp
      }
    }

    console.log('🎉 Signed URLs generated successfully')

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    })

  } catch (error) {
    console.error('💥 Error in generate-upload-url:', error.message)
    console.error('Stack trace:', error.stack)

    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate signed URLs for Google Cloud Storage'
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
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
    
    // Log the first and last few characters for debugging (without exposing the full key)
    console.log('🔐 Processing private key...')
    console.log(`   Key length after cleanup: ${pemContents.length} chars`)
    console.log(`   First 20 chars: ${pemContents.substring(0, 20)}`)
    console.log(`   Last 20 chars: ${pemContents.substring(pemContents.length - 20)}`)
    
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
    console.error('   PEM format check:')
    console.error('   - Has BEGIN marker:', pem.includes('BEGIN PRIVATE KEY'))
    console.error('   - Has END marker:', pem.includes('END PRIVATE KEY'))
    console.error('   - Length:', pem.length)
    throw new Error(`Failed to process private key: ${error.message}`)
  }
}

