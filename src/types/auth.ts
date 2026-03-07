export type UserTier = 'trial' | 'basic' | 'pro' | 'studio' | 'admin';

export interface TierLimits {
    name: string;
    displayName: string;
    price: number; // USD per month
    priceYearly: number; // USD per year
    // Enhancements
    enhancementsPerDay: number; // 0 = unlimited
    enhancementsPerMonth: number;
    // Stem Separation
    stemSeparationsPerMonth: number; // Level/Demucs
    spleeterSeparationsPerMonth: number; // Basic/Spleeter
    sixStemEnabled: boolean; // 6-stem separation
    aiStemsInMixer: boolean; // AI stem separator in Mixer Lab
    // Mastering
    masteringsPerMonth: number;
    // Media Player
    mediaPlayerUnlimited: boolean;
    externalMediaPlayerUnlimited: boolean;
    // Mixer Lab
    mixerLabMinutesPerDay: number; // 0 = unlimited
    mixerLabMinutesPerMonth: number; // 0 = unlimited
    mixerLabRecording: boolean;
    // Premium Features
    premiumFeaturesAccess: boolean; // EQ, Effects, Compression, etc.
    // Trial
    trialDays: number; // 0 = not a trial
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
    trial: {
        name: 'trial',
        displayName: 'Free Trial',
        price: 0,
        priceYearly: 0,
        enhancementsPerDay: 0,
        enhancementsPerMonth: 20,
        stemSeparationsPerMonth: 3,
        spleeterSeparationsPerMonth: 7,
        sixStemEnabled: false,
        aiStemsInMixer: false,
        masteringsPerMonth: 5,
        mediaPlayerUnlimited: true,
        externalMediaPlayerUnlimited: true,
        mixerLabMinutesPerDay: 240, // 4 hours
        mixerLabMinutesPerMonth: 0,
        mixerLabRecording: false,
        premiumFeaturesAccess: true,
        trialDays: 7,
    },
    basic: {
        name: 'basic',
        displayName: 'Basic',
        price: 0,
        priceYearly: 0,
        enhancementsPerDay: 3,
        enhancementsPerMonth: 20,
        stemSeparationsPerMonth: 0,
        spleeterSeparationsPerMonth: 0,
        sixStemEnabled: false,
        aiStemsInMixer: false,
        masteringsPerMonth: 0,
        mediaPlayerUnlimited: true,
        externalMediaPlayerUnlimited: true,
        mixerLabMinutesPerDay: 45,
        mixerLabMinutesPerMonth: 500,
        mixerLabRecording: false,
        premiumFeaturesAccess: false,
        trialDays: 0,
    },
    pro: {
        name: 'pro',
        displayName: 'Pro',
        price: 14.99,
        priceYearly: 149.99,
        enhancementsPerDay: 0,
        enhancementsPerMonth: 150,
        stemSeparationsPerMonth: 100,
        spleeterSeparationsPerMonth: 50,
        sixStemEnabled: false,
        aiStemsInMixer: false,
        masteringsPerMonth: 100,
        mediaPlayerUnlimited: true,
        externalMediaPlayerUnlimited: true,
        mixerLabMinutesPerDay: 0,
        mixerLabMinutesPerMonth: 0,
        mixerLabRecording: true,
        premiumFeaturesAccess: true,
        trialDays: 0,
    },
    studio: {
        name: 'studio',
        displayName: 'Studio',
        price: 29.99,
        priceYearly: 299.99,
        enhancementsPerDay: 0,
        enhancementsPerMonth: 400,
        stemSeparationsPerMonth: 300,
        spleeterSeparationsPerMonth: 150,
        sixStemEnabled: true,
        aiStemsInMixer: true,
        masteringsPerMonth: 350,
        mediaPlayerUnlimited: true,
        externalMediaPlayerUnlimited: true,
        mixerLabMinutesPerDay: 0,
        mixerLabMinutesPerMonth: 0,
        mixerLabRecording: true,
        premiumFeaturesAccess: true,
        trialDays: 0,
    },
    admin: {
        name: 'admin',
        displayName: 'Admin',
        price: 0,
        priceYearly: 0,
        enhancementsPerDay: 0,
        enhancementsPerMonth: 999999,
        stemSeparationsPerMonth: 999999,
        spleeterSeparationsPerMonth: 999999,
        sixStemEnabled: true,
        aiStemsInMixer: true,
        masteringsPerMonth: 999999,
        mediaPlayerUnlimited: true,
        externalMediaPlayerUnlimited: true,
        mixerLabMinutesPerDay: 0,
        mixerLabMinutesPerMonth: 0,
        mixerLabRecording: true,
        premiumFeaturesAccess: true,
        trialDays: 0,
    },
};

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    tier: UserTier;
    subscription_id?: string;
    customer_id?: string;
    avatar_url?: string;
    trial_start?: string;
    created_at: string;
    updated_at: string;
}

export interface AuthState {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
}
