import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log(`Starting account deletion for user: ${user.id}`);

    // Delete user data from all tables
    const { error: uploadsError } = await supabaseAdmin
      .from('daily_uploads')
      .delete()
      .eq('user_id', user.id);

    if (uploadsError) {
      console.error('Error deleting daily_uploads:', uploadsError);
    }

    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error deleting user_roles:', rolesError);
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // Delete user files from storage
    try {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('mastered-audio')
        .list(user.id);

      if (listError) {
        console.error('Error listing files:', listError);
      } else if (files && files.length > 0) {
        const filePaths = files.map((file) => `${user.id}/${file.name}`);
        const { error: deleteFilesError } = await supabaseAdmin.storage
          .from('mastered-audio')
          .remove(filePaths);

        if (deleteFilesError) {
          console.error('Error deleting storage files:', deleteFilesError);
        }
      }
    } catch (storageError) {
      console.error('Error handling storage deletion:', storageError);
    }

    // Finally, delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteUserError) {
      throw new Error(`Failed to delete user: ${deleteUserError.message}`);
    }

    console.log(`Successfully deleted account for user: ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
