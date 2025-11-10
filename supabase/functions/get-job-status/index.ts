import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const BACKEND_URL = 'https://spectrum-backend-857351913435.us-central1.run.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client to verify user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      throw new Error('Missing authorization header')
    }

    console.log('Auth header present, extracting JWT...')
    const jwt = authHeader.replace('Bearer ', '')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify user and get user ID by passing JWT explicitly
    console.log('Verifying user with JWT...')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    
    if (userError) {
      console.error('User verification error:', userError)
      throw new Error(`Auth error: ${userError.message}`)
    }
    
    if (!user) {
      console.error('No user found after verification')
      throw new Error('Unauthorized: No user found')
    }
    
    console.log('User verified:', user.id)

    const { jobId } = await req.json()
    
    // Get backend API token
    const backendToken = Deno.env.get('SPECTRUM_BACKEND_API_TOKEN')
    if (!backendToken) {
      console.error('SPECTRUM_BACKEND_API_TOKEN not configured')
      throw new Error('Backend authentication not configured')
    }

    // Send user ID to backend for identification
    console.log('Calling backend API...')
    const response = await fetch(`${BACKEND_URL}/api/get-job-status/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${backendToken}`,
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
      }
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
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
