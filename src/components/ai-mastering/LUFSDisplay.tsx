import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface LUFSAnalysis {
    integrated_lufs: number | null;
    true_peak_db: number | null;
    dynamic_range_db: number | null;
    sample_rate: number | null;
    duration_seconds: number | null;
    success: boolean;
}

export interface AudioAnalysisData {
    target: LUFSAnalysis | null;
    reference: LUFSAnalysis | null;
    output: LUFSAnalysis | null;
    processing_time?: number;
}

interface LUFSDisplayProps {
    analysis: AudioAnalysisData | null;
    showComparison?: boolean;
}

export const LUFSDisplay: React.FC<LUFSDisplayProps> = ({
    analysis,
    showComparison = true
}) => {
    if (!analysis) return null;

    const { target, reference, output } = analysis;

    // Determine loudness category and color
    const getLoudnessInfo = (lufs: number | null) => {
        if (lufs === null) return { color: 'text-muted-foreground', label: 'N/A', icon: Info };

        if (lufs >= -6) return {
            color: 'text-red-500',
            label: 'Very Loud',
            icon: AlertTriangle
        };
        if (lufs >= -8) return {
            color: 'text-orange-500',
            label: 'Loud',
            icon: TrendingUp
        };
        if (lufs >= -12) return {
            color: 'text-green-500',
            label: 'Optimal',
            icon: CheckCircle
        };
        if (lufs >= -16) return {
            color: 'text-blue-500',
            label: 'Quiet',
            icon: TrendingDown
        };
        return {
            color: 'text-purple-500',
            label: 'Very Quiet',
            icon: TrendingDown
        };
    };

    // Check if reference is problematic
    const getReferenceSuitability = (lufs: number | null) => {
        if (lufs === null) return null;

        if (lufs >= -6) {
            return {
                level: 'error',
                message: `⚠️ Reference muy loud (${lufs} LUFS). Puede causar distorsión y artifacts. Recomendado: -8 a -12 LUFS`,
            };
        }
        if (lufs >= -7) {
            return {
                level: 'warning',
                message: `⚡ Reference loud (${lufs} LUFS). Puede reducir dinámica. Óptimo: -8 a -12 LUFS`,
            };
        }
        if (lufs < -16) {
            return {
                level: 'info',
                message: `📉 Reference quiet (${lufs} LUFS). Resultado puede ser menos loud. Óptimo: -8 a -12 LUFS`,
            };
        }
        return null;
    };

    const refSuitability = reference ? getReferenceSuitability(reference.integrated_lufs) : null;

    const StatCard = ({
        title,
        lufs,
        truePeak,
        dynamicRange,
        showBadge = false
    }: {
        title: string;
        lufs: number | null;
        truePeak: number | null;
        dynamicRange: number | null;
        showBadge?: boolean;
    }) => {
        const info = getLoudnessInfo(lufs);
        const Icon = info.icon;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
                    {showBadge && lufs !== null && (
                        <Badge variant="outline" className={info.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {info.label}
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className={`text-2xl font-bold ${info.color}`}>
                            {lufs !== null ? lufs.toFixed(1) : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">LUFS</div>
                    </div>

                    <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-foreground">
                            {truePeak !== null ? truePeak.toFixed(1) : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">dBTP</div>
                    </div>

                    <div className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-foreground">
                            {dynamicRange !== null ? dynamicRange.toFixed(1) : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">DR</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">📊 Audio Analysis</span>
                    {analysis.processing_time && (
                        <Badge variant="outline" className="text-xs">
                            {analysis.processing_time.toFixed(1)}s
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Reference Suitability Warning */}
                {refSuitability && (
                    <Alert
                        variant={refSuitability.level === 'error' ? 'destructive' : 'default'}
                        className={
                            refSuitability.level === 'warning'
                                ? 'border-orange-500/50 bg-orange-500/10'
                                : refSuitability.level === 'info'
                                    ? 'border-blue-500/50 bg-blue-500/10'
                                    : ''
                        }
                    >
                        <AlertDescription className="text-sm">
                            {refSuitability.message}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Statistics Grid */}
                <div className="space-y-4">
                    {target && (
                        <StatCard
                            title="🎯 Target (Original)"
                            lufs={target.integrated_lufs}
                            truePeak={target.true_peak_db}
                            dynamicRange={target.dynamic_range_db}
                        />
                    )}

                    {reference && (
                        <StatCard
                            title="📌 Reference"
                            lufs={reference.integrated_lufs}
                            truePeak={reference.true_peak_db}
                            dynamicRange={reference.dynamic_range_db}
                            showBadge
                        />
                    )}

                    {output && showComparison && (
                        <div className="pt-2 border-t">
                            <StatCard
                                title="✨ Mastered Output"
                                lufs={output.integrated_lufs}
                                truePeak={output.true_peak_db}
                                dynamicRange={output.dynamic_range_db}
                                showBadge
                            />
                        </div>
                    )}
                </div>

                {/* Comparison */}
                {target && output && showComparison && (
                    <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Loudness Change:</span>
                            <span className={`font-bold ${(output.integrated_lufs ?? 0) > (target.integrated_lufs ?? 0)
                                    ? 'text-green-500'
                                    : 'text-blue-500'
                                }`}>
                                {target.integrated_lufs && output.integrated_lufs
                                    ? `${(output.integrated_lufs - target.integrated_lufs).toFixed(1)} dB`
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
