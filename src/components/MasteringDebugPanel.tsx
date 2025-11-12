/**
 * Mastering Debug Panel
 * 
 * Panel de debugging para el sistema de AI Mastering.
 * Solo se muestra en development mode.
 * 
 * Uso:
 * 1. Importa este componente en tu app temporalmente
 * 2. Agrega <MasteringDebugPanel /> en algún lugar visible
 * 3. Ejecuta los tests desde los botones
 * 4. Revisa los resultados en pantalla
 * 5. Remueve el componente cuando termines de debuggear
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, XCircle, Play, Trash2 } from 'lucide-react';
import {
  testGenerateUploadUrl,
  testUploadToGCS,
  testBackendConnection,
  testFullMasteringFlow,
  runAllTests,
  TestResult,
} from '../../tests/ai-mastering-test';

export const MasteringDebugPanel = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  // Solo mostrar en development
  if (import.meta.env.PROD) {
    return null;
  }

  const runTest = async (
    testName: string,
    testFn: () => Promise<TestResult>
  ) => {
    setIsRunning(true);
    setCurrentTest(testName);
    
    try {
      const result = await testFn();
      setResults(prev => [...prev, { ...result, message: `[${testName}] ${result.message}` }]);
    } catch (error) {
      setResults(prev => [
        ...prev,
        {
          success: false,
          message: `[${testName}] Test failed`,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runAllTestsHandler = async () => {
    setIsRunning(true);
    setCurrentTest('All Tests');
    setResults([]); // Clear previous results
    
    try {
      const allResults = await runAllTests();
      setResults(allResults.map((result, index) => ({
        ...result,
        message: `[Test ${index + 1}] ${result.message}`,
      })));
    } catch (error) {
      setResults([
        {
          success: false,
          message: 'All tests failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const passedCount = results.filter(r => r.success).length;
  const failedCount = results.length - passedCount;

  return (
    <Card className="fixed bottom-4 right-4 w-[600px] max-h-[80vh] shadow-2xl border-2 border-purple-500/50 bg-background/95 backdrop-blur z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🔧 AI Mastering Debug Panel
            <Badge variant="outline" className="text-xs">
              DEV ONLY
            </Badge>
          </CardTitle>
          <Button
            onClick={clearResults}
            variant="ghost"
            size="sm"
            disabled={results.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => runTest('Generate Upload URL', testGenerateUploadUrl)}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isRunning && currentTest === 'Generate Upload URL' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Test Upload URL
          </Button>

          <Button
            onClick={() => runTest('Upload to GCS', testUploadToGCS)}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isRunning && currentTest === 'Upload to GCS' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Test GCS Upload
          </Button>

          <Button
            onClick={() => runTest('Backend Connection', testBackendConnection)}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isRunning && currentTest === 'Backend Connection' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Test Backend
          </Button>

          <Button
            onClick={() => runTest('Full Flow', testFullMasteringFlow)}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isRunning && currentTest === 'Full Flow' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Test Full Flow
          </Button>
        </div>

        <Button
          onClick={runAllTestsHandler}
          disabled={isRunning}
          className="w-full"
          variant="default"
        >
          {isRunning && currentTest === 'All Tests' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running All Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>

        {/* Test Summary */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Passed: {passedCount}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              Failed: {failedCount}
            </Badge>
          </div>
        )}

        {/* Results */}
        <ScrollArea className="h-[300px] w-full rounded-md border p-3">
          {results.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No tests run yet. Click a button above to start testing.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md border ${
                    result.success
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium break-words">
                        {result.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(result.timestamp)}
                      </p>
                      
                      {result.error && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400 font-mono break-words">
                          {result.error}
                        </div>
                      )}
                      
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Show data
                          </summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="font-semibold">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Tests run in order - Upload URL → GCS Upload → Backend → Full Flow</li>
            <li>Check browser console for detailed logs</li>
            <li>Make sure you're logged in before testing</li>
            <li>Backend test may show warning if test file doesn't exist (expected)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
