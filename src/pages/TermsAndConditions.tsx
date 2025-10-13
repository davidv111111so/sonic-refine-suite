import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scale, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black text-white p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-slate-800 border-slate-600 hover:bg-slate-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Terms and Conditions
          </h1>
        </div>

        {/* Copyright Disclaimer - Prominent */}
        <Card className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border-orange-600/50 mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Copyright Disclaimer - Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900/60 p-6 rounded-lg border border-orange-500/30">
              <p className="text-orange-200 font-medium leading-relaxed">
                We do not own or retain any rights to the processed tracks or songs, including master rights and copyrights. 
                In the case of AI mastering, the rights will be retained by the user. We are not responsible for any 
                infringement of master rights; each user must own the respective rights before using our services.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms Content */}
        <div className="space-y-6">
          {/* Service Description */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Scale className="h-5 w-5" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <p>
                Perfect Audio is a web-based audio enhancement application that provides real-time audio processing 
                capabilities using advanced Web Audio APIs. Our service operates entirely within your browser 
                without uploading files to external servers.
              </p>
              <p>
                The application supports WAV, MP3, and FLAC audio formats and provides various enhancement features 
                including equalizer controls, noise reduction, and audio optimization.
              </p>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Shield className="h-5 w-5" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Copyright Compliance</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You must own or have proper authorization for all audio files you process</li>
                  <li>You are solely responsible for ensuring you have the legal right to modify audio content</li>
                  <li>Any copyright infringement is entirely your responsibility</li>
                  <li>Commercial use requires appropriate licensing from rights holders</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Acceptable Use</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the service only for lawful purposes</li>
                  <li>Do not attempt to circumvent any technical limitations</li>
                  <li>Do not use the service to process illegal or harmful content</li>
                  <li>Respect file size and quantity limitations (100MB per file, 20 files maximum)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-purple-400">Privacy and Data Handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Local Processing</h4>
                <p>
                  All audio processing occurs locally in your browser. No audio files are uploaded to our servers 
                  or transmitted over the internet during the enhancement process.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Data Storage</h4>
                <p>
                  The application may store preferences and settings in your browser's local storage. 
                  No personal data or audio content is stored on our servers.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Limitations and Disclaimers */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-yellow-400">Limitations and Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Service Availability</h4>
                <p>
                  The service is provided "as is" without guarantees of availability, performance, or results. 
                  We reserve the right to modify or discontinue the service at any time.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Technical Limitations</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Audio quality depends on browser capabilities and device performance</li>
                  <li>Large files may cause performance issues or processing failures</li>
                  <li>Some browsers may not support all features</li>
                  <li>Processing results may vary based on source audio quality</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Liability Limitation</h4>
                <p>
                  We are not liable for any damages, data loss, or issues arising from the use of this service. 
                  Users assume all risks associated with audio processing and file handling.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact and Updates */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-cyan-400">Updates and Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Terms Updates</h4>
                <p>
                  These terms may be updated periodically. Continued use of the service after changes 
                  indicates acceptance of the updated terms.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Effective Date</h4>
                <p>
                  These terms are effective as of the date of your first use of the Perfect Audio application.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-600 text-center">
          <p className="text-slate-400 text-sm">
            By using Perfect Audio, you acknowledge that you have read, understood, and agree to these terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};