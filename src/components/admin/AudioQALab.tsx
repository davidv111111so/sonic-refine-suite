import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
    Upload,
    FlaskConical,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    Minus,
    FileAudio,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Loader2,
    Activity,
    Waves,
    BarChart3,
    Gauge,
    History,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────
interface FileInfo {
    filename: string;
    extension: string;
    file_size_bytes: number;
    file_size_mb: number;
    sample_rate: number;
    channels: number;
    duration_seconds: number;
    format: string;
    subtype: string;
    bit_depth: number | null;
}

interface Loudness {
    integrated_lufs?: number;
    true_peak_db?: number;
    dynamic_range_db?: number;
    error?: string;
}

interface Spectral {
    centroid_hz?: number;
    bandwidth_hz?: number;
    rolloff_hz?: number;
    rms_db?: number;
    crest_factor_db?: number;
    zero_crossing_rate?: number;
    error?: string;
}

interface Compression {
    level?: string;
    description?: string;
    loudness_warning?: string;
}

interface QAResult {
    success: boolean;
    file_info: FileInfo;
    loudness: Loudness;
    spectral: Spectral;
    compression: Compression;
    timestamp: string;
}

interface QAComparison {
    id: string;
    before: QAResult;
    after: QAResult;
    timestamp: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtNum = (v: number | null | undefined, decimals = 2) =>
    v != null ? v.toFixed(decimals) : '—';

const DeltaBadge = ({ before, after, unit = '', invert = false }: {
    before?: number | null; after?: number | null; unit?: string; invert?: boolean;
}) => {
    if (before == null || after == null) return <span className="text-slate-500">—</span>;
    const diff = after - before;
    if (Math.abs(diff) < 0.01) return (
        <Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px] gap-1">
            <Minus className="w-2.5 h-2.5" /> No change
        </Badge>
    );
    const isPositive = invert ? diff < 0 : diff > 0;
    return (
        <Badge variant="outline" className={`text-[10px] gap-1 ${isPositive ? 'border-emerald-500/50 text-emerald-400' : 'border-amber-500/50 text-amber-400'}`}>
            {diff > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
            {diff > 0 ? '+' : ''}{diff.toFixed(2)} {unit}
        </Badge>
    );
};

const MetricRow = ({ label, before, after, unit = '', invert = false, icon }: {
    label: string; before?: number | string | null; after?: number | string | null;
    unit?: string; invert?: boolean; icon?: React.ReactNode;
}) => {
    const bVal = typeof before === 'number' ? fmtNum(before) : (before ?? '—');
    const aVal = typeof after === 'number' ? fmtNum(after) : (after ?? '—');
    const changed = bVal !== aVal;
    return (
        <TableRow className="border-slate-800/50 hover:bg-slate-900/30">
            <TableCell className="font-medium text-slate-300 flex items-center gap-2 py-2.5">
                {icon}
                {label}
            </TableCell>
            <TableCell className="text-slate-400 py-2.5 font-mono text-sm">
                {bVal} {unit && <span className="text-slate-600 text-[10px]">{unit}</span>}
            </TableCell>
            <TableCell className="text-slate-400 py-2.5 font-mono text-sm">
                {aVal} {unit && <span className="text-slate-600 text-[10px]">{unit}</span>}
            </TableCell>
            <TableCell className="py-2.5">
                {typeof before === 'number' && typeof after === 'number' ? (
                    <DeltaBadge before={before} after={after} unit={unit} invert={invert} />
                ) : changed ? (
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-[10px]">Changed</Badge>
                ) : (
                    <Badge variant="outline" className="border-slate-600 text-slate-500 text-[10px]">Same</Badge>
                )}
            </TableCell>
        </TableRow>
    );
};

// ─── Upload Card ─────────────────────────────────────────────────────────────
const UploadCard = ({ label, color, file, result, isAnalyzing, onDrop, onClear }: {
    label: string; color: string; file: File | null; result: QAResult | null;
    isAnalyzing: boolean; onDrop: (files: File[]) => void; onClear: () => void;
}) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac'] },
        maxFiles: 1,
        disabled: isAnalyzing,
    });

    const borderColor = color === 'cyan' ? 'border-cyan-500/40' : 'border-purple-500/40';
    const hoverBorder = color === 'cyan' ? 'hover:border-cyan-400' : 'hover:border-purple-400';
    const activeBorder = color === 'cyan' ? 'border-cyan-400 bg-cyan-950/20' : 'border-purple-400 bg-purple-950/20';
    const textColor = color === 'cyan' ? 'text-cyan-400' : 'text-purple-400';
    const bgGlow = color === 'cyan' ? 'shadow-cyan-500/5' : 'shadow-purple-500/5';

    return (
        <Card className={`bg-slate-900/60 ${borderColor} backdrop-blur-sm shadow-lg ${bgGlow}`}>
            <CardHeader className="pb-3">
                <CardTitle className={`text-sm font-semibold ${textColor} flex items-center gap-2`}>
                    <FileAudio className="w-4 h-4" />
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!file ? (
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${isDragActive ? activeBorder : `${borderColor} ${hoverBorder}`
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${textColor} opacity-60`} />
                        <p className="text-xs text-slate-400">
                            {isDragActive ? 'Drop here' : 'Drop audio file or click'}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1">.WAV .MP3 .FLAC .M4A</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${borderColor} bg-slate-950/40`}>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-500 hover:text-red-400 h-8 w-8 flex-shrink-0"
                                onClick={onClear}
                                disabled={isAnalyzing}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        {isAnalyzing && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Analyzing...
                            </div>
                        )}
                        {result && (
                            <div className="flex items-center gap-2 text-xs text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Analysis complete
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ─── Compression Badge ───────────────────────────────────────────────────────
const CompressionBadge = ({ level }: { level?: string }) => {
    if (!level) return null;
    const config: Record<string, { color: string; label: string }> = {
        heavy: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: '🔴 Heavy' },
        moderate: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: '🟡 Moderate' },
        light: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: '🟢 Light' },
        none: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: '⚪ None' },
    };
    const c = config[level] || config.none;
    return <Badge variant="outline" className={`${c.color} text-[10px]`}>{c.label}</Badge>;
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const AudioQALab = () => {
    const [beforeFile, setBeforeFile] = useState<File | null>(null);
    const [afterFile, setAfterFile] = useState<File | null>(null);
    const [beforeResult, setBeforeResult] = useState<QAResult | null>(null);
    const [afterResult, setAfterResult] = useState<QAResult | null>(null);
    const [analyzingBefore, setAnalyzingBefore] = useState(false);
    const [analyzingAfter, setAnalyzingAfter] = useState(false);
    const [history, setHistory] = useState<QAComparison[]>([]);

    const backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8001'
        : (import.meta.env.VITE_PYTHON_BACKEND_URL || 'https://mastering-backend-azkp62xtaq-uc.a.run.app');

    const analyzeFile = async (file: File, side: 'before' | 'after') => {
        const setAnalyzing = side === 'before' ? setAnalyzingBefore : setAnalyzingAfter;
        const setResult = side === 'before' ? setBeforeResult : setAfterResult;

        setAnalyzing(true);
        setResult(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${backendUrl}/api/admin/qa-analyze`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Analysis failed (${response.status})`);
            }

            const data: QAResult = await response.json();
            setResult(data);
            toast.success(`${side === 'before' ? 'Before' : 'After'} file analyzed successfully`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleBeforeDrop = useCallback((files: File[]) => {
        if (files[0]) {
            setBeforeFile(files[0]);
            setBeforeResult(null);
        }
    }, []);

    const handleAfterDrop = useCallback((files: File[]) => {
        if (files[0]) {
            setAfterFile(files[0]);
            setAfterResult(null);
        }
    }, []);

    const saveComparison = () => {
        if (beforeResult && afterResult) {
            const comparison: QAComparison = {
                id: crypto.randomUUID(),
                before: beforeResult,
                after: afterResult,
                timestamp: new Date().toISOString(),
            };
            setHistory(prev => [comparison, ...prev].slice(0, 20));
            toast.success('Comparison saved to history');
        }
    };

    const clearAll = () => {
        setBeforeFile(null);
        setAfterFile(null);
        setBeforeResult(null);
        setAfterResult(null);
    };

    const bothReady = !!beforeResult && !!afterResult;
    const isAnalyzing = analyzingBefore || analyzingAfter;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                <UploadCard
                    label="BEFORE (Original)"
                    color="cyan"
                    file={beforeFile}
                    result={beforeResult}
                    isAnalyzing={analyzingBefore}
                    onDrop={handleBeforeDrop}
                    onClear={() => { setBeforeFile(null); setBeforeResult(null); }}
                />
                {/* Arrow connector */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <UploadCard
                    label="AFTER (Processed)"
                    color="purple"
                    file={afterFile}
                    result={afterResult}
                    isAnalyzing={analyzingAfter}
                    onDrop={handleAfterDrop}
                    onClear={() => { setAfterFile(null); setAfterResult(null); }}
                />
            </div>

            {/* Action Buttons */}
            {(beforeFile || afterFile) && (
                <div className="flex justify-center gap-3">
                    {((beforeFile && !beforeResult) || (afterFile && !afterResult)) && (
                        <Button
                            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold gap-2 px-8"
                            onClick={async () => {
                                if (beforeFile && !beforeResult) {
                                    await analyzeFile(beforeFile, 'before');
                                }
                                if (afterFile && !afterResult) {
                                    await analyzeFile(afterFile, 'after');
                                }
                            }}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                            Start Analysis
                        </Button>
                    )}
                    {bothReady && (
                        <Button
                            variant="outline"
                            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/30 gap-2"
                            onClick={saveComparison}
                        >
                            <History className="w-4 h-4" />
                            Save to History
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="border-slate-700 text-slate-400 hover:bg-slate-800 gap-2"
                        onClick={clearAll}
                        disabled={isAnalyzing}
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                    </Button>
                </div>
            )}

            {/* Comparison Results */}
            {bothReady && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Quick Summary Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <SummaryCard
                            label="Format Changed"
                            value={beforeResult.file_info.extension !== afterResult.file_info.extension}
                            icon={<FileAudio className="w-4 h-4" />}
                        />
                        <SummaryCard
                            label="LUFS Changed"
                            value={beforeResult.loudness.integrated_lufs !== afterResult.loudness.integrated_lufs}
                            icon={<Gauge className="w-4 h-4" />}
                        />
                        <SummaryCard
                            label="Compression Applied"
                            value={
                                (beforeResult.compression.level || 'none') !== (afterResult.compression.level || 'none')
                            }
                            icon={<Activity className="w-4 h-4" />}
                        />
                        <SummaryCard
                            label="Duration Match"
                            value={Math.abs(
                                (beforeResult.file_info.duration_seconds || 0) -
                                (afterResult.file_info.duration_seconds || 0)
                            ) < 0.5}
                            isGoodWhenTrue
                            icon={<Clock className="w-4 h-4" />}
                        />
                    </div>

                    {/* Detailed Comparison Table */}
                    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-cyan-400" />
                                Detailed Comparison
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Side-by-side audio fingerprint analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800">
                                        <TableHead className="text-slate-500 w-[200px]">Metric</TableHead>
                                        <TableHead className="text-cyan-500/70">Before</TableHead>
                                        <TableHead className="text-purple-500/70">After</TableHead>
                                        <TableHead className="text-slate-500">Delta</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* File Info Section */}
                                    <TableRow className="border-slate-800/30">
                                        <TableCell colSpan={4} className="py-1.5">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">File Properties</p>
                                        </TableCell>
                                    </TableRow>
                                    <MetricRow label="Format" before={beforeResult.file_info.extension} after={afterResult.file_info.extension} icon={<FileAudio className="w-3.5 h-3.5 text-slate-500" />} />
                                    <MetricRow label="Sample Rate" before={beforeResult.file_info.sample_rate} after={afterResult.file_info.sample_rate} unit="Hz" />
                                    <MetricRow label="Bit Depth" before={beforeResult.file_info.bit_depth} after={afterResult.file_info.bit_depth} unit="bit" />
                                    <MetricRow label="Channels" before={beforeResult.file_info.channels} after={afterResult.file_info.channels} />
                                    <MetricRow label="Duration" before={beforeResult.file_info.duration_seconds} after={afterResult.file_info.duration_seconds} unit="s" />
                                    <MetricRow label="File Size" before={beforeResult.file_info.file_size_mb} after={afterResult.file_info.file_size_mb} unit="MB" />

                                    {/* Loudness Section */}
                                    <TableRow className="border-slate-800/30">
                                        <TableCell colSpan={4} className="py-1.5">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Loudness & Dynamics</p>
                                        </TableCell>
                                    </TableRow>
                                    <MetricRow label="Integrated LUFS" before={beforeResult.loudness.integrated_lufs} after={afterResult.loudness.integrated_lufs} unit="LUFS" icon={<Gauge className="w-3.5 h-3.5 text-slate-500" />} />
                                    <MetricRow label="True Peak" before={beforeResult.loudness.true_peak_db} after={afterResult.loudness.true_peak_db} unit="dBTP" />
                                    <MetricRow label="Dynamic Range" before={beforeResult.loudness.dynamic_range_db} after={afterResult.loudness.dynamic_range_db} unit="dB" />

                                    {/* Spectral Section */}
                                    <TableRow className="border-slate-800/30">
                                        <TableCell colSpan={4} className="py-1.5">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Spectral Analysis</p>
                                        </TableCell>
                                    </TableRow>
                                    <MetricRow label="Centroid (Brightness)" before={beforeResult.spectral.centroid_hz} after={afterResult.spectral.centroid_hz} unit="Hz" icon={<Waves className="w-3.5 h-3.5 text-slate-500" />} />
                                    <MetricRow label="Bandwidth" before={beforeResult.spectral.bandwidth_hz} after={afterResult.spectral.bandwidth_hz} unit="Hz" />
                                    <MetricRow label="Rolloff (95%)" before={beforeResult.spectral.rolloff_hz} after={afterResult.spectral.rolloff_hz} unit="Hz" />
                                    <MetricRow label="RMS Energy" before={beforeResult.spectral.rms_db} after={afterResult.spectral.rms_db} unit="dB" />
                                    <MetricRow label="Crest Factor" before={beforeResult.spectral.crest_factor_db} after={afterResult.spectral.crest_factor_db} unit="dB" invert />
                                    <MetricRow label="Zero Crossing Rate" before={beforeResult.spectral.zero_crossing_rate} after={afterResult.spectral.zero_crossing_rate} />

                                    {/* Compression Section */}
                                    <TableRow className="border-slate-800/30">
                                        <TableCell colSpan={4} className="py-1.5">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Compression Detection</p>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="border-slate-800/50 hover:bg-slate-900/30">
                                        <TableCell className="font-medium text-slate-300 flex items-center gap-2 py-2.5">
                                            <Activity className="w-3.5 h-3.5 text-slate-500" />
                                            Compression Level
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <CompressionBadge level={beforeResult.compression.level} />
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <CompressionBadge level={afterResult.compression.level} />
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            {beforeResult.compression.level !== afterResult.compression.level ? (
                                                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-[10px]">Changed</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-slate-600 text-slate-500 text-[10px]">Same</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Verdict Card */}
                    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <VerdictPanel before={beforeResult} after={afterResult} />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* History Section */}
            {history.length > 0 && (
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2 text-sm">
                                <History className="w-4 h-4 text-slate-400" />
                                Comparison History
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-xs">{history.length} saved comparisons</CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-red-400 text-xs"
                            onClick={() => setHistory([])}
                        >
                            Clear All
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800">
                                    <TableHead className="text-slate-500">Time</TableHead>
                                    <TableHead className="text-slate-500">Before</TableHead>
                                    <TableHead className="text-slate-500">After</TableHead>
                                    <TableHead className="text-slate-500">LUFS Δ</TableHead>
                                    <TableHead className="text-slate-500">Compression</TableHead>
                                    <TableHead className="text-slate-500"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((h) => {
                                    const lufsDelta = (h.after.loudness.integrated_lufs ?? 0) - (h.before.loudness.integrated_lufs ?? 0);
                                    return (
                                        <TableRow key={h.id} className="border-slate-800/50">
                                            <TableCell className="text-slate-400 text-xs">
                                                {new Date(h.timestamp).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell className="text-slate-300 text-xs truncate max-w-[120px]">
                                                {h.before.file_info.filename}
                                            </TableCell>
                                            <TableCell className="text-slate-300 text-xs truncate max-w-[120px]">
                                                {h.after.file_info.filename}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-[10px] ${lufsDelta > 0 ? 'text-emerald-400 border-emerald-500/50' : 'text-amber-400 border-amber-500/50'}`}>
                                                    {lufsDelta > 0 ? '+' : ''}{lufsDelta.toFixed(1)} LUFS
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <CompressionBadge level={h.after.compression.level} />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-500 hover:text-red-400"
                                                    onClick={() => setHistory(prev => prev.filter(x => x.id !== h.id))}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// ─── Summary Card ────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, isGoodWhenTrue = false, icon }: {
    label: string; value: boolean; isGoodWhenTrue?: boolean; icon: React.ReactNode;
}) => {
    const isGood = isGoodWhenTrue ? value : value;
    const bgColor = isGood
        ? 'bg-emerald-500/10 border-emerald-500/20'
        : 'bg-slate-800/30 border-slate-700/30';
    const iconColor = isGood ? 'text-emerald-400' : 'text-slate-500';

    return (
        <div className={`rounded-lg border p-3 ${bgColor} transition-all`}>
            <div className="flex items-center gap-2 mb-1">
                <span className={iconColor}>{icon}</span>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
            </div>
            <div className="flex items-center gap-1.5">
                {isGood ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                    <XCircle className="w-4 h-4 text-slate-500" />
                )}
                <span className={`text-sm font-semibold ${isGood ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {isGoodWhenTrue ? (value ? 'YES ✓' : 'NO ✗') : (value ? 'YES' : 'NO')}
                </span>
            </div>
        </div>
    );
};

// ─── Verdict Panel ───────────────────────────────────────────────────────────
const VerdictPanel = ({ before, after }: { before: QAResult; after: QAResult }) => {
    const checks: { label: string; pass: boolean; detail: string }[] = [];

    // Duration should match (within 0.5s)
    const durDiff = Math.abs((before.file_info.duration_seconds || 0) - (after.file_info.duration_seconds || 0));
    checks.push({
        label: 'Duration Integrity',
        pass: durDiff < 0.5,
        detail: durDiff < 0.5 ? `Duration matches (Δ${durDiff.toFixed(3)}s)` : `Duration mismatch: Δ${durDiff.toFixed(2)}s`,
    });

    // LUFS should have changed (if mastering was applied)
    const lufsBefore = before.loudness.integrated_lufs;
    const lufsAfter = after.loudness.integrated_lufs;
    if (lufsBefore != null && lufsAfter != null) {
        const lufsDiff = Math.abs(lufsAfter - lufsBefore);
        checks.push({
            label: 'Loudness Processing',
            pass: lufsDiff > 0.3,
            detail: lufsDiff > 0.3
                ? `Loudness changed by ${lufsDiff.toFixed(1)} LUFS (${lufsAfter > lufsBefore ? 'louder' : 'quieter'})`
                : 'Loudness unchanged — mastering may not have been applied',
        });
    }

    // Spectral centroid change = EQ was applied
    const centBefore = before.spectral.centroid_hz;
    const centAfter = after.spectral.centroid_hz;
    if (centBefore != null && centAfter != null) {
        const centDiff = Math.abs(centAfter - centBefore);
        const centPct = (centDiff / centBefore) * 100;
        checks.push({
            label: 'EQ / Spectral Changes',
            pass: centPct > 1,
            detail: centPct > 1
                ? `Spectral centroid shifted by ${centDiff.toFixed(0)} Hz (${centPct.toFixed(1)}%) — EQ applied`
                : 'Spectral profile unchanged — no EQ detected',
        });
    }

    // Compression detection
    const compBefore = before.compression.level || 'none';
    const compAfter = after.compression.level || 'none';
    checks.push({
        label: 'Compression Applied',
        pass: compBefore !== compAfter,
        detail: compBefore !== compAfter
            ? `Compression level changed: ${compBefore} → ${compAfter}`
            : `Compression level unchanged: ${compAfter}`,
    });

    // Sample rate should be preserved or intentionally changed
    checks.push({
        label: 'Sample Rate Preserved',
        pass: before.file_info.sample_rate === after.file_info.sample_rate,
        detail: before.file_info.sample_rate === after.file_info.sample_rate
            ? `Sample rate preserved at ${after.file_info.sample_rate} Hz`
            : `Sample rate changed: ${before.file_info.sample_rate} → ${after.file_info.sample_rate} Hz`,
    });

    const passCount = checks.filter(c => c.pass).length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                    QA Verdict
                </h4>
                <Badge variant="outline" className={`${passCount === checks.length ? 'border-emerald-500/50 text-emerald-400' : passCount >= checks.length * 0.6 ? 'border-amber-500/50 text-amber-400' : 'border-red-500/50 text-red-400'} text-xs`}>
                    {passCount}/{checks.length} checks passed
                </Badge>
            </div>
            <div className="space-y-2">
                {checks.map((check, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                        {check.pass ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                            <span className={`font-medium ${check.pass ? 'text-emerald-300' : 'text-amber-300'}`}>{check.label}: </span>
                            <span className="text-slate-400">{check.detail}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
