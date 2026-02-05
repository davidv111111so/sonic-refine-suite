import { useAuth } from '@/contexts/AuthContext';
import { UserTier } from '@/types/auth';

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
  const { profile, loading, isAdmin, isPremium } = useAuth();

  // Mapping new tiers to old expected types for backward compatibility
  const subscription: SubscriptionTier = isPremium ? 'premium' : 'free';
  const role: UserRole = isAdmin ? 'admin' : 'user';

  return {
    subscription,
    role,
    isAdmin,
    isPremium,
    loading,
  };
};
