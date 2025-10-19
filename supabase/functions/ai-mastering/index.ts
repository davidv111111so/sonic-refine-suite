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

    // Prepare FormData for Matchering API
    const matcheringFormData = new FormData();
    matcheringFormData.append('target', targetFile);
    
    if (referenceFile) {
      matcheringFormData.append('reference', referenceFile);
    } else if (presetId) {
      matcheringFormData.append('preset_id', presetId);
    }

    // Get JWT token from authorization header
    const jwtToken = authHeader.replace('Bearer ', '');

    // Call external Matchering API
    console.log('Calling Matchering API with JWT authentication...');
    const matcheringResponse = await fetch(
      'https://mastering-backend-857351913435.us-central1.run.app',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        },
        body: matcheringFormData
      }
    );

    if (!matcheringResponse.ok) {
      const errorText = await matcheringResponse.text();
      console.error('Matchering API error:', errorText);
      throw new Error(`Matchering API failed: ${matcheringResponse.status} - ${errorText}`);
    }

    // Get the processed audio file
    const processedAudioBlob = await matcheringResponse.blob();
    console.log('Matchering processing complete, file size:', processedAudioBlob.size);

    // Upload to Supabase Storage
    const fileName = `mastered_${user.id}_${Date.now()}.wav`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mastered-audio')
      .upload(`${user.id}/${fileName}`, processedAudioBlob, {
        contentType: 'audio/wav',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload mastered audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('mastered-audio')
      .getPublicUrl(`${user.id}/${fileName}`);

    const downloadUrl = urlData.publicUrl;
    
    return new Response(
      JSON.stringify({
        fileName,
        downloadUrl,
        message: 'AI Mastering complete!'
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
