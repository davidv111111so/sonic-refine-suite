import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Infinity, Crown, Music2, Sparkles, AudioWaveform } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrialLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    limitReached: string; // e.g., 'stems', 'mastering', 'enhancement'
}

export const TrialLimitModal: React.FC<TrialLimitModalProps> = ({
    isOpen,
    onClose,
    limitReached,
}) => {
    const navigate = useNavigate();

    const getMessage = () => {
        switch (limitReached) {
            case 'stems':
                return "You've reached your free limit of 3 Stem Separations.";
            case 'mastering':
                return "You've reached your free limit of 2 AI Masters.";
            case 'enhancement':
                return "You've reached your free limit of 10 Audio Enhancements.";
            case 'mixer':
                return "You've reached your 3-hour free limit in the Mixer Lab.";
            default:
                return "You've reached a feature limit for your free account.";
        }
    };

    const handleUpgradeClick = () => {
        onClose();
        // Assuming we'll have an anchor or route for pricing. Let's send them to the root homepage pricing section if they are in /app
        navigate('/#pricing');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white backdrop-blur-xl bg-opacity-95 shadow-2xl">
                <DialogHeader>
                    <div className="mx-auto bg-blue-500/20 p-3 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-blue-400" />
                    </div>
                    <DialogTitle className="text-2xl text-center font-bold text-white mb-2">Free Trial Limit Reached</DialogTitle>
                    <DialogDescription className="text-center text-slate-300 text-base">
                        {getMessage()}
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-800/50 rounded-xl p-5 my-4 border border-slate-700/50">
                    <h3 className="font-semibold flex items-center gap-2 mb-4 text-cyan-300">
                        <Crown className="w-5 h-5" />
                        Upgrade to Premium
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm text-slate-200">
                            <Infinity className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Unlimited 2, 4, and 6 Stem Separations</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-200">
                            <Infinity className="w-4 h-4 text-purple-400 shrink-0" />
                            <span>Unlimited AI Mastering & Enhancements</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-200">
                            <Infinity className="w-4 h-4 text-orange-400 shrink-0" />
                            <span>Unlimited DJ Mixer Lab with Exporting</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-200">
                            <Music2 className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>24-bit Lossless Processing & WAV Downloads</span>
                        </li>
                    </ul>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-3">
                    <Button
                        onClick={handleUpgradeClick}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold h-12 text-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                    >
                        Unlock Full Access
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50"
                    >
                        Continue with limitations
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
