import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { Shield, Users, FileAudio, TrendingUp, Settings } from 'lucide-react';
import { AdminReferenceManager } from './ai-mastering/AdminReferenceManager';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const AdminPanel = () => {
  const { isAdmin, loading } = useUserSubscription();
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get premium users
      const { count: premiumCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription', 'premium');

      setStats({
        totalUsers: totalCount || 0,
        premiumUsers: premiumCount || 0,
        freeUsers: (totalCount || 0) - (premiumCount || 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Level Audio platform
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-400">
          Administrator
        </Badge>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.premiumUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <FileAudio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.freeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Free tier accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Reference Manager */}
      <AdminReferenceManager />
    </div>
  );
};