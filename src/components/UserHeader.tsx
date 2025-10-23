import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileModal } from '@/components/ProfileModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const UserHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        checkAdmin(session.user.id);
      } else {
        navigate('/auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        checkAdmin(session.user.id);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const checkAdmin = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      toast.error('Error signing out');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Send password reset email with instructions
      const { error } = await supabase.auth.updateUser({
        data: { account_deletion_requested: true }
      });

      if (error) throw error;

      toast.success('Account deletion request sent. Please check your email for confirmation.');
      setShowDeleteDialog(false);
      
      // Sign out after requesting deletion
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      toast.error('Error requesting account deletion: ' + error.message);
    }
  };

  if (!user) {
    return null;
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() || 'U';

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-cyan-300 brightness-125">
            {profile?.full_name || user.email}
          </p>
          {isAdmin && (
            <p className="text-xs text-yellow-400 flex items-center gap-1 justify-end">
              <Shield className="h-3 w-3" />
              Admin
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-cyan-500">
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700 z-[9999]">
            <DropdownMenuItem 
              onClick={() => setShowProfile(true)}
              className="text-white hover:bg-slate-800 cursor-pointer"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem 
                onClick={() => navigate('/admin')}
                className="text-yellow-400 hover:bg-slate-800 cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-400 hover:bg-slate-800 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-orange-400 hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        user={user}
        profile={profile}
        isAdmin={isAdmin}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to delete your account? This action cannot be undone.
              You will receive an email confirmation to proceed with the deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Request Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};