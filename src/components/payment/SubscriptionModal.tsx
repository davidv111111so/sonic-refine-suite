import React, { useState } from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, Star, Zap, Shield, Crown, Layers, Bitcoin, CreditCard, Wallet } from 'lucide-react';
import { PayUCheckout } from './PayUCheckout';
import { TIER_LIMITS } from '@/types/auth';
import { Badge } from '@/components/ui/badge';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PlanType = 'basic' | 'pro' | 'studio';
type PaymentMethod = 'payu' | 'paypal' | 'crypto';

export const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

    const plans = [
        {
            id: 'basic' as PlanType,
            name: 'Basic',
            subtitle: 'Free Forever',
            price: '$0',
            period: '/forever',
            description: 'Essential tools for hobbyists',
            features: [
                '3 Enhancements/day (20/month)',
                'Unlimited Media Player',
                'Mixer Lab: 45 min/day',
                'Community Support',
            ],
            limitations: [
                'No Stem Separation',
                'No AI Mastering',
                'No Recording',
                'No Premium Effects',
            ],
            color: 'slate',
            icon: <Layers className="h-5 w-5" />,
            buttonText: 'Current Plan',
            isCurrent: true,
        },
        {
            id: 'pro' as PlanType,
            name: 'Pro',
            subtitle: 'For Active Producers',
            price: `$${TIER_LIMITS.pro.price}`,
            priceYearly: `$${TIER_LIMITS.pro.priceYearly}`,
            period: '/month',
            description: 'Everything you need to produce',
            features: [
                '150 Enhancements/month',
                '100 Level Stem Separations',
                '50 Basic (Spleeter) Separations',
                '100 AI Masterings/month',
                'Unlimited Media & Mixer Lab',
                'Recording Enabled',
                'All Premium Effects & EQ',
            ],
            color: 'cyan',
            icon: <Zap className="h-5 w-5" />,
            buttonText: 'Upgrade to Pro',
            amount: '60000', // ~$14.99 USD in COP
            payUDescription: 'Level Audio Pro - Monthly',
        },
        {
            id: 'studio' as PlanType,
            name: 'Studio',
            subtitle: 'For Professionals',
            price: `$${TIER_LIMITS.studio.price}`,
            priceYearly: `$${TIER_LIMITS.studio.priceYearly}`,
            period: '/month',
            description: 'Maximum power, zero limits',
            features: [
                '400 Enhancements/month',
                '300 Level Stem Separations',
                '150 Basic (Spleeter) Separations',
                '6-Stem Separation Enabled',
                '350 AI Masterings/month',
                'AI Stems in Mixer Lab',
                'Everything in Pro + Priority',
            ],
            color: 'purple',
            icon: <Crown className="h-5 w-5" />,
            buttonText: 'Upgrade to Studio',
            amount: '120000', // ~$29.99 USD in COP
            payUDescription: 'Level Audio Studio - Monthly',
            isBest: true,
        },
    ];

    const paymentMethods = [
        {
            id: 'payu' as PaymentMethod,
            name: 'Credit/Debit Card',
            description: 'Visa, Mastercard, PSE, Efecty',
            icon: <CreditCard className="h-5 w-5" />,
            region: 'Latam & Global Cards',
        },
        {
            id: 'paypal' as PaymentMethod,
            name: 'PayPal',
            description: 'Pay with your PayPal account',
            icon: <Wallet className="h-5 w-5" />,
            region: 'International',
        },
        {
            id: 'crypto' as PaymentMethod,
            name: 'Cryptocurrency',
            description: 'BTC, ETH, SOL, USDT + 350 coins',
            icon: <Bitcoin className="h-5 w-5" />,
            region: 'Global • 0.5% fee',
        },
    ];

    const handlePlanSelect = (planId: PlanType) => {
        if (planId === 'basic') {
            onClose();
        } else {
            setSelectedPlan(planId);
        }
    };

    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        setPaymentMethod(method);
    };

    const selectedPlanData = plans.find(p => p.id === selectedPlan);

    const handleBack = () => {
        if (paymentMethod) {
            setPaymentMethod(null);
        } else {
            setSelectedPlan(null);
        }
    };

    return (
        <SimpleModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent font-bold">
                        Choose Your Plan
                    </span>
                </div>
            }
        >
            <div className="p-1">
                {/* Step 1: Plan Selection */}
                {!selectedPlan && (
                    <>
                        {/* Free Trial Banner */}
                        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                            <div className="flex items-center gap-2 text-sm">
                                <Zap className="h-4 w-4 text-amber-400" />
                                <span className="text-amber-200 font-semibold">Free Trial Available!</span>
                                <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">7 Days</Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                New users get 7 days of premium features including 20 enhancements, 7 Spleeter + 3 Level stems, 4h Mixer Lab access, and all premium effects.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map((plan) => (
                                <Card
                                    key={plan.id}
                                    className={`relative border-2 transition-all duration-300 hover:scale-[1.02] ${plan.isBest
                                        ? 'border-purple-500/50 bg-purple-950/10 shadow-lg shadow-purple-900/20'
                                        : plan.color === 'cyan'
                                            ? 'border-cyan-500/50 bg-cyan-950/10 shadow-lg shadow-cyan-900/20'
                                            : 'border-slate-700 bg-slate-900/50'
                                        }`}
                                >
                                    {plan.isBest && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            {plan.icon}
                                            <CardTitle className={`text-lg ${plan.color === 'slate' ? 'text-slate-200' :
                                                plan.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'
                                                }`}>
                                                {plan.name}
                                            </CardTitle>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">{plan.subtitle}</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-3xl font-bold text-white">{plan.price}</span>
                                            <span className="text-sm text-slate-400">{plan.period}</span>
                                        </div>
                                        {plan.priceYearly && (
                                            <p className="text-[10px] text-green-400">or {plan.priceYearly}/year (save 17%)</p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        <ul className="space-y-1.5 text-sm">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-slate-300">
                                                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${plan.isCurrent ? 'text-slate-500' : 'text-green-500'}`} />
                                                    <span className="text-[11px]">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className={`w-full font-semibold ${plan.isCurrent
                                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                                : plan.color === 'cyan'
                                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                                                }`}
                                            onClick={() => handlePlanSelect(plan.id)}
                                            variant={plan.isCurrent ? 'outline' : 'default'}
                                        >
                                            {plan.buttonText}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </>
                )}

                {/* Step 2: Payment Method Selection */}
                {selectedPlan && !paymentMethod && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                        <Button variant="ghost" onClick={handleBack} className="text-slate-400 hover:text-white text-sm">
                            ← Back to Plans
                        </Button>

                        <h3 className="text-lg font-semibold text-white">
                            How would you like to pay for <span className="text-cyan-400">{selectedPlanData?.name}</span>?
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {paymentMethods.map((method) => (
                                <Card
                                    key={method.id}
                                    className="border-2 border-slate-700 hover:border-cyan-500/50 bg-slate-900/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                                    onClick={() => handlePaymentMethodSelect(method.id)}
                                >
                                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-cyan-400">
                                            {method.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold">{method.name}</h4>
                                            <p className="text-xs text-slate-400 mt-1">{method.description}</p>
                                            <Badge variant="outline" className="mt-2 text-[9px] text-slate-500 border-slate-600">
                                                {method.region}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Payment Processing */}
                {selectedPlan && paymentMethod && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <Button variant="ghost" onClick={handleBack} className="text-slate-400 hover:text-white text-sm mb-4">
                            ← Back to Payment Methods
                        </Button>

                        {paymentMethod === 'payu' && selectedPlanData && (
                            <PayUCheckout
                                planName={selectedPlanData.name}
                                amount={selectedPlanData.amount || '0'}
                                description={selectedPlanData.payUDescription || ''}
                                onBack={handleBack}
                            />
                        )}

                        {paymentMethod === 'paypal' && (
                            <Card className="bg-slate-950/50 border-slate-800 p-8 text-center">
                                <div className="space-y-4">
                                    <Wallet className="h-16 w-16 mx-auto text-blue-400" />
                                    <h3 className="text-xl font-bold text-white">PayPal Integration</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                                        PayPal payments for <span className="text-cyan-400 font-semibold">{selectedPlanData?.name}</span> plan
                                        ({selectedPlanData?.price}{selectedPlanData?.period}) will be available soon.
                                    </p>
                                    <p className="text-xs text-slate-500">Currently being configured via ePayco partnership for Colombian merchants.</p>
                                    <Button disabled className="bg-blue-600 hover:bg-blue-700 text-white opacity-60">
                                        Coming Soon
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {paymentMethod === 'crypto' && (
                            <Card className="bg-slate-950/50 border-slate-800 p-8 text-center">
                                <div className="space-y-4">
                                    <Bitcoin className="h-16 w-16 mx-auto text-orange-400" />
                                    <h3 className="text-xl font-bold text-white">Crypto Payment</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                                        Pay for <span className="text-cyan-400 font-semibold">{selectedPlanData?.name}</span> plan
                                        with Bitcoin, Ethereum, Solana, USDT, and 350+ crypto assets.
                                    </p>
                                    <div className="flex items-center justify-center gap-3 py-2">
                                        <span className="text-lg">₿</span>
                                        <span className="text-lg">Ξ</span>
                                        <span className="text-lg font-bold text-purple-400">◎</span>
                                        <span className="text-sm text-green-400 font-bold">USDT</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Powered by NOWPayments • 0.5% transaction fee • Instant settlement</p>
                                    <Button disabled className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white opacity-60">
                                        Coming Soon
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {!selectedPlan && (
                    <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
                        <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Secure Payment
                        </span>
                        <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> Cards + Crypto
                        </span>
                        <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Instant Activation
                        </span>
                    </div>
                )}
            </div>
        </SimpleModal>
    );
};
