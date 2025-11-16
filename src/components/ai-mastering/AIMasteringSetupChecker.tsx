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
        // Check if it's a network/connection error
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          return {
            status: 'error',
            message: 'Edge Function connection error',
            details: 'Cannot reach Edge Function. It may not be deployed or there is a network issue.',
            fix: '1. Deploy Edge Function in Lovable Cloud > Edge Functions\n2. Check your internet connection\n3. Verify SUPABASE_URL is correct',
          };
        }

        // Check if it's an authentication error
        if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          return {
            status: 'error',
            message: 'Edge Function authentication error',
            details: error.message,
            fix: '1. Log out and log back in\n2. Check if your session is valid\n3. Verify SUPABASE_ANON_KEY is correct',
          };
        }

        // Check if it's a configuration error
        if (error.message?.includes('credentials') || error.message?.includes('Google Cloud')) {
          return {
            status: 'error',
            message: 'Edge Function configuration error',
            details: error.message,
            fix: 'Configure Google Cloud secrets in Lovable Cloud:\n- GOOGLE_CLOUD_PROJECT_ID\n- GOOGLE_CLOUD_BUCKET_NAME\n- GOOGLE_APPLICATION_CREDENTIALS_JSON',
          };
        }

        // Generic error
        return {
          status: 'error',
          message: 'Edge Function error',
          details: error.message || 'Unknown error occurred',
          fix: 'Check Edge Function logs in Lovable Cloud > Edge Functions > generate-upload-url > Logs',
        };
      }

      if (!data || !data.uploadUrl) {
        return {
          status: 'error',
          message: 'Edge Function returned invalid data',
          details: 'No uploadUrl in response. Response: ' + JSON.stringify(data).substring(0, 200),
          fix: 'Verify Edge Function code in supabase/functions/generate-upload-url/index.ts',
        };
      }

      return {
        status: 'success',
        message: 'Edge Function is working',
        details: `Successfully generated upload URL for bucket: ${data.bucket || 'unknown'}`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to call Edge Function',
        details: error instanceof Error ? error.message : 'Unknown error',
        fix: '1. Ensure Edge Function is deployed in Lovable Cloud\n2. Check browser console for detailed errors\n3. Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct',
      };
    }
  };

  // Check 3: Backend Python
  const checkBackend = async (): Promise<CheckResult> => {
    // Detectar la URL del backend basada en el entorno
    let defaultBackendUrl: string;
    
    if (import.meta.env.DEV) {
      // En desarrollo, usar el mismo host que el frontend (soporta localhost y network IPs)
      defaultBackendUrl = window.location.origin;
    } else {
      // En producción, usar el backend desplegado en Cloud Run
      defaultBackendUrl = 'https://mastering-backend-azkp62xtaq-uc.a.run.app';
    }
    
    const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || defaultBackendUrl;

    try {
      // Try health check first
      let healthCheck = false;
      let healthDetails = '';
      try {
        const healthResponse = await fetch(`${backendUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (healthResponse.ok) {
          healthCheck = true;
          const healthData = await healthResponse.json().catch(() => ({}));
          healthDetails = healthData.status === 'healthy' 
            ? `Health: ${healthData.status}, GCS: ${healthData.services?.gcs || 'unknown'}`
            : 'Health check responded';
        } else {
          healthDetails = `Health endpoint returned ${healthResponse.status}`;
        }
      } catch (healthError) {
        healthDetails = 'Health endpoint not available (this is OK if /api/master-audio works)';
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
          details: '/api/master-audio endpoint does not exist (404)',
          fix: 'Deploy the backend Python service. See backend/main.py and ensure /api/master-audio route exists',
        };
      }

      // Check for CORS errors vs backend validation errors
      if (response.status === 0 || (response.status >= 500 && response.status < 600)) {
        const errorText = await response.text().catch(() => '');
        
        // If we got a JSON error response with "error" or "success:false", backend is working!
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error || errorJson.success === false) {
            // Backend is working, just rejecting invalid test data (expected!)
            return {
              status: 'success',
              message: 'Backend is accessible',
              details: healthCheck 
                ? `${healthDetails}. Backend correctly rejected test data: "${errorJson.error?.substring(0, 80) || 'validation error'}"`
                : `Backend responded with validation error (expected for test data): "${errorJson.error?.substring(0, 80) || 'error'}"`,
            };
          }
        } catch (parseError) {
          // Not JSON, likely a real server error
        }
        
        // If we got here, it's a real error
        return {
          status: 'error',
          message: 'Backend error or CORS issue',
          details: `Status: ${response.status}. ${errorText.substring(0, 200)}`,
          fix: '1. Check CORS configuration in backend/main.py\n2. Ensure ALLOWED_ORIGINS includes your frontend URL\n3. Check backend logs for errors',
        };
      }

      // 400/422 means endpoint exists but validation failed (expected with test data)
      if (response.status === 400 || response.status === 422) {
        return {
          status: 'success',
          message: 'Backend is accessible',
          details: healthCheck 
            ? `${healthDetails}. Endpoint exists (validation error expected with test data)`
            : '/api/master-audio endpoint exists and responds (validation error expected)',
        };
      }

      // Any other 2xx or 3xx response means backend is accessible
      return {
        status: 'success',
        message: 'Backend is accessible',
        details: healthCheck
          ? `${healthDetails}. /api/master-audio endpoint exists`
          : '/api/master-audio endpoint exists and responds',
      };
    } catch (error) {
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          status: 'error',
          message: 'Backend CORS error or not accessible',
          details: 'Cannot connect to backend. This could be:\n- CORS not configured\n- Backend not running\n- Network issue',
          fix: `1. Ensure backend is running at: ${backendUrl}\n2. Check CORS in backend/main.py includes your origin\n3. For localhost:8080, ensure "http://localhost:8080" is in allowed_origins`,
        };
      }

      return {
        status: 'error',
        message: 'Backend is not accessible',
        details: error instanceof Error ? error.message : 'Connection failed',
        fix: `1. Verify backend is running at: ${backendUrl}\n2. Check backend logs\n3. Test manually: curl ${backendUrl}/health`,
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
        // Check for specific error types
        if (error.message?.includes('credentials') || error.message?.includes('Google Cloud')) {
          return {
            status: 'error',
            message: 'GCS credentials not configured',
            details: error.message,
            fix: 'Configure Google Cloud secrets in Lovable Cloud:\n- GOOGLE_CLOUD_PROJECT_ID\n- GOOGLE_CLOUD_BUCKET_NAME\n- GOOGLE_APPLICATION_CREDENTIALS_JSON',
          };
        }

        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          return {
            status: 'error',
            message: 'Cannot reach Edge Function',
            details: 'Edge Function may not be deployed or there is a network issue',
            fix: '1. Deploy Edge Function in Lovable Cloud\n2. Check your internet connection',
          };
        }
        
        return {
          status: 'error',
          message: 'GCS configuration error',
          details: error.message || 'Unknown error',
          fix: 'Check Edge Function logs in Lovable Cloud > Edge Functions > generate-upload-url > Logs',
        };
      }

      if (!data || !data.uploadUrl) {
        return {
          status: 'error',
          message: 'Invalid GCS response',
          details: 'No uploadUrl in response. Response: ' + JSON.stringify(data).substring(0, 200),
          fix: 'Verify Edge Function code returns uploadUrl and downloadUrl',
        };
      }

      // Verify the URL format
      if (!data.uploadUrl.includes('storage.googleapis.com') && !data.uploadUrl.includes('googleapis.com')) {
        return {
          status: 'error',
          message: 'Invalid GCS URL format',
          details: `Upload URL does not point to Google Cloud Storage: ${data.uploadUrl.substring(0, 100)}...`,
          fix: 'Verify GCS bucket configuration and credentials in Edge Function',
        };
      }

      // Verify we have both upload and download URLs
      if (!data.downloadUrl) {
        return {
          status: 'warning',
          message: 'GCS partially configured',
          details: 'Upload URL generated but download URL missing',
          fix: 'Check Edge Function code to ensure both URLs are generated',
        };
      }

      // Try to verify the bucket exists (HEAD request to upload URL)
      // This is optional - if it fails, we still consider GCS configured if we got valid URLs
      try {
        const headResponse = await fetch(data.uploadUrl, {
          method: 'HEAD',
        });
        
        // 400, 403, or 405 means bucket exists but we can't access without proper request
        // This is actually expected for signed URLs (they require PUT with specific headers)
        if (headResponse.status === 400 || headResponse.status === 403 || headResponse.status === 405) {
          return {
            status: 'success',
            message: 'GCS is configured correctly',
            details: `Bucket: ${data.bucket || 'unknown'}. Signed URLs generated successfully.`,
          };
        }

        // 404 might mean the file doesn't exist yet (expected for upload URLs)
        if (headResponse.status === 404) {
          return {
            status: 'success',
            message: 'GCS is configured correctly',
            details: `Bucket: ${data.bucket || 'unknown'}. Upload URL ready (file doesn't exist yet, which is expected).`,
          };
        }
      } catch (headError) {
        // Network error or CORS - but if we got the URL, GCS is likely configured
        // This is common with signed URLs that require specific headers
        console.log('HEAD request failed (expected for signed URLs):', headError);
      }

      return {
        status: 'success',
        message: 'GCS is configured correctly',
        details: `Bucket: ${data.bucket || 'unknown'}. Upload and download URLs generated successfully.`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to verify GCS',
        details: error instanceof Error ? error.message : 'Unknown error',
        fix: '1. Check Google Cloud Storage configuration\n2. Verify Edge Function is deployed\n3. See SETUP_GCS.md for setup instructions',
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
