import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Try both backend URLs - the .env one and the alternate
const BACKEND_URLS = [
  "https://mastering-backend-azkp62xtaq-uc.a.run.app",
  "https://sonic-refine-backend-azkp62xtaq-uc.a.run.app"
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try each backend URL until one works
    let lastError: Error | null = null;
    
    for (const backendUrl of BACKEND_URLS) {
      const targetUrl = `${backendUrl}${endpoint}`;
      console.log(`Trying backend: ${targetUrl}`);

      try {
        const proxyResponse = await fetch(targetUrl, {
          method: req.method,
          headers: {
            ...(req.headers.get("authorization") && {
              Authorization: req.headers.get("authorization")!,
            }),
            ...(req.headers.get("content-type") && {
              "Content-Type": req.headers.get("content-type")!,
            }),
          },
          body: req.method !== "GET" ? req.body : undefined,
        });

        // If we get a successful response or a non-404 error, use this backend
        if (proxyResponse.ok || proxyResponse.status !== 404) {
          console.log(`Backend ${backendUrl} responded with status: ${proxyResponse.status}`);
          
          const responseBody = await proxyResponse.arrayBuffer();
          const analysisHeader = proxyResponse.headers.get("X-Audio-Analysis");

          const responseHeaders: Record<string, string> = {
            ...corsHeaders,
            "Content-Type": proxyResponse.headers.get("Content-Type") || "application/octet-stream",
          };

          if (analysisHeader) {
            responseHeaders["X-Audio-Analysis"] = analysisHeader;
          }

          return new Response(responseBody, {
            status: proxyResponse.status,
            headers: responseHeaders,
          });
        }
        
        console.log(`Backend ${backendUrl} returned 404, trying next...`);
      } catch (err) {
        console.log(`Backend ${backendUrl} failed: ${err}`);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
    
    // All backends failed
    throw lastError || new Error("All backend URLs returned 404");
  } catch (error) {
    console.error("Proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: errorMessage,
      hint: "The Python backend may not be running. Please ensure it's deployed on Google Cloud Run."
    }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
