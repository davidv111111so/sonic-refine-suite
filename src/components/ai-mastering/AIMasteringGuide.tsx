import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Upload, 
  Music2, 
  Settings, 
  Download,
  Shield,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Zap
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AIMasteringGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIMasteringGuide({ open, onOpenChange }: AIMasteringGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">AI Mastering User Guide</DialogTitle>
          </div>
          <DialogDescription>
            Complete guide to professional AI-powered audio mastering
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6">
          <Tabs defaultValue="quickstart" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="auth">Auth & Security</TabsTrigger>
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            </TabsList>

            {/* Quick Start Tab */}
            <TabsContent value="quickstart" className="space-y-4 mt-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertTitle>Premium Feature</AlertTitle>
                <AlertDescription>
                  AI Mastering requires a premium subscription and authentication. 
                  Make sure you're logged in before proceeding.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    5-Minute Quick Start
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold">Upload Target Audio</h4>
                        <p className="text-sm text-muted-foreground">
                          Click "Select Target Audio" and choose the track you want to master.
                          Supports WAV, MP3, FLAC, AAC formats.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">Choose Reference</h4>
                        <p className="text-sm text-muted-foreground">
                          Select a genre preset (Rock, EDM, Jazz, etc.) OR upload your own reference track.
                          Genre presets are perfect for beginners!
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold">Start Mastering</h4>
                        <p className="text-sm text-muted-foreground">
                          Click "Start AI Mastering" and wait 1-3 minutes. The mastered file will
                          automatically download as <code className="text-xs bg-muted px-1 rounded">mastered_[filename].wav</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                        <Settings className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Advanced Settings (Optional)</h4>
                        <p className="text-sm text-muted-foreground">
                          Click "Advanced Settings" to fine-tune 37 professional parameters.
                          Default settings work great for most cases!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span><strong>Formats:</strong> WAV, MP3, FLAC, AAC</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span><strong>Sample Rate:</strong> 44.1kHz or 48kHz recommended</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span><strong>Bit Depth:</strong> 16-bit minimum, 24-bit preferred</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span><strong>File Size:</strong> Under 100MB for optimal processing</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Workflow Tab */}
            <TabsContent value="workflow" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Step 1: Generate Upload URLs
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Edge function requests signed URLs from backend (3-5 seconds)
                      </p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4 py-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Step 2: Upload Files to GCS
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Direct upload to Google Cloud Storage (5-30 seconds depending on file size)
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Step 3: Start Mastering Job
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Backend creates asynchronous job, returns ticket ID (1-2 seconds)
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Step 4: AI Processing
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Audio analysis and matching (30-180 seconds) - Status polled every 5 seconds
                      </p>
                    </div>

                    <div className="border-l-4 border-cyan-500 pl-4 py-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Step 5: Download Result
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Mastered file automatically saved to Downloads folder (5-15 seconds)
                      </p>
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Total processing time: <strong>1-3 minutes</strong> for most tracks. 
                      Longer files (&gt;10 minutes) may take up to 5 minutes.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Genre Presets vs Custom Reference</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">🎸 Genre Presets (20 Available)</h4>
                    <p className="text-sm text-muted-foreground">
                      Pre-configured mastering profiles for Rock, Metal, EDM, Jazz, Pop, Hip Hop, 
                      Classical, R&B, Country, Reggae, Electronic, Ambient, Indie, Punk, Blues, 
                      Folk, Soul, Funk, Disco, and Latin. Perfect for quick results!
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">🎛️ Custom Reference Track</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload your own professionally mastered track. The AI will analyze its 
                      characteristics and apply them to your target audio. Gives you complete 
                      control over the final sound.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Default Settings Recommended</AlertTitle>
                <AlertDescription>
                  Advanced settings are pre-optimized for professional results. Only modify if 
                  you have audio mastering experience!
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold">Threshold (0.0 - 1.0)</h4>
                    <p className="text-muted-foreground">
                      Matching sensitivity. Higher = stricter matching. Default: 0.998138
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">FFT Size (512 - 8192)</h4>
                    <p className="text-muted-foreground">
                      Frequency analysis resolution. Higher = more detail but slower. Default: 4096
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Output Bits</h4>
                    <p className="text-muted-foreground">
                      16-bit (CD quality), 24-bit (pro audio), 32-bit (maximum precision). Default: 32 (float)
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Limiter Threshold (-12dB to 0dB)</h4>
                    <p className="text-muted-foreground">
                      Peak limiting to prevent clipping. Default: -1.0dB
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold">Resampling</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-1">
                      <li><strong>FastSinc:</strong> Best speed/quality balance (recommended)</li>
                      <li><strong>Sinc:</strong> Higher quality, slower processing</li>
                      <li><strong>Linear:</strong> Fastest but lower quality</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Spectrum Compensation</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-1">
                      <li><strong>Frequency-Domain:</strong> More precise (recommended)</li>
                      <li><strong>Time-Domain:</strong> Faster processing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Loudness Compensation</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-1">
                      <li><strong>LUFS:</strong> Industry standard (recommended)</li>
                      <li><strong>RMS:</strong> Traditional method</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Auth & Security Tab */}
            <TabsContent value="auth" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authentication System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Login Required</h4>
                    <p className="text-muted-foreground">
                      Navigate to <code className="bg-muted px-1 rounded">/auth</code> to sign up 
                      or log in. You can use email/password or Google OAuth.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">User Roles</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>User (Default):</strong> Basic access to all features</li>
                      <li>• <strong>Premium:</strong> Access to AI Mastering and advanced features</li>
                      <li>• <strong>Admin:</strong> Full access + Reference Track Manager</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Database Tables</h4>
                    <div className="bg-muted p-3 rounded space-y-2">
                      <div>
                        <code className="text-xs">profiles</code>
                        <p className="text-muted-foreground text-xs mt-1">
                          Stores: email, full_name, subscription (free/premium)
                        </p>
                      </div>
                      <div>
                        <code className="text-xs">user_roles</code>
                        <p className="text-muted-foreground text-xs mt-1">
                          Stores: user_id, role (admin/moderator/user)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Security Features</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• JWT token authentication</li>
                      <li>• Row-Level Security (RLS) policies</li>
                      <li>• User-isolated cloud storage</li>
                      <li>• Server-side role validation</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Security Best Practices</AlertTitle>
                <AlertDescription>
                  Never share your login credentials. All authentication is handled securely 
                  via Supabase. Your files are isolated and only accessible to you.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Troubleshooting Tab */}
            <TabsContent value="troubleshooting" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Common Issues & Solutions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="border-l-4 border-red-500 pl-3 py-2">
                    <h4 className="font-semibold text-red-600 dark:text-red-400">
                      "Premium Feature Locked"
                    </h4>
                    <p className="text-muted-foreground mt-1">
                      <strong>Solution:</strong> Log in at <code className="bg-muted px-1 rounded">/auth</code> and 
                      ensure you have premium access. Contact admin if needed.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-3 py-2">
                    <h4 className="font-semibold text-orange-600 dark:text-orange-400">
                      "Please select a target audio file"
                    </h4>
                    <p className="text-muted-foreground mt-1">
                      <strong>Solution:</strong> Click "Select Target Audio" button first to upload 
                      the track you want to master.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-3 py-2">
                    <h4 className="font-semibold text-yellow-600 dark:text-yellow-400">
                      "Backend error: 401 Unauthorized"
                    </h4>
                    <p className="text-muted-foreground mt-1">
                      <strong>Solution:</strong> Your session expired. Log out and log back in, then try again.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-3 py-2">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                      "Processing timeout"
                    </h4>
                    <p className="text-muted-foreground mt-1">
                      <strong>Solution:</strong> Large files (&gt;50MB) take longer. Check internet 
                      connection. Try a smaller file or lower quality version.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-3 py-2">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">
                      "Invalid settings"
                    </h4>
                    <p className="text-muted-foreground mt-1">
                      <strong>Solution:</strong> Click "Reset to Defaults" in Advanced Settings modal. 
                      Ensure Threshold (0-1), FFT Size (512-8192), and other values are in valid ranges.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">FAQs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold">Q: How long does mastering take?</h4>
                    <p className="text-muted-foreground">
                      A: Typically 1-3 minutes. Files over 10 minutes may take up to 5 minutes.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Q: What output format do I get?</h4>
                    <p className="text-muted-foreground">
                      A: WAV format at 32-bit floating point by default (configurable in settings).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Q: Can I master multiple files at once?</h4>
                    <p className="text-muted-foreground">
                      A: No, currently one file at a time. Process each individually for best results.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Q: Are my files stored permanently?</h4>
                    <p className="text-muted-foreground">
                      A: No, temporary storage only during processing. Files are deleted after download.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('/AI_MASTERING_USER_GUIDE.md', '_blank')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Full Documentation
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Got it!
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
