import React, { useEffect, useState } from 'react';
import { TrialLimitModal } from './TrialLimitModal';

export const TrialLimitListener = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [feature, setFeature] = useState('');

    useEffect(() => {
        const handleLimitReached = ((e: CustomEvent<string>) => {
            setFeature(e.detail);
            setIsOpen(true);
        }) as EventListener;

        window.addEventListener('limit_reached', handleLimitReached);
        return () => window.removeEventListener('limit_reached', handleLimitReached);
    }, []);

    return (
        <TrialLimitModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            limitReached={feature as any}
        />
    );
};
