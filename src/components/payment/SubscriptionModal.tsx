import React, { useState } from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, Star, Zap, Shield } from 'lucide-react';
import { PayUCheckout } from './PayUCheckout';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PlanType = 'free' | 'monthly' | 'yearly';

export const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            period: '/forever',
            description: 'Essential tools for hobbyists',
            features: [
                'Basic AI Mastering',
                '2-Stem Separation',
                'Standard Quality Downloads',
                'Community Support'
            ],
            color: 'slate',
            buttonText: 'Current Plan',
            action: () => onClose()
        },
        {
            id: 'monthly',
            name: 'Premium Monthly',
            price: '$7.99',
            period: '/month',
            description: 'Perfect for active producers',
            features: [
                'Unlimited AI Mastering',
                '6-Stem Separation',
                'High-Fidelity WAV Downloads',
                'Priority Processing',
                'Advanced EQ & Dynamics'
            ],
            color: 'cyan',
            buttonText: 'Subscribe Monthly',
            amount: '32000', // Approx 32,000 COP
            payUDescription: 'Sonic Refine Premium - Monthly Subscription'
        },
        {
            id: 'yearly',
            name: 'Premium Yearly',
            price: '$80.00',
            period: '/year',
            description: 'Best value for professionals',
            features: [
                'All Premium Features',
                '2 Months Free',
                'Early Access to New Features',
                'Priority Support',
                'Commercial License'
            ],
            color: 'purple',
            buttonText: 'Subscribe Yearly',
            amount: '320000', // Approx 320,000 COP
            payUDescription: 'Sonic Refine Premium - Yearly Subscription'
        }
    ];

    const handlePlanSelect = (planId: string) => {
        if (planId === 'free') {
            onClose();
        } else {
            setSelectedPlan(planId as PlanType);
        }
    };

    const selectedPlanData = plans.find(p => p.id === selectedPlan);

    return (
        <SimpleModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent font-bold">
                        Upgrade to Premium
                    </span>
                </div>
            }
        >
            <div className="p-1">
                {!selectedPlan ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={`relative border-2 transition-all duration-300 hover:scale-[1.02] ${plan.id === 'yearly'
                                        ? 'border-purple-500/50 bg-purple-950/10 shadow-lg shadow-purple-900/20'
                                        : plan.id === 'monthly'
                                            ? 'border-cyan-500/50 bg-cyan-950/10 shadow-lg shadow-cyan-900/20'
                                            : 'border-slate-700 bg-slate-900/50'
                                    }`}
                            >
                                {plan.id === 'yearly' && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                        BEST VALUE
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <CardTitle className={`text-lg ${plan.id === 'free' ? 'text-slate-200' :
                                            plan.id === 'monthly' ? 'text-cyan-400' : 'text-purple-400'
                                        }`}>
                                        {plan.name}
                                    </CardTitle>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                                        <span className="text-sm text-slate-400">{plan.period}</span>
                                    </div>
                                    <CardDescription className="text-xs mt-1">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <ul className="space-y-2 text-sm">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-slate-300">
                                                <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.id === 'free' ? 'text-slate-500' : 'text-green-500'
                                                    }`} />
                                                <span className="text-xs">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className={`w-full font-semibold ${plan.id === 'free'
                                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                                : plan.id === 'monthly'
                                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                                            }`}
                                        onClick={() => handlePlanSelect(plan.id as string)}
                                        variant={plan.id === 'free' ? 'outline' : 'default'}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {selectedPlanData && (
                            <PayUCheckout
                                planName={selectedPlanData.name}
                                amount={selectedPlanData.amount || '0'}
                                description={selectedPlanData.payUDescription || ''}
                                onBack={() => setSelectedPlan(null)}
                            />
                        )}
                    </div>
                )}

                {!selectedPlan && (
                    <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
                        <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Secure Payment
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
