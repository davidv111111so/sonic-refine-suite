import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Server, Cpu, Zap } from "lucide-react";

export const ProcessingLimitations = () => {
  return (
    <Card className="bg-amber-900/20 border-amber-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-300">
          <Info className="h-5 w-5" />
          Current Processing Limitations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-900/30 border-amber-700/50">
          <Info className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200">
            This is currently a client-side demo. For professional audio
            enhancement, the following server-side components are needed:
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-5 w-5 text-blue-400" />
              <h4 className="font-medium text-white">Backend Services</h4>
            </div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• FFmpeg for audio manipulation</li>
              <li>• AI-based enhancement APIs</li>
              <li>• Cloud processing servers</li>
            </ul>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-5 w-5 text-green-400" />
              <h4 className="font-medium text-white">Processing Libraries</h4>
            </div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Librosa for Python</li>
              <li>• PyTorch/TensorFlow</li>
              <li>• Specialized DSP libraries</li>
            </ul>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-purple-400" />
              <h4 className="font-medium text-white">Enhancement Features</h4>
            </div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Advanced noise reduction</li>
              <li>• AI upsampling</li>
              <li>• Real-time processing</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <p className="text-sm text-blue-200">
            <strong>Note:</strong> This React interface serves as the control
            panel. To implement real audio processing, you would need to
            integrate with backend services that handle the actual audio
            manipulation using professional audio processing libraries and AI
            models.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
