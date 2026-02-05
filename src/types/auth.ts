export type UserTier = 'basic' | 'premium' | 'admin';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    tier: UserTier;
    subscription_id?: string;
    customer_id?: string;
    created_at: string;
    updated_at: string;
}

export interface AuthState {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
}
