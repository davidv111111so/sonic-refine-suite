import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface PayUCheckoutProps {
    userEmail?: string;
    planName: string;
    amount: string;
    description: string;
    onBack?: () => void;
}

export const PayUCheckout = ({
    userEmail = 'customer@example.com',
    planName,
    amount,
    description,
    onBack
}: PayUCheckoutProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        merchantId: '',
        accountId: '',
        description: description,
        referenceCode: '',
        amount: amount,
        tax: '0',
        taxReturnBase: '0',
        currency: 'COP',
        signature: '',
        test: '1',
        buyerEmail: userEmail,
        responseUrl: window.location.origin, // Return to app
        confirmationUrl: window.location.origin + '/api/payment/confirmation', // Webhook (placeholder)
    });

    // Update form data when props change
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            description,
            amount,
            buyerEmail: userEmail
        }));
    }, [description, amount, userEmail]);

    const generateSignature = async () => {
        setIsLoading(true);
        try {
            // Generate unique reference
            const referenceCode = `SONIC-${Date.now()}`;

            const response = await fetch('http://localhost:8001/api/payment/payu-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceCode,
                    amount: formData.amount,
                    currency: formData.currency
                })
            });

            if (!response.ok) throw new Error('Failed to generate signature');

            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                referenceCode,
                merchantId: data.merchantId,
                accountId: data.accountId,
                signature: data.signature,
                test: data.test.toString()
            }));

            // Auto-submit form after state update
            setTimeout(() => {
                const form = document.getElementById('payu-form') as HTMLFormElement;
                if (form) form.submit();
            }, 500);

        } catch (error) {
            console.error(error);
            toast.error("Failed to initialize payment");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="mb-4">
                {onBack && (
                    <Button variant="ghost" onClick={onBack} className="p-0 hover:bg-transparent text-slate-400 hover:text-white flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Plans
                    </Button>
                )}
            </div>

            <Card className="bg-slate-950/50 border-slate-800 backdrop-blur-md flex-1 flex flex-col justify-center">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-cyan-400">
                        <CreditCard className="h-6 w-6" />
                        Checkout: {planName}
                    </CardTitle>
                    <CardDescription>
                        Complete your secure payment with PayU Latam.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                            <span className="text-slate-300">{description}</span>
                            <span className="text-xl font-bold text-white">${parseInt(amount).toLocaleString()} COP</span>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-400 mt-4">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Secure SSL Encryption
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Instant Activation
                            </li>
                        </ul>
                    </div>

                    <Button
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-6 text-lg shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] mt-4"
                        onClick={generateSignature}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Redirecting to PayU...
                            </>
                        ) : (
                            "Pay with PayU Latam"
                        )}
                    </Button>

                    {/* Hidden Form for PayU Redirect */}
                    <form id="payu-form" method="post" action="https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/">
                        <input name="merchantId" type="hidden" value={formData.merchantId} />
                        <input name="accountId" type="hidden" value={formData.accountId} />
                        <input name="description" type="hidden" value={formData.description} />
                        <input name="referenceCode" type="hidden" value={formData.referenceCode} />
                        <input name="amount" type="hidden" value={formData.amount} />
                        <input name="tax" type="hidden" value={formData.tax} />
                        <input name="taxReturnBase" type="hidden" value={formData.taxReturnBase} />
                        <input name="currency" type="hidden" value={formData.currency} />
                        <input name="signature" type="hidden" value={formData.signature} />
                        <input name="test" type="hidden" value={formData.test} />
                        <input name="buyerEmail" type="hidden" value={formData.buyerEmail} />
                        <input name="responseUrl" type="hidden" value={formData.responseUrl} />
                        <input name="confirmationUrl" type="hidden" value={formData.confirmationUrl} />
                    </form>

                    <p className="text-xs text-center text-slate-500 mt-4">
                        Secure payment processed by PayU Latam.
                        <br />
                        Supports PSE, Credit Cards, Efecty, and more.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
