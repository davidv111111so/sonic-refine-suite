export type UserTier = 'trial' | 'basic' | 'pro' | 'studio' | 'dj' | 'admin';

export interface TierLimits {
    name: string;
    displayName: string;
    price: number; // USD per month
    priceIntro: number; // Intro sale price
    priceYearly: number; // USD per year
    priceYearlyIntro: number; // Intro yearly
    // Enhancements
    enhancementsPerDay: number; // 0 = unlimited
    enhancementsPerMonth: number;
    // Stem Separation
    stemSeparationsPerMonth: number; // Level Studio Engine
    spleeterSeparationsPerMonth: number; // Basic/Spleeter
    sixStemEnabled: boolean;
    aiStemsInMixer: boolean;
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
    premiumFeaturesAccess: boolean;
    // Trial
    trialDays: number;
    // Feature flags
    mixerOnly: boolean; // DJ Mode - mixer access only
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
    trial: {
        name: 'trial',
        displayName: 'Free Trial',
        price: 0,
        priceIntro: 0,
        priceYearly: 0,
        priceYearlyIntro: 0,
        enhancementsPerDay: 0,
        enhancementsPerMonth: 20,
        stemSeparationsPerMonth: 3,
        spleeterSeparationsPerMonth: 7,
        sixStemEnabled: false,
        aiStemsInMixer: false,
        masteringsPerMonth: 5,
        mediaPlayerUnlimited: true,
        externalMediaPlayerUnlimited: true,
        mixerLabMinutesPerDay: 240,
        mixerLabMinutesPerMonth: 0,
        mixerLabRecording: false,
        premiumFeaturesAccess: true,
        trialDays: 7,
        mixerOnly: false,
    },
    basic: {
        name: 'basic',
        displayName: 'Basic',
        price: 0,
        priceIntro: 0,
        priceYearly: 0,
        priceYearlyIntro: 0,
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
        mixerOnly: false,
    },
    dj: {
        name: 'dj',
        displayName: 'DJ Mode',
        price: 4.99,
        priceIntro: 4.99,
        priceYearly: 49.99,
        priceYearlyIntro: 49.99,
        enhancementsPerDay: 0,
        enhancementsPerMonth: 0,
        stemSeparationsPerMonth: 0,
        spleeterSeparationsPerMonth: 0,
        sixStemEnabled: false,
        aiStemsInMixer: false,
        masteringsPerMonth: 0,
        mediaPlayerUnlimited: true,
        externalMediaPlayerUnlimited: true,
        mixerLabMinutesPerDay: 0,
        mixerLabMinutesPerMonth: 0,
        mixerLabRecording: true,
        premiumFeaturesAccess: false,
        trialDays: 0,
        mixerOnly: true,
    },
    pro: {
        name: 'pro',
        displayName: 'Pro',
        price: 11.99,
        priceIntro: 9.99,
        priceYearly: 119.99,
        priceYearlyIntro: 99.99,
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
        mixerOnly: false,
    },
    studio: {
        name: 'studio',
        displayName: 'Studio',
        price: 29.99,
        priceIntro: 24.99,
        priceYearly: 299.99,
        priceYearlyIntro: 249.99,
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
        mixerOnly: false,
    },
    admin: {
        name: 'admin',
        displayName: 'Admin (Studio)',
        price: 0,
        priceIntro: 0,
        priceYearly: 0,
        priceYearlyIntro: 0,
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
        mixerOnly: false,
    },
};

// Coupon/Promo code system
export interface PromoCode {
    code: string;
    discountPercent: number; // 0-100
    validTiers: UserTier[];
    expiresAt: string; // ISO date
    maxUses: number;
    currentUses: number;
    description: string;
}

export const ACTIVE_PROMOS: PromoCode[] = [
    {
        code: 'LEVELUP25',
        discountPercent: 25,
        validTiers: ['studio'],
        expiresAt: '2026-06-30T23:59:59Z',
        maxUses: 500,
        currentUses: 0,
        description: 'Launch offer: 25% off Studio plan',
    },
    {
        code: 'DJFIRST',
        discountPercent: 20,
        validTiers: ['dj', 'pro'],
        expiresAt: '2026-12-31T23:59:59Z',
        maxUses: 1000,
        currentUses: 0,
        description: '20% off Pro & DJ Mode',
    },
    {
        code: 'EARLYSTUDIO',
        discountPercent: 17, // $24.99 intro price
        validTiers: ['studio'],
        expiresAt: '2026-09-30T23:59:59Z',
        maxUses: 200,
        currentUses: 0,
        description: 'Early adopter Studio discount',
    },
];

export function validatePromoCode(code: string, tier: UserTier): { valid: boolean; discount: number; message: string } {
    const promo = ACTIVE_PROMOS.find(p => p.code.toUpperCase() === code.toUpperCase());
    if (!promo) return { valid: false, discount: 0, message: 'Invalid promo code' };
    if (new Date(promo.expiresAt) < new Date()) return { valid: false, discount: 0, message: 'This promo code has expired' };
    if (promo.currentUses >= promo.maxUses) return { valid: false, discount: 0, message: 'This promo code has reached its usage limit' };
    if (!promo.validTiers.includes(tier)) return { valid: false, discount: 0, message: `This code is not valid for the ${tier} plan` };
    return { valid: true, discount: promo.discountPercent, message: `${promo.discountPercent}% off applied! ${promo.description}` };
}

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
