import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check premium status - CRITICAL SECURITY CHECK
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription")
      .eq("id", user.id)
      .single();

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isPremium =
      profile?.subscription === "premium" || userRole?.role === "admin";

    if (!isPremium) {
      return new Response(
        JSON.stringify({
          error: "Premium subscription required for AI mastering",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const targetFile = formData.get("target");
    const referenceFile = formData.get("reference");
    const presetId = formData.get("preset_id");

    if (!targetFile) {
      return new Response(
        JSON.stringify({ error: "Target file is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Forward request to Matchering backend
    const MATCHERING_API_URL =
      Deno.env.get("MATCHERING_API_URL") ||
      "https://mastering-backend-857351913435.us-central1.run.app";
    const backendUrl = `${MATCHERING_API_URL}/api/ai-mastering`;

    // Rebuild form data for proxying
    const proxiedForm = new FormData();
    if (targetFile && targetFile instanceof File)
      proxiedForm.append("target", targetFile, (targetFile as File).name);
    if (referenceFile && referenceFile instanceof File)
      proxiedForm.append(
        "reference",
        referenceFile,
        (referenceFile as File).name
      );
    if (presetId) proxiedForm.append("preset_id", String(presetId));

    // Forward Authorization header so backend API key check can see it
    const auth = req.headers.get("Authorization") || "";

    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: auth ? { Authorization: auth } : undefined,
      body: proxiedForm,
    });

    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        ...corsHeaders,
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (error: any) {
    console.error("AI Mastering error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
