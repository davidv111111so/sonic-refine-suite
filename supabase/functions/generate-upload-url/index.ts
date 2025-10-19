import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
const BACKEND_URL = 'https://mastering-backend-857351913435.us-central1.run.app'

// Define CORS headers to be reused
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Allow any origin
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allow these methods
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Allow these headers
}

serve(async (req) => {
  // --- ROBUST OPTIONS HANDLER ---
  // This is the crucial fix. It immediately responds to the preflight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const userAuthHeader = req.headers.get('Authorization')

    // Call the debug endpoint
    const response = await fetch(`${BACKEND_URL}/api/debug-headers`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': userAuthHeader || '',
      },
      body: JSON.stringify({ message: "Debug call from Edge Function" }),
    })
    const data = await response.json()

    // Return the successful response from the debug endpoint
    return new Response(JSON.stringify(data), { 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: response.status 
    })
  } catch (error) {
    // Return an error response if something goes wrong
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
