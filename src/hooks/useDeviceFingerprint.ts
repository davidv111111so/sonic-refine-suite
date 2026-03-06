import { useState, useEffect } from 'react';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { supabase } from '@/integrations/supabase/client';

export const useDeviceFingerprint = () => {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initFingerprint = async () => {
            try {
                // Check if we already have it in localStorage to save processing time
                const cachedId = localStorage.getItem('levelAudio_deviceId');

                if (cachedId) {
                    setDeviceId(cachedId);
                    setIsLoading(false);
                    // Still run background check to ensure it's recorded in Supabase, but UI can proceed
                }

                // Generate fingerprint
                const fp = await fpPromise.load();
                const result = await fp.get();
                const hash = result.visitorId;

                // Only update and insert if different from cache or no cache
                if (hash !== cachedId) {
                    localStorage.setItem('levelAudio_deviceId', hash);
                    setDeviceId(hash);
                }

                // Register/Update device record in Supabase (silent failure if network error)
                try {
                    await supabase.rpc('register_device', {
                        device_hash: hash,
                    });
                } catch (dbError) {
                    console.error('Failed to register device fingerprint in database:', dbError);
                }

            } catch (error) {
                console.error('Failed to generate device fingerprint:', error);

                // Fallback to a random ID if fingerprinting totally fails (rare)
                const fallbackId = localStorage.getItem('levelAudio_deviceId') || `fb_${Math.random().toString(36).substring(2, 15)}`;
                localStorage.setItem('levelAudio_deviceId', fallbackId);
                setDeviceId(fallbackId);
            } finally {
                setIsLoading(false);
            }
        };

        initFingerprint();
    }, []);

    return { deviceId, isLoading };
};
