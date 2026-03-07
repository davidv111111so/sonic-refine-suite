import { useAuth } from '@/contexts/AuthContext';
import { UserTier, TIER_LIMITS, TierLimits } from '@/types/auth';

export type SubscriptionTier = 'trial' | 'basic' | 'pro' | 'studio';
export type UserRole = 'admin' | 'moderator' | 'user';

interface UserSubscriptionData {
  tier: UserTier;
  tierLimits: TierLimits;
  subscription: SubscriptionTier;
  role: UserRole | null;
  isAdmin: boolean;
  isPremium: boolean; // pro or studio
  isStudio: boolean;
  isTrial: boolean;
  loading: boolean;
}

export const useUserSubscription = (): UserSubscriptionData => {
  const { profile, loading, isAdmin, isPremium } = useAuth();

  const tier: UserTier = profile?.tier || 'basic';
  const tierLimits = TIER_LIMITS[tier] || TIER_LIMITS.basic;

  // Backward compatibility mapping
  const subscription: SubscriptionTier = tier === 'admin' ? 'studio' : tier as SubscriptionTier;
  const role: UserRole = isAdmin ? 'admin' : 'user';

  return {
    tier,
    tierLimits,
    subscription,
    role,
    isAdmin,
    isPremium: tier === 'pro' || tier === 'studio' || isAdmin,
    isStudio: tier === 'studio' || isAdmin,
    isTrial: tier === 'trial',
    loading,
  };
};
