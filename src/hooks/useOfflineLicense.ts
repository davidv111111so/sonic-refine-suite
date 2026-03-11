import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// The key used to store the encrypted/signed license offline
const OFFLINE_LICENSE_KEY = 'level_audio_offline_license';

interface OfflineLicense {
    userId: string;
    tier: string;
    expiresAt: string; // ISO Date String
    signature: string; // Cryptographic verification (mocked for frontend security conceptually)
}

/**
 * Hook to manage offline license validation for "Solo DJ Mixer" capabilities
 * It acts like a heartbeat. When online, it fetches a fresh 30-day ticket.
 * When offline, it verifies the local ticket allows access.
 */
export const useOfflineLicense = () => {
    const { profile, isPremium, isVip, isAdmin } = useAuth();
    const [hasValidOfflineLicense, setHasValidOfflineLicense] = useState<boolean>(false);
    const [offlineExpiration, setOfflineExpiration] = useState<Date | null>(null);

    // Validate a token string against expiration date
    const validateToken = useCallback((license: OfflineLicense): boolean => {
        const expirationDate = new Date(license.expiresAt);
        const now = new Date();
        
        // Ensure it hasn't expired and the user tier permits offline (premium, vip, admin)
        if (expirationDate > now && ['premium', 'vip', 'admin'].includes(license.tier)) {
            return true;
        }
        return false;
    }, []);

    // Effect to grab a new license ticket when online and logged in as paid user
    useEffect(() => {
        const refreshHeartbeat = async () => {
            if (!navigator.onLine) return; // Skip if currently offline

            if (profile?.id && (isPremium || isVip || isAdmin)) {
                try {
                    // Create a 30-day validity window
                    const expiration = new Date();
                    expiration.setDate(expiration.getDate() + 30);

                    // A real app would get this signed cryptographically by Supabase Edge Functions.
                    // For now, we trust the local generation if they successfully authed online.
                    const tier = isVip ? 'vip' : (isAdmin ? 'admin' : 'premium');
                    
                    const newLicense: OfflineLicense = {
                        userId: profile.id,
                        tier: tier,
                        expiresAt: expiration.toISOString(),
                        signature: btoa(`${profile.id}-${tier}-${expiration.toISOString()}-secret_salt`)
                    };

                    localStorage.setItem(OFFLINE_LICENSE_KEY, JSON.stringify(newLicense));
                    setHasValidOfflineLicense(true);
                    setOfflineExpiration(expiration);
                    
                } catch (error) {
                    console.error("Failed to store offline license heartbeat", error);
                }
            } else if (profile?.id && !isPremium && !isVip && !isAdmin) {
                // Free user, clear any old premium tickets to prevent abuse
                localStorage.removeItem(OFFLINE_LICENSE_KEY);
                setHasValidOfflineLicense(false);
                setOfflineExpiration(null);
            }
        };

        refreshHeartbeat();
    }, [profile?.id, isPremium, isVip, isAdmin, navigator.onLine]);

    // Effect to check offline license on startup/mount
    useEffect(() => {
        const checkLocalStoredLicense = () => {
            try {
                const storedJSON = localStorage.getItem(OFFLINE_LICENSE_KEY);
                if (storedJSON) {
                    const license: OfflineLicense = JSON.parse(storedJSON);
                    const isValid = validateToken(license);
                    
                    setHasValidOfflineLicense(isValid);
                    setOfflineExpiration(isValid ? new Date(license.expiresAt) : null);

                    if (!navigator.onLine && isValid && !profile) {
                        toast.success("Offline Mode Active", {
                            description: "Pro Mixer features unlocked via local license.",
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to parse offline license", e);
            }
        };

        checkLocalStoredLicense();
    }, [validateToken, navigator.onLine, profile]);

    return {
        hasValidOfflineLicense,
        offlineExpiration,
        isOfflineModeActive: !navigator.onLine && hasValidOfflineLicense
    };
};
