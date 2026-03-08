import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, Shield, Zap, Sparkles, Crown } from 'lucide-react';
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
  const { profile, isAdmin, isPremium, isVip, signOut } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState("profile");

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


  if (!profile) {
    return null;
  }

  const initials = profile.full_name
    ? (profile.full_name as string).split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : profile.email?.[0].toUpperCase() || 'U';

  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setProfileModalTab("subscription");
            setShowProfile(true);
          }}
          className="hidden sm:flex bg-slate-900/50 hover:bg-slate-800/70 backdrop-blur-md border border-slate-700/50 text-slate-300 font-medium h-9 px-4 rounded-full transition-colors duration-300"
        >
          <Zap className="mr-2 h-4 w-4 text-cyan-400/70" />
          {isPremium ? 'Plans' : 'Upgrade'}
        </Button>

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
            {isVip && !isAdmin && (
              <p className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-1 font-bold">
                <Crown className="h-2.5 w-2.5" />
                VIP
              </p>
            )}
            {isPremium && !isVip && !isAdmin && (
              <p className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 font-bold">
                <Sparkles className="h-2.5 w-2.5" />
                PREMIUM
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-slate-700/50 bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-transparent text-slate-300 font-medium text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700 z-[9999]">
            <DropdownMenuItem
              onClick={() => {
                setProfileModalTab("profile");
                setShowProfile(true);
              }}
              className="text-white hover:bg-slate-800 cursor-pointer"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/landing')}
              className="text-white hover:bg-slate-800 cursor-pointer"
            >
              <Sparkles className="mr-2 h-4 w-4 text-cyan-400" />
              <span>About Level</span>
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
        defaultTab={profileModalTab}
      />


    </>
  );
};