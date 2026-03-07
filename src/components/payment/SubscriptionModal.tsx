import React, { useState } from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2, Star, Zap, Shield, Crown, Layers, Bitcoin, CreditCard, Wallet, Headphones, Tag, X } from 'lucide-react';
import { PayUCheckout } from './PayUCheckout';
import { TIER_LIMITS, validatePromoCode, UserTier } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PlanType = 'basic' | 'dj' | 'pro' | 'studio';
type PaymentMethod = 'payu' | 'paypal' | 'crypto' | 'epayco';

export const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<{ discount: number; message: string } | null>(null);
    const { toast } = useToast();

    const plans = [
        {
            id: 'basic' as PlanType,
            name: 'Basic',
            subtitle: 'Free Forever',
            price: '$0',
            period: '/forever',
            features: [
                '3 Enhancements/day (20/month)',
                'Unlimited Media Player',
                'Mixer Lab: 45 min/day',
            ],
            color: 'slate',
            icon: <Layers className="h-5 w-5" />,
            buttonText: 'Current Plan',
            isCurrent: true,
        },
        {
            id: 'dj' as PlanType,
            name: 'DJ Mode',
            subtitle: 'Mixer Pass',
            price: `$${TIER_LIMITS.dj.price}`,
            period: '/month',
            features: [
                'Unlimited Mixer Lab',
                'Recording Enabled',
                'Full Media Player',
                'Beat Jump & Quantize',
                'All DJ features',
            ],
            color: 'amber',
            icon: <Headphones className="h-5 w-5" />,
            buttonText: 'Get DJ Mode',
            amount: '20000',
            payUDescription: 'Level Audio DJ Mode - Monthly',
        },
        {
            id: 'pro' as PlanType,
            name: 'Pro',
            subtitle: 'For Active Producers',
            price: `$${TIER_LIMITS.pro.priceIntro}`,
            priceRegular: `$${TIER_LIMITS.pro.price}`,
            priceYearly: `$${TIER_LIMITS.pro.priceYearlyIntro}`,
            period: '/month',
            isIntro: true,
            features: [
                '150 Enhancements/month',
                '100 Level Stem Separations',
                '50 Basic Separations',
                '100 AI Masterings/month',
                'Unlimited Everything',
                'Recording + Premium FX',
            ],
            color: 'cyan',
            icon: <Zap className="h-5 w-5" />,
            buttonText: 'Upgrade to Pro',
            amount: '40000',
            payUDescription: 'Level Audio Pro - Monthly',
        },
        {
            id: 'studio' as PlanType,
            name: 'Studio',
            subtitle: 'For Professionals',
            price: `$${TIER_LIMITS.studio.price}`,
            priceYearly: `$${TIER_LIMITS.studio.priceYearlyIntro}`,
            period: '/month',
            features: [
                '400 Enhancements/month',
                '300 Level Stems + 6-Stem',
                '350 AI Masterings/month',
                'AI Stems in Mixer Lab',
                'Everything in Pro + Priority',
                'Use code EARLYSTUDIO for $24.99',
            ],
            color: 'purple',
            icon: <Crown className="h-5 w-5" />,
            buttonText: 'Upgrade to Studio',
            amount: '120000',
            payUDescription: 'Level Audio Studio - Monthly',
            isBest: true,
        },
    ];

    const paymentMethods = [
        {
            id: 'payu' as PaymentMethod,
            name: 'PayU / PSE',
            description: 'Visa, Mastercard, PSE, Efecty',
            icon: <CreditCard className="h-5 w-5" />,
            region: 'Latam Cards',
            available: true,
        },
        {
            id: 'epayco' as PaymentMethod,
            name: 'ePayco',
            description: 'Global Cards, Nequi, Daviplata',
            icon: <CreditCard className="h-5 w-5" />,
            region: 'Global + CO',
            available: true,
        },
        {
            id: 'paypal' as PaymentMethod,
            name: 'PayPal',
            description: 'Pay with PayPal account',
            icon: <Wallet className="h-5 w-5" />,
            region: 'International',
            available: false, // Coming soon
        },
        {
            id: 'crypto' as PaymentMethod,
            name: 'Crypto',
            description: 'BTC, ETH, SOL, USDT + 350',
            icon: <Bitcoin className="h-5 w-5" />,
            region: '0.5% fee',
            available: false, // Coming soon
        },
    ];

    const handleApplyPromo = () => {
        if (!promoCode || !selectedPlan) return;
        const result = validatePromoCode(promoCode, selectedPlan as UserTier);
        if (result.valid) {
            setAppliedPromo({ discount: result.discount, message: result.message });
            toast({ title: '✅ Promo Applied!', description: result.message });
        } else {
            setAppliedPromo(null);
            toast({ title: '❌ Invalid Code', description: result.message, variant: 'destructive' });
        }
    };

    const handlePlanSelect = (planId: PlanType) => {
        if (planId === 'basic') {
            onClose();
        } else {
            setSelectedPlan(planId);
            setAppliedPromo(null);
            setPromoCode('');
        }
    };

    const selectedPlanData = plans.find(p => p.id === selectedPlan);

    const getDiscountedPrice = () => {
        if (!selectedPlanData || !appliedPromo) return selectedPlanData?.price;
        const tierLimits = TIER_LIMITS[selectedPlan as UserTier];
        if (!tierLimits) return selectedPlanData?.price;
        const discounted = tierLimits.priceIntro * (1 - appliedPromo.discount / 100);
        return `$${discounted.toFixed(2)}`;
    };

    const handleBack = () => {
        if (paymentMethod) {
            setPaymentMethod(null);
        } else {
            setSelectedPlan(null);
            setAppliedPromo(null);
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
                                New users get 7 days of premium features. No credit card required.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {plans.map((plan) => (
                                <Card
                                    key={plan.id}
                                    className={`relative border-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${plan.isBest
                                        ? 'border-purple-500/50 bg-purple-950/10 shadow-lg shadow-purple-900/20'
                                        : plan.color === 'cyan'
                                            ? 'border-cyan-500/50 bg-cyan-950/10'
                                            : plan.color === 'amber'
                                                ? 'border-amber-500/50 bg-amber-950/10'
                                                : 'border-slate-700 bg-slate-900/50'
                                        }`}
                                    onClick={() => handlePlanSelect(plan.id)}
                                >
                                    {plan.isBest && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                                            BEST VALUE
                                        </div>
                                    )}
                                    {plan.isIntro && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                                            INTRO PRICE
                                        </div>
                                    )}
                                    <CardHeader className="pb-2 pt-4">
                                        <div className="flex items-center gap-2">
                                            {plan.icon}
                                            <CardTitle className={`text-base ${plan.color === 'slate' ? 'text-slate-200' :
                                                    plan.color === 'cyan' ? 'text-cyan-400' :
                                                        plan.color === 'amber' ? 'text-amber-400' :
                                                            'text-purple-400'
                                                }`}>
                                                {plan.name}
                                            </CardTitle>
                                        </div>
                                        <p className="text-[10px] text-slate-500">{plan.subtitle}</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-bold text-white">{plan.price}</span>
                                            <span className="text-xs text-slate-400">{plan.period}</span>
                                        </div>
                                        {plan.priceRegular && (
                                            <p className="text-[10px] text-slate-500 line-through">then {plan.priceRegular}/mo</p>
                                        )}
                                        {plan.priceYearly && (
                                            <p className="text-[10px] text-green-400">or {plan.priceYearly}/year</p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <ul className="space-y-1">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex items-start gap-1.5 text-slate-300">
                                                    <CheckCircle2 className={`h-3 w-3 shrink-0 mt-0.5 ${plan.isCurrent ? 'text-slate-500' : 'text-green-500'}`} />
                                                    <span className="text-[10px]">{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button
                                            className={`w-full text-xs font-semibold ${plan.isCurrent
                                                ? 'bg-slate-800 text-slate-300'
                                                : plan.color === 'cyan'
                                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                                                    : plan.color === 'amber'
                                                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                }`}
                                            size="sm"
                                        >
                                            {plan.buttonText}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </>
                )}

                {/* Step 2: Payment + Promo Code */}
                {selectedPlan && !paymentMethod && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                        <Button variant="ghost" onClick={handleBack} className="text-slate-400 hover:text-white text-sm">
                            ← Back to Plans
                        </Button>

                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                {selectedPlanData?.name} Plan
                            </h3>
                            <div className="text-right">
                                {appliedPromo ? (
                                    <div>
                                        <span className="text-sm text-slate-400 line-through mr-2">{selectedPlanData?.price}</span>
                                        <span className="text-xl font-bold text-green-400">{getDiscountedPrice()}</span>
                                        <span className="text-xs text-slate-400">/mo</span>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-xl font-bold text-white">{selectedPlanData?.price}</span>
                                        <span className="text-xs text-slate-400">/mo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Promo Code Box */}
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Tag className="h-4 w-4 text-cyan-400" />
                                <span className="text-sm text-slate-300 font-medium">Have a promo code?</span>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="Enter code (e.g. LEVELUP25)"
                                    className="bg-slate-800 border-slate-600 text-white text-sm uppercase"
                                />
                                <Button onClick={handleApplyPromo} size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0">
                                    Apply
                                </Button>
                            </div>
                            {appliedPromo && (
                                <div className="mt-2 flex items-center justify-between text-xs bg-green-500/10 border border-green-500/30 rounded px-2 py-1">
                                    <span className="text-green-400">✓ {appliedPromo.message}</span>
                                    <button onClick={() => { setAppliedPromo(null); setPromoCode(''); }} className="text-slate-400 hover:text-white">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Payment Methods */}
                        <h4 className="text-sm font-medium text-slate-300">Choose payment method:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {paymentMethods.map((method) => (
                                <Card
                                    key={method.id}
                                    className={`border-2 transition-all duration-300 cursor-pointer ${method.available
                                            ? 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/50 hover:scale-[1.02]'
                                            : 'border-slate-800 bg-slate-950/50 opacity-60'
                                        }`}
                                    onClick={() => method.available && setPaymentMethod(method.id)}
                                >
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-cyan-400">
                                            {method.icon}
                                        </div>
                                        <h4 className="text-white font-semibold text-sm">{method.name}</h4>
                                        <p className="text-[10px] text-slate-400">{method.description}</p>
                                        <Badge variant="outline" className={`text-[9px] ${method.available ? 'text-slate-400 border-slate-600' : 'text-slate-600 border-slate-700'}`}>
                                            {method.available ? method.region : 'Coming Soon'}
                                        </Badge>
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
                            ← Back
                        </Button>

                        {(paymentMethod === 'payu' || paymentMethod === 'epayco') && selectedPlanData && (
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
                                    <h3 className="text-xl font-bold text-white">PayPal</h3>
                                    <p className="text-slate-400 text-sm">
                                        PayPal payments via ePayco partnership available soon.
                                    </p>
                                    <Button disabled className="bg-blue-600 text-white opacity-60">Coming Soon</Button>
                                </div>
                            </Card>
                        )}

                        {paymentMethod === 'crypto' && (
                            <Card className="bg-slate-950/50 border-slate-800 p-8 text-center">
                                <div className="space-y-4">
                                    <Bitcoin className="h-16 w-16 mx-auto text-orange-400" />
                                    <h3 className="text-xl font-bold text-white">Crypto Payment</h3>
                                    <p className="text-slate-400 text-sm">
                                        Bitcoin, Ethereum, Solana, USDT + 350 coins via NOWPayments.
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-lg">₿</span>
                                        <span className="text-lg">Ξ</span>
                                        <span className="text-lg font-bold text-purple-400">◎</span>
                                    </div>
                                    <p className="text-xs text-slate-500">0.5% fee • DIAN-compliant (Res. 000240)</p>
                                    <Button disabled className="bg-orange-600 text-white opacity-60">Coming Soon</Button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {!selectedPlan && (
                    <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
                        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure</span>
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Cards + Crypto</span>
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Instant Activation</span>
                    </div>
                )}
            </div>
        </SimpleModal>
    );
};
