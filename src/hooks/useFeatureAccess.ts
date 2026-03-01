/**
 * Feature Access Hook
 * Controls access to features based on subscription tier and usage limits
 * 
 * Option A "Preview" Limits (Updated):
 * - FREE/BASIC: 30s preview mastering/stems, 2hr mixer/day (playback only), 16-bit, MP3 only
 * - PREMIUM: Unlimited features, 20 mastering/day, 20 stems/day, 24-bit, WAV export
 * - ADMIN: Unlimited everything, no caps
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Feature types that can be gated
export type Feature =
    | 'enhancement'      // Audio enhancement
    | 'stems_2'          // 2-stem separation (Vocals/Instrumental)
    | 'stems_4'          // 4-stem separation
    | 'stems_6'          // 6-stem separation
    | 'stems_daily'      // Daily stem separation limit
    | 'stems_monthly'    // Monthly stem separation limit
    | 'mastering_daily'  // AI Mastering daily
    | 'mastering_monthly'// AI Mastering monthly
    | 'mixer'            // Mixer Lab
    | 'mixer_export'     // Mixer Lab export
    | 'enhance_24bit'    // 24-bit enhancement
    | 'wav_download'     // WAV download (vs MP3)
    | 'effects'          // Player effects section
    | 'compression'      // Player compression section
    | 'priority_processing'; // Priority queue

// Usage data structure
interface UsageData {
    files_enhanced_count: number;
    mastering_daily_count: number;
    mastering_monthly_count: number;
    stems_daily_count: number;
    stems_monthly_count: number;
    mixer_minutes_used: number;
}

const LIMITS = {
    free: {
        enhancement: 20,           // per month
        stems_2: 0,                // blocked (30s preview only, handled in UI)
        stems_4: 0,                // blocked
        stems_6: 0,                // blocked
        stems_daily: 0,
        stems_monthly: 0,
        mastering_daily: 0,
        mastering_monthly: 0,
        mixer: 120,                // 2 hours per day (in minutes)
        mixer_export: false,       // no export for free
        enhance_24bit: false,      // 16-bit only
        wav_download: false,
        effects: false,            // player effects locked
        compression: false,        // player compression locked
        priority_processing: false,
    },
    premium: {
        enhancement: 250,          // 250 per month
        stems_2: Infinity,
        stems_4: Infinity,
        stems_6: Infinity,
        stems_daily: 20,
        stems_monthly: 150,
        mastering_daily: 20,
        mastering_monthly: 150,
        mixer: Infinity,
        mixer_export: true,
        enhance_24bit: true,
        wav_download: true,
        effects: true,
        compression: true,
        priority_processing: true,
    },
    vip: {
        enhancement: Infinity,     // Unlimited
        stems_2: Infinity,
        stems_4: Infinity,
        stems_6: Infinity,
        stems_daily: 30,
        stems_monthly: 350,
        mastering_daily: 30,
        mastering_monthly: 350,
        mixer: Infinity,
        mixer_export: true,
        enhance_24bit: true,
        wav_download: true,
        effects: true,
        compression: true,
        priority_processing: true,
    },
    admin: {
        enhancement: Infinity,
        stems_2: Infinity,
        stems_4: Infinity,
        stems_6: Infinity,
        stems_daily: Infinity,
        stems_monthly: Infinity,
        mastering_daily: Infinity,
        mastering_monthly: Infinity,
        mixer: Infinity,
        mixer_export: true,
        enhance_24bit: true,
        wav_download: true,
        effects: true,
        compression: true,
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
    const { profile, isPremium, isVip, isAdmin } = useAuth();
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
                const { data, error } = await (supabase.rpc as any)('get_user_usage', {
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

            // Admins bypass all limits
            if (isAdmin) {
                return { allowed: true };
            }

            const tier = isVip ? 'vip' : (isPremium ? 'premium' : 'free');
            const limit = LIMITS[tier][feature as keyof typeof LIMITS[typeof tier]];

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

            if (feature === 'mastering_daily' || feature === 'mastering_monthly') {
                const currentDaily = usage.mastering_daily_count || 0;
                const currentMonthly = usage.mastering_monthly_count || 0;

                const tier = isVip ? 'vip' : 'premium';
                const dailyLimit = LIMITS[tier].mastering_daily as number;
                const monthlyLimit = LIMITS[tier].mastering_monthly as number;

                if (currentDaily >= dailyLimit) {
                    return {
                        allowed: false,
                        reason: `Daily mastering limit reached (${dailyLimit} files). Try again tomorrow!`,
                        remaining: 0,
                        limit: dailyLimit,
                    };
                }

                if (currentMonthly >= monthlyLimit) {
                    return {
                        allowed: false,
                        reason: `Monthly mastering limit reached (${monthlyLimit} files). Upgrade for more!`,
                        remaining: 0,
                        limit: monthlyLimit,
                    };
                }

                const remainingDaily = dailyLimit - currentDaily;
                const remainingMonthly = monthlyLimit - currentMonthly;
                return {
                    allowed: true,
                    remaining: Math.min(remainingDaily, remainingMonthly),
                    limit: remainingDaily < remainingMonthly ? dailyLimit : monthlyLimit
                };
            }

            if (feature === 'stems_daily' || feature === 'stems_monthly') {
                const currentDaily = usage.stems_daily_count || 0;
                const currentMonthly = usage.stems_monthly_count || 0;

                const tier = isVip ? 'vip' : 'premium';
                const dailyLimit = LIMITS[tier].stems_daily as number;
                const monthlyLimit = LIMITS[tier].stems_monthly as number;

                if (currentDaily >= dailyLimit) {
                    return {
                        allowed: false,
                        reason: `Daily stem separation limit reached (${dailyLimit}). Try again tomorrow!`,
                        remaining: 0,
                        limit: dailyLimit,
                    };
                }

                if (currentMonthly >= monthlyLimit) {
                    return {
                        allowed: false,
                        reason: `Monthly stem separation limit reached (${monthlyLimit}). Upgrade for more!`,
                        remaining: 0,
                        limit: monthlyLimit,
                    };
                }

                const remainingDaily = dailyLimit - currentDaily;
                const remainingMonthly = monthlyLimit - currentMonthly;
                return {
                    allowed: true,
                    remaining: Math.min(remainingDaily, remainingMonthly),
                    limit: remainingDaily < remainingMonthly ? dailyLimit : monthlyLimit
                };
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
        [profile, isPremium, isVip, isAdmin, usage]
    );

    /**
     * Increment usage counter after a feature is used
     */
    const incrementUsage = useCallback(
        async (feature: 'enhancement' | 'mastering' | 'stems' | 'mixer', amount = 1): Promise<void> => {
            if (!profile?.id) return;

            const fieldMap: Record<string, string> = {
                enhancement: 'files_enhanced_count',
                mastering: 'mastering_increment', // Backend will increment both daily and monthly
                stems: 'stems_increment', // Backend will increment both daily and monthly
                mixer: 'mixer_minutes_used',
            };

            const field = fieldMap[feature];

            try {
                // Update remotely
                await (supabase.rpc as any)('increment_usage', {
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
            const { data, error } = await (supabase.rpc as any)('get_user_usage', {
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
        isVip,
        limits: isVip ? LIMITS.vip : (isPremium ? LIMITS.premium : LIMITS.free),
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
        const { data: profile } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', userId)
            .single();

        const isVip = (profile as any)?.tier === 'vip';
        const isPremium = (profile as any)?.tier === 'premium' || (profile as any)?.tier === 'admin' || isVip;
        const tier = isVip ? 'vip' : (isPremium ? 'premium' : 'free');
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
        const { data: usageData } = await (supabase.rpc as any)('get_user_usage', {
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
