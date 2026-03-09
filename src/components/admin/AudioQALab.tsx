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
    const bothExist = before != null && after != null;
    const changed = bothExist && before !== after;

    return (
        <TableRow className="border-slate-800/30 hover:bg-slate-800/40 transition-colors">
            <TableCell className="font-medium text-slate-300 flex items-center gap-2 py-3">
                {icon}
                {label}
            </TableCell>
            <TableCell className="text-slate-400 py-3 font-mono text-sm">
                {bVal} {unit && bVal !== '—' && <span className="text-slate-600 text-[10px] ml-1">{unit}</span>}
            </TableCell>
            <TableCell className="text-slate-400 py-3 font-mono text-sm">
                {aVal} {unit && aVal !== '—' && <span className="text-slate-600 text-[10px] ml-1">{unit}</span>}
            </TableCell>
            <TableCell className="py-3">
                {!bothExist ? (
                    <span className="text-slate-700 text-xs">—</span>
                ) : typeof before === 'number' && typeof after === 'number' ? (
                    <DeltaBadge before={before} after={after} unit={unit} invert={invert} />
                ) : changed ? (
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-950/20 text-[10px]">Changed</Badge>
                ) : (
                    <Badge variant="outline" className="border-slate-700 text-slate-500 bg-slate-900/50 text-[10px]">Same</Badge>
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
    const anyReady = !!beforeResult || !!afterResult;
    const isAnalyzing = analyzingBefore || analyzingAfter;
    const activeResult = afterResult || beforeResult;

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
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 items-center justify-center shadow-lg shadow-black/50">
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
                            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold gap-2 px-8 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
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
            {anyReady && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Quick Summary Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {!bothReady ? (
                            <>
                                <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-lg flex items-center gap-4 backdrop-blur-md">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg"><FileAudio className="w-6 h-6 text-cyan-400" /></div>
                                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Format</p><p className="text-lg font-bold text-slate-200">{activeResult?.file_info.extension?.toUpperCase() || '—'}</p></div>
                                </div>
                                <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-lg flex items-center gap-4 backdrop-blur-md">
                                    <div className="p-2 bg-purple-500/10 rounded-lg"><Gauge className="w-6 h-6 text-purple-400" /></div>
                                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Loudness</p><p className="text-lg font-bold text-slate-200">{activeResult?.loudness.integrated_lufs?.toFixed(1) || '—'} <span className="text-sm font-normal text-slate-500">LUFS</span></p></div>
                                </div>
                                <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-lg flex items-center gap-4 backdrop-blur-md">
                                    <div className="p-2 bg-amber-500/10 rounded-lg"><Waves className="w-6 h-6 text-amber-400" /></div>
                                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Sample Rate</p><p className="text-lg font-bold text-slate-200">{activeResult?.file_info.sample_rate || '—'} <span className="text-sm font-normal text-slate-500">Hz</span></p></div>
                                </div>
                                <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-lg flex items-center gap-4 backdrop-blur-md">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity className="w-6 h-6 text-emerald-400" /></div>
                                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Compression</p><p className="text-lg font-bold text-slate-200 capitalize">{activeResult?.compression.level || '—'}</p></div>
                                </div>
                            </>
                        ) : (
                            <>
                                <SummaryCard
                                    label="Format Changed"
                                    value={beforeResult?.file_info.extension !== afterResult?.file_info.extension}
                                    icon={<FileAudio className="w-4 h-4" />}
                                />
                                <SummaryCard
                                    label="LUFS Changed"
                                    value={beforeResult?.loudness.integrated_lufs !== afterResult?.loudness.integrated_lufs}
                                    icon={<Gauge className="w-4 h-4" />}
                                />
                                <SummaryCard
                                    label="Compression Applied"
                                    value={
                                        (beforeResult?.compression.level || 'none') !== (afterResult?.compression.level || 'none')
                                    }
                                    icon={<Activity className="w-4 h-4" />}
                                />
                                <SummaryCard
                                    label="Duration Match"
                                    value={Math.abs(
                                        (beforeResult?.file_info.duration_seconds || 0) -
                                        (afterResult?.file_info.duration_seconds || 0)
                                    ) < 0.5}
                                    isGoodWhenTrue
                                    icon={<Clock className="w-4 h-4" />}
                                />
                            </>
                        )}
                    </div>

                    {/* Detailed Comparison Table */}
                    <Card className="relative overflow-hidden bg-slate-950/40 border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                        <CardHeader className="pb-4 border-b border-slate-800/60 relative z-10 bg-slate-900/30">
                            <CardTitle className="text-white flex items-center gap-2 text-xl font-bold tracking-wide">
                                <BarChart3 className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                Audio Properties Analysis
                            </CardTitle>
                            <CardDescription className="text-slate-400 font-medium">
                                Technical breakdown of frequency, loudness, and metadata.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 relative z-10">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-900/60">
                                        <TableRow className="border-slate-800/60">
                                            <TableHead className="text-slate-400 font-bold w-[250px] uppercase tracking-wider text-xs px-6 py-4">Metric</TableHead>
                                            <TableHead className="text-cyan-400 font-bold uppercase tracking-wider text-xs py-4">Before</TableHead>
                                            <TableHead className="text-purple-400 font-bold uppercase tracking-wider text-xs py-4">After</TableHead>
                                            <TableHead className="text-slate-400 font-bold uppercase tracking-wider text-xs py-4">Delta / Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* File Info Section */}
                                        <TableRow className="border-slate-800/30 bg-slate-900/20">
                                            <TableCell colSpan={4} className="py-2 px-6">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/80 font-bold">File Properties</p>
                                            </TableCell>
                                        </TableRow>
                                        <MetricRow label="Format" before={beforeResult?.file_info.extension} after={afterResult?.file_info.extension} icon={<FileAudio className="w-4 h-4 text-slate-500" />} />
                                        <MetricRow label="Sample Rate" before={beforeResult?.file_info.sample_rate} after={afterResult?.file_info.sample_rate} unit="Hz" />
                                        <MetricRow label="Bit Depth" before={beforeResult?.file_info.bit_depth} after={afterResult?.file_info.bit_depth} unit="bit" />
                                        <MetricRow label="Channels" before={beforeResult?.file_info.channels} after={afterResult?.file_info.channels} />
                                        <MetricRow label="Duration" before={beforeResult?.file_info.duration_seconds} after={afterResult?.file_info.duration_seconds} unit="s" />
                                        <MetricRow label="File Size" before={beforeResult?.file_info.file_size_mb} after={afterResult?.file_info.file_size_mb} unit="MB" />

                                        {/* Loudness Section */}
                                        <TableRow className="border-slate-800/30 bg-slate-900/20">
                                            <TableCell colSpan={4} className="py-2 px-6">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/80 font-bold">Loudness & Dynamics</p>
                                            </TableCell>
                                        </TableRow>
                                        <MetricRow label="Integrated LUFS" before={beforeResult?.loudness.integrated_lufs} after={afterResult?.loudness.integrated_lufs} unit="LUFS" icon={<Gauge className="w-4 h-4 text-slate-500" />} />
                                        <MetricRow label="True Peak" before={beforeResult?.loudness.true_peak_db} after={afterResult?.loudness.true_peak_db} unit="dBTP" />
                                        <MetricRow label="Dynamic Range" before={beforeResult?.loudness.dynamic_range_db} after={afterResult?.loudness.dynamic_range_db} unit="dB" />

                                        {/* Spectral Section */}
                                        <TableRow className="border-slate-800/30 bg-slate-900/20">
                                            <TableCell colSpan={4} className="py-2 px-6">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/80 font-bold">Spectral Analysis</p>
                                            </TableCell>
                                        </TableRow>
                                        <MetricRow label="Centroid (Brightness)" before={beforeResult?.spectral.centroid_hz} after={afterResult?.spectral.centroid_hz} unit="Hz" icon={<Waves className="w-4 h-4 text-slate-500" />} />
                                        <MetricRow label="Bandwidth" before={beforeResult?.spectral.bandwidth_hz} after={afterResult?.spectral.bandwidth_hz} unit="Hz" />
                                        <MetricRow label="Rolloff (95%)" before={beforeResult?.spectral.rolloff_hz} after={afterResult?.spectral.rolloff_hz} unit="Hz" />
                                        <MetricRow label="RMS Energy" before={beforeResult?.spectral.rms_db} after={afterResult?.spectral.rms_db} unit="dB" />
                                        <MetricRow label="Crest Factor" before={beforeResult?.spectral.crest_factor_db} after={afterResult?.spectral.crest_factor_db} unit="dB" invert />
                                        <MetricRow label="Zero Crossing Rate" before={beforeResult?.spectral.zero_crossing_rate} after={afterResult?.spectral.zero_crossing_rate} />

                                        {/* Compression Section */}
                                        <TableRow className="border-slate-800/30 bg-slate-900/20">
                                            <TableCell colSpan={4} className="py-2 px-6">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/80 font-bold">Compression Detection</p>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className="border-slate-800/30 hover:bg-slate-800/40 transition-colors">
                                            <TableCell className="font-medium text-slate-300 flex items-center gap-2 py-3 px-6">
                                                <Activity className="w-4 h-4 text-slate-500" />
                                                Compression Level
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {beforeResult ? <CompressionBadge level={beforeResult.compression.level} /> : <span className="text-slate-700 text-xs">—</span>}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {afterResult ? <CompressionBadge level={afterResult.compression.level} /> : <span className="text-slate-700 text-xs">—</span>}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {!bothReady ? (
                                                    <span className="text-slate-700 text-xs">—</span>
                                                ) : beforeResult?.compression.level !== afterResult?.compression.level ? (
                                                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-950/20 text-[10px]">Changed</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-slate-700 text-slate-500 bg-slate-900/50 text-[10px]">Same</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
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
const VerdictPanel = ({ before, after }: { before: QAResult | null; after: QAResult | null }) => {
    const checks: { label: string; pass: boolean; detail: string }[] = [];

    if (!before || !after) {
        // Single File Quality Check
        const result = before || after;
        if (!result) return null;

        const lufs = result.loudness.integrated_lufs;
        if (lufs != null) {
            const isGoodLoudness = lufs >= -16 && lufs <= -9;
            checks.push({
                label: 'Streaming Loudness',
                pass: isGoodLoudness,
                detail: isGoodLoudness
                    ? `Optimal for streaming platforms (${lufs.toFixed(1)} LUFS)`
                    : `Loudness (${lufs.toFixed(1)} LUFS) is outside standard streaming target (-14 LUFS)`,
            });
        }

        const peak = result.loudness.true_peak_db;
        if (peak != null) {
            const noClipping = peak <= -0.5;
            checks.push({
                label: 'True Peak (Clipping)',
                pass: noClipping,
                detail: noClipping
                    ? `Safe digital margin detected (${peak.toFixed(2)} dBTP)`
                    : `Potential clipping hazard (${peak.toFixed(2)} dBTP). Target is <-1.0 dBTP for lossy encoding`,
            });
        }

        const sr = result.file_info.sample_rate;
        if (sr) {
            const isHighRes = sr >= 44100;
            checks.push({
                label: 'Sample Rate & Fidelity',
                pass: isHighRes,
                detail: isHighRes ? `Professional standard (${sr} Hz)` : `Sub-optimal sample rate (${sr} Hz)`,
            });
        }
    } else {
        // Comparison Checks
        const durDiff = Math.abs((before.file_info.duration_seconds || 0) - (after.file_info.duration_seconds || 0));
        checks.push({
            label: 'Duration Integrity',
            pass: durDiff < 0.5,
            detail: durDiff < 0.5 ? `Duration perfectly matches (Δ${durDiff.toFixed(3)}s)` : `Warning: Duration mismatch of ${durDiff.toFixed(2)}s detected`,
        });

        const lufsBefore = before.loudness.integrated_lufs;
        const lufsAfter = after.loudness.integrated_lufs;
        if (lufsBefore != null && lufsAfter != null) {
            const lufsDiff = Math.abs(lufsAfter - lufsBefore);
            checks.push({
                label: 'Loudness Processing',
                pass: lufsDiff > 0.3,
                detail: lufsDiff > 0.3
                    ? `Dynamic lift detected: Loudness changed by ${lufsDiff.toFixed(1)} LUFS (${lufsAfter > lufsBefore ? 'louder' : 'quieter'})`
                    : 'Target maintained: Loudness unchanged — mastering limits preserved',
            });
        }

        const centBefore = before.spectral.centroid_hz;
        const centAfter = after.spectral.centroid_hz;
        if (centBefore != null && centAfter != null) {
            const centDiff = Math.abs(centAfter - centBefore);
            const centPct = (centDiff / centBefore) * 100;
            checks.push({
                label: 'EQ / Spectral Balance',
                pass: centPct > 1,
                detail: centPct > 1
                    ? `Spectral centroid shifted by ${centDiff.toFixed(0)} Hz (${centPct.toFixed(1)}%) indicating EQ/Saturation was applied`
                    : 'Spectral profile unchanged — no broad equalization detected',
            });
        }

        const compBefore = before.compression.level || 'none';
        const compAfter = after.compression.level || 'none';
        checks.push({
            label: 'Dynamic Range Compression',
            pass: compBefore !== compAfter,
            detail: compBefore !== compAfter
                ? `Dynamics altered: Compression level changed from ${compBefore} to ${compAfter}`
                : `Dynamics preserved: Compression level remained ${compAfter}`,
        });
    }

    const passCount = checks.filter(c => c.pass).length;
    const allPassed = passCount === checks.length;
    const isSingle = !before || !after;

    return (
        <Card className="relative overflow-hidden bg-slate-950/40 border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className={`absolute inset-0 bg-gradient-to-r ${allPassed ? 'from-emerald-500/5 to-cyan-500/5' : 'from-amber-500/5 to-purple-500/5'} pointer-events-none`} />
            <CardContent className="p-6 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2 tracking-wide">
                            <FlaskConical className={`w-5 h-5 ${allPassed ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'}`} />
                            {isSingle ? 'File Quality Analysis' : 'Processing Verdict'}
                        </h4>
                        <Badge variant="outline" className={`${allPassed ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20' : passCount >= checks.length * 0.6 ? 'border-amber-500/50 text-amber-400 bg-amber-950/20' : 'border-red-500/50 text-red-400 bg-red-950/20'} px-3 py-1 text-sm font-bold shadow-lg`}>
                            {passCount}/{checks.length} checks passed
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {checks.map((check, i) => (
                            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${check.pass ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-amber-500/20 bg-amber-950/10'} backdrop-blur-sm transition-all hover:bg-slate-900/50`}>
                                {check.pass ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
                                )}
                                <div className="space-y-1">
                                    <span className={`block font-bold text-sm tracking-wide ${check.pass ? 'text-emerald-300' : 'text-amber-300'}`}>{check.label}</span>
                                    <span className="block text-xs text-slate-400 leading-relaxed">{check.detail}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
