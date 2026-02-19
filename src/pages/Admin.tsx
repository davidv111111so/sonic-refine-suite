import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
    Activity,
    Users,
    HardDrive,
    Shield,
    Settings,
    LogOut,
    Server,
    FileAudio,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Search,
    Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Admin() {
    const { signOut, profile } = useAuth();
    const { role, isAdmin } = useUserSubscription();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState<any>(null);
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cleaning, setCleaning] = useState(false);

    // Dynamic backend URL: Prioritize local if on localhost, otherwise use env or cloud fallback
    const backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? "" // This will hit the Vite proxy or local server if configured
        : (import.meta.env.VITE_PYTHON_BACKEND_URL || "https://mastering-backend-857351913435.us-central1.run.app");

    // For manual local overrides if the above is not enough
    const finalBackendUrl = backendUrl === "" ? "http://localhost:8001" : backendUrl;

    const fetchStats = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${finalBackendUrl}/api/admin/system-stats`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch stats');

            const data = await response.json();
            setStats(data.summary);
            setRecentJobs(data.recent_jobs);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            toast.error('Failed to load system metrics');
        } finally {
            setLoading(false);
        }
    };

    const handleCleanup = async () => {
        try {
            setCleaning(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${finalBackendUrl}/api/admin/cleanup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Cleanup failed');

            const result = await response.json();
            toast.success(`Cleanup successful! Deleted ${result.files_deleted} stale files.`);
        } catch (error) {
            toast.error('Storage cleanup failed');
        } finally {
            setCleaning(false);
        }
    };

    useEffect(() => {
        if (!isAdmin && !loading) {
            // navigate('/'); // Uncomment for strict security
        }
        fetchStats();
    }, [isAdmin]);

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    const dashboardCards = [
        { title: 'Total Users', value: stats?.total_users || '0', icon: Users, color: 'text-blue-400' },
        { title: 'Total Jobs', value: stats?.total_jobs || '0', icon: Activity, color: 'text-green-400' },
        { title: 'Data Processed', value: stats?.total_data_bytes ? `${(stats.total_data_bytes / 1024 / 1024 / 1024).toFixed(2)} GB` : '0 GB', icon: HardDrive, color: 'text-purple-400' },
        { title: 'Est. Cost', value: stats?.total_estimated_cost ? `$${stats.total_estimated_cost.toFixed(2)}` : '$0.00', icon: FileAudio, color: 'text-cyan-400' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-400">System Overview & Management</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <div className="text-right hidden md:block px-2">
                        <p className="text-sm font-medium text-slate-200">{profile?.email}</p>
                        <div className="flex items-center justify-end gap-2">
                            <Badge variant="outline" className="text-[10px] h-4 border-cyan-500/50 text-cyan-400">
                                {role?.toUpperCase() || 'USER'}
                            </Badge>
                            {isAdmin && <Shield className="w-3 h-3 text-yellow-400" />}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400 hover:bg-red-950/30">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                    <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-slate-800">
                        <Activity className="w-4 h-4" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-slate-800">
                        <Users className="w-4 h-4" /> User Management
                    </TabsTrigger>
                    <TabsTrigger value="system" className="gap-2 data-[state=active]:bg-slate-800">
                        <Server className="w-4 h-4" /> System Health
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-slate-800">
                        <Settings className="w-4 h-4" /> Settings
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {dashboardCards.map((stat, index) => (
                            <Card key={index} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">
                                        {stat.title}
                                    </CardTitle>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Alerts for limits */}
                    {(stats?.total_users >= 100 || stats?.total_jobs >= 10000) && (
                        <Card className="bg-red-950/20 border-red-500/50">
                            <CardContent className="flex items-center gap-4 p-4">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <div>
                                    <p className="font-bold text-red-400">Scaling Alert Reached!</p>
                                    <p className="text-sm text-red-300/70">
                                        Current load: {stats?.total_users} users / {stats?.total_jobs} monthly jobs.
                                        Consider upgrading infrastructure tiers.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle>Recent Job History</CardTitle>
                                <CardDescription>Latest audio processing requests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-800">
                                            <TableHead className="text-slate-400">Job</TableHead>
                                            <TableHead className="text-slate-400">Size</TableHead>
                                            <TableHead className="text-slate-400">Status</TableHead>
                                            <TableHead className="text-slate-400">Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentJobs.length > 0 ? recentJobs.map((job) => (
                                            <TableRow key={job.id} className="border-slate-800">
                                                <TableCell className="font-medium text-slate-300">
                                                    {job.job_type.toUpperCase()}
                                                </TableCell>
                                                <TableCell className="text-slate-400 text-sm">
                                                    {(job.file_size_bytes / 1024 / 1024).toFixed(1)} MB
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        job.status === 'completed' ? 'border-green-500/50 text-green-400' :
                                                            job.status === 'failed' ? 'border-red-500/50 text-red-400' : 'border-yellow-500/50 text-yellow-400'
                                                    }>
                                                        {job.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-xs">
                                                    {new Date(job.created_at).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                                                    No recent jobs found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle>Storage Management</CardTitle>
                                <CardDescription>Cleanup & Maintenance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                                    <p className="text-sm font-medium text-slate-300 mb-1">Temporary Storage</p>
                                    <p className="text-xs text-slate-500 mb-4">
                                        Files are automatically removed after 1 hour. Trigger manually if needed.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 border-red-900/50 hover:bg-red-950/30 text-red-400"
                                        onClick={handleCleanup}
                                        disabled={cleaning}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {cleaning ? 'Cleaning...' : 'Purge Old Files'}
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Auto-Cleanup</span>
                                        <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Storage Limit</span>
                                        <span className="text-slate-500 underline decoration-dotted">1.0 GB (Free)</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Users Tab - Placeholder or Reuse existing logic */}
                <TabsContent value="users">
                    <Card className="bg-slate-900/50 border-slate-800 text-center py-12">
                        <Users className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Filtering & editing users coming soon.</CardDescription>
                    </Card>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle>System Health</CardTitle>
                            <CardDescription>Backend Status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium text-green-400">All Systems Operational</p>
                                    <p className="text-xs text-green-600">Backend version 2.1.0-storage</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle>Admin Settings</CardTitle>
                            <CardDescription>Configure system-wide settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-base font-medium text-slate-200">Processing Bypass</label>
                                    <p className="text-sm text-slate-500">Allow uploads without preprocessing</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-base font-medium text-slate-200">Debug Logging</label>
                                    <p className="text-sm text-slate-500">Enable verbose logging in console</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
