import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check premium status - CRITICAL SECURITY CHECK
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription')
      .eq('id', user.id)
      .single();

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isPremium = profile?.subscription === 'premium' || userRole?.role === 'admin';

    if (!isPremium) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required for AI mastering' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const targetFile = formData.get('target');
    const referenceFile = formData.get('reference');
    const presetId = formData.get('preset_id');

    if (!targetFile) {
      return new Response(
        JSON.stringify({ error: 'Target file is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Placeholder response - In production, integrate with Matchering backend
    console.log('AI Mastering request:', { 
      userId: user.id, 
      hasReference: !!referenceFile, 
      presetId 
    });

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return mock response
    return new Response(
      JSON.stringify({
        fileName: `mastered_${Date.now()}.wav`,
        downloadUrl: '#', // Would be actual URL from Matchering backend
        message: 'Backend integration pending - Matchering API endpoint required'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('AI Mastering error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
