import React from 'react';
import { Crown, Lock } from 'lucide-react';

/**
 * PremiumBadge — A small pill that labels premium features.
 * Shows for ALL users (premium included) as a UX cue.
 * For free users, it also shows a lock icon.
 */
interface PremiumBadgeProps {
    locked?: boolean;    // true if the current user does NOT have access
    size?: 'sm' | 'md';
    className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
    locked = false,
    size = 'sm',
    className = ''
}) => {
    const sizeClasses = size === 'sm'
        ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
        : 'text-xs px-2 py-1 gap-1';

    return (
        <span
            className={`inline-flex items-center font-semibold rounded-full uppercase tracking-wide
        ${locked
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-300 border border-amber-400/20'
                }
        ${sizeClasses} ${className}`}
        >
            {locked ? (
                <Lock className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            ) : (
                <Crown className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            )}
            PRO
        </span>
    );
};

/**
 * PremiumGate — Wraps content that requires premium.
 * For free users: shows grayed-out content with an upgrade overlay.
 * For premium/admin users: shows content normally with an optional PRO label.
 */
interface PremiumGateProps {
    children: React.ReactNode;
    isLocked: boolean;
    featureName?: string;
    showBadge?: boolean;        // Show the PRO badge even when unlocked (for UX)
    className?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
    children,
    isLocked,
    featureName = 'This feature',
    showBadge = true,
    className = ''
}) => {
    if (!isLocked) {
        return <>{children}</>;
    }

    return (
        <div className={`relative ${className}`}>
            {/* Grayed-out content */}
            <div className="opacity-40 pointer-events-none select-none filter grayscale">
                {children}
            </div>

            {/* Upgrade overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-slate-900/95 backdrop-blur-sm border border-amber-500/30 rounded-xl p-6 text-center max-w-sm shadow-2xl shadow-amber-500/10">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">Premium Feature</h3>
                    <p className="text-slate-400 text-sm mb-4">
                        {featureName} requires a Premium subscription.
                    </p>
                    <PremiumBadge locked size="md" />
                </div>
            </div>
        </div>
    );
};

export default PremiumBadge;
