import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    console.log('User authenticated:', user.id)

    // 3. Get backend API token
    const BACKEND_API_TOKEN = Deno.env.get('SPECTRUM_BACKEND_API_TOKEN')
    if (!BACKEND_API_TOKEN) {
      throw new Error('SPECTRUM_BACKEND_API_TOKEN not configured')
    }

    // 4. Call backend with API token (not user JWT)
    const body = await req.json()
    console.log('Starting mastering job...')

    const response = await fetch(`${BACKEND_URL}/api/start-mastering-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BACKEND_API_TOKEN}`
      },
      body: JSON.stringify(body),
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
