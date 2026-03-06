import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Music,
    Zap,
    Layers,
    Layout,
    CreditCard,
    BookOpen,
    MessageSquare,
    Download,
    ArrowRight,
    Shield,
    Star,
    CheckCircle2,
    Lock,
    Menu,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Orb from '@/components/ui/Orb';
import { AnimatedTitle } from '@/components/AnimatedTitle';
import { cn } from '@/lib/utils';

export const Landing = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const features = [
        {
            title: "Stem Separation",
            description: "Extract vocals, drums, bass, and instruments with surgical precision using neural networks.",
            icon: <Layers className="h-6 w-6" />,
            image: "/stems_separation_vfx_1772770642282.png",
            color: "cyan"
        },
        {
            title: "AI Mastering",
            description: "Professional loudness and tonal balancing that rivals high-end studio gear.",
            icon: <Zap className="h-6 w-6" />,
            image: "/ai_mastering_vfx_1772770655355.png",
            color: "purple"
        },
        {
            title: "Pro Mixer Lab",
            description: "Real-time mixing with stem control, EQ, and effects designed for DJs and performers.",
            icon: <Layout className="h-6 w-6" />,
            image: "/dj_mixer_vfx_1772770668357.png",
            color: "orange"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-cyan-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
                            <Music className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            LEVEL
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Features</a>
                        <a href="#plans" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Pricing</a>
                        <a href="#guides" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Guides</a>
                        <a href="#support" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Support</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            className="hidden sm:flex text-slate-300 hover:text-white"
                            onClick={() => navigate('/auth')}
                        >
                            Sign In
                        </Button>
                        <Button
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105"
                            onClick={() => navigate('/app')}
                        >
                            Get Started
                        </Button>
                        <button className="md:hidden p-2 text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-slate-950 border-b border-white/5 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
                        <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
                        <a href="#plans" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                        <a href="#guides" onClick={() => setIsMenuOpen(false)}>Guides</a>
                        <a href="#support" onClick={() => setIsMenuOpen(false)}>Support</a>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1.5 rounded-full mb-4 animate-pulse">
                        ✨ Your AI Creative Suite is Here
                    </Badge>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1]">
                        <span className="block text-white">The companion for</span>
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                            creators & producers
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Ultimate audio toolkit for DJs, musicians, and music lovers.
                        Separate stems, master your tracks, and mix in real-time with AI-powered precision.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            size="lg"
                            className="h-16 px-10 text-lg bg-white text-slate-950 hover:bg-slate-200 font-black rounded-2xl group transition-all"
                            onClick={() => navigate('/app')}
                        >
                            Open Web App
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 px-10 text-lg border-white/10 hover:bg-white/5 text-white font-bold rounded-2xl"
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Download Media Player
                        </Button>
                    </div>

                    {/* App Preview Frame */}
                    <div className="mt-20 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-[100px] opacity-50 group-hover:opacity-80 transition-opacity" />
                        <div className="relative border border-white/10 rounded-[32px] overflow-hidden bg-slate-900/50 backdrop-blur-3xl shadow-2xl">
                            <div className="h-12 bg-slate-800/50 border-b border-white/5 flex items-center px-6 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="mx-auto bg-slate-900/50 px-4 py-1 rounded-lg text-xs text-slate-500 font-mono">
                                    levelaudio.live/app
                                </div>
                            </div>
                            <img
                                src="/level_landing_concept_1_1772769179993.png"
                                alt="Level App Interface"
                                className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Tabs Section (Features, Pricing, etc) */}
            <section id="features" className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <Tabs defaultValue="features" className="w-full">
                        <div className="flex justify-center mb-12">
                            <TabsList className="bg-slate-900/50 border border-white/5 p-1 h-14 rounded-2xl backdrop-blur-xl">
                                <TabsTrigger value="features" className="px-8 rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950">Features</TabsTrigger>
                                <TabsTrigger value="plans" className="px-8 rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950">Plans</TabsTrigger>
                                <TabsTrigger value="guides" className="px-8 rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950">Guides</TabsTrigger>
                                <TabsTrigger value="support" className="px-8 rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950">Support</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="features" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {features.map((f, i) => (
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
                                            <p className="text-slate-400 font-light leading-relaxed">
                                                {f.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="plans" id="plans">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                {/* Free Tier */}
                                <Card className="bg-slate-900/40 border-white/5 p-8 relative overflow-hidden group">
                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Free Trial</h3>
                                            <p className="text-slate-500 mt-2">Test the power of Level</p>
                                        </div>
                                        <div className="text-4xl font-black text-white">$0 <span className="text-lg font-normal text-slate-500">/ forever</span></div>
                                        <ul className="space-y-4">
                                            <li className="flex items-center gap-3 text-slate-300">
                                                <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                                                10 Audio Enhancements
                                            </li>
                                            <li className="flex items-center gap-3 text-slate-300">
                                                <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                                                3 Stem Separations
                                            </li>
                                            <li className="flex items-center gap-3 text-slate-300">
                                                <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                                                2 AI Mastering tracks
                                            </li>
                                            <li className="flex items-center gap-3 text-slate-300">
                                                <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                                                Unlimited Media Player
                                            </li>
                                            <li className="flex items-center gap-1.5 text-slate-500 italic text-sm">
                                                Expired trial users switch to Basic (20h Mixer/mo)
                                            </li>
                                        </ul>
                                        <Button className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white" onClick={() => navigate('/app')}>
                                            Start Trial
                                        </Button>
                                    </div>
                                </Card>

                                {/* Premium Tier */}
                                <Card className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border-cyan-500/30 p-8 shadow-[0_0_40px_rgba(6,182,212,0.1)] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4">
                                        <Badge className="bg-cyan-500 text-slate-950 font-bold">MOST POPULAR</Badge>
                                    </div>
                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Premium</h3>
                                            <p className="text-cyan-400/60 mt-2">The producer's choice</p>
                                        </div>
                                        <div className="text-4xl font-black text-white">$19 <span className="text-lg font-normal text-slate-500">/ mo</span></div>
                                        <ul className="space-y-4">
                                            <li className="flex items-center gap-3 text-slate-100">
                                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                                Unlimited Stems & Mastering
                                            </li>
                                            <li className="flex items-center gap-3 text-slate-100">
                                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                                Lossless WAV Downloads
                                            </li>
                                            <li className="flex items-center gap-3 text-slate-100">
                                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                                Advanced Mastering Settings
                                            </li>
                                            <li className="flex items-center gap-3 text-slate-100">
                                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                                Unlimited Mixer & VST Lab
                                            </li>
                                            <li className="flex items-center gap-3 text-cyan-400 font-bold">
                                                <Shield className="h-5 w-5" />
                                                14-Day Money Back Guarantee
                                            </li>
                                        </ul>
                                        <Button className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
                                            Upgrade to Pro
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

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
                                    <textarea placeholder="How can we help?" className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500" />
                                    <Button className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all">
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
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-4 py-1">AVAILABLE NOW</Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            The external <br />
                            <span className="text-purple-400">Level Media Player</span>
                        </h2>
                        <p className="text-lg text-slate-400 font-light leading-relaxed">
                            Download our standalone player for free. Plays ultra-high fidelity audio and video with real-time effects, visualizers, and neural engine integration.
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
                        <div className="relative border border-white/10 rounded-3xl overflow-hidden shadow-2xl skew-y-3 transform hover:skew-y-0 transition-transform duration-700">
                            <img src="/media__1772764121883.jpg" alt="Media Player UI" className="w-full h-auto" />
                        </div>
                    </div>
                </div>
            </section>

            {/* App Screenshots Lower Section */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                            Experience the Suite
                        </h2>
                        <p className="text-slate-500 mt-2">Everything you need in one powerful ecosystem.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="relative group overflow-hidden rounded-2xl border border-white/5">
                            <img src="/level_landing_concept_2_1772769196923.png" alt="Concept View" className="w-full grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                                <p className="font-bold">Next-Gen Audio Engine</p>
                            </div>
                        </div>
                        <div className="relative group overflow-hidden rounded-2xl border border-white/5 skew-y-1">
                            <img src="/stems_separation_vfx_1772770642282.png" alt="VFX" className="w-full grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                                <p className="font-bold">Neural Stem Splitting</p>
                            </div>
                        </div>
                        <div className="relative group overflow-hidden rounded-2xl border border-white/5">
                            <img src="/ai_mastering_vfx_1772770655355.png" alt="Mastering" className="w-full grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                                <p className="font-bold">Intelligent Mastering</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
                    <div className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-cyan-500" />
                        <span className="font-bold text-slate-300">LEVEL AUDIO 2026</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white">Privacy</a>
                        <a href="#" className="hover:text-white">Terms</a>
                        <a href="#" className="hover:text-white">Refunds</a>
                        <a href="#" className="hover:text-white">API</a>
                    </div>
                    <p>© All rights reserved. Built with Antigravity.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
