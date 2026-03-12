import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Music, Star, Crown, CreditCard, Wallet, X, Sparkles, Zap, Headphones, Shield, ArrowRight } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PaymentMethod = 'paddle' | 'crypto';

export const Pricing: React.FC = () => {
    const { profile, isPremium, isVip } = useAuth();
    const navigate = useNavigate();
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
            id: 'solo-dj',
            name: 'Solo DJ Mixer',
            price: '$4.99',
            period: '/mo',
            description: 'Professional mixing gear',
            icon: Music,
            color: 'cyan',
            features: [
                { text: 'Full Pro Mixer Lab', included: true },
                { text: 'Harmonic Mixing Tools', included: true },
                { text: 'Unlimited Playlists', included: true },
                { text: 'MIDI Controller Support', included: true },
                { text: 'Offline Mode (Desktop)', included: true },
            ],
            buttonText: 'Start Mixing',
            buttonAction: () => navigate('/app'),
            specialBadge: 'NEW',
        },
        {
            id: 'free',
            name: 'Free Trial',
            price: '$0',
            period: '/7 days',
            description: 'Perfect for getting started',
            icon: Headphones,
            color: 'slate',
            features: [
                { text: '10 Enhancements/mo', included: true },
                { text: '3 Stems/mo', included: true },
                { text: '2 Masterings/mo', included: true },
                { text: 'Unlimited Media Player', included: true },
                { text: 'Basic tier speed', included: true },
            ],
            buttonText: profile ? 'Active' : 'Start Trial',
            buttonAction: () => navigate('/app'),
            disabled: !!profile,
        },
        {
            id: 'monthly',
            name: 'Premium',
            price: '$9.99',
            period: '/mo',
            description: 'Full studio access',
            icon: Sparkles,
            color: 'blue',
            features: [
                { text: '250 Enhancements/mo', included: true },
                { text: '150 Stems/mo', included: true },
                { text: '150 Masterings/mo', included: true },
                { text: 'Pro Mixer Lab Access', included: true },
                { text: 'Lossless WAV Export', included: true },
                { text: 'Priority Buffer', included: true },
            ],
            buttonText: isPremium && !isVip ? 'Current Plan' : (isVip ? 'Downgrade' : 'Go Premium'),
            buttonAction: () => handleUpgrade('monthly'),
            disabled: isPremium && !isVip,
        },
        {
            id: 'yearly',
            name: 'VIP Cloud',
            price: '$24.99',
            period: '/mo',
            description: 'Ultimate GPU Power',
            icon: Crown,
            color: 'purple',
            highlighted: true,
            features: [
                { text: '⚡ GPU Accelerated (10x)', included: true },
                { text: '500 Stems/month', included: true },
                { text: '500 Masterings/month', included: true },
                { text: 'Pro Mixer Lab Access', included: true },
                { text: 'Everything in Premium', included: true },
                { text: '24/7 Priority Support', included: true },
            ],
            buttonText: isVip ? 'Current Plan' : 'Get VIP',
            buttonAction: () => handleUpgrade('yearly'),
            disabled: isVip,
        },
        {
            id: 'desktop',
            name: 'Desktop Pro',
            price: '$49.99',
            period: ' once',
            originalPrice: '$59.99',
            description: 'Lifetime License',
            icon: Zap,
            color: 'orange',
            features: [
                { text: 'Local GPU Processing', included: true },
                { text: 'ZERO recurring fees', included: true },
                { text: 'Fully offline capable', included: true },
                { text: 'Unlimited EVERYTHING', included: true },
                { text: 'Lifetime Updates', included: true },
                { text: 'Local File Indexing', included: true },
            ],
            buttonText: 'Pre-Order',
            buttonAction: () => { toast.info('Desktop Pro coming very soon!') },
            savings: 'Launch Offer!',
        },
    ];

    const getColorClasses = (color: string, highlighted?: boolean) => {
        const variants: Record<string, any> = {
            cyan: {
                border: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
                text: 'text-cyan-400',
                button: 'bg-cyan-600 hover:bg-cyan-500 text-white',
                icon: 'text-cyan-400'
            },
            purple: {
                border: 'border-purple-500/50 shadow-purple-500/20 ring-1 ring-purple-500/30',
                text: 'text-purple-400',
                button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20',
                icon: 'text-purple-400'
            },
            orange: {
                border: 'hover:border-orange-500/50 hover:shadow-orange-500/10',
                text: 'text-orange-400',
                button: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white',
                icon: 'text-orange-400'
            },
            blue: {
                border: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
                text: 'text-blue-400',
                button: 'bg-blue-600 hover:bg-blue-500 text-white',
                icon: 'text-blue-400'
            },
            slate: {
                border: 'hover:border-slate-500/30',
                text: 'text-slate-400',
                button: 'bg-slate-800 hover:bg-slate-700 text-slate-300',
                icon: 'text-slate-400'
            }
        };
        return variants[color] || variants.cyan;
    };

    return (
        <div className="py-6 px-2 space-y-10">
            {/* Payment Method Selector */}
            {!isPremium && (
                <div className="flex justify-center">
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
                        <button
                            onClick={() => setSelectedPayment('paddle')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
                                selectedPayment === 'paddle'
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "text-slate-500 hover:text-white"
                            )}
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            Credit Card
                        </button>
                        <button
                            onClick={() => setSelectedPayment('crypto')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
                                selectedPayment === 'crypto'
                                    ? "bg-orange-600 text-white shadow-lg"
                                    : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Wallet className="w-3.5 h-3.5" />
                            Crypto
                        </button>
                    </div>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {plans.map((plan) => {
                    const colors = getColorClasses(plan.color, plan.highlighted);
                    return (
                        <Card
                            key={plan.id}
                            className={cn(
                                "bg-slate-900/40 border-white/5 backdrop-blur-xl transition-all duration-500 rounded-2xl overflow-hidden group flex flex-col relative",
                                colors.border
                            )}
                        >
                            {plan.savings && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg z-20 uppercase tracking-tighter">
                                    {plan.savings}
                                </div>
                            )}

                            {plan.specialBadge && (
                                <div className="absolute top-0 left-0 bg-cyan-500 text-slate-950 text-[9px] font-black px-2 py-1 rounded-br-lg z-20 uppercase tracking-widest">
                                    {plan.specialBadge}
                                </div>
                            )}

                            <CardHeader className="pt-8 pb-4">
                                <div className={cn("p-2.5 rounded-xl w-fit mb-4 bg-white/5", colors.icon)}>
                                    <plan.icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-xl font-black text-white">{plan.name}</CardTitle>
                                <CardDescription className="text-slate-500 text-xs font-medium leading-relaxed">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-grow space-y-6">
                                <div className="flex items-baseline gap-1">
                                    {plan.originalPrice && (
                                        <span className="text-sm text-slate-500 line-through opacity-50">{plan.originalPrice}</span>
                                    )}
                                    <span className="text-3xl font-black text-white tracking-tighter">{plan.price}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{plan.period}</span>
                                </div>

                                <ul className="space-y-2.5">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs">
                                            <Check className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.text)} />
                                            <span className="text-slate-400 font-medium">{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter className="pt-2 pb-6">
                                <Button
                                    onClick={plan.buttonAction}
                                    disabled={plan.disabled || isLoading}
                                    className={cn(
                                        "w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                                        colors.button,
                                        plan.disabled && "opacity-50 grayscale cursor-not-allowed"
                                    )}
                                >
                                    {isLoading ? 'Wait...' : plan.buttonText}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Trust Footer */}
            <div className="flex flex-col items-center gap-4 pt-4">
               <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                   <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Secure Payment</span>
                   <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-cyan-500" /> Cancel Anytime</span>
               </div>
               <p className="text-[9px] text-slate-600 text-center max-w-md leading-relaxed">
                   {selectedPayment === 'paddle' 
                     ? "Billing handled by Paddle. Secure encryption. Supports All Cards & PayPal."
                     : "Crypto payments via Coinbase. BTC, ETH, SOL supported. No chargebacks."}
               </p>
            </div>
        </div>
    );
};

export default Pricing;
