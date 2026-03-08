import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LevelLogo } from "@/components/LevelLogo";

const RefundPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="text-slate-400 hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <LevelLogo size="md" showIcon={true} />
                    </div>
                    <div className="flex items-center gap-3 bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-full font-medium">
                        <Shield className="h-5 w-5" />
                        14-Day Money Back Guarantee
                    </div>
                </div>

                {/* Content */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-8 md:p-12 space-y-8">
                        <div className="space-y-4 text-center pb-8 border-b border-slate-800/50">
                            <h1 className="text-3xl font-bold text-white">Refund Policy</h1>
                            <p className="text-slate-400">Last Updated: March 2026</p>
                        </div>

                        <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-slate-300 prose-headings:text-slate-100 space-y-6">
                            <section>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    1. Overview
                                </h2>
                                <p>
                                    At Level Audio, we want you to be completely satisfied with our professional audio tools.
                                    If you are not entirely happy with your subscription or standalone purchase, we offer a transparent and hassle-free refund policy.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    2. 14-Day Money-Back Guarantee
                                </h2>
                                <p>
                                    We offer a full 14-day money-back guarantee for all new subscriptions and one-time purchases (e.g., Desktop Pro tier).
                                    If you realize our tools don't meet your needs within the first 14 days of your original purchase, you can request a full refund, no questions asked.
                                </p>
                                <p className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 text-orange-200 mt-4 text-sm">
                                    <strong>Note on Cryptocurrencies:</strong> For payments made via Coinbase Commerce (BTC, ETH, USDC), refunds will be processed based on the <strong>fiat ($USD) value</strong> of the transaction at the time of purchase, minus any network gas fees incurred during the refund transfer.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    3. Subscription Renewals
                                </h2>
                                <p>
                                    We do not typically offer refunds for automatic subscription renewals once the billing cycle has started.
                                    You will receive an email reminder before your annual subscription renews, giving you ample time to cancel.
                                    If you forget to cancel your monthly or annual subscription and request a refund within <strong>48 hours</strong> of the renewal charge, we will review the request on a case-by-case basis.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    4. Unfair Usage & Abuse
                                </h2>
                                <p>
                                    While our refund policy is designed to be fully user-friendly, we reserve the right to deny refund requests if we detect clear abuse of our services. This includes, but is not limited to:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-300">
                                    <li>Processing an excessive amount of audio/tracks (e.g., mastering an entire 50-track catalog or isolating hundreds of stems) and then immediately requesting a refund.</li>
                                    <li>Repeatedly purchasing, refunding, and repurchasing our plans.</li>
                                    <li>Using automated scripts to bypass trial limits.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    5. How to Request a Refund
                                </h2>
                                <p>
                                    To initiate a refund, please contact our support team:
                                </p>
                                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mt-4 text-center">
                                    <p className="text-lg font-medium text-white mb-2">Email us at:</p>
                                    <a href="mailto:support@levelaudio.live" className="text-cyan-400 text-xl font-bold hover:underline">
                                        support@levelaudio.live
                                    </a>
                                    <p className="text-sm text-slate-500 mt-4">
                                        Please include your account email address and order number. Refund requests are typically processed within 24-48 business hours.
                                    </p>
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RefundPolicy;
