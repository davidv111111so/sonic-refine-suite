import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class VisualizerErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in 3D Visualizer:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white p-4 rounded-lg border border-red-500/30">
                    <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                    <h3 className="text-lg font-semibold text-red-400">3D Visualizer Error</h3>
                    <p className="text-sm text-slate-400 text-center max-w-xs">
                        Something went wrong with the 3D rendering engine.
                    </p>
                    <button
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm transition-colors"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
