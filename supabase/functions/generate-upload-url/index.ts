import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BACKEND_URL = 'https://spectrum-backend-857351913435.us-central1.run.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Robust Token Extraction
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header from client')

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) throw new Error('Token is empty')

    // 2. Call Backend with explicit Bearer format
    const { fileName, fileType } = await req.json()
    console.log(`Requesting upload URL for: ${fileName}`)

    const response = await fetch(`${BACKEND_URL}/api/generate-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Explicitly re-construct the header to guarantee correct format
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fileName, fileType }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      throw new Error(`Backend error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Edge Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
