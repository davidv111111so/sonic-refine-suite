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
import { Trash2, AlertTriangle } from 'lucide-react';

export function AccountSettings() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('No user email found');
      }

      // Sign out first
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      toast.success('Account deletion initiated. You have been logged out.');
      navigate('/auth');

    } catch (error: any) {
      toast.error(error.message || 'Error deleting account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
    </Card>
  );
}
