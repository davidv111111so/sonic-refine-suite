import React, { useState } from 'react';
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
    Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

export default function Admin() {
    const { signOut, user } = useAuth();
    const { role, subscription, isAdmin } = useUserSubscription();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    // Mock Data for Dashboard
    const stats = [
        { title: 'Total Users', value: '1,234', icon: Users, color: 'text-blue-400', change: '+12%' },
        { title: 'Active Sessions', value: '42', icon: Activity, color: 'text-green-400', change: '+5%' },
        { title: 'Storage Used', value: '450 GB', icon: HardDrive, color: 'text-purple-400', change: '85%' },
        { title: 'Files Processed', value: '15.2k', icon: FileAudio, color: 'text-cyan-400', change: '+8%' },
    ];

    // Mock Users Data (plus current user)
    const users = [
        { id: user?.id || 'current', email: user?.email, role: role || 'user', subscription: subscription, status: 'Active', lastActive: 'Now' },
        { id: '1', email: 'alice@example.com', role: 'user', subscription: 'free', status: 'Active', lastActive: '2 hours ago' },
        { id: '2', email: 'bob@example.com', role: 'moderator', subscription: 'premium', status: 'Active', lastActive: '1 day ago' },
        { id: '3', email: 'charlie@example.com', role: 'user', subscription: 'free', status: 'Inactive', lastActive: '1 week ago' },
        { id: '4', email: 'david@example.com', role: 'admin', subscription: 'premium', status: 'Active', lastActive: '3 hours ago' },
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
                    <div className="text-right hidden md:block px-2">
                        <p className="text-sm font-medium text-slate-200">{user?.email}</p>
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
                        {stats.map((stat, index) => (
                            <Card key={index} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">
                                        {stat.title}
                                    </CardTitle>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                                    <p className="text-xs text-slate-500 mt-1">{stat.change} from last month</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Latest system events and user actions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center gap-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                                            <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-purple-500' : 'bg-cyan-500'}`} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-200">
                                                    {i % 2 === 0 ? 'File processing completed' : 'New user registration'}
                                                </p>
                                                <p className="text-xs text-slate-500">{i * 5} minutes ago</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle>System Status</CardTitle>
                                <CardDescription>Real-time performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">CPU Usage</span>
                                        <span className="font-mono text-green-400">24%</span>
                                    </div>
                                    <Progress value={24} className="h-2 bg-slate-800" indicatorClassName="bg-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Memory Usage</span>
                                        <span className="font-mono text-yellow-400">68%</span>
                                    </div>
                                    <Progress value={68} className="h-2 bg-slate-800" indicatorClassName="bg-yellow-500" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Storage</span>
                                        <span className="font-mono text-blue-400">45%</span>
                                    </div>
                                    <Progress value={45} className="h-2 bg-slate-800" indicatorClassName="bg-blue-500" />
                                </div>
                                <div className="pt-4 flex items-center gap-2 text-xs text-green-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    All systems operational
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>User Management</CardTitle>
                                <CardDescription>Manage user access and roles</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                                <Input placeholder="Search users..." className="pl-8 bg-slate-950 border-slate-800" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800 hover:bg-slate-900/50">
                                        <TableHead className="text-slate-400">User</TableHead>
                                        <TableHead className="text-slate-400">Role</TableHead>
                                        <TableHead className="text-slate-400">Subscription</TableHead>
                                        <TableHead className="text-slate-400">Status</TableHead>
                                        <TableHead className="text-slate-400">Last Active</TableHead>
                                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => (
                                        <TableRow key={u.id} className="border-slate-800 hover:bg-slate-900/50">
                                            <TableCell className="font-medium text-slate-200">{u.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`
                                                    ${u.role === 'admin' ? 'border-red-500/50 text-red-400' :
                                                        u.role === 'moderator' ? 'border-yellow-500/50 text-yellow-400' :
                                                            'border-slate-700 text-slate-400'}
                                                `}>
                                                    {u.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`
                                                    ${u.subscription === 'premium' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}
                                                `}>
                                                    {u.subscription}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-slate-600'}`} />
                                                    <span className="text-sm text-slate-400">{u.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-sm">{u.lastActive}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle>System Health</CardTitle>
                            <CardDescription>Detailed system diagnostics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                                    <div className="flex items-center gap-2 text-green-400 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium">API Service</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Uptime: 99.99%</p>
                                    <p className="text-xs text-slate-500">Latency: 45ms</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                                    <div className="flex items-center gap-2 text-green-400 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium">Database</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Connections: 12/100</p>
                                    <p className="text-xs text-slate-500">Cache Hit Rate: 94%</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                                    <div className="flex items-center gap-2 text-green-400 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium">Storage</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Used: 450GB</p>
                                    <p className="text-xs text-slate-500">Available: 1.2TB</p>
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
                                    <label className="text-base font-medium text-slate-200">Maintenance Mode</label>
                                    <p className="text-sm text-slate-500">Disable access for non-admin users</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-base font-medium text-slate-200">Allow New Registrations</label>
                                    <p className="text-sm text-slate-500">Enable or disable new user signups</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-base font-medium text-slate-200">Debug Logging</label>
                                    <p className="text-sm text-slate-500">Enable verbose logging for system events</p>
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
