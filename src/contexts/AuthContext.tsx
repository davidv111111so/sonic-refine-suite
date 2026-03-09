import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserTier } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVip: boolean;
  isPremium: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as unknown as UserProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for dev bypass first
    const isDevBypass = localStorage.getItem('dev_bypass') === 'true' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Tauri Standalone / Offline Bypass
    // @ts-ignore
    const isTauri = !!window.__TAURI_INTERNALS__ || !!(window as any).__TAURI__;
    const isOffline = !navigator.onLine;

    if (isDevBypass || (isTauri && isOffline)) {
      console.log(isDevBypass ? "🛠️ Auth: Using Dev Bypass context" : "📴 Auth: Using Offline Standalone context");
      setProfile({
        id: 'standalone-user',
        email: 'guest@levelaudio.live',
        full_name: isTauri ? 'Level Player (Offline)' : 'Developer Mode',
        tier: 'dj', // Standalone gets DJ tier (Mixer access) by default
        created_at: new Date().toISOString()
      } as any);
      setLoading(false);
      return;
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If we are in dev bypass, don't let auth changes override it unless we're logging in
      if (isDevBypass && !session) return;

      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (profile?.id) {
      await fetchProfile(profile.id);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  // Map legacy tier values to new system
  const tier = profile?.tier;
  const isAdmin = tier === 'admin';
  const isPremium = tier === 'pro' || tier === 'studio' || tier === 'admin' || tier === ('premium' as any) || tier === ('vip' as any);
  const isStudio = tier === 'studio' || isAdmin;

  const value = {
    profile,
    loading,
    isAdmin,
    isVip: isStudio, // backward compat
    isPremium,
    signOut,
    refreshProfile,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useRole = () => {
  const { profile, isAdmin, isPremium, isVip } = useAuth();
  return {
    tier: profile?.tier || 'basic' as UserTier,
    isAdmin,
    isPremium,
    isVip
  };
};
