import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PYTHON_BACKEND_URL = "https://sonic-refine-backend-azkp62xtaq-uc.a.run.app";

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

    const targetUrl = `${PYTHON_BACKEND_URL}${endpoint}`;
    console.log(`Proxying request to: ${targetUrl}`);

    // Forward the request to the Python backend
    const proxyResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // Forward auth if present
        ...(req.headers.get("authorization") && {
          Authorization: req.headers.get("authorization")!,
        }),
      },
      body: req.method !== "GET" ? await req.arrayBuffer() : undefined,
    });

    // Get response body
    const responseBody = await proxyResponse.arrayBuffer();
    
    // Get analysis header if present
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
  } catch (error) {
    console.error("Proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
