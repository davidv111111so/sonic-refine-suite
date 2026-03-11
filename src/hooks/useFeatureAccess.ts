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
import { useDeviceFingerprint } from './useDeviceFingerprint';
import { useOfflineLicense } from './useOfflineLicense';

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
        enhancement: 10,           // 10 enhancements total
        stems_2: 3,                // 3 stems total
        stems_4: 3,
        stems_6: 3,
        stems_daily: 3,
        stems_monthly: 3,
        mastering_daily: 2,        // 2 masters total
        mastering_monthly: 2,
        mixer: Infinity,           // Unlimited Media Player
        mixer_export: false,       // no export for free
        enhance_24bit: false,      // 16-bit only
        wav_download: false,
        effects: false,            // player effects locked
        compression: false,        // player compression locked
        priority_processing: false,
    },
    basic: {
        enhancement: 0,
        stems_2: 0,
        stems_4: 0,
        stems_6: 0,
        stems_daily: 0,
        stems_monthly: 0,
        mastering_daily: 0,
        mastering_monthly: 0,
        mixer: Infinity,            // Unlimited Media Player
        mixer_export: false,
        enhance_24bit: false,
        wav_download: false,
        effects: false,
        compression: false,
        priority_processing: false,
    },
    premium: {
        enhancement: 250,          // 250 per month
        stems_2: Infinity,
        stems_4: Infinity,
        stems_6: Infinity,
        stems_daily: 150,
        stems_monthly: 150,
        mastering_daily: 150,
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
        stems_daily: 500,
        stems_monthly: 500,
        mastering_daily: 500,
        mastering_monthly: 500,
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
    const { deviceId } = useDeviceFingerprint();
    const { isOfflineModeActive } = useOfflineLicense();
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch current usage on mount
    useEffect(() => {
        const fetchUsage = async () => {
            if (profile?.id) {
                try {
                    // Call the get_user_usage function which auto-resets quotas
                    const { data, error } = await (supabase.rpc as any)('get_user_usage', {
                        p_user_id: profile.id,
                    });

                    if (error) {
                        console.error('Error fetching user usage:', error);
                    } else if (data && data.length > 0) {
                        setUsage(data[0]);
                    }
                } catch (error) {
                    console.error('Error in fetchUsage:', error);
                }
            } else if (deviceId) {
                try {
                    const { data, error } = await (supabase.rpc as any)('get_device_usage', {
                        p_device_hash: deviceId,
                    });

                    if (error) {
                        console.error('Error fetching device usage:', error);
                    } else if (data && data.length > 0) {
                        setUsage({
                            files_enhanced_count: data[0].enhancements_used,
                            mastering_daily_count: data[0].mastering_used,
                            mastering_monthly_count: data[0].mastering_used,
                            stems_daily_count: data[0].stems_used,
                            stems_monthly_count: data[0].stems_used,
                            mixer_minutes_used: data[0].mixer_minutes_used,
                        });
                    }
                } catch (error) {
                    console.error('Error in fetch device usage:', error);
                }
            }
            setLoading(false);
        };

        fetchUsage();
    }, [profile?.id, deviceId]);

    /**
     * Check if user has access to a feature
     */
    const checkAccess = useCallback(
        async (feature: Feature): Promise<AccessResult> => {
            // Offline Mode overrides for local tasks
            if (isOfflineModeActive && ['mixer', 'effects', 'compression', 'wav_download', 'enhance_24bit', 'mixer_export'].includes(feature)) {
                return { allowed: true };
            }

            // Admins bypass all limits
            if (isAdmin) {
                return { allowed: true };
            }

            // Treat no profile as free tier unless offline mode verified their premium tier
            const tier = profile ? (isVip ? 'vip' : (isPremium ? 'premium' : 'free')) : (isOfflineModeActive ? 'premium' : 'free');
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

            // 7-Day Trial Expiration Logic
            const trialStartDate = profile?.created_at || (usage as any)?.created_at;
            if (trialStartDate && !isPremium && !isAdmin && !isVip) {
                const startDate = new Date(trialStartDate);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 7) {
                    // Trial expired, switch to basic limits
                    const basicLimit = LIMITS.basic[feature as keyof typeof LIMITS.basic];
                    if (typeof basicLimit === 'boolean') {
                        return { allowed: basicLimit, reason: 'Trial expired. Upgrade to Premium for full access!' };
                    }
                    if (feature === 'mixer') {
                        const current = usage.mixer_minutes_used || 0;
                        if (current >= (basicLimit as number)) {
                            return {
                                allowed: false,
                                reason: `Monthly mixer limit reached (20 hours). Upgrade to Premium for unlimited!`,
                                remaining: 0,
                                limit: basicLimit as number
                            };
                        }
                        return { allowed: true, remaining: (basicLimit as number) - current, limit: basicLimit as number };
                    }
                    return { allowed: false, reason: 'Trial expired. Mastering and Stems require Premium.' };
                }
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
        [profile, isPremium, isVip, isAdmin, usage, isOfflineModeActive]
    );

    /**
     * Increment usage counter after a feature is used
     */
    const incrementUsage = useCallback(
        async (feature: 'enhancement' | 'mastering' | 'stems' | 'mixer', amount = 1): Promise<void> => {
            const fieldMap: Record<string, string> = {
                enhancement: 'files_enhanced_count',
                mastering: 'mastering_increment', // Backend will increment both daily and monthly
                stems: 'stems_increment', // Backend will increment both daily and monthly
                mixer: 'mixer_minutes_used',
            };

            const field = fieldMap[feature];

            try {
                if (profile?.id) {
                    // Update remotely for authenticated user
                    await (supabase.rpc as any)('increment_usage', {
                        p_user_id: profile.id,
                        p_field: field,
                        p_amount: amount,
                    });
                } else if (deviceId) {
                    // Update remotely for anonymous device
                    const deviceFieldMap: Record<string, string> = {
                        enhancement: 'enhancements_used',
                        mastering: 'mastering_used',
                        stems: 'stems_used',
                        mixer: 'mixer_minutes_used',
                    };
                    const deviceField = deviceFieldMap[feature];
                    if (deviceField) {
                        await (supabase.rpc as any)('increment_device_usage', {
                            p_device_id: deviceId,
                            p_field: deviceField,
                            p_amount: amount
                        });
                    }
                }

                // Update local state
                setUsage((prev) => {
                    if (!prev) return prev;
                    if (profile?.id) {
                        return {
                            ...prev,
                            [field]: (prev[field as keyof UsageData] || 0) + amount,
                        };
                    } else {
                        const deviceFieldMap: Record<string, string> = {
                            enhancement: 'enhancements_used',
                            mastering: 'mastering_used',
                            stems: 'stems_used',
                            mixer: 'mixer_minutes_used',
                        };
                        const deviceField = deviceFieldMap[feature];
                        return {
                            ...prev,
                            [deviceField]: (prev[deviceField as keyof UsageData] || 0) + amount,
                        };
                    }
                });
            } catch (error) {
                console.error('Error incrementing usage:', error);
            }
        },
        [profile?.id, deviceId]
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
        limits: (function () {
            if (isVip) return LIMITS.vip;
            if (isAdmin) return LIMITS.admin;
            if (isPremium) return LIMITS.premium;

            // Check trial expiration
            const trialStartDate = profile?.created_at || (usage as any)?.created_at;
            if (trialStartDate) {
                const startDate = new Date(trialStartDate);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 7) return LIMITS.basic;
            }
            return LIMITS.free;
        })(),
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
