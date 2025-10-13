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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

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

  return {
    subscription,
    role,
    isAdmin: role === 'admin',
    isPremium: subscription === 'premium' || role === 'admin',
    loading,
  };
};
