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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription")
      .eq("id", user.id)
      .single();

    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle(); // Use maybeSingle to handle cases where user has no role

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

    // NOTE: This Edge Function is DEPRECATED.
    // The backend now uses a job-based flow where:
    // 1. Frontend uploads files directly to GCS using signed URLs
    // 2. Frontend calls /api/start-mastering-job with GCS paths
    // 3. Backend processes in background and updates Firestore
    // 
    // Use masteringService.ts in the frontend instead of this Edge Function.
    
    // For backward compatibility, return error indicating migration needed
    return new Response(
      JSON.stringify({
        error: "This Edge Function is deprecated. Please use the masteringService.ts in the frontend which implements the job-based flow. The backend no longer accepts direct file uploads.",
        migrationGuide: "Use masteringService.masterAudio() which handles upload to GCS and job management automatically."
      }),
      {
        status: 410, // Gone - indicates resource is no longer available
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
