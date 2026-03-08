import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Zap,
    Layers,
    Layout,
    BookOpen,
    MessageSquare,
    Download,
    ArrowRight,
    Shield,
    Star,
    CheckCircle2,
    Menu,
    X,
    Headphones,
    Cpu,
    Music2,
    Sparkles,
    Gauge,
    Crown,
    CreditCard,
    Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LevelLogo } from '@/components/LevelLogo';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

/* ─── Animated Audio Wave Background ─── */
const AudioWaveBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = 700;
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.008;

            // Multiple wave layers
            const waves = [
                { amplitude: 40, frequency: 0.008, speed: 1, color: 'rgba(6, 182, 212, 0.12)', yOffset: 0.5 },
                { amplitude: 30, frequency: 0.012, speed: 1.5, color: 'rgba(99, 102, 241, 0.10)', yOffset: 0.55 },
                { amplitude: 50, frequency: 0.006, speed: 0.7, color: 'rgba(168, 85, 247, 0.08)', yOffset: 0.45 },
                { amplitude: 20, frequency: 0.015, speed: 2, color: 'rgba(6, 182, 212, 0.06)', yOffset: 0.6 },
            ];

            waves.forEach(wave => {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height);
                for (let x = 0; x <= canvas.width; x += 2) {
                    const y = canvas.height * wave.yOffset +
                        Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
                        Math.sin(x * wave.frequency * 0.5 + time * wave.speed * 0.8) * wave.amplitude * 0.5;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(canvas.width, canvas.height);
                ctx.closePath();
                ctx.fillStyle = wave.color;
                ctx.fill();
            });

            // Floating particles
            for (let i = 0; i < 30; i++) {
                const px = (canvas.width * 0.1) + (i * canvas.width * 0.03) + Math.sin(time * 0.5 + i) * 40;
                const py = 200 + Math.sin(time * 0.3 + i * 0.7) * 150;
                const size = 1.5 + Math.sin(time + i) * 1;
                const alpha = 0.2 + Math.sin(time * 0.5 + i * 0.5) * 0.15;

                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fillStyle = i % 3 === 0
                    ? `rgba(6, 182, 212, ${alpha})`
                    : i % 3 === 1
                        ? `rgba(99, 102, 241, ${alpha})`
                        : `rgba(168, 85, 247, ${alpha})`;
                ctx.fill();
            }

            // EQ bars in the center area
            const barCount = 32;
            const barWidth = 3;
            const gap = 6;
            const totalWidth = barCount * (barWidth + gap);
            const startX = (canvas.width - totalWidth) / 2;

            for (let i = 0; i < barCount; i++) {
                const barHeight = 15 + Math.abs(Math.sin(time * 2 + i * 0.3)) * 60 +
                    Math.abs(Math.sin(time * 1.5 + i * 0.5)) * 30;
                const x = startX + i * (barWidth + gap);
                const y = 350 - barHeight / 2;

                const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
                gradient.addColorStop(0, `rgba(6, 182, 212, ${0.15 + Math.sin(time + i) * 0.1})`);
                gradient.addColorStop(0.5, `rgba(99, 102, 241, ${0.12 + Math.sin(time + i) * 0.08})`);
                gradient.addColorStop(1, `rgba(168, 85, 247, ${0.08 + Math.sin(time + i) * 0.06})`);

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth, barHeight);
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" style={{ width: '100%', height: '700px' }} />;
};

/* ─── Suite Feature Card ─── */
interface SuiteFeature {
    title: string;
    description: string;
    pros: string[];
    image: string;
    color: string;
    icon: React.ReactNode;
}

const SuiteCard: React.FC<{ feature: SuiteFeature; index: number }> = ({ feature, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const borderColor = {
        cyan: 'hover:border-cyan-500/40',
        purple: 'hover:border-purple-500/40',
        orange: 'hover:border-orange-500/40',
        green: 'hover:border-green-500/40',
        blue: 'hover:border-blue-500/40',
        pink: 'hover:border-pink-500/40'
    }[feature.color] || 'hover:border-cyan-500/40';

    const iconBg = {
        cyan: 'bg-cyan-500/20 text-cyan-400',
        purple: 'bg-purple-500/20 text-purple-400',
        orange: 'bg-orange-500/20 text-orange-400',
        green: 'bg-green-500/20 text-green-400',
        blue: 'bg-blue-500/20 text-blue-400',
        pink: 'bg-pink-500/20 text-pink-400'
    }[feature.color] || 'bg-cyan-500/20 text-cyan-400';

    return (
        <Card
            className={cn(
                "bg-slate-900/60 border-white/5 backdrop-blur-lg overflow-hidden transition-all duration-500 group",
                borderColor,
                index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={cn("flex flex-col lg:flex-row gap-0", index % 2 !== 0 && "lg:flex-row-reverse")}>
                {/* Image */}
                <div className="lg:w-[55%] relative overflow-hidden">
                    <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover min-h-[250px] group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                        <div className={cn("p-2.5 rounded-xl w-fit", iconBg)}>
                            {feature.icon}
                        </div>
                    </div>
                </div>
                {/* Info */}
                <div className="lg:w-[45%] p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-5 font-light">{feature.description}</p>
                    <ul className="space-y-2.5">
                        {feature.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                                <span>{pro}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Card>
    );
};


export const Landing = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<'paddle' | 'crypto'>('paddle');

    const suiteFeatures: SuiteFeature[] = [
        {
            title: "Dashboard",
            description: "Your creative command center. Upload, manage, and process all your audio files from one place with real-time analytics.",
            pros: ["Drag & drop multi-file upload", "Real-time processing status", "Usage analytics and history", "One-click access to all tools"],
            image: "/screen_level.png",
            color: "cyan",
            icon: <Layout className="h-5 w-5" />
        },
        {
            title: "Audio Enhancement",
            description: "AI-powered audio cleanup and upscaling. Improve clarity, remove noise, and bring life to any recording.",
            pros: ["Neural noise reduction", "Audio upscaling to high quality", "Batch processing support", "Instant A/B comparison"],
            image: "/screen_enhance.png",
            color: "green",
            icon: <Sparkles className="h-5 w-5" />
        },
        {
            title: "Stem Separation",
            description: "Extract vocals, drums, bass, and instruments from any track using state-of-the-art neural networks.",
            pros: ["2, 4, or 6-stem isolation modes", "GPU-accelerated processing", "Professional-grade quality", "Export individual stems"],
            image: "/screen_stems.png",
            color: "purple",
            icon: <Layers className="h-5 w-5" />
        },
        {
            title: "AI Mastering",
            description: "Professional loudness and tonal balancing powered by AI. Master your tracks for streaming, club, or broadcast.",
            pros: ["Streaming-optimized LUFS targeting", "Genre-aware processing profiles", "GPU-accelerated speed", "Lossless WAV output"],
            image: "/screen_mastering.png",
            color: "orange",
            icon: <Zap className="h-5 w-5" />
        },
        {
            title: "Media Player",
            description: "Ultra-fidelity audio and video player with real-time effects, 10-band EQ, visualizers, and a dynamics compressor.",
            pros: ["Unlimited free playback for all users", "10-band parametric EQ", "Real-time visualizers and waveforms", "Playlist management"],
            image: "/screen_player.png",
            color: "blue",
            icon: <Headphones className="h-5 w-5" />
        },
        {
            title: "Mixer Lab",
            description: "A full professional DJ mixer with dual decks, beat sync, crossfader curves, MIDI mapping, and recording.",
            pros: ["Dual-deck mixing with auto-sync", "Real-time EQ, filters & effects", "MIDI controller support", "Record & export your mixes"],
            image: "/screen_mixer.png",
            color: "pink",
            icon: <Music2 className="h-5 w-5" />
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-cyan-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-500/8 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-500/8 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-blue-500/8 blur-[120px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="cursor-pointer" onClick={() => navigate('/')}>
                        <LevelLogo size="md" showIcon={true} />
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {/* Links removed as requested. They are now located below the hero section. */}
                    </div>

                    <div className="flex items-center gap-4">
                        {profile ? (
                            <Button
                                variant="ghost"
                                className="hidden sm:flex text-cyan-400 hover:text-cyan-300 font-medium"
                                onClick={() => navigate('/app')}
                            >
                                <Layout className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                className="hidden sm:flex text-slate-300 hover:text-white"
                                onClick={() => navigate('/auth')}
                            >
                                Sign In
                            </Button>
                        )}
                        <Button
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105"
                            onClick={() => navigate('/app')}
                        >
                            {profile ? 'Go to App' : 'Get Started'}
                        </Button>
                        <button className="md:hidden p-2 text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden bg-slate-950 border-b border-white/5 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
                        <span className="text-slate-500 text-sm">Professional Audio Tools</span>
                    </div>
                )}
            </nav>

            {/* Hero Section with Dynamic Background */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[700px] flex items-center">
                <AudioWaveBackground />

                {/* Hero background image overlay */}
                <div
                    className="absolute inset-0 z-[1] opacity-20"
                    style={{
                        backgroundImage: 'url(/hero_background_music.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0 z-[2] bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950" />

                <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1.5 rounded-full mb-4">
                        <Gauge className="mr-1.5 h-3.5 w-3.5" />
                        GPU-Accelerated AI Processing
                    </Badge>

                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.05]">
                        <span className="block text-white">The companion for</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                            creators, DJs
                        </span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400">
                            & producers
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Ultimate audio toolkit for DJs, musicians, and music lovers.
                        Separate stems, master your tracks, and mix in real-time with GPU-powered precision.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            size="lg"
                            className="h-16 px-10 text-lg bg-white text-slate-950 hover:bg-slate-200 font-black rounded-2xl group transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                            onClick={() => navigate('/app')}
                        >
                            Open Level App
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 px-10 text-lg border-white/10 hover:bg-white/5 text-white font-bold rounded-2xl"
                            onClick={() => {
                                // For now, we point to the web player as a standalone wrapper/bookmarklet
                                // In the future, this can link to a .exe or .dmg download
                                toast("The standalone media player app is coming soon. For now, enjoy the web version!");
                                navigate('/player');
                            }}
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Download Media Player
                        </Button>
                    </div>
                </div>
            </section>

            {/* Tabs Section */}
            <section id="features" className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <Tabs defaultValue="features" className="w-full">
                        <div className="flex justify-center mb-12">
                            <TabsList className="bg-slate-900/50 border border-white/5 p-1 h-14 rounded-2xl backdrop-blur-xl">
                                <TabsTrigger value="features" className="px-6 sm:px-8 rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 text-sm sm:text-base">Features</TabsTrigger>
                                <TabsTrigger value="plans" className="px-6 sm:px-8 rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 text-sm sm:text-base">Plans</TabsTrigger>
                                <TabsTrigger value="guides" className="px-6 sm:px-8 rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 text-sm sm:text-base">Guides</TabsTrigger>
                                <TabsTrigger value="support" className="px-6 sm:px-8 rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 text-sm sm:text-base">Support</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Features Tab */}
                        <TabsContent value="features" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    {
                                        title: "Stem Separation",
                                        description: "Extract vocals, drums, bass, and instruments with surgical precision using GPU-accelerated neural networks.",
                                        icon: <Layers className="h-6 w-6" />,
                                        image: "/stems_separation_vfx_1772770642282.png",
                                    },
                                    {
                                        title: "AI Mastering",
                                        description: "Professional loudness and tonal balancing. GPU-powered processing delivers results in minutes, not hours.",
                                        icon: <Zap className="h-6 w-6" />,
                                        image: "/ai_mastering_vfx_1772770655355.png",
                                    },
                                    {
                                        title: "Pro Mixer Lab",
                                        description: "Real-time mixing with dual decks, beat sync, EQ, and effects. Designed for DJs and live performers.",
                                        icon: <Layout className="h-6 w-6" />,
                                        image: "/dj_mixer_vfx_1772770668357.png",
                                    }
                                ].map((f, i) => (
                                    <Card key={i} className="bg-slate-900/40 border-white/5 hover:border-cyan-500/30 transition-all duration-500 overflow-hidden group">
                                        <div className="aspect-square relative overflow-hidden">
                                            <img src={f.image} alt={f.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                                            <div className="absolute bottom-6 left-6 right-6">
                                                <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl w-fit mb-4 group-hover:bg-cyan-500 transition-colors duration-500">
                                                    {f.icon}
                                                </div>
                                                <h3 className="text-2xl font-bold mb-2">{f.title}</h3>
                                            </div>
                                        </div>
                                        <CardContent className="p-6">
                                            <p className="text-slate-400 font-light leading-relaxed">{f.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Plans Tab - Using the app's actual pricing structure */}
                        <TabsContent value="plans" id="plans">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-3">
                                    Choose Your Plan
                                </h2>
                                <p className="text-slate-400 max-w-xl mx-auto">
                                    From casual editing to professional production. Choose the plan that fits your workflow.
                                </p>
                            </div>

                            {/* Payment Method Toggle */}
                            <div className="flex justify-center mb-8">
                                <div className="inline-flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-700">
                                    <button
                                        onClick={() => setSelectedPayment('paddle')}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                            selectedPayment === 'paddle'
                                                ? "bg-blue-600 text-white shadow-lg"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )}
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Card / PayPal
                                    </button>
                                    <button
                                        onClick={() => setSelectedPayment('crypto')}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                            selectedPayment === 'crypto'
                                                ? "bg-orange-600 text-white shadow-lg"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )}
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Crypto
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                                {/* Free Trial */}
                                <Card className="bg-slate-900/60 border-white/5 overflow-hidden hover:scale-[1.02] transition-all">
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center gap-3">
                                            <Headphones className="h-6 w-6 text-cyan-400" />
                                            <h3 className="text-xl font-bold text-white">Free Trial</h3>
                                        </div>
                                        <p className="text-sm text-slate-500">Perfect for getting started</p>
                                        <div className="text-3xl font-black text-white">$0 <span className="text-sm font-normal text-slate-500">/ 7 days</span></div>
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> 10 Audio Enhancements</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> 3 Stem Separations</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> 2 AI Mastering tracks</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> Unlimited Media Player</li>
                                            <li className="flex items-center gap-2.5 text-slate-500 text-xs italic">After trial: Basic tier (player only)</li>
                                        </ul>
                                        <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl" onClick={() => navigate('/app')}>
                                            Start Free Trial
                                        </Button>
                                    </div>
                                </Card>

                                {/* Premium */}
                                <Card className="bg-slate-900/60 border-white/5 overflow-hidden hover:scale-[1.02] transition-all">
                                    <div className="p-6 space-y-5">
                                        <div className="flex items-center gap-3">
                                            <Star className="h-6 w-6 text-yellow-400" />
                                            <h3 className="text-xl font-bold text-white">Premium</h3>
                                        </div>
                                        <p className="text-sm text-slate-500">Full access to all features</p>
                                        <div className="text-3xl font-black text-white">$9.99 <span className="text-sm font-normal text-slate-500">/ month</span></div>
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> 250 Enhancements/month</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> 150 Stem Separations/month</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> 150 AI Masterings/month</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> Audio Effects & Compressor</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" /> Lossless WAV Downloads</li>
                                        </ul>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => navigate('/app')}>
                                            Subscribe Monthly
                                        </Button>
                                    </div>
                                </Card>

                                {/* VIP Cloud */}
                                <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/60 border-purple-500/30 ring-1 ring-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.1)] overflow-hidden relative hover:scale-[1.02] transition-all">
                                    <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-widest z-10">
                                        Most Popular
                                    </div>
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        Launch Promo!
                                    </div>
                                    <div className="p-6 pt-8 space-y-5">
                                        <div className="flex items-center gap-3">
                                            <Crown className="h-6 w-6 text-purple-400 fill-purple-400" />
                                            <h3 className="text-xl font-bold text-white">VIP Cloud</h3>
                                        </div>
                                        <p className="text-sm text-purple-300/60">Fastest online processing</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg text-slate-500 line-through">$29.99</span>
                                            <span className="text-3xl font-black text-white">$24.99</span>
                                            <span className="text-sm font-normal text-slate-500">/ month</span>
                                        </div>
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex items-center gap-2.5 text-slate-200 font-medium"><Cpu className="h-4 w-4 text-purple-400 shrink-0" /> GPU Accelerated (5-10x faster)</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" /> 500 Stem Separations/month</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" /> 500 AI Masterings/month</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" /> Priority Processing Queue</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" /> Everything in Premium</li>
                                        </ul>
                                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20" onClick={() => navigate('/app')}>
                                            Go VIP
                                        </Button>
                                    </div>
                                </Card>

                                {/* Desktop Pro */}
                                <Card className="bg-slate-900/60 border-orange-500/30 ring-1 ring-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)] overflow-hidden relative hover:scale-[1.02] transition-all">
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        Launch Offer!
                                    </div>
                                    <div className="p-6 pt-8 space-y-5">
                                        <div className="flex items-center gap-3">
                                            <Zap className="h-6 w-6 text-orange-400" />
                                            <h3 className="text-xl font-bold text-white">Desktop Pro</h3>
                                        </div>
                                        <p className="text-sm text-slate-500">Lightning fast. Local GPU.</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg text-slate-500 line-through">$59.99</span>
                                            <span className="text-3xl font-black text-white">$49.99</span>
                                            <span className="text-sm font-normal text-slate-500"> one-time</span>
                                        </div>
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" /> Runs on your GPU/CPU locally</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" /> ZERO recurring fees (Lifetime)</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" /> Fully offline capable</li>
                                            <li className="flex items-center gap-2.5 text-slate-300"><CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" /> Unlimited everything</li>
                                        </ul>
                                        <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20">
                                            Pre-Order Now
                                        </Button>
                                    </div>
                                </Card>
                            </div>

                            {/* Trust & Payment Info */}
                            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-slate-500 text-sm">
                                <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Secure Checkout</div>
                                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Cancel Anytime</div>
                                <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> 14-Day Refund Guarantee</div>
                            </div>
                            <p className="text-center text-xs text-slate-600 mt-4">
                                {selectedPayment === 'paddle'
                                    ? 'Payments processed securely by Paddle. Supports Visa, Mastercard, PayPal.'
                                    : 'Payments via Coinbase Commerce. Supports BTC, ETH, USDC.'}
                            </p>
                        </TabsContent>

                        {/* Guides Tab */}
                        <TabsContent value="guides" id="guides">
                            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { title: "Getting Started with Stems", time: "5 min read", icon: <Layers className="text-cyan-400" /> },
                                    { title: "Mastering Tips for DJs", time: "8 min read", icon: <Zap className="text-yellow-400" /> },
                                    { title: "Hardware Sync Guide", time: "12 min read", icon: <Layout className="text-purple-400" /> },
                                    { title: "Lossless Export Settings", time: "4 min read", icon: <Download className="text-green-400" /> }
                                ].map((g, i) => (
                                    <Card key={i} className="bg-slate-900/50 border-white/5 p-6 hover:bg-slate-800/50 cursor-pointer transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white/5 rounded-xl">{g.icon}</div>
                                            <div>
                                                <h4 className="font-bold text-lg">{g.title}</h4>
                                                <p className="text-slate-500 text-sm">{g.time}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Support Tab */}
                        <TabsContent value="support" id="support">
                            <Card className="max-w-xl mx-auto bg-slate-900/40 border-white/5 p-8 backdrop-blur-xl">
                                <div className="text-center mb-8">
                                    <MessageSquare className="h-10 w-10 text-cyan-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold">Contact Support</h3>
                                    <p className="text-slate-400 mt-2">Have questions? We're here to help you Level up.</p>
                                </div>
                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="Name" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500" />
                                        <input type="email" placeholder="Email" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500" />
                                    </div>
                                    <textarea placeholder="How can we help?" className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500 resize-none" />
                                    <Button className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl">
                                        Send Message
                                    </Button>
                                </form>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            {/* External Player Section */}
            <section className="py-24 px-6 bg-gradient-to-b from-transparent to-slate-900/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-4 py-1">FREE DOWNLOAD</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            The external <br />
                            <span className="text-purple-400">Level Media Player</span>
                        </h2>
                        <p className="text-lg text-slate-400 font-light leading-relaxed">
                            Download our standalone player for free. Ultra-high fidelity audio and video playback with real-time effects, visualizers, and 10-band EQ.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-purple-500/20">
                                <Download className="mr-2 h-5 w-5" /> Download for Windows
                            </Button>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-slate-300 h-14 px-8 rounded-xl">
                                <Download className="mr-2 h-5 w-5" /> Download for macOS
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 bg-purple-500/20 blur-[120px] rounded-full" />
                        <div className="relative border border-white/10 rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-700">
                            <img src="/screen_player.png" alt="Media Player UI" className="w-full h-auto" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Experience the Suite */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center">
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1 mb-6">THE FULL SUITE</Badge>
                        <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
                            Experience the Suite
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Six powerful tools, one ecosystem. Every feature designed to push your audio to the next level.</p>
                    </div>
                    <div className="space-y-8">
                        {suiteFeatures.map((feature, i) => (
                            <SuiteCard key={i} feature={feature} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6 relative">
                <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
                    <h2 className="text-4xl md:text-5xl font-black text-white">Ready to Level up?</h2>
                    <p className="text-lg text-slate-400">Join thousands of creators, DJs, and producers who trust Level Audio for their workflow.</p>
                    <Button
                        size="lg"
                        className="h-16 px-12 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] transition-all hover:scale-105"
                        onClick={() => navigate('/app')}
                    >
                        Open Level App
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
                    <LevelLogo size="sm" showIcon={true} />
                    <div className="flex gap-8">
                        <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="/refunds" className="hover:text-white transition-colors">Refunds</a>
                    </div>
                    <p>© 2025 Level Audio. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
