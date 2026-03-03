import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Upload, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

export function AccountSettings() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();

  const handleDeleteAccount = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No user found');
      }

      // Call edge function to delete all user data
      const { error: deleteError } = await supabase.functions.invoke('delete-account');

      if (deleteError) throw deleteError;

      toast.success('Account and all data deleted successfully.');
      navigate('/auth');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting account';
      toast.error(message);
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      setUploading(true);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // Update local context
      if (updateProfile) {
        updateProfile({ avatar_url: publicUrl });
      }

      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture Upload Section */}
        <div className="border border-slate-700/50 rounded-lg p-6 bg-slate-800/20">
          <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-slate-600">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-slate-700 text-lg font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <label htmlFor="avatar-upload" className="block">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white cursor-pointer relative"
                  asChild
                >
                  <div>
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </Button>
              </label>
              <p className="text-xs text-slate-400">
                Recommended size: 256x256px. Max 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-2 border-red-500/50 rounded-lg p-6 bg-red-950/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
          </div>

          <p className="text-sm text-slate-300 mb-4">
            Once you delete your account, there is no going back. This action cannot be undone.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-400">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card >
  );
}
