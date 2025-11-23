import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}

export const SimpleModal = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    maxWidth = 'max-w-lg'
}: SimpleModalProps) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Panel */}
            <div
                className={cn(
                    "relative w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl transform transition-all flex flex-col max-h-[90vh]",
                    maxWidth,
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
                    <div className="text-lg font-semibold text-white w-full">
                        {title}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 ml-4"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto text-white">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
