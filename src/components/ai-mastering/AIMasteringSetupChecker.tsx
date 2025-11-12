/**
 * AI Mastering Setup Checker
 * 
 * Componente de verificación para validar que todo el sistema de AI Mastering
 * esté configurado correctamente.
 * 
 * Verifica:
 * - Variables de entorno
 * - Edge Function desplegada
 * - Backend Python accesible
 * - Google Cloud Storage configurado
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CheckResult {
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
  fix?: string;
}

interface CheckResults {
  envVars: CheckResult;
  edgeFunction: CheckResult;
  backend: CheckResult;
  gcs: CheckResult;
}

export const AIMasteringSetupChecker = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CheckResults>({
    envVars: { status: 'pending', message: 'Not checked yet' },
    edgeFunction: { status: 'pending', message: 'Not checked yet' },
    backend: { status: 'pending', message: 'Not checked yet' },
    gcs: { status: 'pending', message: 'Not checked yet' },
  });

  // Check 1: Environment Variables
  const checkEnvVars = async (): Promise<CheckResult> => {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    ];

    const missingVars = requiredVars.filter(
      varName => !import.meta.env[varName]
    );

    if (missingVars.length > 0) {
      return {
        status: 'error',
        message: 'Missing environment variables',
        details: `Missing: ${missingVars.join(', ')}`,
        fix: 'Check your .env file and ensure all required variables are set.',
      };
    }

    // Check optional backend URL
    const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL;
    
    if (!backendUrl) {
      return {
        status: 'warning',
        message: 'Environment variables OK (using fallback backend)',
        details: 'VITE_PYTHON_BACKEND_URL not set, using default backend',
      };
    }

    return {
      status: 'success',
      message: 'All environment variables configured',
      details: 'Supabase and Backend URLs are set',
    };
  };

  // Check 2: Edge Function
  const checkEdgeFunction = async (): Promise<CheckResult> => {
    try {
      // Check if user is authenticated first
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        return {
          status: 'warning',
          message: 'Not authenticated',
          details: 'Please login to test Edge Function',
          fix: 'Login to the application first',
        };
      }

      // Try to call the Edge Function
      const { data, error } = await supabase.functions.invoke('generate-upload-url', {
        body: {
          fileName: 'test-setup-check.wav',
          fileType: 'audio/wav',
          fileSize: 1024,
        },
      });

      if (error) {
        return {
          status: 'error',
          message: 'Edge Function error',
          details: error.message,
          fix: 'Check Edge Function logs in Lovable Cloud > Edge Functions',
        };
      }

      if (!data || !data.uploadUrl) {
        return {
          status: 'error',
          message: 'Edge Function returned invalid data',
          details: 'No uploadUrl in response',
          fix: 'Verify Edge Function code in supabase/functions/generate-upload-url/',
        };
      }

      return {
        status: 'success',
        message: 'Edge Function is working',
        details: 'Successfully generated upload URL',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to call Edge Function',
        details: error instanceof Error ? error.message : 'Unknown error',
        fix: 'Ensure Edge Function is deployed. Check Lovable Cloud > Edge Functions',
      };
    }
  };

  // Check 3: Backend Python
  const checkBackend = async (): Promise<CheckResult> => {
    const backendUrl =
      import.meta.env.VITE_PYTHON_BACKEND_URL ||
      'https://spectrum-backend-857351913435.us-central1.run.app';

    try {
      // Try health check first
      let healthCheck = false;
      try {
        const healthResponse = await fetch(`${backendUrl}/health`, {
          method: 'GET',
        });
        healthCheck = healthResponse.ok;
      } catch {
        // Health endpoint may not exist, continue
      }

      // Try mastering endpoint (will fail but we just want to see if it responds)
      const response = await fetch(`${backendUrl}/api/master-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputUrl: 'https://test.url/file.wav',
          fileName: 'test.wav',
          settings: {},
        }),
      });

      // Backend should respond, even if with error (because test data is invalid)
      if (response.status === 404) {
        return {
          status: 'error',
          message: 'Backend endpoint not found',
          details: '/api/master-audio endpoint does not exist',
          fix: 'Deploy the backend Python service. See BACKEND_CORS_CONFIG.md',
        };
      }

      // Any other response means backend is accessible
      return {
        status: 'success',
        message: 'Backend is accessible',
        details: healthCheck
          ? 'Health check passed and /api/master-audio exists'
          : '/api/master-audio endpoint exists',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Backend is not accessible',
        details: error instanceof Error ? error.message : 'Connection failed',
        fix: `Verify backend is deployed and accessible at: ${backendUrl}`,
      };
    }
  };

  // Check 4: Google Cloud Storage
  const checkGCS = async (): Promise<CheckResult> => {
    try {
      // Check if user is authenticated first
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        return {
          status: 'warning',
          message: 'Not authenticated',
          details: 'Please login to test GCS configuration',
          fix: 'Login to the application first',
        };
      }

      // Generate upload URL (this tests GCS credentials in Edge Function)
      const { data, error } = await supabase.functions.invoke('generate-upload-url', {
        body: {
          fileName: 'test-gcs-check.wav',
          fileType: 'audio/wav',
          fileSize: 1024,
        },
      });

      if (error) {
        if (error.message.includes('credentials') || error.message.includes('Google Cloud')) {
          return {
            status: 'error',
            message: 'GCS credentials not configured',
            details: error.message,
            fix: 'Configure Google Cloud secrets in Lovable. See DEPLOY.md section 2.',
          };
        }
        
        return {
          status: 'error',
          message: 'GCS configuration error',
          details: error.message,
          fix: 'Check Edge Function logs for detailed error',
        };
      }

      if (!data || !data.uploadUrl || !data.uploadUrl.includes('storage.googleapis.com')) {
        return {
          status: 'error',
          message: 'Invalid GCS response',
          details: 'Upload URL does not point to Google Cloud Storage',
          fix: 'Verify GCS bucket configuration and credentials',
        };
      }

      // Try to verify the bucket exists (HEAD request to upload URL)
      try {
        const headResponse = await fetch(data.uploadUrl, {
          method: 'HEAD',
        });
        
        // 400 or 403 means bucket exists but we can't access without proper request
        // This is actually expected for signed URLs
        if (headResponse.status === 400 || headResponse.status === 403) {
          return {
            status: 'success',
            message: 'GCS is configured correctly',
            details: 'Bucket exists and signed URLs are generated',
          };
        }
      } catch {
        // Network error or CORS - but if we got the URL, GCS is likely configured
        return {
          status: 'success',
          message: 'GCS appears configured',
          details: 'Signed URLs are generated (bucket verification skipped due to CORS)',
        };
      }

      return {
        status: 'success',
        message: 'GCS is configured',
        details: 'Successfully generated GCS signed URL',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to verify GCS',
        details: error instanceof Error ? error.message : 'Unknown error',
        fix: 'Check Google Cloud Storage configuration. See SETUP_GCS.md',
      };
    }
  };

  // Run all checks
  const runAllChecks = async () => {
    setIsChecking(true);

    try {
      // Run checks sequentially for better UX
      const envVarsResult = await checkEnvVars();
      setResults(prev => ({ ...prev, envVars: envVarsResult }));

      const edgeFunctionResult = await checkEdgeFunction();
      setResults(prev => ({ ...prev, edgeFunction: edgeFunctionResult }));

      const backendResult = await checkBackend();
      setResults(prev => ({ ...prev, backend: backendResult }));

      const gcsResult = await checkGCS();
      setResults(prev => ({ ...prev, gcs: gcsResult }));
    } finally {
      setIsChecking(false);
    }
  };

  // Individual check functions
  const runCheck = async (checkName: keyof CheckResults) => {
    setIsChecking(true);
    
    try {
      let result: CheckResult;
      
      switch (checkName) {
        case 'envVars':
          result = await checkEnvVars();
          break;
        case 'edgeFunction':
          result = await checkEdgeFunction();
          break;
        case 'backend':
          result = await checkBackend();
          break;
        case 'gcs':
          result = await checkGCS();
          break;
      }
      
      setResults(prev => ({ ...prev, [checkName]: result }));
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">OK</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const allSuccess = Object.values(results).every(r => r.status === 'success');
  const hasError = Object.values(results).some(r => r.status === 'error');

  return (
    <Card className="bg-card border-2 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              🔍 AI Mastering Setup Checker
              {allSuccess && (
                <Badge className="bg-green-500 text-white">All Systems Go!</Badge>
              )}
              {hasError && (
                <Badge className="bg-red-500 text-white">Issues Detected</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              Verify that all components are configured correctly
            </CardDescription>
          </div>
          <Button
            onClick={runAllChecks}
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test All
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Environment Variables Check */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(results.envVars.status)}
              <div>
                <h3 className="font-semibold">Environment Variables</h3>
                <p className="text-sm text-muted-foreground">
                  {results.envVars.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(results.envVars.status)}
              <Button
                onClick={() => runCheck('envVars')}
                disabled={isChecking}
                variant="ghost"
                size="sm"
              >
                Test
              </Button>
            </div>
          </div>

          {results.envVars.details && (
            <p className="text-xs text-muted-foreground ml-8">
              {results.envVars.details}
            </p>
          )}

          {results.envVars.fix && (
            <Alert className="ml-8">
              <AlertDescription className="text-xs">
                <strong>Fix:</strong> {results.envVars.fix}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Edge Function Check */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(results.edgeFunction.status)}
              <div>
                <h3 className="font-semibold">Edge Function</h3>
                <p className="text-sm text-muted-foreground">
                  {results.edgeFunction.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(results.edgeFunction.status)}
              <Button
                onClick={() => runCheck('edgeFunction')}
                disabled={isChecking}
                variant="ghost"
                size="sm"
              >
                Test
              </Button>
            </div>
          </div>

          {results.edgeFunction.details && (
            <p className="text-xs text-muted-foreground ml-8">
              {results.edgeFunction.details}
            </p>
          )}

          {results.edgeFunction.fix && (
            <Alert className="ml-8">
              <AlertDescription className="text-xs">
                <strong>Fix:</strong> {results.edgeFunction.fix}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Backend Check */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(results.backend.status)}
              <div>
                <h3 className="font-semibold">Backend Python</h3>
                <p className="text-sm text-muted-foreground">
                  {results.backend.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(results.backend.status)}
              <Button
                onClick={() => runCheck('backend')}
                disabled={isChecking}
                variant="ghost"
                size="sm"
              >
                Test
              </Button>
            </div>
          </div>

          {results.backend.details && (
            <p className="text-xs text-muted-foreground ml-8">
              {results.backend.details}
            </p>
          )}

          {results.backend.fix && (
            <Alert className="ml-8">
              <AlertDescription className="text-xs">
                <strong>Fix:</strong> {results.backend.fix}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* GCS Check */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(results.gcs.status)}
              <div>
                <h3 className="font-semibold">Google Cloud Storage</h3>
                <p className="text-sm text-muted-foreground">
                  {results.gcs.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(results.gcs.status)}
              <Button
                onClick={() => runCheck('gcs')}
                disabled={isChecking}
                variant="ghost"
                size="sm"
              >
                Test
              </Button>
            </div>
          </div>

          {results.gcs.details && (
            <p className="text-xs text-muted-foreground ml-8">
              {results.gcs.details}
            </p>
          )}

          {results.gcs.fix && (
            <Alert className="ml-8">
              <AlertDescription className="text-xs">
                <strong>Fix:</strong> {results.gcs.fix}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Documentation Links */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium">📚 Documentation:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open('/DEPLOY.md', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Deploy Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open('/SETUP_GCS.md', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              GCS Setup
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open('/BACKEND_CORS_CONFIG.md', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Backend Config
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open('/QUICK_START_TESTING.md', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Testing Guide
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {allSuccess && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <strong className="text-green-500">All checks passed!</strong> Your AI Mastering system is ready to use.
              You can now remove this checker component from the AI Mastering tab.
            </AlertDescription>
          </Alert>
        )}

        {/* Warning about temporary component */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Note:</strong> This is a temporary setup checker. Once all systems are green,
            you can remove this component from AIMasteringTab.tsx
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
