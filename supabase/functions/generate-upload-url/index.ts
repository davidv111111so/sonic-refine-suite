import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Storage } from 'https://esm.sh/@google-cloud/storage@7.7.0'

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
      throw new Error('Server configuration error: Missing Google Cloud credentials')
    }

    console.log('🔧 GCS Configuration:', { projectId, bucketName })

    // 4. Parse credentials JSON
    let credentials
    try {
      credentials = JSON.parse(credentialsJSON)
      console.log('✅ Credentials parsed successfully')
    } catch (error) {
      console.error('❌ Failed to parse credentials JSON:', error)
      throw new Error('Invalid Google Cloud credentials format')
    }

    // 5. Initialize Google Cloud Storage client
    const storage = new Storage({
      projectId: projectId,
      credentials: credentials
    })

    console.log('✅ Google Cloud Storage client initialized')

    // 6. Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFileName = `audio-uploads/${user.id}/${timestamp}-${sanitizedFileName}`

    console.log('📁 Generated unique filename:', uniqueFileName)

    // 7. Get bucket reference
    const bucket = storage.bucket(bucketName)

    // 8. Generate signed URL for upload (PUT, 1 hour)
    const uploadOptions = {
      version: 'v4' as const,
      action: 'write' as const,
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      contentType: fileType,
    }

    const [uploadUrl] = await bucket.file(uniqueFileName).getSignedUrl(uploadOptions)
    console.log('✅ Upload URL generated (valid for 1 hour)')

    // 9. Generate signed URL for download (GET, 24 hours)
    const downloadOptions = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }

    const [downloadUrl] = await bucket.file(uniqueFileName).getSignedUrl(downloadOptions)
    console.log('✅ Download URL generated (valid for 24 hours)')

    // 10. Prepare response
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
