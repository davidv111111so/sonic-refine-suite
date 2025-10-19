import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
const BACKEND_URL = 'https://mastering-backend-857351913435.us-central1.run.app'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // This handles the CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  // Get the Authorization header from the incoming request
  const userAuthHeader = req.headers.get('Authorization')

  // --- TEMPORARY DEBUG LOGIC ---
  // Call the new debug endpoint and forward the auth header
  const response = await fetch(`${BACKEND_URL}/api/debug-headers`, {
    method: 'POST', // Use POST to simulate the real request
    headers: {
      'Content-Type': 'application/json',
      // Pass the user's auth header to the debug endpoint
      'Authorization': userAuthHeader || '',
    },
    body: JSON.stringify({ message: "Debug call from Edge Function" }),
  })

  const data = await response.json()

  // Return the response from the debug endpoint directly to the frontend
  return new Response(JSON.stringify(data), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status: response.status
  })
})