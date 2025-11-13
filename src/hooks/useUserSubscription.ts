import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'free' | 'premium';
export type UserRole = 'admin' | 'moderator' | 'user';

interface UserSubscriptionData {
  subscription: SubscriptionTier;
  role: UserRole | null;
  isAdmin: boolean;
  isPremium: boolean;
  loading: boolean;
}

export const useUserSubscription = (): UserSubscriptionData => {
  const [subscription, setSubscription] = useState<SubscriptionTier>('free');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremiumAccess, setIsPremiumAccess] = useState(false);
  const [isAdminEmail, setIsAdminEmail] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          setIsAdminEmail(false);
          return;
        }

        // Check if user email is in admin whitelist (permanent premium access)
        const adminEmails = ['davidv111111@gmail.com', 'santiagov.t068@gmail.com'];
        const userEmail = session.user.email?.toLowerCase();
        const isAdminEmailCheck = userEmail ? adminEmails.includes(userEmail) : false;
        setIsAdminEmail(isAdminEmailCheck);

        // Fetch user profile with subscription
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const sub = profile.subscription as SubscriptionTier;
          setSubscription(sub || 'free');
        }

        // Fetch user role
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (userRole) {
          setRole(userRole.role as UserRole);
        }

        // Check premium access using database function (includes whitelist)
        const { data: premiumData, error: premiumError } = await supabase.rpc('has_premium_access', {
          _user_id: session.user.id
        });
        
        // Admin emails get permanent premium access
        const hasPremium = isAdminEmailCheck || (!premiumError && premiumData === true);
        setIsPremiumAccess(hasPremium);
      } catch (error) {
        console.error('Error fetching user subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  // Determine admin and premium status
  // Admin emails get permanent admin role and premium access
  const isAdmin = role === 'admin' || isAdminEmail;
  const isPremium = isPremiumAccess || subscription === 'premium' || isAdmin || isAdminEmail;

  return {
    subscription,
    role,
    isAdmin,
    isPremium,
    loading,
  };
};
