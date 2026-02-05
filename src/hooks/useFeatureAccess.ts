/**
 * Feature Access Hook
 * Controls access to features based on subscription tier and usage limits
 * 
 * Usage Limits:
 * - FREE: 20 enhancements/month, 2 stems only, 1hr mixer/day, MP3 only
 * - PREMIUM: Unlimited enhancement, 2/4/6 stems, unlimited mixer, WAV, 25 mastering/day
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Feature types that can be gated
export type Feature =
    | 'enhancement'      // Audio enhancement
    | 'stems_4'          // 4-stem separation
    | 'stems_6'          // 6-stem separation
    | 'mastering'        // AI Mastering
    | 'mixer'            // Mixer Lab
    | 'wav_download'     // WAV download (vs MP3)
    | 'priority_processing'; // Priority queue

// Usage data structure
interface UsageData {
    files_enhanced_count: number;
    mastering_daily_count: number;
    mixer_minutes_used: number;
}

// Limits per tier
const LIMITS = {
    free: {
        enhancement: 20,           // per month
        stems_4: 0,                // not allowed
        stems_6: 0,                // not allowed
        mastering: 0,              // not allowed
        mixer: 60,                 // 1 hour per day (in minutes)
        wav_download: false,
        priority_processing: false,
    },
    premium: {
        enhancement: Infinity,
        stems_4: Infinity,
        stems_6: Infinity,
        mastering: 25,             // per day
        mixer: Infinity,
        wav_download: true,
        priority_processing: true,
    },
} as const;

interface AccessResult {
    allowed: boolean;
    reason?: string;
    remaining?: number;
    limit?: number;
}

export const useFeatureAccess = () => {
    const { profile, isPremium } = useAuth();
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch current usage on mount
    useEffect(() => {
        const fetchUsage = async () => {
            if (!profile?.id) {
                setLoading(false);
                return;
            }

            try {
                // Call the get_user_usage function which auto-resets quotas
                const { data, error } = await supabase.rpc('get_user_usage', {
                    p_user_id: profile.id,
                });

                if (error) {
                    console.error('Error fetching usage:', error);
                } else if (data && data.length > 0) {
                    setUsage(data[0]);
                }
            } catch (error) {
                console.error('Error in fetchUsage:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
    }, [profile?.id]);

    /**
     * Check if user has access to a feature
     */
    const checkAccess = useCallback(
        async (feature: Feature): Promise<AccessResult> => {
            if (!profile) {
                return { allowed: false, reason: 'Please log in to use this feature' };
            }

            const tier = isPremium ? 'premium' : 'free';
            const limit = LIMITS[tier][feature];

            // Boolean features (like wav_download, priority_processing)
            if (typeof limit === 'boolean') {
                if (!limit) {
                    return {
                        allowed: false,
                        reason: `${feature === 'wav_download' ? 'WAV downloads are' : 'This feature is'} only available for Premium members`
                    };
                }
                return { allowed: true };
            }

            // Unlimited features
            if (limit === Infinity) {
                return { allowed: true };
            }

            // Zero limit means not allowed at all
            if (limit === 0) {
                const featureNames: Record<string, string> = {
                    stems_4: '4-stem separation',
                    stems_6: '6-stem separation',
                    mastering: 'AI Mastering',
                };
                return {
                    allowed: false,
                    reason: `${featureNames[feature] || feature} requires a Premium subscription`
                };
            }

            // Check usage-based limits
            if (!usage) {
                // If no usage data yet, allow and it will be tracked
                return { allowed: true, remaining: limit, limit };
            }

            // Check specific limits
            if (feature === 'enhancement') {
                const current = usage.files_enhanced_count || 0;
                if (current >= limit) {
                    return {
                        allowed: false,
                        reason: `Monthly enhancement limit reached (${limit} files). Upgrade to Premium for unlimited!`,
                        remaining: 0,
                        limit,
                    };
                }
                return { allowed: true, remaining: limit - current, limit };
            }

            if (feature === 'mastering') {
                const current = usage.mastering_daily_count || 0;
                if (current >= limit) {
                    return {
                        allowed: false,
                        reason: `Daily mastering limit reached (${limit} files). Try again tomorrow!`,
                        remaining: 0,
                        limit,
                    };
                }
                return { allowed: true, remaining: limit - current, limit };
            }

            if (feature === 'mixer') {
                const current = usage.mixer_minutes_used || 0;
                if (current >= limit) {
                    return {
                        allowed: false,
                        reason: `Daily mixer time limit reached (${limit} minutes). Upgrade to Premium for unlimited!`,
                        remaining: 0,
                        limit,
                    };
                }
                return { allowed: true, remaining: limit - current, limit };
            }

            return { allowed: true };
        },
        [profile, isPremium, usage]
    );

    /**
     * Increment usage counter after a feature is used
     */
    const incrementUsage = useCallback(
        async (feature: 'enhancement' | 'mastering' | 'mixer', amount = 1): Promise<void> => {
            if (!profile?.id) return;

            const fieldMap: Record<string, string> = {
                enhancement: 'files_enhanced_count',
                mastering: 'mastering_daily_count',
                mixer: 'mixer_minutes_used',
            };

            const field = fieldMap[feature];

            try {
                await supabase.rpc('increment_usage', {
                    p_user_id: profile.id,
                    p_field: field,
                    p_amount: amount,
                });

                // Update local state
                setUsage((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        [field]: (prev[field as keyof UsageData] || 0) + amount,
                    };
                });
            } catch (error) {
                console.error('Error incrementing usage:', error);
            }
        },
        [profile?.id]
    );

    /**
     * Get the maximum allowed stems for the user
     */
    const getMaxStems = useCallback((): 2 | 4 | 6 => {
        if (isPremium) return 6;
        return 2;
    }, [isPremium]);

    /**
     * Get the download format allowed for the user
     */
    const getDownloadFormat = useCallback((): 'mp3' | 'wav' => {
        return isPremium ? 'wav' : 'mp3';
    }, [isPremium]);

    /**
     * Refresh usage data from server
     */
    const refreshUsage = useCallback(async () => {
        if (!profile?.id) return;

        try {
            const { data, error } = await supabase.rpc('get_user_usage', {
                p_user_id: profile.id,
            });

            if (!error && data && data.length > 0) {
                setUsage(data[0]);
            }
        } catch (error) {
            console.error('Error refreshing usage:', error);
        }
    }, [profile?.id]);

    return {
        checkAccess,
        incrementUsage,
        getMaxStems,
        getDownloadFormat,
        refreshUsage,
        usage,
        loading,
        isPremium,
        limits: isPremium ? LIMITS.premium : LIMITS.free,
    };
};

/**
 * Utility function for server-side feature checking
 * Use this in API routes or server functions
 */
export const checkFeatureAccess = async (
    userId: string,
    feature: Feature
): Promise<AccessResult> => {
    try {
        // Check if user is premium
        const { data: subData } = await supabase
            .from('subscriptions')
            .select('status, plan_type')
            .eq('user_id', userId)
            .single();

        const isPremium = subData?.status === 'active' || subData?.status === 'trialing';
        const tier = isPremium ? 'premium' : 'free';
        const limit = LIMITS[tier][feature];

        // Boolean features
        if (typeof limit === 'boolean') {
            return { allowed: limit, reason: limit ? undefined : 'Premium required' };
        }

        // Unlimited
        if (limit === Infinity) return { allowed: true };

        // Not allowed at all
        if (limit === 0) return { allowed: false, reason: 'Premium required' };

        // Get usage
        const { data: usageData } = await supabase.rpc('get_user_usage', {
            p_user_id: userId,
        });

        if (!usageData || usageData.length === 0) {
            return { allowed: true, remaining: limit, limit };
        }

        const usage = usageData[0];

        // Check limits
        const fieldMap: Record<string, keyof UsageData> = {
            enhancement: 'files_enhanced_count',
            mastering: 'mastering_daily_count',
            mixer: 'mixer_minutes_used',
        };

        const field = fieldMap[feature];
        if (field) {
            const current = usage[field] || 0;
            if (current >= limit) {
                return { allowed: false, reason: 'Limit reached', remaining: 0, limit };
            }
            return { allowed: true, remaining: limit - current, limit };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking feature access:', error);
        return { allowed: false, reason: 'Error checking access' };
    }
};

export default useFeatureAccess;
