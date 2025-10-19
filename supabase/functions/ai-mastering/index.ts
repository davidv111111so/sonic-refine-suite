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

    // Log request details
    console.log('AI Mastering request:', { 
      userId: user.id, 
      hasReference: !!referenceFile, 
      presetId,
      targetFileName: targetFile instanceof File ? targetFile.name : 'unknown'
    });

    // Simulate processing for now
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create a mock processed file (in production, this would be actual Matchering output)
    const mockProcessedAudio = new Uint8Array(1024); // Mock audio data
    const blob = new Blob([mockProcessedAudio], { type: 'audio/wav' });
    
    // In production, upload to Supabase Storage and return the public URL
    const fileName = `mastered_${Date.now()}.wav`;
    
    // For now, return the original file data as blob URL (mock)
    // TODO: Integrate with actual Matchering backend
    const mockUrl = `data:audio/wav;base64,${btoa(String.fromCharCode(...mockProcessedAudio))}`;
    
    return new Response(
      JSON.stringify({
        fileName,
        downloadUrl: mockUrl,
        message: 'AI Mastering complete (mock response - backend integration pending)'
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
