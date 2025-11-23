import React from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
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
    <SimpleModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span>AI Mastering User Guide</span>
        </div>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-1 mb-6">
        <p className="text-slate-400 text-sm">
          Complete guide to professional AI-powered audio mastering
        </p>
      </div>

      <ScrollArea className="h-[calc(85vh-120px)] pr-4">
        <Tabs defaultValue="quickstart" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="auth">Auth & Security</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="space-y-4 mt-4">
            <Alert className="bg-blue-900/20 border-blue-800">
              <Zap className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-400">Premium Feature</AlertTitle>
              <AlertDescription className="text-blue-300">
                AI Mastering requires a premium subscription and authentication.
                Make sure you're logged in before proceeding.
              </AlertDescription>
            </Alert>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
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
                      <h4 className="font-semibold text-white">Upload Target Audio</h4>
                      <p className="text-sm text-slate-400">
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
                      <h4 className="font-semibold text-white">Choose Reference</h4>
                      <p className="text-sm text-slate-400">
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
                      <h4 className="font-semibold text-white">Start Mastering</h4>
                      <p className="text-sm text-slate-400">
                        Click "Start AI Mastering" and wait 1-3 minutes. The mastered file will
                        automatically download as <code className="text-xs bg-slate-900 px-1 rounded">mastered_[filename].wav</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Advanced Settings (Optional)</h4>
                      <p className="text-sm text-slate-400">
                        Click "Advanced Settings" to fine-tune 37 professional parameters.
                        Default settings work great for most cases!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">File Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-300">
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
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Processing Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold flex items-center gap-2 text-white">
                      <Upload className="h-4 w-4 text-blue-400" />
                      Step 1: Generate Upload URLs
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Edge function requests signed URLs from backend (3-5 seconds)
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold flex items-center gap-2 text-white">
                      <Upload className="h-4 w-4 text-green-400" />
                      Step 2: Upload Files to GCS
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Direct upload to Google Cloud Storage (5-30 seconds depending on file size)
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <h4 className="font-semibold flex items-center gap-2 text-white">
                      <Zap className="h-4 w-4 text-purple-400" />
                      Step 3: Start Mastering Job
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Backend creates asynchronous job, returns ticket ID (1-2 seconds)
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <h4 className="font-semibold flex items-center gap-2 text-white">
                      <Settings className="h-4 w-4 text-yellow-400" />
                      Step 4: AI Processing
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Audio analysis and matching (30-180 seconds) - Status polled every 5 seconds
                    </p>
                  </div>

                  <div className="border-l-4 border-cyan-500 pl-4 py-2">
                    <h4 className="font-semibold flex items-center gap-2 text-white">
                      <Download className="h-4 w-4 text-cyan-400" />
                      Step 5: Download Result
                    </h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Mastered file automatically saved to Downloads folder (5-15 seconds)
                    </p>
                  </div>
                </div>

                <Alert className="mt-4 bg-slate-900 border-slate-700">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <AlertDescription className="text-slate-300">
                    Total processing time: <strong>1-3 minutes</strong> for most tracks.
                    Longer files (&gt;10 minutes) may take up to 5 minutes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Genre Presets vs Custom Reference</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-white">🎸 Genre Presets (20 Available)</h4>
                  <p className="text-sm text-slate-400">
                    Pre-configured mastering profiles for Rock, Metal, EDM, Jazz, Pop, Hip Hop,
                    Classical, R&B, Country, Reggae, Electronic, Ambient, Indie, Punk, Blues,
                    Folk, Soul, Funk, Disco, and Latin. Perfect for quick results!
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-white">🎛️ Custom Reference Track</h4>
                  <p className="text-sm text-slate-400">
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
            <Alert className="bg-slate-900 border-slate-700">
              <Settings className="h-4 w-4 text-slate-400" />
              <AlertTitle className="text-white">Default Settings Recommended</AlertTitle>
              <AlertDescription className="text-slate-400">
                Advanced settings are pre-optimized for professional results. Only modify if
                you have audio mastering experience!
              </AlertDescription>
            </Alert>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Key Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-white">Threshold (0.0 - 1.0)</h4>
                  <p className="text-slate-400">
                    Matching sensitivity. Higher = stricter matching. Default: 0.998138
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">FFT Size (512 - 8192)</h4>
                  <p className="text-slate-400">
                    Frequency analysis resolution. Higher = more detail but slower. Default: 4096
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Output Bits</h4>
                  <p className="text-slate-400">
                    16-bit (CD quality), 24-bit (pro audio), 32-bit (maximum precision). Default: 32 (float)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Limiter Threshold (-12dB to 0dB)</h4>
                  <p className="text-slate-400">
                    Peak limiting to prevent clipping. Default: -1.0dB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Processing Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-white">Resampling</h4>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 mt-1">
                    <li><strong>FastSinc:</strong> Best speed/quality balance (recommended)</li>
                    <li><strong>Sinc:</strong> Higher quality, slower processing</li>
                    <li><strong>Linear:</strong> Fastest but lower quality</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Spectrum Compensation</h4>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 mt-1">
                    <li><strong>Frequency-Domain:</strong> More precise (recommended)</li>
                    <li><strong>Time-Domain:</strong> Faster processing</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Loudness Compensation</h4>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 mt-1">
                    <li><strong>LUFS:</strong> Industry standard (recommended)</li>
                    <li><strong>RMS:</strong> Traditional method</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auth & Security Tab */}
          <TabsContent value="auth" className="space-y-4 mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-blue-400" />
                  Authentication System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2 text-white">Login Required</h4>
                  <p className="text-slate-400">
                    Navigate to <code className="bg-slate-900 px-1 rounded">/auth</code> to sign up
                    or log in. You can use email/password or Google OAuth.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-white">User Roles</h4>
                  <ul className="space-y-1 text-slate-400">
                    <li>• <strong>User (Default):</strong> Basic access to all features</li>
                    <li>• <strong>Premium:</strong> Access to AI Mastering and advanced features</li>
                    <li>• <strong>Admin:</strong> Full access + Reference Track Manager</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-white">Database Tables</h4>
                  <div className="bg-slate-900 p-3 rounded space-y-2 border border-slate-700">
                    <div>
                      <code className="text-xs text-blue-300">profiles</code>
                      <p className="text-slate-400 text-xs mt-1">
                        Stores: email, full_name, subscription (free/premium)
                      </p>
                    </div>
                    <div>
                      <code className="text-xs text-blue-300">user_roles</code>
                      <p className="text-slate-400 text-xs mt-1">
                        Stores: user_id, role (admin/moderator/user)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-white">Security Features</h4>
                  <ul className="space-y-1 text-slate-400">
                    <li>• JWT token authentication</li>
                    <li>• Row-Level Security (RLS) policies</li>
                    <li>• User-isolated cloud storage</li>
                    <li>• Server-side role validation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-slate-900 border-slate-700">
              <Shield className="h-4 w-4 text-green-400" />
              <AlertTitle className="text-white">Security Best Practices</AlertTitle>
              <AlertDescription className="text-slate-400">
                Never share your login credentials. All authentication is handled securely
                via Supabase. Your files are isolated and only accessible to you.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Troubleshooting Tab */}
          <TabsContent value="troubleshooting" className="space-y-4 mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <HelpCircle className="h-5 w-5 text-yellow-400" />
                  Common Issues & Solutions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="border-l-4 border-red-500 pl-3 py-2">
                  <h4 className="font-semibold text-red-400">
                    "Premium Feature Locked"
                  </h4>
                  <p className="text-slate-400 mt-1">
                    <strong>Solution:</strong> Log in at <code className="bg-slate-900 px-1 rounded">/auth</code> and
                    ensure you have premium access. Contact admin if needed.
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-3 py-2">
                  <h4 className="font-semibold text-orange-400">
                    "Please select a target audio file"
                  </h4>
                  <p className="text-slate-400 mt-1">
                    <strong>Solution:</strong> Click "Select Target Audio" button first to upload
                    the track you want to master.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-3 py-2">
                  <h4 className="font-semibold text-yellow-400">
                    "Backend error: 401 Unauthorized"
                  </h4>
                  <p className="text-slate-400 mt-1">
                    <strong>Solution:</strong> Your session expired. Log out and log back in, then try again.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-3 py-2">
                  <h4 className="font-semibold text-blue-400">
                    "Processing timeout"
                  </h4>
                  <p className="text-slate-400 mt-1">
                    <strong>Solution:</strong> Large files (&gt;50MB) take longer. Check internet
                    connection. Try a smaller file or lower quality version.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-3 py-2">
                  <h4 className="font-semibold text-purple-400">
                    "Invalid settings"
                  </h4>
                  <p className="text-slate-400 mt-1">
                    <strong>Solution:</strong> Click "Reset to Defaults" in Advanced Settings modal.
                    Ensure Threshold (0-1), FFT Size (512-8192), and other values are in valid ranges.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">FAQs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-white">Q: How long does mastering take?</h4>
                  <p className="text-slate-400">
                    A: Typically 1-3 minutes. Files over 10 minutes may take up to 5 minutes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Q: What output format do I get?</h4>
                  <p className="text-slate-400">
                    A: WAV format at 32-bit floating point by default (configurable in settings).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Q: Can I master multiple files at once?</h4>
                  <p className="text-slate-400">
                    A: No, currently one file at a time. Process each individually for best results.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Q: Are my files stored permanently?</h4>
                  <p className="text-slate-400">
                    A: No, temporary storage only during processing. Files are deleted after download.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-2 pb-4">
          <Button
            variant="outline"
            onClick={() => window.open('/AI_MASTERING_USER_GUIDE.md', '_blank')}
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Full Documentation
          </Button>
          <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-500 text-white">
            Got it!
          </Button>
        </div>
      </ScrollArea>
    </SimpleModal>
  );
}
