import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Music, Star, Crown, CreditCard, Wallet, X, Sparkles, Zap } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PaymentMethod = 'paddle' | 'crypto';

export const Pricing: React.FC = () => {
    const { profile, isPremium, isVip } = useAuth();
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('paddle');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async (planId: 'monthly' | 'yearly') => {
        if (!profile) {
            toast.error('Please log in to upgrade');
            return;
        }

        setIsLoading(true);

        try {
            const options = {
                planId,
                email: profile.email || '',
                userId: profile.id,
            };

            if (selectedPayment === 'paddle') {
                await paymentService.startPaddleCheckout(options);
            } else {
                await paymentService.startCryptoCheckout(options);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Failed to start checkout. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            period: '',
            description: 'Perfect for getting started',
            icon: Music,
            iconColor: 'text-cyan-400',
            features: [
                { text: '20 Audio Enhancements/month', included: true },
                { text: '2-Stem Separation Only', included: true },
                { text: '1 Hour Mixer Lab/day', included: true },
                { text: 'MP3 Downloads Only', included: true },
                { text: 'AI Mastering', included: false },
                { text: 'Priority Processing', included: false },
            ],
            buttonText: profile ? 'Current Plan' : 'Get Started',
            buttonAction: () => { },
            disabled: true,
            highlighted: false,
        },
        {
            id: 'monthly',
            name: 'Premium',
            price: '$9.99',
            period: '/month',
            description: 'Full access to all features',
            icon: Star,
            iconColor: 'text-yellow-400',
            features: [
                { text: '250 Enhancements/month', included: true },
                { text: '2, 4, or 6 Stem Separation', included: true },
                { text: '150 Stem Tracks/month', included: true },
                { text: '150 AI Masterings/month', included: true },
                { text: 'Unlimited Mixer Lab', included: true },
                { text: 'High-Fidelity WAV Downloads', included: true },
            ],
            buttonText: isPremium && !isVip ? 'Current Plan' : (isVip ? 'Downgrade' : 'Subscribe Monthly'),
            buttonAction: () => handleUpgrade('monthly'),
            disabled: isPremium && !isVip,
            highlighted: false,
        },
        {
            id: 'yearly',
            name: 'VIP Cloud',
            price: '$24.99',
            period: '/month',
            originalPrice: '$29.99',
            savings: 'Launch Promo!',
            description: 'Fastest online processing',
            icon: Crown,
            iconColor: 'text-purple-400',
            features: [
                { text: '⚡ GPU Accelerated (5-10x faster)', included: true },
                { text: 'Unlimited Enhancements', included: true },
                { text: '500 Stem Tracks/month', included: true },
                { text: '500 AI Masterings/month', included: true },
                { text: 'Priority Processing Queue', included: true },
                { text: 'Everything in Premium', included: true },
            ],
            buttonText: isVip ? 'Current Plan' : 'Go VIP',
            buttonAction: () => handleUpgrade('yearly'),
            disabled: isVip,
            highlighted: true,
        },
        {
            id: 'desktop',
            name: 'Desktop Pro',
            price: '$49.99',
            period: ' one-time',
            originalPrice: '$59.99',
            savings: 'Launch Offer!',
            description: 'Lightning fast. Unlimited. Local.',
            icon: Zap,
            iconColor: 'text-orange-400',
            features: [
                { text: 'Runs on your GPU/CPU locally', included: true },
                { text: 'ZERO recurring fees (Lifetime)', included: true },
                { text: 'Fully offline capable', included: true },
                { text: 'Unlimited Enhancements', included: true },
                { text: 'Unlimited Stem Separations', included: true },
                { text: 'Unlimited AI Mastering', included: true },
            ],
            buttonText: 'Pre-Order Now',
            buttonAction: () => { toast.info('Desktop Pro coming very soon!') },
            disabled: false,
            highlighted: false,
            specialBorder: 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/30'
        },
    ];

    return (
        <div className="py-12 px-4 bg-gradient-to-b from-slate-950/80 to-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-sm">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 mb-4">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-300 font-medium">Unlock Your Full Potential</span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
                    Choose Your Plan
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    From casual editing to professional production. Choose the plan that fits your workflow.
                </p>
            </div>

            {/* Payment Method Selector */}
            {!isPremium && (
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-700">
                        <button
                            onClick={() => setSelectedPayment('paddle')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                selectedPayment === 'paddle'
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <CreditCard className="w-4 h-4" />
                            Card / PayPal
                        </button>
                        <button
                            onClick={() => setSelectedPayment('crypto')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                selectedPayment === 'crypto'
                                    ? "bg-orange-600 text-white shadow-lg"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <Wallet className="w-4 h-4" />
                            Crypto
                        </button>
                    </div>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className={cn(
                            "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                            "bg-slate-900/80 border-slate-800",
                            (plan as any).specialBorder ? (plan as any).specialBorder : (
                                plan.highlighted ? [
                                    "border-purple-500/50",
                                    "shadow-[0_0_40px_rgba(168,85,247,0.15)]",
                                    "ring-1 ring-purple-500/30",
                                ] : ""
                            )
                        )}
                    >
                        {/* Savings Badge */}
                        {plan.savings && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                                {plan.savings}
                            </div>
                        )}

                        {/* Most Popular Badge */}
                        {plan.highlighted && (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-widest z-10">
                                Most Popular
                            </div>
                        )}

                        <CardHeader className="pt-10">
                            <div className="flex items-center gap-3 mb-2">
                                <plan.icon className={cn("h-7 w-7", plan.iconColor, plan.highlighted && "fill-current")} />
                                <CardTitle className="text-xl font-bold text-white">
                                    {plan.name}
                                </CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">
                                {plan.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="flex items-baseline gap-1">
                                {plan.originalPrice && (
                                    <span className="text-base lg:text-lg text-slate-500 line-through mr-2">
                                        {plan.originalPrice}
                                    </span>
                                )}
                                <span className="text-3xl lg:text-4xl font-extrabold text-white">{plan.price}</span>
                                {plan.period && <span className="text-xs lg:text-sm text-slate-400">{plan.period}</span>}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        {feature.included ? (
                                            <Check className={cn(
                                                "h-5 w-5 shrink-0",
                                                plan.highlighted ? "text-purple-400" : "text-cyan-400"
                                            )} />
                                        ) : (
                                            <X className="h-5 w-5 shrink-0 text-slate-600" />
                                        )}
                                        <span className={cn(
                                            "text-xs lg:text-sm",
                                            feature.included ? "text-slate-300" : "text-slate-500"
                                        )}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 pb-6">
                            <Button
                                onClick={plan.buttonAction}
                                disabled={plan.disabled || isLoading}
                                className={cn(
                                    "w-full font-bold text-base py-6",
                                    plan.id === 'free' && "bg-slate-800 hover:bg-slate-700 text-slate-300",
                                    plan.id === 'monthly' && !isPremium && "bg-blue-600 hover:bg-blue-700",
                                    plan.id === 'desktop' && "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25",
                                    plan.highlighted && !isVip && [
                                        "bg-gradient-to-r from-purple-600 to-pink-600",
                                        "hover:from-purple-700 hover:to-pink-700",
                                        "shadow-lg shadow-purple-500/25",
                                    ],
                                    plan.disabled && plan.id !== 'free' && "bg-green-600/50 text-green-300"
                                )}
                            >
                                {isLoading ? 'Loading...' : plan.buttonText}
                            </Button>


                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-slate-500 text-sm">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    Secure Checkout
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Cancel Anytime
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    24/7 Support
                </div>
            </div>

            {/* Payment Method Info */}
            <div className="text-center mt-8">
                <p className="text-xs text-slate-600">
                    {selectedPayment === 'paddle'
                        ? 'Payments processed securely by Paddle. Supports Visa, Mastercard, PayPal, and more.'
                        : 'Payments processed via Coinbase Commerce. Supports BTC, ETH, USDC, and other major cryptocurrencies.'
                    }
                </p>
            </div>
        </div>
    );
};

export default Pricing;
