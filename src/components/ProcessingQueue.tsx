import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { ProcessingLimitations } from '@/components/ProcessingLimitations';

interface ProcessingQueueProps {
  files: AudioFile[];
}

export const ProcessingQueue = ({ files }: ProcessingQueueProps) => {
  const processingFiles = files.filter(file => file.status === 'processing');
  const enhancedFiles = files.filter(file => file.status === 'enhanced');
  const errorFiles = files.filter(file => file.status === 'error');

  return (
    <div className="space-y-4">
      {/* Add limitations notice at the top */}
      <ProcessingLimitations />
      
      {processingFiles.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              Currently Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {processingFiles.map(file => (
                <li key={file.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-white">{file.name}</span>
                    {file.processingStage && (
                      <Badge variant="secondary" className="ml-2">{file.processingStage}</Badge>
                    )}
                  </div>
                  <div className="w-24">
                    <Progress value={file.progress} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {enhancedFiles.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Successfully Enhanced
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {enhancedFiles.map(file => (
                <li key={file.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white">{file.name}</span>
                  </div>
                  <Badge variant="outline">Enhanced</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {errorFiles.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              Enhancement Errors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {errorFiles.map(file => (
                <li key={file.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-white">{file.name}</span>
                  </div>
                  <Badge variant="destructive">Error</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {processingFiles.length === 0 && enhancedFiles.length === 0 && errorFiles.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm text-center">
              No files are currently processing or have completed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
