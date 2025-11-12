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
 * Generate a signed URL for Google Cloud Storage using REST API
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
    // 1. Get OAuth2 access token
    console.log('📡 Requesting OAuth2 token...')
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(credentials)
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ OAuth2 token request failed:', errorText)
      throw new Error(`Failed to get OAuth2 token: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    
    console.log('✅ OAuth2 token obtained')

    // 2. Generate signed URL using Cloud Storage API
    const expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString()
    
    const signedUrlResponse = await fetch(
      `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}/generateSignedUrl`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: method,
          expiration: expirationTime,
          contentType: method === 'PUT' ? contentType : undefined,
        })
      }
    )

    if (!signedUrlResponse.ok) {
      const errorText = await signedUrlResponse.text()
      console.error('❌ Signed URL generation failed:', errorText)
      throw new Error(`Failed to generate signed URL: ${errorText}`)
    }

    const signedUrlData = await signedUrlResponse.json()
    return signedUrlData.signedUrl

  } catch (error) {
    console.error('❌ Error generating signed URL:', error)
    throw error
  }
}

/**
 * Create a JWT for Google Cloud authentication
 */
async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/devstorage.full_control',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signatureInput = `${encodedHeader}.${encodedPayload}`

  // Import the private key
  const privateKey = credentials.private_key.replace(/\\n/g, '\n')
  
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

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyData,
    new TextEncoder().encode(signatureInput)
  )

  const encodedSignature = base64UrlEncode(signature)
  return `${signatureInput}.${encodedSignature}`
}

/**
 * Convert PEM private key to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  const binaryString = atob(pemContents)
  const bytes = new Uint8Array(binaryString.length)
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  return bytes.buffer
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string
  
  if (typeof data === 'string') {
    base64 = btoa(data)
  } else {
    const bytes = new Uint8Array(data)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    base64 = btoa(binary)
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
