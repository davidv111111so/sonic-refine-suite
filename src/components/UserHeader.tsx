import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, Shield, Trash2, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileModal } from '@/components/ProfileModal';
import { useAuth } from '@/contexts/AuthContext';
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

interface UserHeaderProps {
  onLogout?: () => void;
}

export const UserHeader = ({ onLogout }: UserHeaderProps) => {
  const navigate = useNavigate();
  const { profile, isAdmin, isPremium, signOut } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleLogout = async () => {
    try {
      if (onLogout) {
        onLogout();
      }

      // Clear dev bypass flag
      localStorage.removeItem("dev_bypass");

      await signOut();
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
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      toast.error('Error requesting account deletion: ' + error.message);
    }
  };

  if (!profile) {
    return null;
  }

  const initials = profile.full_name
    ? (profile.full_name as string).split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : profile.email?.[0].toUpperCase() || 'U';

  return (
    <>
      <div className="flex items-center gap-4">
        {!isPremium && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowProfile(true)}
            className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold h-9 px-4 rounded-full border-none shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse"
          >
            <Zap className="mr-2 h-4 w-4 fill-white" />
            Go Pro
          </Button>
        )}

        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-cyan-300 brightness-125">
            {profile.full_name || profile.email}
          </p>
          <div className="flex items-center gap-2 justify-end">
            {isAdmin && (
              <p className="text-[10px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-400/30 flex items-center gap-1 font-bold">
                <Shield className="h-2.5 w-2.5" />
                ADMIN
              </p>
            )}
            {isPremium && !isAdmin && (
              <p className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 font-bold">
                <Sparkles className="h-2.5 w-2.5" />
                PREMIUM
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-cyan-500">
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold">
                  {profile.email?.[0].toUpperCase() || 'U'}
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