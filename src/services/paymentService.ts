/**
 * Payment Service
 * Handles Paddle Billing and Coinbase Commerce checkout flows
 * 
 * Pricing:
 * - Monthly: $7.99/month
 * - Yearly: $79.99/year (2 months free)
 */

// Paddle SDK types
declare global {
    interface Window {
        Paddle?: {
            Environment: {
                set: (env: 'sandbox' | 'production') => void;
            };
            Setup: (options: { token: string }) => void;
            Checkout: {
                open: (options: PaddleCheckoutOptions) => void;
            };
        };
    }
}

interface PaddleCheckoutOptions {
    items: Array<{ priceId: string; quantity: number }>;
    customer?: { email: string };
    customData?: Record<string, string>;
    settings?: {
        successUrl?: string;
        displayMode?: 'overlay' | 'inline';
        theme?: 'light' | 'dark';
        locale?: string;
    };
}

export interface CheckoutOptions {
    planId: 'monthly' | 'yearly';
    email: string;
    userId: string;
}

// Environment variables
const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
const PADDLE_ENV = import.meta.env.VITE_PADDLE_ENV || 'sandbox';

// Paddle Price IDs (replace with your actual IDs from Paddle dashboard)
const PADDLE_PRICES = {
    monthly: import.meta.env.VITE_PADDLE_PRICE_MONTHLY || 'pri_01xxx', // $7.99/month
    yearly: import.meta.env.VITE_PADDLE_PRICE_YEARLY || 'pri_01yyy',   // $79.99/year
};

// Pricing for Coinbase Commerce (USD)
const CRYPTO_PRICES = {
    monthly: '7.99',
    yearly: '79.99',
};

/**
 * Check if Paddle SDK is loaded
 */
const isPaddleReady = (): boolean => {
    return typeof window !== 'undefined' && !!window.Paddle;
};

/**
 * Load Paddle SDK script dynamically
 */
const loadPaddleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (isPaddleReady()) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Paddle SDK'));
        document.head.appendChild(script);
    });
};

export const paymentService = {
    /**
     * Initialize Paddle SDK
     * Call this on app startup or before first checkout
     */
    initPaddle: async (): Promise<boolean> => {
        try {
            await loadPaddleScript();

            if (!window.Paddle) {
                console.error('Paddle SDK not available');
                return false;
            }

            // Set environment (sandbox for testing, production for live)
            window.Paddle.Environment.set(PADDLE_ENV as 'sandbox' | 'production');

            // Initialize with client token
            window.Paddle.Setup({ token: PADDLE_CLIENT_TOKEN });

            console.log(`✅ Paddle initialized (${PADDLE_ENV})`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Paddle:', error);
            return false;
        }
    },

    /**
     * Start Paddle checkout (handles Credit Card + PayPal)
     */
    startPaddleCheckout: async ({ planId, email, userId }: CheckoutOptions): Promise<void> => {
        if (!isPaddleReady()) {
            await paymentService.initPaddle();
        }

        if (!window.Paddle) {
            throw new Error('Paddle not initialized');
        }

        const priceId = PADDLE_PRICES[planId];
        if (!priceId || priceId.includes('xxx')) {
            throw new Error(`Invalid price ID for plan: ${planId}. Please configure VITE_PADDLE_PRICE_${planId.toUpperCase()}`);
        }

        console.log(`🛒 Starting Paddle checkout: ${planId} (${priceId})`);

        window.Paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: { email },
            customData: { userId, planId },
            settings: {
                successUrl: `${window.location.origin}/subscription/success?provider=paddle`,
                displayMode: 'overlay',
                theme: 'dark',
                locale: 'en',
            },
        });
    },

    /**
     * Start Coinbase Commerce checkout (Crypto payments)
     */
    startCryptoCheckout: async ({ planId, email, userId }: CheckoutOptions): Promise<void> => {
        const price = CRYPTO_PRICES[planId];
        const planName = planId === 'yearly' ? 'Yearly' : 'Monthly';

        console.log(`🪙 Creating crypto charge: ${planId} ($${price})`);

        try {
            const response = await fetch('/api/create-crypto-charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Level Premium ${planName}`,
                    description: `Level Audio Premium - ${planName} subscription`,
                    local_price: { amount: price, currency: 'USD' },
                    metadata: { userId, planId, email },
                    redirect_url: `${window.location.origin}/subscription/success?provider=coinbase`,
                    cancel_url: `${window.location.origin}/pricing`,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create crypto charge');
            }

            const { hosted_url } = await response.json();

            if (!hosted_url) {
                throw new Error('No checkout URL returned');
            }

            // Redirect to Coinbase Commerce checkout
            window.location.href = hosted_url;
        } catch (error) {
            console.error('❌ Crypto checkout error:', error);
            throw error;
        }
    },

    /**
     * Start PayPal checkout (via Paddle - PayPal is a payment method in Paddle)
     * Paddle automatically shows PayPal as an option, so this just opens Paddle checkout
     */
    startPayPalCheckout: async (options: CheckoutOptions): Promise<void> => {
        // PayPal is handled through Paddle's checkout
        return paymentService.startPaddleCheckout(options);
    },

    /**
     * Check current subscription status
     */
    getSubscriptionStatus: async (userId: string): Promise<{
        isPremium: boolean;
        planType: string;
        status: string;
        expiresAt: string | null;
    }> => {
        try {
            const { supabase } = await import('@/integrations/supabase/client');

            const { data, error } = await supabase
                .from('subscriptions')
                .select('status, plan_type, current_period_end')
                .eq('user_id', userId)
                .single();

            if (error || !data) {
                return { isPremium: false, planType: 'free', status: 'free', expiresAt: null };
            }

            return {
                isPremium: data.status === 'active' || data.status === 'trialing',
                planType: data.plan_type,
                status: data.status,
                expiresAt: data.current_period_end,
            };
        } catch (error) {
            console.error('Error fetching subscription:', error);
            return { isPremium: false, planType: 'free', status: 'free', expiresAt: null };
        }
    },

    /**
     * Cancel subscription (user-initiated)
     * This would typically redirect to Paddle's customer portal
     */
    openCustomerPortal: async (email: string): Promise<void> => {
        // Paddle provides a customer portal URL
        // You'll need to implement this based on your Paddle setup
        console.log('Opening customer portal for:', email);
        // window.location.href = `https://customer-portal.paddle.com/...`;
    },
};

export default paymentService;
