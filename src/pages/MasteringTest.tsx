import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const MasteringTest = () => {
  const { user } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://mastering-backend-857351913435.us-central1.run.app';

  const [healthStatus, setHealthStatus] = React.useState<'checking' | 'ok' | 'error'>('checking');
  const [healthData, setHealthData] = React.useState<any>(null);

  const checkHealth = async () => {
    setHealthStatus('checking');
    try {
      const response = await fetch(`${backendUrl}/health`);
      const data = await response.json();
      setHealthData(data);
      setHealthStatus(response.ok ? 'ok' : 'error');
    } catch (error) {
      setHealthStatus('error');
      setHealthData({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  React.useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 Mastering Backend Test Panel
              <Badge variant="secondary">{user?.email}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Backend Health */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Backend Health Check
                {healthStatus === 'ok' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {healthStatus === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                {healthStatus === 'checking' && <AlertCircle className="w-5 h-5 text-yellow-500 animate-spin" />}
              </h3>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-mono mb-2">Backend URL:</p>
                <code className="text-xs bg-background p-2 rounded block">{backendUrl}</code>
              </div>

              {healthData && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-mono mb-2">Response:</p>
                  <pre className="text-xs bg-background p-2 rounded overflow-auto">
                    {JSON.stringify(healthData, null, 2)}
                  </pre>
                </div>
              )}

              <Button onClick={checkHealth} variant="outline">
                Refresh Health Check
              </Button>
            </div>

            {/* Test URLs */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test URLs (Admin Only)</h3>
              <div className="grid gap-2">
                <a
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-medium">Production App (Current)</span>
                </a>
                <div className="text-sm text-muted-foreground ml-8">
                  Admin access: davidv111111@gmail.com, santiagov.t068@gmail.com
                </div>
              </div>
            </div>

            {/* Environment Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Environment</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <Badge>{import.meta.env.DEV ? 'Development' : 'Production'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beta Mode:</span>
                  <Badge variant="destructive">ENABLED (Admins Only)</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Backend:</span>
                  <Badge variant="secondary">Cloud Run</Badge>
                </div>
              </div>
            </div>

            {/* API Endpoints */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Available Endpoints</h3>
              <div className="space-y-2 text-sm font-mono bg-muted/50 p-4 rounded-lg">
                <div><span className="text-green-500">GET</span> /health</div>
                <div><span className="text-blue-500">POST</span> /api/master-audio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
