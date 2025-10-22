import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Calendar, Shield, Settings } from 'lucide-react';
import { AccountSettings } from './AccountSettings';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  profile: any;
  isAdmin: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onOpenChange,
  user,
  profile,
  isAdmin,
}) => {
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() || 'U';

  const createdDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">My Account</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-cyan-500">
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isAdmin && (
              <Badge className="bg-yellow-600 text-white border-yellow-500">
                <Shield className="h-3 w-3 mr-1" />
                Administrator
              </Badge>
            )}
          </div>

          <Separator className="bg-slate-700" />

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-700/30 rounded-lg">
                <User className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Full Name</p>
                <p className="text-sm font-medium text-white">
                  {profile?.full_name || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-700/30 rounded-lg">
                <Mail className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-white break-all">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-700/30 rounded-lg">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Member Since</p>
                <p className="text-sm font-medium text-white">
                  {createdDate}
                </p>
              </div>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="settings">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
